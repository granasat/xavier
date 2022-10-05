use std::fs::File;
use std::io::Write;

use crate::AppState;
use actix_files::NamedFile;
use actix_web::http::header::ContentType;
use actix_web::{web, Error, HttpResponse};

use chrono::SecondsFormat;
use entity::{self, measurement::Category};
use sea_orm::{JsonValue, FromQueryResult};
use sea_orm::{EntityTrait, QuerySelect, prelude::DateTimeLocal};
use serde::Serialize;
use serde_json;

// use super::types::ErrorJson;
use crate::b1500::wgfmu::driver::Measurement;

// use std::time::Instant;


#[derive(FromQueryResult, Serialize)]
pub struct ListedMeasurement {
    pub id: i32,
    pub status: String,
    pub date: DateTimeLocal,
    pub category: entity::measurement::Category,
    pub parameters: JsonValue
}

pub async fn list(app: web::Data<AppState>) -> Result<HttpResponse, Error> {

    let mut list: Vec<ListedMeasurement> = entity::measurement::Entity::find()
        .select_only()
        .column(entity::measurement::Column::Id)
        .column(entity::measurement::Column::Status)
        .column(entity::measurement::Column::Date)
        .column(entity::measurement::Column::Category)
        .column(entity::measurement::Column::Parameters)
        .into_model::<ListedMeasurement>()
        .all(app.db.get_connection())
        .await
        .unwrap();

    let list_str = serde_json::to_string(&list).unwrap();

    Ok(HttpResponse::Ok()
        .content_type(ContentType::json())
        .body(list_str))
}

pub async fn get_single(
    app: web::Data<AppState>,
    id: web::Path<i32>,
) -> Result<HttpResponse, Error> {
    let mut measurement = entity::measurement::Entity::find_by_id(id.into_inner())
        .one(app.db.get_connection())
        .await
        .expect("Could not find measurement")
        .unwrap();

    let measurement_str = serde_json::to_string(&measurement).unwrap();

    Ok(HttpResponse::Ok()
        .content_type(ContentType::json())
        .body(measurement_str))
}

pub async fn get_single_file(
    app: web::Data<AppState>,
    id: web::Path<i32>,
) -> actix_web::Result<NamedFile> {
    let mut measurement = entity::measurement::Entity::find_by_id(id.into_inner())
        .one(app.db.get_connection())
        .await
        .expect("Could not find measurement")
        .unwrap();

    match measurement.category {
        Category::Pulse => {
            let data = measurement.data.unwrap().to_string();
            let data = serde_json::from_str::<Vec<Measurement>>(data.as_str()).unwrap();

            let file_name = "Train_".to_string()
                + i32::to_string(&measurement.id).as_str()
                + "__"
                + measurement
                    .date
                    .to_rfc3339_opts(SecondsFormat::Secs, true)
                    .replace(":", "_")
                    .as_str()
                + ".csv";

            println!("File name: {}", file_name);

            let mut f = File::create(file_name.to_owned()).expect("Could not open file");

            for point in data {
                match point.current {
                    Some(current) => {
                        writeln!(f, "{},{},{}", point.voltage, current, point.time);
                    }
                    None => {
                        writeln!(f, "{} {}", point.voltage, point.time);
                    }
                }
            }

            Ok(NamedFile::open(file_name)?)
        }
        _ => (panic!()),
    }
}
