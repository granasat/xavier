use crate::b1500::measure;
use crate::AppState;
use actix_web::http::header::ContentType;
use actix_web::{web, HttpResponse, Responder};
use log::info;
use serde_json::json;

use super::types::ErrorJson;

pub async fn calibrate(app: web::Data<AppState>) -> impl Responder {
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

    info!("Calibrating!");

    let result = match web::block(move || measure::calibrate("b1500gpib")).await {
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
        Ok(_) => {
            let res = json! {
                {
                    "result": "Calibration OK"
                }
            };

            HttpResponse::Ok()
                .content_type(ContentType::json())
                .body(res.to_string())
        }
        Err(err) => HttpResponse::InternalServerError()
            .content_type(ContentType::json())
            .body(
                (ErrorJson {
                    error: format!("WGFMU calibration error {}.", err),
                })
                .to_string(),
            ),
    }
}
