use actix_web::web;

pub fn register_urls(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/measurements").configure(super::measurements::register_urls)
    );
}