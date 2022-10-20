use std::default::Default;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub database_url: String,
    pub port: usize,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            database_url: "sqlite:./xavier.db?mode=rwc".to_string(),
            port: 8000,
        }
    }
}
