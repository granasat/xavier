use super::wgfmu::driver::{
    Error, MeasureEventMode, MeasureMode, Measurement, OperationMode, WgfmuDriver,
};
use super::WGFMU;
use log::info;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;
use std::sync::Arc;

const CHANNEL1: usize = 101;
const CHANNEL2: usize = 102;

pub fn round_10ns(n: f64) -> f64 {
    f64::floor(n * 1e8) / 1e8
}

pub fn measure_pulse_fastiv(
    instrument: Option<&str>,
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
    wgfmu.clear()?;
    println!("clearOk");

    let mut avg_time = avg_time;

    // Sampling measurements High
    let totaltime_high = round_10ns(cycle_time * duty_cycle + 1e-8);
    let measure_totaltime_high = round_10ns(totaltime_high - 1e-8);
    let mut time_sampling_resolution_high =
        round_10ns(measure_totaltime_high / (n_points_high as f64));

    if time_sampling_resolution_high < 1e-8 {
        time_sampling_resolution_high = 1e-8
    }

    if avg_time > time_sampling_resolution_high {
        avg_time = round_10ns(time_sampling_resolution_high);
    }

    let points_high =
        f64::floor((measure_totaltime_high - avg_time) / time_sampling_resolution_high) as i32 - 1;

    // Sampling measurements Low
    let totaltime_low = round_10ns(cycle_time * duty_cycle + 1e-8);
    let measure_totaltime_low = round_10ns(totaltime_low - 2e-8);
    let mut time_sampling_resolution_low =
        round_10ns(measure_totaltime_low / (n_points_low as f64));

    if time_sampling_resolution_low < 1e-8 {
        time_sampling_resolution_low = 1e-8
    }

    if avg_time > time_sampling_resolution_low {
        avg_time = round_10ns(time_sampling_resolution_low);
    }

    let points_low =
        f64::floor((measure_totaltime_low - avg_time) / time_sampling_resolution_low) as i32 - 1;

    info!("Total points: {}", points_high + points_low);

    {
        // CHANNEL2
        // Initializing the "v1" pattern at 0, this is for SMU1
        wgfmu.create_pattern("v1", 0.0)?;

        // Add the pulses to the waveform
        wgfmu.add_vector("v1", 1e-8, v_high)?;
        wgfmu.add_vector("v1", cycle_time * duty_cycle, v_high)?;
        wgfmu.add_vector("v1", 1e-8, v_low)?;
        wgfmu.add_vector("v1", cycle_time * (1.0 - duty_cycle), v_low)?;

        // Add the created waveform ONE time
        wgfmu.add_sequence(CHANNEL2, "v1", n_pulses)?;

        wgfmu.set_measure_event(
            "v1",
            "event_high",
            time_sampling_resolution_high + 1e-8,
            points_high,
            time_sampling_resolution_high,
            avg_time,
            MeasureEventMode::MeasureEventDataAveraged,
        )?;

        wgfmu.set_measure_event(
            "v1",
            "event_low",
            round_10ns(time_sampling_resolution_low + totaltime_high),
            points_low,
            time_sampling_resolution_low,
            avg_time,
            MeasureEventMode::MeasureEventDataAveraged,
        )?;

        // Sampling margin
        wgfmu.create_pattern("v1_margin", 0.0)?;
        wgfmu.add_vector("v1_margin", cycle_time, 0.0)?;
        wgfmu.add_sequence(CHANNEL2, "v1_margin", 1)?;

        info!(
            "New Cycle ({}, averaging: {}):\n
            \t HIGH\n
            \t\t Points: {}!, time: {}, sampling_time: {}\n
            \t LOW\n
            \t\t Points: {}!, time: {}, sampling_time: {}\n",
            cycle_time,
            avg_time,
            points_high,
            totaltime_high,
            (points_high as f64) * time_sampling_resolution_high,
            points_low,
            totaltime_low,
            (points_low as f64) * time_sampling_resolution_low
        );
    }

    {
        let total_time = cycle_time + 2e-8;

        // Initialize at 0
        wgfmu.create_pattern("v2", 0.0)?;
        // End at 0
        wgfmu.set_vector("v2", total_time, 0.0)?;

        wgfmu.add_sequence(CHANNEL1, "v2", n_pulses)?;

        wgfmu.set_measure_event(
            "v2",
            "event_high_current",
            time_sampling_resolution_high + 1e-8,
            points_high,
            time_sampling_resolution_high,
            avg_time,
            MeasureEventMode::MeasureEventDataAveraged,
        )?;

        wgfmu.set_measure_event(
            "v2",
            "event_low_current",
            round_10ns(time_sampling_resolution_low + totaltime_high),
            points_low,
            time_sampling_resolution_low,
            avg_time,
            MeasureEventMode::MeasureEventDataAveraged,
        )?;
    }

    info!("Initializing WGFMU");
    if instrument.is_some() {
        wgfmu.open_session(instrument.unwrap())?;
    }
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

    if instrument.is_some() {
        wgfmu.close_session()?;
    }
    Ok(measurement)
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum StdpType {
    Depression,
    Potenciation,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StdpMeasurement {
    iv: Vec<Measurement>,
    conductance: f64, // (S)
}

pub fn measure_stdp_fastiv(
    instrument: Option<&str>,
    delay: f64,
    amplitude: f64,
    pulse_duration: f64,
    wait_time: f64,
    n_points: usize,
    avg_time: f64,
    stdp_type: StdpType,
) -> Result<StdpMeasurement, Error> {
    info!(
        "Measuring STDP at {} V Amplitude and {} ns delay",
        amplitude,
        delay * 1e9
    );

    let measurement;
    {
        let wgfmu = Arc::clone(&WGFMU);
        let mut wgfmu = wgfmu.lock()?;

        {
            wgfmu.clear()?;

            let cycle_time = round_10ns(delay + wait_time * 2.0 + pulse_duration);

            let mut avg_time = avg_time;

            // Sampling measurements High
            let totaltime = round_10ns(cycle_time);
            let measure_totaltime = round_10ns(totaltime - 1e-8);
            let time_sampling_resolution = round_10ns(measure_totaltime / (n_points as f64));

            if avg_time > time_sampling_resolution {
                avg_time = round_10ns(time_sampling_resolution);
            }

            let points =
                f64::floor((measure_totaltime - avg_time) / time_sampling_resolution) as i32;
            {
                let mut multiplier = 1.0;
                match stdp_type {
                    StdpType::Potenciation => {
                        multiplier = -1.0;
                    }
                    _ => {}
                }

                // CHANNEL2
                // Initializing the "v1" pattern at 0, this is for SMU1
                wgfmu.create_pattern("v1", 0.0)?;

                // Add the pulses to the waveform
                let constant_v_high =
                    (amplitude / 2.0) / (pulse_duration / 2.0) * delay * multiplier;
                let cutting_v =
                    (amplitude / 2.0) / (pulse_duration / 2.0) * (pulse_duration / 2.0 - delay);

                wgfmu.add_vector("v1", 1e-8, 0.0)?;
                wgfmu.add_vector("v1", wait_time, 0.0)?;
                if delay != 0.0 {
                    wgfmu.add_vector("v1", delay, constant_v_high)?;
                }

                wgfmu.add_vector("v1", pulse_duration / 2.0 - delay, constant_v_high)?;

                if delay != 0.0 {
                    // Lower pulse
                    wgfmu.add_vector("v1", 1e-8, (-cutting_v - (amplitude / 2.0)) * multiplier)?;
                    wgfmu.add_vector("v1", delay, (-cutting_v - (amplitude / 2.0)) * multiplier)?;

                    // Second high voltage
                    wgfmu.add_vector("v1", 1e-8, constant_v_high)?;
                    wgfmu.add_vector("v1", pulse_duration / 2.0 - delay, constant_v_high)?;

                    // Lower
                    wgfmu.add_vector("v1", delay, 0.0)?;
                } else {
                    wgfmu.add_vector("v1", wait_time, 0.0)?;
                }

                wgfmu.add_vector("v1", wait_time, 0.0)?;

                // Add the created waveform ONE time
                wgfmu.add_sequence(CHANNEL2, "v1", 1)?;

                wgfmu.set_measure_event(
                    "v1",
                    "event",
                    0.0,
                    points,
                    time_sampling_resolution,
                    avg_time,
                    MeasureEventMode::MeasureEventDataAveraged,
                )?;

                // Sampling margin
                wgfmu.create_pattern("v1_margin", 0.0)?;
                wgfmu.add_vector("v1_margin", cycle_time / 4.0, 0.0)?;
                wgfmu.add_sequence(CHANNEL2, "v1_margin", 1)?;
            }

            {
                let total_time = cycle_time;

                // Initialize at 0
                wgfmu.create_pattern("v2", 0.0)?;
                // End at 0
                wgfmu.add_vector("v2", total_time, 0.0)?;
                wgfmu.add_sequence(CHANNEL1, "v2", 1)?;
                wgfmu.set_measure_event(
                    "v2",
                    "event",
                    0.0,
                    points,
                    time_sampling_resolution,
                    avg_time,
                    MeasureEventMode::MeasureEventDataAveraged,
                )?;
            }


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
            wgfmu.execute()?;

            info!("Performing measurements");
            wgfmu.wait_until_completed()?;

            info!("Retrieving data...");
        }

        measurement = wgfmu.get_measure_values(CHANNEL2)?;

        info!("Stdp measurement length: {}", measurement.len());

        if instrument.is_some() {
            wgfmu.close_session()?;
        }
    }

    std::thread::sleep(std::time::Duration::from_millis(1000)); // Litle wait before conductance measurement

    let conductance = measure_conductance_fastiv(instrument)?;

    Ok(StdpMeasurement {
        iv: measurement,
        conductance, // (S)uctance,
    })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StdpMeasurementWrapper {
    stdp_measurement: StdpMeasurement,
    delay: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StdpCollectionMeasurement {
    base_conductance: f64,
    collection: Vec<StdpMeasurementWrapper>,
}

pub enum StdpCollectionMeasMode {
    /*
        Measurements will be sequential, with no repetitions
    */
    SequentialMeasurement,
    /*
        Will try to force a conductance change by repeating measurements
        (either up or down depending on whether potenciation or depression is selected)
    */
    ForceConductanceMeasurement,
}

const MAX_FORCE_CONDUCTANCE_TRIES: usize = 3;

pub fn measure_stdp_collection_fastiv(
    instrument: &str,
    delay_points: usize,
    amplitude: f64,
    wait_time: f64,
    pulse_duration: f64,
    stdp_type: StdpType,
    n_points: usize,
    avg_time: f64,
    meas_mode: StdpCollectionMeasMode,
) -> Result<StdpCollectionMeasurement, Error> {
    info!(
        "Performing STDP Collection Measurement!\n\t{} delay points",
        delay_points
    );

    {
        let wgfmu = Arc::clone(&WGFMU);
        let mut wgfmu = wgfmu.lock()?;
        wgfmu.open_session(instrument)?;
    }

    let max_delay = pulse_duration / 2.0;

    let base_conductance = measure_conductance_fastiv(None)?;

    let mut delay: f64;
    let mut collection = vec![];
    for i in (0..delay_points).rev() {
        delay = max_delay / (delay_points as f64) * (i + 1) as f64;

        let get_meas = || -> Result<StdpMeasurementWrapper, Error> {
            Ok(
                StdpMeasurementWrapper {
                    stdp_measurement: measure_stdp_fastiv(
                        None,
                        delay,
                        amplitude,
                        pulse_duration,
                        wait_time,
                        n_points,
                        avg_time,
                        stdp_type,
                    )?,
                    delay: match stdp_type {
                        StdpType::Depression => -delay,
                        StdpType::Potenciation => delay,
                    },
                }
            )
        };

        let mut meas = get_meas()?;
        match meas_mode {
            StdpCollectionMeasMode::SequentialMeasurement => {
                collection.push(meas);
            },
            StdpCollectionMeasMode::ForceConductanceMeasurement => {

                let prev_conductance = if collection.len() == 0 { base_conductance } else { collection.last().unwrap().stdp_measurement.conductance };
                let conductance_ok = |meas: StdpMeasurementWrapper| {
                    match stdp_type {
                        StdpType::Depression => meas.stdp_measurement.conductance <= prev_conductance,
                        StdpType::Potenciation => meas.stdp_measurement.conductance >= prev_conductance
                    }
                };

                let mut ntries = 0;
                
                while ntries < MAX_FORCE_CONDUCTANCE_TRIES && !conductance_ok(meas.clone()) {
                    meas = get_meas()?;
                    ntries += 1;
                }

                collection.push(meas);
            }
        }
        
    }

    {
        let wgfmu = Arc::clone(&WGFMU);
        let mut wgfmu = wgfmu.lock()?;
        wgfmu.close_session()?;
    }

    Ok(StdpCollectionMeasurement {
        base_conductance,
        collection,
    })
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
                info!("current: {}, voltage: {}", current, val.voltage);
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

pub fn calibrate(instrument: Option<&str>) -> Result<(), Error> {
    let wgfmu = Arc::clone(&WGFMU);
    let mut wgfmu = wgfmu.lock()?;

    wgfmu.clear()?;

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

    wgfmu.do_self_calibration()?;

    if instrument.is_some() {
        wgfmu.close_session()?;
    }

    Ok(())
}
