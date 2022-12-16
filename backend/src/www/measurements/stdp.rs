use log::{error, info};
use std::str::FromStr;
use std::sync::mpsc::{self, Receiver, Sender};
use std::thread;

use crate::b1500::measure::{
    self,
    measure_conductance_fastiv, measure_stdp_collection_fastiv, measure_stdp_fastiv,
    StdpCollectionMeasurement, StdpMeasurement, StdpType, StdpCollectionMeasMode,
};
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
pub struct StdpMeasurementParams {
    amplitude: f64,
    delay: f64,
    wait_time: f64,
    pulse_duration: f64,
    stdp_type: StdpType,
    n_points: usize,
    avg_time: f64,
    noise: bool,
    noise_std: f64
}

impl Responder for StdpMeasurementParams {
    type Body = BoxBody;

    fn respond_to(self, _: &actix_web::HttpRequest) -> actix_web::HttpResponse<Self::Body> {
        let res_body = serde_json::to_string(&self).unwrap();

        HttpResponse::Ok()
            .content_type(ContentType::json())
            .body(res_body)
    }
}

pub async fn stdp_measurement(
    app: web::Data<AppState>,
    params: web::Json<StdpMeasurementParams>,
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
        category: Set(measurement::Category::Stdp),
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
        Sender<Result<StdpMeasurement, measure::Error>>,
        Receiver<Result<StdpMeasurement, measure::Error>>,
    ) = mpsc::channel();

    thread::spawn(move || {
        let result = measure_stdp_fastiv(
            Some("b1500gpib"),
            params.delay,
            params.amplitude,
            params.pulse_duration,
            params.wait_time,
            params.n_points,
            params.avg_time,
            params.stdp_type,
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

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StdpCollectionMeasurementParams {
    delay_points: usize,
    amplitude: f64,
    wait_time: f64,
    pulse_duration: f64,
    stdp_type: StdpType,
    n_points: usize,
    avg_time: f64,
    noise: bool,
    noise_std: f64
}

impl Responder for StdpCollectionMeasurementParams {
    type Body = BoxBody;

    fn respond_to(self, _: &actix_web::HttpRequest) -> actix_web::HttpResponse<Self::Body> {
        let res_body = serde_json::to_string(&self).unwrap();

        HttpResponse::Ok()
            .content_type(ContentType::json())
            .body(res_body)
    }
}

pub async fn stdp_collection_measurement(
    app: web::Data<AppState>,
    params: web::Json<StdpCollectionMeasurementParams>,
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
        category: Set(measurement::Category::StdpCollection),
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
        Sender<Result<StdpCollectionMeasurement, measure::Error>>,
        Receiver<Result<StdpCollectionMeasurement, measure::Error>>,
    ) = mpsc::channel();

    thread::spawn(move || {
        let result = measure_stdp_collection_fastiv(
            "b1500gpib",
            params.delay_points,
            params.amplitude,
            params.wait_time,
            params.pulse_duration,
            params.stdp_type,
            params.n_points,
            params.avg_time,
            params.noise,
            params.noise_std,
            StdpCollectionMeasMode::ForceConductanceMeasurement
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

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Conductance {
    conductance: f64,
}
pub async fn conductance_measurement(app: web::Data<AppState>) -> impl Responder {
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

    let result = match web::block(move || measure_conductance_fastiv(Some("b1500gpib"))).await {
        Ok(res) => res,
        Err(err) => {
            return HttpResponse::InternalServerError()
                .content_type(ContentType::json())
                .body(
                    (ErrorJson {
                        error: format!("Actix blocking error {}.", err),
                    })
                    .to_string(),
                )
        }
    };

    match result {
        Ok(conductance) => {
            info!("Conductance: {}", conductance);
            let res_body = serde_json::to_string(&(Conductance { conductance })).unwrap();

            HttpResponse::Ok()
                .content_type(ContentType::json())
                .body(res_body)
        }
        Err(err) => HttpResponse::InternalServerError()
            .content_type(ContentType::json())
            .body(
                (ErrorJson {
                    error: format!("WGFMU measurement error {}.", err),
                })
                .to_string(),
            ),
    }
}
