use std::sync::{Arc, MutexGuard};

use log::{debug, info};
use serde::{Deserialize, Serialize};

use crate::b1500::types::{GaussianNoise, Noise, VoltageWaveForm, VoltageWaveFormPoint};
use crate::b1500::utils::{add_noisy_waveform, add_waveform};
use crate::b1500::wgfmu::driver::{MeasureEventMode, MeasureMode, Measurement, OperationMode};
use crate::b1500::wgfmu::WgfmuDriver;
use crate::b1500::{CHANNEL1, CHANNEL2, WGFMU};

use super::{utils::round_10ns, Error};

fn init_pulsed_voltage_waveform(
    v_high: f64,
    v_low: f64,
    cycle_time: f64,
    duty_cycle: f64,
) -> VoltageWaveForm {
    let mut waveform: VoltageWaveForm = vec![];

    waveform.push(VoltageWaveFormPoint {
        dtime: 1e-8,
        voltage: v_high,
    });
    waveform.push(VoltageWaveFormPoint {
        dtime: cycle_time * duty_cycle,
        voltage: v_high,
    });
    waveform.push(VoltageWaveFormPoint {
        dtime: 1e-8,
        voltage: v_low,
    });
    waveform.push(VoltageWaveFormPoint {
        dtime: cycle_time * (1.0 - duty_cycle),
        voltage: v_low,
    });

    waveform
}

pub type PulseTrainCollection = Vec<PulseTrain>;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PulseTrain {
    pub n_pulses: usize,
    pub duty_cycle: f64,
    pub cycle_time: f64,
    pub v_high: f64,
    pub v_low: f64,
}

fn wgfmu_add_pulse_train<T: WgfmuDriver>(
    wgfmu: &mut MutexGuard<T>,
    pulse_train: PulseTrain,
    n_points_high: usize,
    n_points_low: usize,
    noise: bool,
    noise_std: f64,
    avg_time: &mut f64,
    pattern: &str,
) -> Result<(), Error> {
    // Sampling measurements High
    let totaltime_high = round_10ns(pulse_train.cycle_time * pulse_train.duty_cycle + 1e-8);
    let measure_totaltime_high = round_10ns(totaltime_high - 1e-8);
    let mut time_sampling_resolution_high =
        round_10ns(measure_totaltime_high / (n_points_high as f64));

    if time_sampling_resolution_high < 1e-8 {
        time_sampling_resolution_high = 1e-8
    }

    if *avg_time > time_sampling_resolution_high {
        *avg_time = round_10ns(time_sampling_resolution_high);
    }

    let points_high =
        f64::floor((measure_totaltime_high - *avg_time) / time_sampling_resolution_high) as i32 - 1;

    // Sampling measurements Low
    let totaltime_low = round_10ns(pulse_train.cycle_time * (1.0 - pulse_train.duty_cycle));
    let measure_totaltime_low = round_10ns(totaltime_low);
    let mut time_sampling_resolution_low =
        round_10ns(measure_totaltime_low / (n_points_low as f64));

    if time_sampling_resolution_low < 1e-8 {
        time_sampling_resolution_low = 1e-8
    }

    if *avg_time > time_sampling_resolution_low {
        *avg_time = round_10ns(time_sampling_resolution_low);
    }

    let points_low =
        f64::floor((measure_totaltime_low - *avg_time) / time_sampling_resolution_low) as i32 - 1;

    debug!("Total points: {}", points_high + points_low);

    // Due to the 2048 maximum vectors limitation of the b1530A, when adding noise, we have to repeat the waveform,
    // Page 1-14, Table 1-6 on https://twiki.cern.ch/twiki/pub/Main/AtlasEdinburghGroupHardwareUpgradeDocumentation/Agilent_B1530A_WGFMU_UserGuide.pdf

    // Each pulse has n_points_high + n_points_low vectors
    let unique_pulses =
        (2048 / (n_points_high as usize + n_points_low as usize)).min(pulse_train.n_pulses);
    let n_rep = f64::ceil(pulse_train.n_pulses as f64 / unique_pulses as f64);
    let unique_pulses = f64::ceil(pulse_train.n_pulses as f64 / n_rep) as usize;
    let n_rep = ((pulse_train.n_pulses as f64) / (unique_pulses as f64)).ceil() as usize;
    debug!("Unique pulses: {}", unique_pulses);

    let mut unique_finish_time = 0.0;

    {
        // CHANNEL2
        // Initializing the "v1" pattern at 0, this is for SMU1
        wgfmu.create_pattern(pattern, 0.0)?;

        let mut waveform = init_pulsed_voltage_waveform(
            pulse_train.v_high,
            pulse_train.v_low,
            pulse_train.cycle_time,
            pulse_train.duty_cycle,
        );

        if !noise {
            add_waveform(wgfmu, &waveform, pattern)?;
            wgfmu.add_sequence(CHANNEL2, pattern, pulse_train.n_pulses)?;
        } else {
            waveform = waveform.repeat(unique_pulses);

            let cycle_points = (n_points_high + n_points_low) as usize;
            let total_unique_points = cycle_points * unique_pulses;

            add_noisy_waveform(
                wgfmu,
                &waveform,
                total_unique_points,
                pattern,
                Noise::Gaussian(GaussianNoise {
                    mean: 0.0,
                    sigma: noise_std,
                }),
            )?;
            wgfmu.add_sequence(CHANNEL2, pattern, n_rep)?;
        }

        // Add the created waveform n_pulses times
        if !noise {
            wgfmu.set_measure_event(
                pattern,
                "event_high",
                time_sampling_resolution_high + 1e-8,
                points_high,
                time_sampling_resolution_high,
                *avg_time,
                MeasureEventMode::MeasureEventDataAveraged,
            )?;
            wgfmu.set_measure_event(
                pattern,
                "event_low",
                round_10ns(time_sampling_resolution_low + totaltime_high),
                points_low,
                time_sampling_resolution_low,
                *avg_time,
                MeasureEventMode::MeasureEventDataAveraged,
            )?;

            // Sampling margin
            let pattern_margin = format!("{}_margin", pattern);
            wgfmu.create_pattern(pattern_margin.as_str(), 0.0)?;
            wgfmu.add_vector(pattern_margin.as_str(), pulse_train.cycle_time, 0.0)?;
            wgfmu.add_sequence(CHANNEL2, "v1_margin", 1)?;
        } else {
            // let total_measure_time = measure_totaltime_high + measure_totaltime_low;

            // For some reason set_measure_event adds 1 to the vector (1.5 when event_low and event_high???????)
            // so sampling interval has to be constant. I am sorry for this but I cannot find any other solution.
            let total_points =
                (unique_pulses * (n_points_low as usize + n_points_high as usize)) as i32;
            unique_finish_time = waveform.iter().fold(0.0, |sum, &p| sum + p.dtime);
            wgfmu.set_measure_event(
                // format!("v1_{}", i).as_str(),
                pattern,
                "pulse_sample",
                0.0, //  + time_sampling_resolution_high + 1e-8,
                total_points,
                (unique_finish_time - *avg_time) / (total_points - 1) as f64,
                *avg_time,
                MeasureEventMode::MeasureEventDataAveraged,
            )?;
        }

        // debug!(
        //     "New Cycle ({}, averaging: {}):\n
        //     \t HIGH\n
        //     \t\t Points: {}!, time: {}, sampling_time: {}\n
        //     \t LOW\n
        //     \t\t Points: {}!, time: {}, sampling_time: {}\n",
        //     cycle_time,
        //     avg_time,
        //     points_high,
        //     totaltime_high,
        //     (points_high as f64) * time_sampling_resolution_high,
        //     points_low,
        //     totaltime_low,
        //     (points_low as f64) * time_sampling_resolution_low
        // );
    }

    {
        let v2 = format!("{}_v2", pattern);

        if !noise {
            let total_time = pulse_train.cycle_time + 2e-8;

            // Initialize at 0
            wgfmu.create_pattern(v2.as_str(), 0.0)?;
            // End at 0
            wgfmu.set_vector(v2.as_str(), total_time, 0.0)?;

            wgfmu.add_sequence(CHANNEL1, "v2", pulse_train.n_pulses)?;

            wgfmu.set_measure_event(
                v2.as_str(),
                "event_high_current",
                time_sampling_resolution_high + 1e-8,
                points_high,
                time_sampling_resolution_high,
                *avg_time,
                MeasureEventMode::MeasureEventDataAveraged,
            )?;

            wgfmu.set_measure_event(
                v2.as_str(),
                "event_low_current",
                round_10ns(time_sampling_resolution_low + totaltime_high),
                points_low,
                time_sampling_resolution_low,
                *avg_time,
                MeasureEventMode::MeasureEventDataAveraged,
            )?;
        } else {
            let total_time = pulse_train.cycle_time + 2e-8;

            // Initialize at 0
            wgfmu.create_pattern(v2.as_str(), 0.0)?;
            // End at 0
            wgfmu.set_vector(v2.as_str(), total_time * (pulse_train.n_pulses as f64), 0.0)?;

            wgfmu.add_sequence(CHANNEL1, "v2", 1)?;

            let total_points =
                (n_rep * (unique_pulses * (n_points_low as usize + n_points_high as usize))) as i32;
            wgfmu.set_measure_event(
                // format!("v1_{}", i).as_str(),
                v2.as_str(),
                "pulse_sample",
                0.0, //  + time_sampling_resolution_high + 1e-8,
                total_points,
                (unique_finish_time - *avg_time) / (total_points - 1) as f64,
                *avg_time,
                MeasureEventMode::MeasureEventDataAveraged,
            )?;
            info!("P2: {}", total_points);
        }
    }

    Ok(())
}

pub fn measure_pulse_fastiv(
    instrument: Option<&str>,
    pulse_train: PulseTrain,
    n_points_high: usize,
    n_points_low: usize,
    avg_time: f64,
    noise: bool,
    noise_std: f64,
) -> Result<Vec<Measurement>, Error> {
    let n_pulses = pulse_train.n_pulses;
    let duty_cycle = pulse_train.duty_cycle;
    let cycle_time = pulse_train.cycle_time;
    // let v_high = pulse_train.v_high;
    // let v_low = pulse_train.v_low;

    let mut avg_time = avg_time;

    info!(
        "Measuring {} pulses at {}% DC and {}ns period",
        n_pulses,
        duty_cycle * 100.0,
        cycle_time * 1e9
    );

    let wgfmu = Arc::clone(&WGFMU);
    let mut wgfmu = wgfmu.lock()?;

    wgfmu.clear()?;

    wgfmu_add_pulse_train(
        &mut wgfmu,
        pulse_train,
        n_points_high,
        n_points_low,
        noise,
        noise_std,
        &mut avg_time,
        "v1",
    )?;

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

pub fn measure_pulse_collection_fastiv(
    instrument: Option<&str>,
    pulse_train_collection: PulseTrainCollection,
    n_points_high: usize,
    n_points_low: usize,
    avg_time: f64,
    noise: bool,
    noise_std: f64,
) -> Result<Vec<Measurement>, Error> {
    let wgfmu = Arc::clone(&WGFMU);
    let mut wgfmu = wgfmu.lock()?;

    wgfmu.clear()?;

    let mut avg_time = avg_time;

    for (idx, pulse_train) in pulse_train_collection.iter().enumerate() {
        let pattern = format!("v{}", idx);
        
        wgfmu_add_pulse_train(&mut wgfmu, pulse_train.clone(), n_points_high, n_points_low, noise, noise_std, &mut avg_time, pattern.as_str())?;
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
