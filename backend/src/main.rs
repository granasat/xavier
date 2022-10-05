use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use sea_orm::DatabaseConnection;

#[cfg(debug_assertions)]
use dotenv::dotenv;

mod www;
mod gui;
mod b1500;
mod db;

#[derive(Debug, Clone)]
pub struct AppState {
    pub measuring: bool,
    pub db: db::Database
}

#[actix_web::main]
async fn web_server() -> std::io::Result<()> {

    #[cfg(debug_assertions)]
    dotenv().ok();

    let db = db::Database::new().await;
    
    let state = AppState {
        measuring: false,
        db
    };

    std::env::set_var("RUST_LOG", "actix_web=debug");
    std::env::set_var("RUST_LOG", "debug");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(state.clone()))
            .wrap(Logger::default())

            .wrap(
                Cors::permissive(),
            )
            .service(web::scope("/api").configure(www::register_urls))
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}

fn main() {
    println!("Hello world!");

    std::env::set_var("RUST_LOG", "actix_web=debug");
    std::env::set_var("RUST_LOG", "debug");

    std::thread::spawn(move || {
        web_server();
    });

    gui::gui();
}