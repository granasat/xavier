use actix_web::web;

pub fn register_urls(cfg: &mut web::ServiceConfig) {
    
    // New measurement
    cfg.service(web::resource("/pulse").route(web::post().to(super::pulse::pulse_measurement)));
    
    cfg.service(web::resource("/stdp").route(web::post().to(super::stdp::stdp_measurement)));
    cfg.service(
        web::resource("/stdp-collection")
        .route(web::post().to(super::stdp::stdp_collection_measurement)),
    );
    cfg.service(
        web::resource("/conductance").route(web::post().to(super::stdp::conductance_measurement)),
    );
    
    // Other
    cfg.service(web::resource("/calibrate").route(web::post().to(super::calibrate::calibrate)));
    
    // Main
    cfg.service(web::resource("/").route(web::get().to(super::measurements::list)));
    
    // Retrieve
    cfg.service(web::resource("/{id}").route(web::get().to(super::measurements::get_single)));
    cfg.service(
        web::resource("/file/{id}").route(web::get().to(super::measurements::get_single_file)),
    );
}
