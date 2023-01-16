use crate::AppState;

use super::measurements::calibrate;
use actix_web::{web, Responder, HttpResponse, http::header::ContentType};

pub fn register_urls(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/measurements").configure(super::measurements::register_urls));

    // Other
    cfg.service(web::resource("/calibrate").route(web::post().to(calibrate::calibrate)));
    cfg.service(web::resource("/ping").route(web::get().to(pong)));
    // pub async fn calibrate(app: web::Data<AppState>) -> impl Responder {
}

// This goes here until a better place is found, maybe a utils module?
#[allow(unused)]
pub async fn pong(app: web::Data<AppState>) -> impl Responder {
    HttpResponse::Ok().content_type(ContentType::plaintext()).body("pong".to_owned())
}

