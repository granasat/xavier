// use libloading::{Library, Symbol};
use num_traits::{FromPrimitive};
use std::{collections::HashMap};
// use std::ffi::{CStr, CString};
// use std::os::raw::{c_char, c_double, c_int};
// use std::rc::Rc;

use super::driver::*;

// WGFMU Library rust bindings, see https://l4.granasat.space/docs/B1500A/wgfmu/programming_guide for more details.

#[allow(dead_code)]
#[derive(Debug)]
pub struct TestWgfmu {
    vectors: HashMap<String, Vector>,
    last_t: f64,
    measured_waveform: Vec<Measurement>
}

#[derive(Clone, Debug)]
struct Vector {
    measurements: Vec<Measurement>,
    last_t: f64,
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

type Res = Result<(), Error>;

#[allow(unused_unsafe, dead_code, unused)]
impl WgfmuDriver for TestWgfmu {
    fn open_session(&mut self, instrument: &str) -> Res {
        let ret = 0;
        get_result(ret)
    }
    
    fn close_session(&mut self) -> Res {
        let ret = 0;
        get_result(ret)
    }

    fn clear(&mut self) -> Res {
        let ret = 0;
        get_result(ret)
    }

    fn create_pattern(&mut self, pattern: &str, init_v: f64) -> Res {
        self.vectors.insert(
            pattern.to_string(),
            Vector {
                measurements: Vec::new(),
                last_t: 0.0,
            },
        );

        get_result(0)
    }

    fn add_vector(&mut self, pattern: &str, d_time: f64, voltage: f64) -> Res {

        let mut d_time = d_time;

        if ! (d_time > 0.0) {
            d_time = 1e-8;
        }

        match self.vectors.get_mut(pattern) {
            Some(vector) => {
                vector.last_t = vector.last_t + d_time;
                vector.measurements.push(Measurement {
                    voltage,
                    current: Some(voltage/2.0),
                    time: vector.last_t,
                });
                get_result(0)
            }
            None => get_result(0),
        }
    }
    
    fn add_vectors(&mut self, pattern: &str, d_time: Vec<f64>, voltage: Vec<f64>) -> Res {

        let mut d_time = d_time;

        if d_time.len() != voltage.len() {
            return Result::Err(Error::BadArguments);
        }

        for i in 0..d_time.len() {
            self.add_vector(pattern, d_time[i], voltage[i])?;
        }

        Ok(())
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
        let ret = 0;
        get_result(ret)
    }

    fn add_sequence(&mut self, chan_id: usize, pattern: &str, count: usize) -> Res {
        let ret = 0;

        match self.vectors.get_mut(pattern) {
            Some(vector) => {
                let mut vector_copy = vector.to_owned();
                let cycle_time = vector.last_t;
                for i in 0..count-1 {
                    // vector.measurements.append(
                    //     &mut vector_copy.measurements.iter().map(|meas| {
                    //         Measurement {
                    //             voltage: meas.voltage,
                    //             current: meas.current,
                    //             time: meas.time + vector.last_t
                    //         }
                    //     }).collect::<Vec<Measurement>>()
                    // );
                    // vector.last_t = vector.last_t + cycle_time;

                    self.measured_waveform.append(
                        &mut vector_copy.measurements.iter().map(|meas| {
                            Measurement {
                                voltage: meas.voltage,
                                current: meas.current,
                                time: meas.time + cycle_time * (i as f64) + self.last_t
                            }
                        }).collect::<Vec<Measurement>>()
                    );
                }
                self.last_t = self.last_t + cycle_time * (count as f64 - 1.0);
            },
            None => {}
        };

        get_result(ret)
    }

    fn add_sequences(&mut self, chan_id: usize, pattern: Vec<&str>, count: Vec<usize>) -> Res {
        let ret = 0;
        let len = pattern.len();
        
        if pattern.len() != count.len() {
            return Result::Err(Error::BadArguments);
        }

        for i in 0..len {
            self.add_sequence(chan_id, pattern[i], count[i]);
        }

        get_result(ret)
    }

    fn set_vector(&mut self, pattern: &str, time: f64, voltage: f64) -> Res {
        let ret = 0;
        get_result(ret)
    }

    fn initialize(&mut self) -> Res {
        get_result(0)
    }

    fn set_operation_mode(&mut self, chan_id: usize, operation_mode: OperationMode) -> Res {
        let ret = 0;
        get_result(ret)
    }

    fn set_measure_mode(&mut self, chan_id: usize, mode: MeasureMode) -> Res {
        let ret = 0;
        get_result(ret)
    }

    fn get_measure_mode(&mut self, chan_id: i32) -> Result<MeasureMode, Error> {
        #[allow(unused_mut)]
        let ret = 0;
        match get_result(ret) {
            Ok(_) => match FromPrimitive::from_i32(MeasureMode::MeasureModeCurrent as i32) {
                Some(meas_mode) => Ok(meas_mode),
                None => Result::Err(Error::UnidentifiedError),
            },
            Err(err) => Result::Err(err),
        }
    }

    fn get_operation_mode(&mut self, chan_id: i32) -> Result<OperationMode, Error> {
        #[allow(unused_mut)]
        let ret = 0;
        match get_result(ret) {
            Ok(_) => match FromPrimitive::from_i32(OperationMode::OperationModeFastIV as i32) {
                Some(op_mode) => Ok(op_mode),
                None => Result::Err(Error::UnidentifiedError),
            },
            Err(err) => Result::Err(err),
        }
    }

    fn connect(&mut self, chan_id: usize) -> Res {
        let ret = 0;
        get_result(ret)
    }

    fn execute(&mut self) -> Res {
        let ret = 0;
        get_result(ret)
    }

    fn wait_until_completed(&mut self) -> Res {
        let ret = 0;
        get_result(ret)
    }

    fn get_measure_values(&mut self, chan_id: usize) -> Result<Vec<Measurement>, Error> {
        std::thread::sleep(std::time::Duration::from_millis(4000));

        Ok(self.measured_waveform.to_owned())
    }

    fn do_self_calibration(&mut self) -> Res {
        Ok(())
    }
}

impl TestWgfmu {
    #[rustfmt::skip]
    pub fn new() -> Result<TestWgfmu, Box<dyn std::error::Error>> {
        Ok(TestWgfmu {
            vectors: HashMap::new(),
            last_t: 0.0,
            measured_waveform: vec![]
        })
    }
}























