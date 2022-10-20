use entity::sea_orm;
use sea_orm::{ConnectOptions, DatabaseConnection};

#[derive(Debug, Clone)]
pub struct Database {
    pub connection: DatabaseConnection,
}

impl Database {
    pub async fn new() -> Self {
        let database_url = match std::env::var("DATABASE_URL") {
            Ok(url) => url,
            Err(_) => "sqlite:./xavier.db?mode=rwc".to_owned(),
        };

        let mut opt = ConnectOptions::new(database_url);
        opt.sqlx_logging(false);

        let connection = sea_orm::Database::connect(opt)
            .await
            .expect("Could not connect to database");
        Database { connection }
    }

    pub fn get_connection(&self) -> &DatabaseConnection {
        &self.connection
    }
}
