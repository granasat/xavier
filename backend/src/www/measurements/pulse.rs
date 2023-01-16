use log::error;
use std::str::FromStr;
use std::sync::mpsc::{self, Receiver, Sender};
use std::thread;

use crate::b1500::measure::pulsed::{
    measure_pulse_collection_fastiv, measure_pulse_fastiv, PulseTrain, PulseTrainCollection,
};
use crate::b1500::{measure, wgfmu::driver::Measurement};
use crate::AppState;
use actix_web::body::BoxBody;
use actix_web::http::header::ContentType;
use actix_web::rt::spawn;
use actix_web::{web, HttpResponse, Responder};

use serde::{Deserialize, Serialize};
use serde_json::Value;

use entity::sea_orm::{ActiveModelTrait, Set};

use super::types::{ErrorJson, MeasurementRef};
use crate::www::utils;
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
    noise_std: f64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PulseCollectionMeasurementParams {
    avg_time: f64,
    pulse_train_collection: PulseTrainCollection,
    n_points_high: usize,
    n_points_low: usize,
    noise: bool,
    noise_std: f64,
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

    let guard = utils::measuring_guard(&app);
    if guard.is_err() {
        return guard.unwrap_err();
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
            PulseTrain {
                n_pulses: params.n_pulses,
                duty_cycle: params.duty_cycle,
                cycle_time: params.cycle_time,
                v_high: params.v_high,
                v_low: params.v_low,
            },
            params.n_points_high,
            params.n_points_low,
            params.avg_time,
            params.noise,
            params.noise_std,
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

pub async fn pulse_collection_measurement(
    app: web::Data<AppState>,
    params: web::Json<PulseCollectionMeasurementParams>,
) -> impl Responder {
    let guard = utils::measuring_guard(&app);
    if guard.is_err() {
        return guard.unwrap_err();
    }

    if params.pulse_train_collection.len() < 1 {
        
        return HttpResponse::BadRequest()
            .content_type(ContentType::json())
            .body(
                (ErrorJson {
                    error: "Provide at least one pulse train to measure. Train list length was 0.".to_string(),
                })
                .to_string(),
            )
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

        println!("{:#?}", params);

        let result = measure_pulse_collection_fastiv(
            Some("b1500gpib"),
            params.pulse_train_collection.clone(),
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
