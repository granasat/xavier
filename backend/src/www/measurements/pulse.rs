use log::error;
use std::str::FromStr;
use std::sync::mpsc::{self, Receiver, Sender};
use std::thread;

use crate::b1500::measure::measure_pulse_fastiv;
use crate::b1500::{
    measure,
    wgfmu::driver::Measurement};
use crate::AppState;
use actix_web::body::BoxBody;
use actix_web::http::header::ContentType;
use actix_web::rt::spawn;
use actix_web::{web, HttpResponse, Responder};

use serde::{Deserialize, Serialize};
use serde_json::Value;

use entity::sea_orm::{ActiveModelTrait, Set};

use super::types::{ErrorJson, MeasurementRef};
use entity::measurement;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PulseMeasurementParams {
    avg_time: f64,
    v_high: f64,
    v_low: f64,
    cycle_time: f64,
    n_pulses: usize,
    duty_cycle: f64,
    n_points_high: usize,
    n_points_low: usize,
    noise: bool,
    noise_std: f64
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Test {
    test: String,
}

impl Responder for PulseMeasurementParams {
    type Body = BoxBody;

    fn respond_to(self, _: &actix_web::HttpRequest) -> actix_web::HttpResponse<Self::Body> {
        let res_body = serde_json::to_string(&self).unwrap();

        HttpResponse::Ok()
            .content_type(ContentType::json())
            .body(res_body)
    }
}

pub async fn pulse_measurement(
    app: web::Data<AppState>,
    params: web::Json<PulseMeasurementParams>,
) -> impl Responder {
    // let res_body = serde_json::to_string(&params).unwrap();

    if app.measuring {
        return HttpResponse::Conflict()
            .content_type(ContentType::json())
            .body(
                (ErrorJson {
                    error: "Another measurement is already in progress.".to_string(),
                })
                .to_string(),
            );
    }

    let params_str = serde_json::to_string(&params).unwrap();

    let measurement = measurement::ActiveModel {
        status: Set(measurement::Status::InProgress),
        date: Set(chrono::Local::now()),
        parameters: Set(Some(Value::from_str(params_str.as_str()).unwrap())),
        category: Set(measurement::Category::Pulse),
        ..Default::default()
    };

    let measurement = measurement.insert(app.db.get_connection()).await;
    if measurement.is_err() {
        return HttpResponse::InternalServerError()
            .content_type(ContentType::json())
            .body(
                (ErrorJson {
                    error: "Could not insert measurement in database.".to_string(),
                })
                .to_string(),
            );
    }

    let id = measurement.unwrap().id as usize;

    let (tx, rx): (
        Sender<Result<Vec<Measurement>, measure::Error>>,
        Receiver<Result<Vec<Measurement>, measure::Error>>,
    ) = mpsc::channel();

    thread::spawn(move || {
        let result = measure_pulse_fastiv(
            Some("b1500gpib"),
            params.n_pulses,
            params.duty_cycle,
            params.cycle_time,
            params.v_high,
            params.v_low,
            params.n_points_high,
            params.n_points_low,
            params.avg_time,
            params.noise,
            params.noise_std
        );

        tx.send(result).unwrap();
    });

    spawn(async move {
        let result = rx.recv().unwrap();

        let measurement = measurement::Entity::find_by_id(id as i32)
            .one(app.db.get_connection())
            .await;
        if measurement.is_err() {
            return;
        }
        let measurement = measurement.unwrap();
        if measurement.is_none() {
            return;
        }

        let mut measurement: measurement::ActiveModel = measurement.unwrap().into();

        match result {
            Ok(data) => {
                measurement.status = Set(measurement::Status::Done);

                let data_str = serde_json::to_string(&data).unwrap();

                measurement.data = Set(Some(Value::from_str(data_str.as_str()).unwrap()));

                measurement.update(app.db.get_connection()).await.unwrap();
            }
            Err(err) => {
                error!("--------------------");
                error!("--------------------");
                error!("{:?}", err);
                error!("--------------------");
                error!("--------------------");

                measurement.status = Set(measurement::Status::Error);
                measurement.update(app.db.get_connection()).await.unwrap();
            }
        };
    });

    let measurement_ref = MeasurementRef { id };
    let res_body = serde_json::to_string(&measurement_ref).unwrap();

    HttpResponse::Ok()
        .content_type(ContentType::json())
        .body(res_body)
}
