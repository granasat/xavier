// pub mod measure;
pub mod measure;
pub mod types;
pub mod utils;
pub mod wgfmu;

pub const CHANNEL1: usize = 101;
pub const CHANNEL2: usize = 102;

use lazy_static::lazy_static;
use std::sync::{Arc, Mutex};
#[allow(unused_imports)]
use wgfmu::{production::ProductionWgfmu, sim::TestWgfmu, WgfmuDriver};

#[cfg(target_os = "windows")]
lazy_static! {
    pub static ref WGFMU: Arc<Mutex<ProductionWgfmu<'static>>> =
        Arc::new(Mutex::new(ProductionWgfmu::new().unwrap()));
}

#[cfg(target_os = "linux")]
lazy_static! {
    pub static ref WGFMU: Arc<Mutex<TestWgfmu>> = Arc::new(Mutex::new(TestWgfmu::new().unwrap()));
}
