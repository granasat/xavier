use crate::www::measurements::pulse;

use super::wgfmu::driver::{
    Error, MeasureEventMode, MeasureMode, Measurement, OperationMode, WgfmuDriver,
};
use super::WGFMU;
use log::info;
use serde_json::de;
use std::sync::Arc;

const CHANNEL1: usize = 101;
const CHANNEL2: usize = 102;

pub fn round_10ns(n: f64) -> f64 {
    f64::floor(n * 1e8) / 1e8
}

pub fn measure_pulse_fastiv(
    instrument: &str,
    n_pulses: usize,
    duty_cycle: f64,
    cycle_time: f64,
    v_high: f64,
    v_low: f64,
    n_points_high: usize,
    n_points_low: usize,
    avg_time: f64,
) -> Result<Vec<Measurement>, Error> {
    info!(
        "Measuring {} pulses at {}% DC and {}ns period",
        n_pulses,
        duty_cycle * 100.0,
        cycle_time * 1e9
    );

    let wgfmu = Arc::clone(&WGFMU);
    let mut wgfmu = wgfmu.lock()?;

    println!("clear");
    wgfmu.clear().unwrap();
    println!("clearOk");

    let mut avg_time = avg_time;
    {
        // CHANNEL2
        // Initializing the "v1" pattern at 0, this is for SMU1
        wgfmu.create_pattern("v1", 0.0).unwrap();

        // Add the pulses to the waveform
        let mut time = 0.0;

        wgfmu.add_vector("v1", 1e-8, v_high).unwrap();
        wgfmu
            .add_vector("v1", cycle_time * duty_cycle, v_high)
            .unwrap();
        wgfmu.add_vector("v1", 1e-8, v_low).unwrap();
        wgfmu
            .add_vector("v1", cycle_time * (1.0 - duty_cycle), v_low)
            .unwrap();

        time = time + 1e-8 + cycle_time * duty_cycle + 1e-8 + cycle_time * (1.0 - duty_cycle);
        // Add the created waveform ONE time
        wgfmu.add_sequence(CHANNEL2, "v1", n_pulses).unwrap();

        time = round_10ns(time);

        // Sampling measurements High
        let totaltime_high = round_10ns(cycle_time * duty_cycle + 1e-8);
        let measure_totaltime_high = round_10ns(totaltime_high - 1e-8);
        let time_sampling_resolution_high =
            round_10ns(measure_totaltime_high / (n_points_high as f64));

        if avg_time > time_sampling_resolution_high {
            avg_time = round_10ns(time_sampling_resolution_high);
        }

        let points_high =
            f64::floor((measure_totaltime_high - avg_time) / time_sampling_resolution_high) as i32;
        let measure_event_mode = MeasureEventMode::MeasureEventDataAveraged;
        wgfmu.set_measure_event(
            "v1",
            "event_high",
            0.0,
            points_high,
            time_sampling_resolution_high,
            avg_time,
            measure_event_mode,
        )?;

        // Sampling measurements Low
        let totaltime_low = round_10ns(cycle_time * duty_cycle + 1e-8);
        let measure_totaltime_low = round_10ns(totaltime_low - 1e-8);
        let mut time_sampling_resolution_low =
            round_10ns(measure_totaltime_low / (n_points_low as f64));

        if time_sampling_resolution_low < 1e-8 {
            time_sampling_resolution_low = 1e-8
        }

        if avg_time > time_sampling_resolution_low {
            avg_time = round_10ns(time_sampling_resolution_low);
        }

        let points_low =
            f64::floor((measure_totaltime_low - avg_time) / time_sampling_resolution_low) as i32;
        let measure_event_mode = MeasureEventMode::MeasureEventDataAveraged;
        wgfmu.set_measure_event(
            "v1",
            "event_low",
            round_10ns(1e-8 + measure_totaltime_low + totaltime_high),
            points_low,
            time_sampling_resolution_low,
            avg_time,
            measure_event_mode,
        )?;

        // Sampling margin
        wgfmu.create_pattern("v1_margin", 0.0)?;
        wgfmu.add_vector("v1_margin", cycle_time, 0.0)?;
        wgfmu.add_sequence(CHANNEL2, "v1_margin", 1).unwrap();

        info!(
            "New Cycle ({}):\n
            \t HIGH\n
            \t\t Points: {}!, time: {}, sampling_time: {}\n
            \t LOW\n
            \t\t Points: {}!, time: {}, sampling_time: {}\n",
            cycle_time,
            points_high,
            totaltime_high,
            (points_high as f64) * time_sampling_resolution_high,
            points_low,
            totaltime_low,
            (points_low as f64) * time_sampling_resolution_low
        );
    }

    {
        let total_time = cycle_time * ((n_pulses + 1) as f64);
        let meas_time = cycle_time * (n_pulses as f64);
        // Initialize at 0
        wgfmu.create_pattern("v2", 0.0)?;
        // End at 0
        wgfmu.set_vector("v2", total_time, 0.0)?;
        // let points = f64::floor(meas_time / time_sampling_resolution) as i32;
        // let measure_event_mode = MeasureEventMode::MeasureEventDataAveraged;
        // // Measurements
        // wgfmu.set_measure_event(
        //     "v2",
        //     "event2",
        //     0.0,
        //     points,
        //     round_10ns(n),
        //     avg_time,
        //     measure_event_mode,
        // )?;
        wgfmu.add_sequence(CHANNEL1, "v2", 1)?;
    }

    info!("Initializing WGFMU");
    wgfmu.open_session(instrument)?;
    wgfmu.initialize()?;

    wgfmu.set_operation_mode(CHANNEL2, OperationMode::OperationModeFastIV)?;
    wgfmu.set_operation_mode(CHANNEL1, OperationMode::OperationModeFastIV)?;
    wgfmu.set_measure_mode(CHANNEL2, MeasureMode::MeasureModeCurrent)?;
    wgfmu.set_measure_mode(CHANNEL1, MeasureMode::MeasureModeCurrent)?;
    wgfmu.connect(CHANNEL2)?;
    wgfmu.connect(CHANNEL1)?;
    wgfmu.execute()?;

    info!("Performing measurements");
    wgfmu.wait_until_completed()?;

    info!("Retrieving data...");

    let measurement = wgfmu.get_measure_values(CHANNEL2)?;

    info!("Measured event len {}", measurement.len());

    wgfmu.close_session()?;
    Ok(measurement)
}

pub fn measure_stdp_fastiv(
    instrument: &str,
    delay: f64,
    amplitude: f64,
    pulse_duration: f64,
    wait_time: f64,
    n_points: usize,
    avg_time: f64,
) -> Result<Vec<Measurement>, Error> {
    info!(
        "Measuring STDP at {} V Amplitude and {} ns delay",
        amplitude,
        delay * 1e9
    );

    let wgfmu = Arc::clone(&WGFMU);
    let mut wgfmu = wgfmu.lock()?;

    println!("clear");
    wgfmu.clear().unwrap();
    println!("clearOk");

    let cycle_time = round_10ns(delay + wait_time * 2.0  + pulse_duration);

    let mut avg_time = avg_time;
    {
        // CHANNEL2
        // Initializing the "v1" pattern at 0, this is for SMU1
        wgfmu.create_pattern("v1", 0.0).unwrap();
        wgfmu.create_pattern("v1", 0.0).unwrap();


        // Add the pulses to the waveform
        let mut time = 0.0;
        let constant_v_high = (amplitude / 2.0) / (pulse_duration / 2.0) * delay;

        wgfmu.add_vector("v1", 1e-8, 0.0).unwrap();
        wgfmu.add_vector("v1", wait_time, 0.0).unwrap();
        if delay != 0.0 {
            wgfmu.add_vector("v1", delay, constant_v_high).unwrap();
        }
        wgfmu
            .add_vector("v1", pulse_duration / 2.0 - delay, constant_v_high)
            .unwrap();

        if delay != 0.0 {
            // Lower pulse
            wgfmu
                .add_vector("v1", 1e-8, constant_v_high - (amplitude / 2.0))
                .unwrap();
            wgfmu
                .add_vector("v1", delay, constant_v_high - (amplitude / 2.0))
                .unwrap();
            
            // Second high voltage
            wgfmu
                .add_vector("v1", 1e-8, constant_v_high)
                .unwrap();
            wgfmu
                .add_vector("v1", pulse_duration / 2.0 - delay, constant_v_high)
                .unwrap();
            
            // Lower
            wgfmu
                    .add_vector("v1", delay, 0.0)
                    .unwrap();
        } else {
            wgfmu
                .add_vector("v1", wait_time, 0.0)
                .unwrap();
        }


        wgfmu
            .add_vector("v1", wait_time, 0.0)
            .unwrap();



        // Add the created waveform ONE time
        wgfmu.add_sequence(CHANNEL2, "v1", 1).unwrap();
        // Sampling measurements High
        let totaltime = round_10ns(cycle_time);
        let measure_totaltime = round_10ns(totaltime - 1e-8);
        let time_sampling_resolution =
            round_10ns(measure_totaltime / (n_points as f64));

        if avg_time > time_sampling_resolution {
            avg_time = round_10ns(time_sampling_resolution);
        }

        let points =
            f64::floor((measure_totaltime - avg_time) / time_sampling_resolution) as i32;
        let measure_event_mode = MeasureEventMode::MeasureEventDataAveraged;
        wgfmu.set_measure_event(
            "v1",
            "event",
            0.0,
            points,
            time_sampling_resolution,
            avg_time,
            measure_event_mode,
        )?;

        // Sampling margin
        wgfmu.create_pattern("v1_margin", 0.0)?;
        wgfmu.add_vector("v1_margin", cycle_time / 4.0, 0.0)?;
        wgfmu.add_sequence(CHANNEL2, "v1_margin", 1).unwrap();
    }

    {
        let total_time = cycle_time;

        // Initialize at 0
        wgfmu.create_pattern("v2", 0.0)?;
        // End at 0
        wgfmu.set_vector("v2", total_time, 0.0)?;
        wgfmu.add_sequence(CHANNEL1, "v2", 1)?;
    }

    info!("Initializing WGFMU");
    wgfmu.open_session(instrument)?;
    wgfmu.initialize()?;

    wgfmu.set_operation_mode(CHANNEL2, OperationMode::OperationModeFastIV)?;
    wgfmu.set_operation_mode(CHANNEL1, OperationMode::OperationModeFastIV)?;
    wgfmu.set_measure_mode(CHANNEL2, MeasureMode::MeasureModeCurrent)?;
    wgfmu.set_measure_mode(CHANNEL1, MeasureMode::MeasureModeCurrent)?;
    wgfmu.connect(CHANNEL2)?;
    wgfmu.connect(CHANNEL1)?;
    wgfmu.execute()?;

    info!("Performing measurements");
    wgfmu.wait_until_completed()?;

    info!("Retrieving data...");

    let measurement = wgfmu.get_measure_values(CHANNEL2)?;

    info!("Measured event len {}", measurement.len());

    wgfmu.close_session()?;
    Ok(measurement)
}
