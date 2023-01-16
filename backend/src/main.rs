// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod b1500;
mod config;
mod db;
mod gui;
mod www;

use actix_cors::Cors;
use actix_files as fs;
use actix_web::{dev::fn_service, middleware::Logger, web, App, HttpServer};

#[cfg(debug_assertions)]
use dotenv::dotenv;

use config::Config;

#[derive(Debug, Clone)]
pub struct AppState {
    pub measuring: bool,
    pub db: db::Database,
    pub cfg: config::Config,
}

#[actix_web::main]
async fn web_server(cfg: Config) -> std::io::Result<()> {
    #[cfg(debug_assertions)]
    dotenv().ok();

    let db = db::Database::new().await;

    let state = AppState {
        measuring: false,
        db,
        cfg,
    };

    std::env::set_var("RUST_LOG", "actix_web=debug");
    std::env::set_var("RUST_LOG", "debug");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(state.clone()))
            .wrap(Logger::default())
            .wrap(Cors::permissive())
            .service(web::scope("/api").configure(www::register_urls))
            .service(
                fs::Files::new("/", "./dist")
                    .index_file("index.html")
                    .show_files_listing()
                    .default_handler(fn_service(|req: actix_web::dev::ServiceRequest| async {
                        let (req, _) = req.into_parts();
                        let file = actix_files::NamedFile::open_async("./dist/index.html").await?;
                        let res = file.into_response(&req);
                        Ok(actix_web::dev::ServiceResponse::new(req, res))
                    })),
            )
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await
}

fn main() {
    let cfg: config::Config = confy::load("xavier", None).expect("Could not load config. SAD!");

    std::env::set_var("RUST_LOG", "actix_web=debug");
    std::env::set_var("RUST_LOG", "debug");
    std::env::remove_var("WAYLAND_DISPLAY"); // Temporal fix

    let join_handle = std::thread::spawn({
        let cfg = cfg.clone();
        move || {
            web_server(cfg).unwrap();
        }
    });

    gui::gui(cfg.clone());
    join_handle.join().unwrap(); // If the user quits the GUI launch a new one.
}
