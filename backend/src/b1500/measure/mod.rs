use std::{sync::PoisonError};

use std::fmt::Display;

use super::{wgfmu};

pub mod pulsed;
pub mod stdp;
pub mod utils;

impl Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "WGFMU measurement error {}", self.to_string())
    }
}

#[derive(Debug)]
pub enum Error {
    WgfmuMutexLockError,
    WgfmuError(wgfmu::driver::Error),
    UtilsError(super::utils::Error),
}

impl From<wgfmu::driver::Error> for Error {
    fn from(error: wgfmu::driver::Error) -> Self {
        Error::WgfmuError(error)
    }
}

impl From<super::utils::Error> for Error {
    fn from(error: super::utils::Error) -> Self {
        Error::UtilsError(error)
    }
}

impl<T> From<PoisonError<T>> for Error {
    fn from(_: PoisonError<T>) -> Error {
        Error::WgfmuMutexLockError
    }
}