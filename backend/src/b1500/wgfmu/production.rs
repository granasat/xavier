use lazy_static::lazy_static;
use libloading::{Library, Symbol};
use log::info;
use num_traits::FromPrimitive;
use std::ffi::CString;
use std::os::raw::{c_char, c_double, c_int};

use super::driver::*;
use super::types::*;
// WGFMU Library rust bindings, see https://l4.granasat.space/docs/B1500A/wgfmu/programming_guide for more details.

lazy_static! {
    static ref DLL: Library = unsafe { Library::new("./wgfmu.dll").unwrap() };
}

#[allow(dead_code)]
#[rustfmt::skip]
pub struct ProductionWgfmu<'a> {
    open_session:                           Symbol<'a, OpenSession>,
    close_session:                          Symbol<'a, CloseSession>,
    initialize:                             Symbol<'a, Initialize>,
    set_timeout:                            Symbol<'a, SetTimeout>,
    do_self_calibration:                    Symbol<'a, DoSelfCalibration>,
    do_self_test:                           Symbol<'a, DoSelfTest>,
    get_channel_id_size:                    Symbol<'a, GetChannelIdSize>,
    get_channel_ids:                        Symbol<'a, GetChannelIds>,
    get_error_size:                         Symbol<'a, GetErrorSize>,
    get_error:                              Symbol<'a, GetError>,
    get_error_summary_size:                 Symbol<'a, GetErrorSummarySize>,
    get_error_summary:                      Symbol<'a, GetErrorSummary>,
    treat_warnings_as_errors:               Symbol<'a, TreatWarningsAsErrors>,
    set_warning_level:                      Symbol<'a, SetWarningLevel>,
    get_warning_level:                      Symbol<'a, GetWarningLevel>,
    get_warning_summary_size:               Symbol<'a, GetWarningSummarySize>,
    get_warning_summary:                    Symbol<'a, GetWarningSummary>,
    open_log_file:                          Symbol<'a, OpenLogFile>,
    close_log_file:                         Symbol<'a, CloseLogFile>,
    set_operation_mode:                     Symbol<'a, SetOperationMode>,
    get_operation_mode:                     Symbol<'a, GetOperationMode>,
    set_force_voltage_range:                Symbol<'a, SetForceVoltageRange>,
    get_force_voltage_range:                Symbol<'a, GetForceVoltageRange>,
    set_measure_mode:                       Symbol<'a, SetMeasureMode>,
    get_measure_mode:                       Symbol<'a, GetMeasureMode>,
    set_measure_current_range:              Symbol<'a, SetMeasureCurrentRange>,
    get_measure_current_range:              Symbol<'a, GetMeasureCurrentRange>,
    set_measure_voltage_range:              Symbol<'a, SetMeasureVoltageRange>,
    get_measure_voltage_range:              Symbol<'a, GetMeasureVoltageRange>,
    set_force_delay:                        Symbol<'a, SetForceDelay>,
    get_force_delay:                        Symbol<'a, GetForceDelay>,
    set_measure_delay:                      Symbol<'a, SetMeasureDelay>,
    get_measure_delay:                      Symbol<'a, GetMeasureDelay>,
    set_measure_enabled:                    Symbol<'a, SetMeasureEnabled>,
    is_measure_enabled:                     Symbol<'a, IsMeasureEnabled>,
    set_trigger_out_mode:                   Symbol<'a, SetTriggerOutMode>,
    get_trigger_out_mode:                   Symbol<'a, GetTriggerOutMode>,
    connect:                                Symbol<'a, Connect>,
    disconnect:                             Symbol<'a, Disconnect>,
    clear:                                  Symbol<'a, Clear>,
    create_pattern:                         Symbol<'a, CreatePattern>,
    add_vector:                             Symbol<'a, AddVector>,
    add_vectors:                            Symbol<'a, AddVectors>,
    set_vector:                             Symbol<'a, SetVector>,
    set_vectors:                            Symbol<'a, SetVectors>,
    create_merged_pattern:                  Symbol<'a, CreateMergedPattern>,
    create_multiplied_pattern:              Symbol<'a, CreateMultipliedPattern>,
    create_offset_pattern:                  Symbol<'a, CreateOffsetPattern>,
    set_measure_event:                      Symbol<'a, SetMeasureEvent>,
    set_range_event:                        Symbol<'a, SetRangeEvent>,
    set_trigger_out_event:                  Symbol<'a, SetTriggerOutEvent>,
    add_sequence:                           Symbol<'a, AddSequence>,
    add_sequences:                          Symbol<'a, AddSequences>,
    get_pattern_force_value_size:           Symbol<'a, GetPatternForceValueSize>,
    get_pattern_force_values:               Symbol<'a, GetPatternForceValues>,
    get_pattern_force_value:                Symbol<'a, GetPatternForceValue>,
    get_pattern_interpolated_force_value:   Symbol<'a, GetPatternInterpolatedForceValue>,
    get_pattern_measure_time_size:          Symbol<'a, GetPatternMeasureTimeSize>,
    get_pattern_measure_times:              Symbol<'a, GetPatternMeasureTimes>,
    get_pattern_measure_time:               Symbol<'a, GetPatternMeasureTime>,
    get_force_value_size:                   Symbol<'a, GetForceValueSize>,
    get_force_values:                       Symbol<'a, GetForceValues>,
    get_force_value:                        Symbol<'a, GetForceValue>,
    get_interpolated_force_value:           Symbol<'a, GetInterpolatedForceValue>,
    get_measure_time_size:                  Symbol<'a, GetMeasureTimeSize>,
    get_measure_times:                      Symbol<'a, GetMeasureTimes>,
    get_measure_time:                       Symbol<'a, GetMeasureTime>,
    get_measure_event_size:                 Symbol<'a, GetMeasureEventSize>,
    get_measure_events:                     Symbol<'a, GetMeasureEvents>,
    get_measure_event:                      Symbol<'a, GetMeasureEvent>,
    get_measure_event_attribute:            Symbol<'a, GetMeasureEventAttribute>,
    update:                                 Symbol<'a, Update>,
    update_channel:                         Symbol<'a, UpdateChannel>,
    execute:                                Symbol<'a, Execute>,
    abort:                                  Symbol<'a, Abort>,
    abort_channel:                          Symbol<'a, AbortChannel>,
    get_channel_status:                     Symbol<'a, GetChannelStatus>,
    wait_until_completed:                   Symbol<'a, WaitUntilCompleted>,
    get_measure_value_size:                 Symbol<'a, GetMeasureValueSize>,
    get_measure_values:                     Symbol<'a, GetMeasureValues>,
    get_measure_value:                      Symbol<'a, GetMeasureValue>,
    get_completed_measure_event_size:       Symbol<'a, GetCompletedMeasureEventSize>,
    is_measure_event_completed:             Symbol<'a, IsMeasureEventCompleted>,
    export_ascii:                           Symbol<'a, ExportAscii>,
    dcforce_voltage:                        Symbol<'a, DcforceVoltage>,
    dcmeasure_value:                        Symbol<'a, DcmeasureValue>,
    dcmeasure_averaged_value:               Symbol<'a, DcmeasureAveragedValue>,
}

fn get_result(ret: i32) -> Res {
    match ret {
        0 => Ok(()),
        _ => match FromPrimitive::from_i32(ret) {
            Some(err) => Result::Err(err),
            None => Result::Err(Error::UnidentifiedError),
        },
    }
}

#[allow(unused_unsafe, dead_code)]
impl<'a> WgfmuDriver for ProductionWgfmu<'a> {

    fn open_session(&mut self, instrument: &str) -> Res {
        let ret;
        unsafe {
            let instrument = CString::new(instrument.to_string()).unwrap();
            let instrument = instrument.as_ptr();

            ret = (self.open_session)(instrument);
        }
        let res = get_result(ret);
        match res {
            Ok(_) => res,
            Err(err) => match err {
                Error::ContextError => {
                    self.close_session().unwrap();
                    self.open_session(instrument)
                }
                _ => Result::Err(err),
            },
        }
    }

    fn close_session(&mut self) -> Res {
        let ret;
        unsafe {
            ret = (self.close_session)();
        }
        get_result(ret)
    }

    fn clear(&mut self) -> Res {
        let ret;
        unsafe {
            ret = (self.clear)();
        }
        get_result(ret)
    }

    fn create_pattern(&mut self, pattern: &str, init_v: f64) -> Res {
        let ret;
        unsafe {
            let pattern = CString::new(pattern).unwrap();
            let pattern = pattern.as_ptr();

            ret = (self.create_pattern)(pattern, init_v);
        }
        get_result(ret)
    }

    fn add_vector(&mut self, pattern: &str, d_time: f64, voltage: f64) -> Res {
        let mut d_time = d_time;

        if !(d_time > 0.0) {
            d_time = 1e-8;
        }

        let ret;
        unsafe {
            let pattern = CString::new(pattern).unwrap();
            let pattern = pattern.as_ptr();

            ret = (self.add_vector)(pattern, d_time, voltage);
        }
        get_result(ret)
    }

    fn add_vectors(&mut self, pattern: &str, d_time: Vec<f64>, voltage: Vec<f64>) -> Res {

        if d_time.len() != voltage.len() {
            return Result::Err(Error::BadArguments);
        }

        let ret;
        unsafe {
            let pattern = CString::new(pattern).unwrap();
            let pattern = pattern.as_ptr();
            info!("LEN {}", d_time.len());
            ret = (self.add_vectors)(pattern, d_time.as_ptr(), voltage.as_ptr(), d_time.len() as c_int);
            
            let mut r_len = 0;
            let r_len = &mut r_len as *mut c_int;
            
            (self.get_pattern_force_value_size)(pattern, r_len);
            
            info!("REAL LEN {}", *r_len);

        }
        get_result(ret)
    }

    fn set_measure_event(
        &mut self,
        pattern: &str,
        event: &str,
        time: f64,
        points: i32,
        interval: f64,
        average: f64,
        measure_event_mode: MeasureEventMode,
    ) -> Res {
        let ret;
        unsafe {
            let pattern = CString::new(pattern).unwrap();
            let pattern = pattern.as_ptr();

            let event = CString::new(event).unwrap();
            let event = event.as_ptr();
            let rdata = measure_event_mode as i32;
            ret = (self.set_measure_event)(pattern, event, time, points, interval, average, rdata);
        }
        get_result(ret)
    }

    fn add_sequence(&mut self, chan_id: usize, pattern: &str, count: usize) -> Res {
        let ret;
        unsafe {
            let pattern = CString::new(pattern).unwrap();
            let pattern = pattern.as_ptr();

            ret = (self.add_sequence)(chan_id as i32, pattern, count as f64);
        }
        get_result(ret)
    }

    fn add_sequences(&mut self, chan_id: usize, pattern: Vec<&str>, count: Vec<usize>) -> Res {
        let ret;
        unsafe {

            let pattern_c: Vec<CString> = pattern.iter().map(|&s| CString::new(s).unwrap()).collect();
            let mut count_c: Vec<f64> = count.iter().map(|&c| c as f64).collect();

            ret = (self.add_sequences)(
                chan_id as i32,
                pattern_c.iter().map(|cstr| cstr.as_ptr()).collect::<Vec<*const i8>>().as_ptr(),
                count_c.as_mut_ptr(),
                pattern.len() as c_int);
        }
        get_result(ret)
    }

    fn set_vector(&mut self, pattern: &str, time: f64, voltage: f64) -> Res {
        let ret;
        unsafe {
            let pattern = CString::new(pattern).unwrap();
            let pattern = pattern.as_ptr();

            ret = (self.set_vector)(pattern, time, voltage);
        }
        get_result(ret)
    }

    fn initialize(&mut self) -> Res {
        get_result((self.initialize)())
    }

    fn set_operation_mode(&mut self, chan_id: usize, operation_mode: OperationMode) -> Res {
        let ret;
        unsafe {
            ret = (self.set_operation_mode)(chan_id as i32, operation_mode as i32);
        }
        get_result(ret)
    }

    fn set_measure_mode(&mut self, chan_id: usize, mode: MeasureMode) -> Res {
        let ret;
        unsafe {
            ret = (self.set_measure_mode)(chan_id as i32, mode as i32);
        }
        get_result(ret)
    }

    fn get_measure_mode(&mut self, chan_id: i32) -> Result<MeasureMode, Error> {
        #[allow(unused_mut)]
        unsafe {
            let mut meas_mode_tmp = 0;
            let mut meas_mode_tmp = &mut meas_mode_tmp as *mut c_int;

            let ret = (self.get_measure_mode)(chan_id, meas_mode_tmp);
            match get_result(ret) {
                Ok(_) => match FromPrimitive::from_i32(*meas_mode_tmp) {
                    Some(meas_mode) => Ok(meas_mode),
                    None => Result::Err(Error::UnidentifiedError),
                },
                Err(err) => Result::Err(err),
            }
        }
    }

    fn get_operation_mode(&mut self, chan_id: i32) -> Result<OperationMode, Error> {
        #[allow(unused_mut)]
        unsafe {
            let mut op_mode_tmp = 0;
            let mut op_mode_tmp = &mut op_mode_tmp as *mut c_int;

            let ret = (self.get_operation_mode)(chan_id, op_mode_tmp);
            match get_result(ret) {
                Ok(_) => match FromPrimitive::from_i32(*op_mode_tmp) {
                    Some(op_mode) => Ok(op_mode),
                    None => Result::Err(Error::UnidentifiedError),
                },
                Err(err) => Result::Err(err),
            }
        }
    }

    fn connect(&mut self, chan_id: usize) -> Res {
        let ret;
        unsafe {
            ret = (self.connect)(chan_id as i32);
        }
        get_result(ret)
    }

    fn execute(&mut self) -> Res {
        let ret;
        unsafe {
            let pattern = CString::new("v1_1").unwrap();
            let pattern = pattern.as_ptr();
            
            let mut r_len = 0;
            let r_len = &mut r_len as *mut c_int;
            
            (self.get_pattern_force_value_size)(pattern, r_len);
            
            info!("REAL LEN2 {}", *r_len);

            ret = (self.execute)();
        }
        get_result(ret)
    }

    fn wait_until_completed(&mut self) -> Res {
        let ret;
        unsafe {
            ret = (self.wait_until_completed)();
        }
        get_result(ret)
    }

    fn get_measure_values(&mut self, chan_id: usize) -> Result<Vec<Measurement>, Error> {
        let mut meas_vec = Vec::<Measurement>::new();
        unsafe {
            let measurement_size = self.get_measure_value_size(chan_id as i32)?;
            let measurement_size1 = self.get_measure_value_size(101 as i32)?;
            info!(
                "Size 102: {}\nSize 101: {}",
                measurement_size, measurement_size1
            );
            let op_mode = self.get_operation_mode(chan_id as i32)?;
            match op_mode {
                OperationMode::OperationModeFastIV => {
                    // let mut voltage_vec = Vec::<f64>::new();
                    // let mut current_vec = Vec::<f64>::new();
                    // let mut time_vec = Vec::<f64>::new();

                    for i in 0..measurement_size {
                        let mut voltage = 0.0;
                        let voltage = &mut voltage as *mut c_double;

                        let mut current = 0.0;
                        let current = &mut current as *mut c_double;

                        let mut time = 0.0;
                        let time = &mut time as *mut c_double;

                        let ret = (self.get_measure_value)(101 as i32, i as c_int, time, current);
                        get_result(ret)?;

                        let ret = (self.get_measure_value)(chan_id as i32, i as c_int, time, voltage);

                        get_result(ret)?;

                        meas_vec.push(Measurement {
                            voltage: *voltage,
                            current: Some(*current),
                            time: *time,
                        });
                    }
                    Ok(meas_vec)
                }
                _ => Result::Err(Error::NotImplemented),
            }
        }
    }

    fn do_self_calibration(&mut self) -> Res {
        let ret;
        unsafe {
            let mut result = 0;
            let result = &mut result as *mut c_int;

            let string: &str = "Hello, world!";
            let bytes: Vec<u8> = String::from(string).into_bytes();
            let mut c_chars: Vec<i8> = bytes.iter().map(|c| *c as i8).collect::<Vec<i8>>();

            c_chars.push(0); // null terminator

            let detail: *mut c_char = c_chars.as_mut_ptr();

            let mut size = string.len() as i32;
            let size = &mut size as *mut c_int;

            ret = (self.do_self_calibration)(result, detail, size);
        }
        get_result(ret)
    }
}

impl<'a> ProductionWgfmu<'a> {
    #[rustfmt::skip]
    #[allow(unused)]
    pub fn new() -> Result<ProductionWgfmu<'a>, Box<dyn std::error::Error>> {

        unsafe {
            Ok(ProductionWgfmu {
                open_session:                           DLL.get::<OpenSession>              (b"WGFMU_openSession").unwrap(),
                close_session:                          DLL.get::<CloseSession>             (b"WGFMU_closeSession").unwrap(),
                initialize:                             DLL.get::<Initialize>               (b"WGFMU_initialize").unwrap(),
                set_timeout:                            DLL.get::<SetTimeout>               (b"WGFMU_setTimeout").unwrap(),
                do_self_calibration:                    DLL.get::<DoSelfCalibration>        (b"WGFMU_doSelfCalibration").unwrap(),
                do_self_test:                           DLL.get::<DoSelfTest>               (b"WGFMU_doSelfTest").unwrap(),
                get_channel_id_size:                    DLL.get::<GetChannelIdSize>         (b"WGFMU_getChannelIdSize").unwrap(),
                get_channel_ids:                        DLL.get::<GetChannelIds>            (b"WGFMU_getChannelIds").unwrap(),
                get_error_size:                         DLL.get::<GetErrorSize>             (b"WGFMU_getErrorSize").unwrap(),
                get_error:                              DLL.get::<GetError>                 (b"WGFMU_getError").unwrap(),
                get_error_summary_size:                 DLL.get::<GetErrorSummarySize>      (b"WGFMU_getErrorSummarySize").unwrap(),
                get_error_summary:                      DLL.get::<GetErrorSummary>          (b"WGFMU_getErrorSummary").unwrap(),
                treat_warnings_as_errors:               DLL.get::<TreatWarningsAsErrors>    (b"WGFMU_treatWarningsAsErrors").unwrap(),
                set_warning_level:                      DLL.get::<SetWarningLevel>          (b"WGFMU_setWarningLevel").unwrap(),
                get_warning_level:                      DLL.get::<GetWarningLevel>          (b"WGFMU_getWarningLevel").unwrap(),
                get_warning_summary_size:               DLL.get::<GetWarningSummarySize>    (b"WGFMU_getWarningSummarySize").unwrap(),
                get_warning_summary:                    DLL.get::<GetWarningSummary>        (b"WGFMU_getWarningSummary").unwrap(),
                open_log_file:                          DLL.get::<OpenLogFile>              (b"WGFMU_openLogFile").unwrap(),
                close_log_file:                         DLL.get::<CloseLogFile>             (b"WGFMU_closeLogFile").unwrap(),
                set_operation_mode:                     DLL.get::<SetOperationMode>         (b"WGFMU_setOperationMode").unwrap(),
                get_operation_mode:                     DLL.get::<GetOperationMode>         (b"WGFMU_getOperationMode").unwrap(),
                set_force_voltage_range:                DLL.get::<SetForceVoltageRange>     (b"WGFMU_setForceVoltageRange").unwrap(),
                get_force_voltage_range:                DLL.get::<GetForceVoltageRange>     (b"WGFMU_getForceVoltageRange").unwrap(),
                set_measure_mode:                       DLL.get::<SetMeasureMode>           (b"WGFMU_setMeasureMode").unwrap(),
                get_measure_mode:                       DLL.get::<GetMeasureMode>           (b"WGFMU_getMeasureMode").unwrap(),
                set_measure_current_range:              DLL.get::<SetMeasureCurrentRange>   (b"WGFMU_setMeasureCurrentRange").unwrap(),
                get_measure_current_range:              DLL.get::<GetMeasureCurrentRange>   (b"WGFMU_getMeasureCurrentRange").unwrap(),
                set_measure_voltage_range:              DLL.get::<SetMeasureVoltageRange>   (b"WGFMU_setMeasureVoltageRange").unwrap(),
                get_measure_voltage_range:              DLL.get::<GetMeasureVoltageRange>   (b"WGFMU_getMeasureVoltageRange").unwrap(),
                set_force_delay:                        DLL.get::<SetForceDelay>            (b"WGFMU_setForceDelay").unwrap(),
                get_force_delay:                        DLL.get::<GetForceDelay>            (b"WGFMU_getForceDelay").unwrap(),
                set_measure_delay:                      DLL.get::<SetMeasureDelay>          (b"WGFMU_setMeasureDelay").unwrap(),
                get_measure_delay:                      DLL.get::<GetMeasureDelay>          (b"WGFMU_getMeasureDelay").unwrap(),
                set_measure_enabled:                    DLL.get::<SetMeasureEnabled>        (b"WGFMU_setMeasureEnabled").unwrap(),
                is_measure_enabled:                     DLL.get::<IsMeasureEnabled>         (b"WGFMU_isMeasureEnabled").unwrap(),
                set_trigger_out_mode:                   DLL.get::<SetTriggerOutMode>        (b"WGFMU_setTriggerOutMode").unwrap(),
                get_trigger_out_mode:                   DLL.get::<GetTriggerOutMode>        (b"WGFMU_getTriggerOutMode").unwrap(),
                connect:                                DLL.get::<Connect>                  (b"WGFMU_connect").unwrap(),
                disconnect:                             DLL.get::<Disconnect>               (b"WGFMU_disconnect").unwrap(),
                clear:                                  DLL.get::<Clear>                    (b"WGFMU_clear").unwrap(),
                create_pattern:                         DLL.get::<CreatePattern>            (b"WGFMU_createPattern").unwrap(),
                add_vector:                             DLL.get::<AddVector>                (b"WGFMU_addVector").unwrap(),
                add_vectors:                            DLL.get::<AddVectors>               (b"WGFMU_addVectors").unwrap(),
                set_vector:                             DLL.get::<SetVector>                (b"WGFMU_setVector").unwrap(),
                set_vectors:                            DLL.get::<SetVectors>               (b"WGFMU_setVectors").unwrap(),
                create_merged_pattern:                  DLL.get::<CreateMergedPattern>      (b"WGFMU_createMergedPattern").unwrap(),
                create_multiplied_pattern:              DLL.get::<CreateMultipliedPattern>  (b"WGFMU_createMultipliedPattern").unwrap(),
                create_offset_pattern:                  DLL.get::<CreateOffsetPattern>      (b"WGFMU_createOffsetPattern").unwrap(),
                set_measure_event:                      DLL.get::<SetMeasureEvent>          (b"WGFMU_setMeasureEvent").unwrap(),
                set_range_event:                        DLL.get::<SetRangeEvent>            (b"WGFMU_setRangeEvent").unwrap(),
                set_trigger_out_event:                  DLL.get::<SetTriggerOutEvent>       (b"WGFMU_setTriggerOutEvent").unwrap(),
                add_sequence:                           DLL.get::<AddSequence>              (b"WGFMU_addSequence").unwrap(),
                add_sequences:                          DLL.get::<AddSequences>             (b"WGFMU_addSequences").unwrap(),
                get_pattern_force_value_size:           DLL.get::<GetPatternForceValueSize> (b"WGFMU_getPatternForceValueSize").unwrap(),
                get_pattern_force_values:               DLL.get::<GetPatternForceValues>    (b"WGFMU_getPatternForceValues").unwrap(),
                get_pattern_force_value:                DLL.get::<GetPatternForceValue>     (b"WGFMU_getPatternForceValue").unwrap(),
                get_pattern_interpolated_force_value:   DLL.get::<GetPatternInterpolatedForceValue>(b"WGFMU_getPatternInterpolatedForceValue").unwrap(),
                get_pattern_measure_time_size:          DLL.get::<GetPatternMeasureTimeSize>(b"WGFMU_getPatternMeasureTimeSize").unwrap(),
                get_pattern_measure_times:              DLL.get::<GetPatternMeasureTimes>   (b"WGFMU_getPatternMeasureTimes").unwrap(),
                get_pattern_measure_time:               DLL.get::<GetPatternMeasureTime>    (b"WGFMU_getPatternMeasureTime").unwrap(),
                get_force_value_size:                   DLL.get::<GetForceValueSize>        (b"WGFMU_getForceValueSize").unwrap(),
                get_force_values:                       DLL.get::<GetForceValues>           (b"WGFMU_getForceValues").unwrap(),
                get_force_value:                        DLL.get::<GetForceValue>            (b"WGFMU_getForceValue").unwrap(),
                get_interpolated_force_value:           DLL.get::<GetInterpolatedForceValue>(b"WGFMU_getInterpolatedForceValue").unwrap(),
                get_measure_time_size:                  DLL.get::<GetMeasureTimeSize>       (b"WGFMU_getMeasureTimeSize").unwrap(),
                get_measure_times:                      DLL.get::<GetMeasureTimes>          (b"WGFMU_getMeasureTimes").unwrap(),
                get_measure_time:                       DLL.get::<GetMeasureTime>           (b"WGFMU_getMeasureTime").unwrap(),
                get_measure_event_size:                 DLL.get::<GetMeasureEventSize>      (b"WGFMU_getMeasureEventSize").unwrap(),
                get_measure_events:                     DLL.get::<GetMeasureEvents>         (b"WGFMU_getMeasureEvents").unwrap(),
                get_measure_event:                      DLL.get::<GetMeasureEvent>          (b"WGFMU_getMeasureEvent").unwrap(),
                get_measure_event_attribute:            DLL.get::<GetMeasureEventAttribute> (b"WGFMU_getMeasureEventAttribute").unwrap(),
                update:                                 DLL.get::<Update>                   (b"WGFMU_update").unwrap(),
                update_channel:                         DLL.get::<UpdateChannel>            (b"WGFMU_updateChannel").unwrap(),
                execute:                                DLL.get::<Execute>                  (b"WGFMU_execute").unwrap(),
                abort:                                  DLL.get::<Abort>                    (b"WGFMU_abort").unwrap(),
                abort_channel:                          DLL.get::<AbortChannel>             (b"WGFMU_abortChannel").unwrap(),
                get_channel_status:                     DLL.get::<GetChannelStatus>         (b"WGFMU_getChannelStatus").unwrap(),
                wait_until_completed:                   DLL.get::<WaitUntilCompleted>       (b"WGFMU_waitUntilCompleted").unwrap(),
                get_measure_value_size:                 DLL.get::<GetMeasureValueSize>      (b"WGFMU_getMeasureValueSize").unwrap(),
                get_measure_values:                     DLL.get::<GetMeasureValues>         (b"WGFMU_getMeasureValues").unwrap(),
                get_measure_value:                      DLL.get::<GetMeasureValue>          (b"WGFMU_getMeasureValue").unwrap(),
                get_completed_measure_event_size:       DLL.get::<GetCompletedMeasureEventSize>(b"WGFMU_getCompletedMeasureEventSize").unwrap(),
                is_measure_event_completed:             DLL.get::<IsMeasureEventCompleted>  (b"WGFMU_isMeasureEventCompleted").unwrap(),
                export_ascii:                           DLL.get::<ExportAscii>              (b"WGFMU_exportAscii").unwrap(),
                dcforce_voltage:                        DLL.get::<DcforceVoltage>           (b"WGFMU_dcforceVoltage").unwrap(),
                dcmeasure_value:                        DLL.get::<DcmeasureValue>           (b"WGFMU_dcmeasureValue").unwrap(),
                dcmeasure_averaged_value:               DLL.get::<DcmeasureAveragedValue>   (b"WGFMU_dcmeasureAveragedValue").unwrap(),
            })
        }
    }

    fn get_measure_value_size(&mut self, chan_id: i32) -> Result<u32, Error> {
        unsafe {
            let mut complete = 0;
            let complete = &mut complete as *mut c_int;
            let mut total = 0;
            let total = &mut total as *mut c_int;

            let ret = (self.get_measure_value_size)(chan_id, complete, total);
            match get_result(ret) {
                Ok(_) => Ok((*complete) as u32),
                Err(err) => Result::Err(err),
            }
        }
    }
}

// impl<'a> Deref for ProductionWgfmu<'a> {

//     fn deref(&self) -> &'a ProductionWgfmu{
//         &self
//     }

//     type Target = ProductionWgfmu<'a>;
// }

// impl<'a> DerefMut for ProductionWgfmu<'a> {
//     fn deref_mut(&mut self) -> &mut ProductionWgfmu {
//         &mut self
//     }
// }
