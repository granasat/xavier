use std::{sync::Arc, fs::File, io::Write};

use log::info;

use crate::b1500::{WGFMU, CHANNEL1, CHANNEL2, wgfmu::{driver::{MeasureEventMode, OperationMode, MeasureMode}, WgfmuDriver}};
use super::Error;


pub fn round_10ns(n: f64) -> f64 {
    f64::floor(n * 1e8) / 1e8
}

pub fn measure_conductance_fastiv(instrument: Option<&str>) -> Result<f64, Error> {
    let wgfmu = Arc::clone(&WGFMU);
    let mut wgfmu = wgfmu.lock()?;

    println!("clear");
    wgfmu.clear()?;
    println!("clearOk");

    let avg_time = 0.0;
    let test_v = -0.1;
    let test_time = 1.0;
    {
        // CHANNEL2
        // Initializing the "v1" pattern at 0, this is for SMU1
        wgfmu.create_pattern("v1", 0.0)?;

        // Add the pulses to the waveform
        wgfmu.add_vector("v1", 1e-8, test_v)?;
        wgfmu.add_vector("v1", test_time, test_v)?;

        // Add the created waveform ONE time
        wgfmu.add_sequence(CHANNEL2, "v1", 1)?;

        // Sampling measurements High
        let time_sampling_resolution = 10e-3;
        let points = f64::floor((test_time - avg_time) / time_sampling_resolution) as i32 - 1;
        let measure_event_mode = MeasureEventMode::MeasureEventDataAveraged;
        wgfmu.set_measure_event(
            "v1",
            "event_voltage",
            0.0,
            points,
            time_sampling_resolution,
            avg_time,
            measure_event_mode,
        )?;

        // Sampling margin
        wgfmu.create_pattern("v1_margin", 0.0)?;
        wgfmu.add_vector("v1_margin", test_time / 8.0, 0.0)?;
        wgfmu.add_sequence(CHANNEL2, "v1_margin", 1)?;
    }

    {
        // Initialize at 0
        wgfmu.create_pattern("v2", 0.0)?;

        // End at 0
        wgfmu.set_vector("v2", test_time * 9.0 / 8.0 + 1e-8, 0.0)?;
        wgfmu.add_sequence(CHANNEL1, "v2", 1)?;

        let time_sampling_resolution = 10e-3;
        let points = f64::floor((test_time - avg_time) / time_sampling_resolution) as i32 - 1;
        let measure_event_mode = MeasureEventMode::MeasureEventDataAveraged;
        wgfmu.set_measure_event(
            "v2",
            "event_current",
            0.0,
            points,
            time_sampling_resolution,
            avg_time,
            measure_event_mode,
        )?;
    }

    info!("Initializing WGFMU");
    if instrument.is_some() {
        wgfmu.open_session(instrument.unwrap())?;
    }
    wgfmu.initialize()?;

    wgfmu.set_operation_mode(CHANNEL2, OperationMode::OperationModeFastIV)?;
    wgfmu.set_operation_mode(CHANNEL1, OperationMode::OperationModeFastIV)?;
    wgfmu.set_measure_mode(CHANNEL2, MeasureMode::MeasureModeVoltage)?;
    wgfmu.set_measure_mode(CHANNEL1, MeasureMode::MeasureModeCurrent)?;
    wgfmu.connect(CHANNEL2)?;
    wgfmu.connect(CHANNEL1)?;

    // wgfmu.do_self_calibration().unwrap();

    wgfmu.execute()?;

    info!("Performing measurements");
    wgfmu.wait_until_completed()?;

    info!("Retrieving data...");

    let measurement = wgfmu.get_measure_values(CHANNEL2)?;

    let mut f = File::create("test.csv".to_owned()).expect("Could not open file");

    let mut n_v_0: usize = 0; // Remove the points with voltage 0
    let conductance = measurement.iter().fold(0.0, |acc, val| match val.current {
        Some(current) => {
            writeln!(f, "{},{},{}", val.voltage, current, val.time).unwrap();
            if val.voltage != 0.0 {
                acc + (f64::abs(current) / f64::abs(val.voltage))
            } else {
                n_v_0 += 1;
                acc
            }
        }
        None => acc,
    }) / ((measurement.len() - n_v_0) as f64);

    if instrument.is_some() {
        wgfmu.close_session()?;
    }

    Ok(conductance)
}