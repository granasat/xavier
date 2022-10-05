use num_derive::{FromPrimitive, ToPrimitive};
use serde::{ Serialize, Deserialize };
use std::{error, fmt, sync::PoisonError};

#[allow(dead_code)]
pub enum CalibrationtTestResult {
    PASS = 0,
    FAIL = 1,
}

#[allow(dead_code)]
pub enum Status {
    Completed = 10000,
    Done = 10001,
    Running = 10002,
    AbortCompleted = 10003,
    Aborted = 10004,
    RunningIllegal = 10005,
    Idle = 10006,
}

#[derive(FromPrimitive, ToPrimitive, Debug)]
pub enum Error {
    MutexUnlockError,
    NotImplemented,

    ParameterOutOfRangeError = -1,
    IllegalStringError = -2,
    ContextError = -3,
    FunctionNotSupportedError = -4,
    CommunicationError = -5,
    FwError = -6,
    LibraryError = -7,
    UnidentifiedError = -8,
    ChannelNotFoundError = -9,
    PatternNotFoundError = -10,
    EventNotFoundError = -11,
    PatternAlreadyExistsError = -12,
    SequencerNotRunningError = -13,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match *self {
            // Error::NotImplemented(ref err) => write!(f, "RPPAL Spi error: {}", err),
            _ => write!(f, "WGFMU error:")
        }
    }
}

impl error::Error for Error {}

impl<T>From<PoisonError<T>> for Error {
    fn from(_: PoisonError<T>) -> Error {
        Error::MutexUnlockError
    }
}

#[derive(FromPrimitive, ToPrimitive, Debug)]
pub enum OperationMode {
    OperationModeDC = 2000,
    OperationModeFastIV = 2001,
    OperationModePG = 2002,
    OperationModeSMU = 2003,
}

#[derive(FromPrimitive, ToPrimitive, Debug)]
pub enum MeasureMode {
    MesureModeVoltage = 4000,
    MeasureModeCurrent = 4001,
}

#[derive(FromPrimitive, ToPrimitive, Debug)]
pub enum MeasureEventMode {
    MeasureEventDataAveraged = 12000,
    MeasureEventDataRaw = 12001,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Measurement {
    pub voltage: f64,
    pub current: Option<f64>,
    pub time: f64,
}

pub type Res = Result<(), Error>;

pub trait WgfmuDriver<T> {
    fn new() -> Result<T, Box<dyn std::error::Error>>;
    fn open_session(&mut self, instrument: &str) -> Res;
    fn close_session(&mut self) -> Res;
    fn clear(&mut self) -> Res;
    fn create_pattern<'a>(&mut self, pattern: &'a str, init_v: f64) -> Res ;
    fn add_vector<'a>(&mut self, pattern: &'a str, d_time: f64, voltage: f64) -> Res;
    fn set_measure_event(
        &mut self,
        pattern: &str,
        event: &str,
        time: f64,
        points: i32,
        interval: f64,
        average: f64,
        measure_event_mode: MeasureEventMode,
    ) -> Res;
    fn add_sequence(&mut self, chan_id: usize, pattern: &str, count: usize) -> Res;
    fn set_vector(&mut self, pattern: &str, time: f64, voltage: f64) -> Res;
    fn initialize(&mut self) -> Res;
    fn set_operation_mode(&mut self, chan_id: usize, operation_mode: OperationMode) -> Res;
    fn set_measure_mode(&mut self, chan_id: usize, mode: MeasureMode) -> Res;
    fn get_measure_mode(&mut self, chan_id: i32) -> Result<MeasureMode, Error>;
    fn get_operation_mode(&mut self, chan_id: i32) -> Result<OperationMode, Error>;
    fn connect(&mut self, chan_id: usize) -> Res;
    fn execute(&mut self) -> Res;
    fn wait_until_completed(&mut self) -> Res;
    fn get_measure_values(&mut self, chan_id: usize) -> Result<Vec<Measurement>, Error>;
}