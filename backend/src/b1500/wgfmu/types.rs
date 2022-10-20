use std::os::raw::{c_char, c_double, c_int};

// Common-initialize
pub type OpenSession = extern "C" fn(*const c_char) -> c_int;
pub type CloseSession = extern "C" fn() -> c_int;
pub type Initialize = extern "C" fn() -> c_int;
pub type SetTimeout = extern "C" fn(timeout: c_double) -> c_int;
pub type DoSelfCalibration =
    extern "C" fn(result: *mut c_int, detail: *mut c_char, size: *mut c_int) -> c_int;
pub type DoSelfTest =
    extern "C" fn(result: *mut c_int, detail: *mut c_char, size: *mut c_int) -> c_int;
pub type GetChannelIdSize = extern "C" fn(size: *mut c_int) -> c_int;
pub type GetChannelIds = extern "C" fn(result: *mut c_int, size: *mut c_int) -> c_int;

// Common Error and Warning
pub type GetErrorSize = extern "C" fn(size: *mut c_int) -> c_int;
pub type GetError = extern "C" fn(result: *mut c_char, size: *mut c_int) -> c_int;
pub type GetErrorSummarySize = extern "C" fn(size: *mut c_int) -> c_int;
pub type GetErrorSummary = extern "C" fn(result: *mut c_char, size: *mut c_int) -> c_int;
pub type TreatWarningsAsErrors = extern "C" fn(level: c_int) -> c_int;
pub type SetWarningLevel = extern "C" fn(level: c_int) -> c_int;
pub type GetWarningLevel = extern "C" fn(level: *mut c_int) -> c_int;
pub type GetWarningSummarySize = extern "C" fn(size: *mut c_int) -> c_int;
pub type GetWarningSummary = extern "C" fn(result: *mut c_char, size: *mut c_int) -> c_int;
pub type OpenLogFile = extern "C" fn(fname: *const c_char) -> c_int;
pub type CloseLogFile = extern "C" fn() -> c_int;

// Common-Setup
pub type SetOperationMode = extern "C" fn(chan_id: c_int, mode: c_int) -> c_int;
pub type GetOperationMode = extern "C" fn(chan_id: c_int, mode: *mut c_int) -> c_int;
pub type SetForceVoltageRange = extern "C" fn(chan_id: c_int, range: c_int) -> c_int;
pub type GetForceVoltageRange = extern "C" fn(chan_id: c_int, range: *mut c_int) -> c_int;
pub type SetMeasureMode = extern "C" fn(chan_id: c_int, mode: c_int) -> c_int;
pub type GetMeasureMode = extern "C" fn(chan_id: c_int, mode: *mut c_int) -> c_int;
pub type SetMeasureCurrentRange = extern "C" fn(chan_id: c_int, range: c_int) -> c_int;
pub type GetMeasureCurrentRange = extern "C" fn(chan_id: c_int, range: *mut c_int) -> c_int;
pub type SetMeasureVoltageRange = extern "C" fn(chan_id: c_int, range: c_int) -> c_int;
pub type GetMeasureVoltageRange = extern "C" fn(chan_id: c_int, range: *mut c_int) -> c_int;
pub type SetForceDelay = extern "C" fn(chan_id: c_int, delay: c_double) -> c_int;
pub type GetForceDelay = extern "C" fn(chan_id: c_int, delay: *mut c_double) -> c_int;
pub type SetMeasureDelay = extern "C" fn(chan_id: c_int, delay: c_double) -> c_int;
pub type GetMeasureDelay = extern "C" fn(chan_id: c_int, delay: *mut c_double) -> c_int;
pub type SetMeasureEnabled = extern "C" fn(chan_id: c_int, status: c_int) -> c_int;
pub type IsMeasureEnabled = extern "C" fn(chan_id: c_int, status: *mut c_int) -> c_int;
pub type SetTriggerOutMode = extern "C" fn(chan_id: c_int, mode: c_int, polarity: c_int) -> c_int;
pub type GetTriggerOutMode =
    extern "C" fn(chan_id: c_int, mode: *mut c_int, polarity: *mut c_int) -> c_int;

// Common-measurement
pub type Connect = extern "C" fn(chan_id: c_int) -> c_int;
pub type Disconnect = extern "C" fn(chan_id: c_int) -> c_int;

// WGFMU - Initialize
pub type Clear = extern "C" fn() -> c_int;

// WGFMU - Setup - Pattern
pub type CreatePattern = extern "C" fn(pattern: *const c_char, init_V: c_double) -> c_int;
pub type AddVector =
    extern "C" fn(pattern: *const c_char, d_time: c_double, voltage: c_double) -> c_int;
pub type AddVectors = extern "C" fn(
    pattern: *const c_char,
    d_time: *const c_double,
    voltage: *const c_double,
    size: c_int,
) -> c_int;
pub type SetVector =
    extern "C" fn(pattern: *const c_char, time: c_double, voltage: c_double) -> c_int;
pub type SetVectors = extern "C" fn(
    pattern: *const c_char,
    time: *const c_double,
    voltage: *const c_double,
    size: c_int,
) -> c_int;

// WGFMU - Setup - Pattern operation
pub type CreateMergedPattern = extern "C" fn(
    pattern: *const c_char,
    pattern1: *const c_char,
    pattern2: *const c_char,
    direction: c_int,
) -> c_int;
pub type CreateMultipliedPattern = extern "C" fn(
    pattern: *const c_char,
    pattern1: *const c_char,
    factor_t: c_double,
    factor_V: c_double,
) -> c_int;
pub type CreateOffsetPattern = extern "C" fn(
    pattern: *const c_char,
    pattern1: *const c_char,
    offset_t: c_double,
    offset_V: c_double,
) -> c_int;

// WGFMU - Setup - Event
pub type SetMeasureEvent = extern "C" fn(
    pattern: *const c_char,
    event: *const c_char,
    time: c_double,
    points: c_int,
    interval: c_double,
    average: c_double,
    rdata: c_int,
) -> c_int;
pub type SetRangeEvent = extern "C" fn(
    pattern: *const c_char,
    event: *const c_char,
    time: c_double,
    time: c_int,
) -> c_int;
pub type SetTriggerOutEvent =
    extern "C" fn(pattern: *const c_char, event: *const c_char, time: c_double, duration: c_double);

// WGFMU - Setup - Sequence
pub type AddSequence =
    extern "C" fn(chan_id: c_int, pattern: *const c_char, count: c_double) -> c_int;
pub type AddSequences = extern "C" fn(
    chan_id: c_int,
    pattern: *const *const c_char,
    count: *const c_double,
    size: c_int,
) -> c_int;

// WGFMU - Setup check - Pattern
pub type GetPatternForceValueSize =
    extern "C" fn(pattern: *const c_char, size: *mut c_int) -> c_int;
pub type GetPatternForceValues = extern "C" fn(
    pattern: *const c_char,
    index: c_int,
    length: *mut c_int,
    time: *mut c_double,
    voltage: *mut c_double,
) -> c_int;
pub type GetPatternForceValue = extern "C" fn(
    pattern: *const c_char,
    index: c_int,
    time: *mut c_double,
    voltage: *mut c_double,
) -> c_int;
pub type GetPatternInterpolatedForceValue =
    extern "C" fn(chan_id: c_int, time: c_double, voltage: *mut c_double) -> c_int;
pub type GetPatternMeasureTimeSize =
    extern "C" fn(pattern: *const c_char, size: *mut c_int) -> c_int;
pub type GetPatternMeasureTimes = extern "C" fn(
    pattern: *const c_char,
    index: c_int,
    length: *mut c_int,
    time: *mut c_double,
) -> c_int;
pub type GetPatternMeasureTime =
    extern "C" fn(pattern: *const c_char, index: c_int, time: *mut c_double) -> c_int;

// WGFMU - Setup check - Sequence
pub type GetForceValueSize = extern "C" fn(chan_id: c_int, size: *mut c_int) -> c_int;
pub type GetForceValues = extern "C" fn(
    chan_id: c_int,
    index: c_double,
    length: *mut c_int,
    time: *mut c_double,
    voltage: *mut c_double,
) -> c_int;
pub type GetForceValue = extern "C" fn(
    chan_id: c_int,
    index: c_double,
    time: *mut c_double,
    voltage: *mut c_double,
) -> c_int;
pub type GetInterpolatedForceValue =
    extern "C" fn(chan_id: c_int, time: c_double, voltage: *mut c_double) -> c_int;
pub type GetMeasureTimeSize = extern "C" fn(chan_id: c_int, size: *mut c_int) -> c_int;
pub type GetMeasureTimes =
    extern "C" fn(chan_id: c_int, index: c_int, length: *mut c_int, time: *mut c_double) -> c_int;
pub type GetMeasureTime = extern "C" fn(chan_id: c_int, index: c_int, time: *mut c_double) -> c_int;

// WGFMU - Setup check - Event
pub type GetMeasureEventSize = extern "C" fn(chan_id: c_int, size: *mut c_int) -> c_int;
pub type GetMeasureEvents = extern "C" fn(
    chan_id: c_int,
    meas_id: c_int,
    events_no: *mut c_int,
    pattern: *const *const c_char,
    event: *const *const c_char,
    cycle: *mut c_int,
    loop_count: *mut c_double,
    count: *mut c_int,
    index: *mut c_int,
    length: *mut c_int,
) -> c_int;
pub type GetMeasureEvent = extern "C" fn(
    chan_id: c_int,
    meas_id: c_int,
    pattern: *const c_char,
    event: *const c_char,
    cycle: *mut c_int,
    loop_count: *mut c_double,
    count: *mut c_int,
    index: *mut c_int,
    length: *mut c_int,
) -> c_int;
pub type GetMeasureEventAttribute = extern "C" fn(
    chan_id: c_int,
    meas_id: c_int,
    time: *mut c_double,
    points: *mut c_int,
    interval: *mut c_double,
    average: *mut c_double,
    rdata: *mut c_int,
) -> c_int;

// WGFMU - Measurement
pub type Update = extern "C" fn() -> c_int;
pub type UpdateChannel = extern "C" fn(chan_id: c_int) -> c_int;
pub type Execute = extern "C" fn() -> c_int;
pub type Abort = extern "C" fn() -> c_int;
pub type AbortChannel = extern "C" fn(chan_id: c_int) -> c_int;
pub type GetChannelStatus = extern "C" fn(
    chan_id: c_int,
    status: *mut c_int,
    elapsed_t: *mut c_double,
    total_t: *mut c_double,
) -> c_int;
pub type WaitUntilCompleted = extern "C" fn() -> c_int;

// WGFMU Data retrieve - Measurement value
pub type GetMeasureValueSize =
    extern "C" fn(chan_id: c_int, complete: *mut c_int, total: *mut c_int) -> c_int;
pub type GetMeasureValues = extern "C" fn(
    chan_id: c_int,
    index: c_int,
    length: *mut c_int,
    time: *mut c_double,
    value: *mut c_double,
) -> c_int;
pub type GetMeasureValue =
    extern "C" fn(chan_id: c_int, index: c_int, time: *mut c_double, value: *mut c_double) -> c_int;

// WGFMU Data retrieve - Event
pub type GetCompletedMeasureEventSize =
    extern "C" fn(chan_id: c_int, complete: *mut c_int, total: *mut c_int);
pub type IsMeasureEventCompleted = extern "C" fn(
    chan_id: c_int,
    pattern: *const c_char,
    event: *const c_char,
    cycle: c_int,
    loop_count: c_double,
    count: c_int,
    complete: *mut c_int,
    meas_id: *mut c_int,
    index: *mut c_int,
    length: *mut c_int,
) -> c_int;

// WGFMU - Export setup data
pub type ExportAscii = extern "C" fn(file_name: *const c_char) -> c_int;

// DC - Measurement
pub type DcforceVoltage = extern "C" fn(chan_id: c_int, voltage: c_double) -> c_int;
pub type DcmeasureValue = extern "C" fn(chan_id: c_int, value: *mut c_double) -> c_int;
pub type DcmeasureAveragedValue =
    extern "C" fn(chan_id: c_int, points: c_int, interval: c_int, value: *mut c_double) -> c_int;
