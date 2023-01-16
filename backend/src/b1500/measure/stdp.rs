use std::sync::Arc;

use log::info;
use serde::{Serialize, Deserialize};

use crate::b1500::{wgfmu::{driver::{Measurement, MeasureEventMode, OperationMode, MeasureMode}, WgfmuDriver}, WGFMU, types::{VoltageWaveForm, VoltageWaveFormPoint, Noise, GaussianNoise}, utils::{add_waveform, add_noisy_waveform}, CHANNEL2, CHANNEL1};

use super::{Error, utils::round_10ns, utils::measure_conductance_fastiv};

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
    noise: bool,
    noise_std: f64,
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

                let mut waveform: VoltageWaveForm = vec![];

                // CHANNEL2
                // Initializing the "v1" pattern at 0, this is for SMU1
                wgfmu.create_pattern("v1", 0.0)?;

                // Add the pulses to the waveform
                let constant_v_high =
                    (amplitude / 2.0) / (pulse_duration / 2.0) * delay * multiplier;
                let cutting_v =
                    (amplitude / 2.0) / (pulse_duration / 2.0) * (pulse_duration / 2.0 - delay);

                // wgfmu.add_vector("v1", 1e-8, 0.0)?;
                // wgfmu.add_vector("v1", wait_time, 0.0)?;
                waveform.push(VoltageWaveFormPoint {
                    dtime: 1e-8,
                    voltage: 0.0,
                });
                waveform.push(VoltageWaveFormPoint {
                    dtime: wait_time,
                    voltage: 0.0,
                });

                if delay != 0.0 {
                    // wgfmu.add_vector("v1", delay, constant_v_high)?;
                    waveform.push(VoltageWaveFormPoint {
                        dtime: delay,
                        voltage: constant_v_high,
                    });
                }

                // wgfmu.add_vector("v1", pulse_duration / 2.0 - delay, constant_v_high)?;
                waveform.push(VoltageWaveFormPoint {
                    dtime: pulse_duration / 2.0 - delay,
                    voltage: constant_v_high,
                });

                if delay != 0.0 {
                    // Lower pulse
                    // wgfmu.add_vector("v1", 1e-8, (-cutting_v - (amplitude / 2.0)) * multiplier)?;
                    // wgfmu.add_vector("v1", delay, (-cutting_v - (amplitude / 2.0)) * multiplier)?;
                    waveform.push(VoltageWaveFormPoint {
                        dtime: 1e-8,
                        voltage: (-cutting_v - (amplitude / 2.0)) * multiplier,
                    });
                    waveform.push(VoltageWaveFormPoint {
                        dtime: delay,
                        voltage: (-cutting_v - (amplitude / 2.0)) * multiplier,
                    });

                    // Second high voltage
                    // wgfmu.add_vector("v1", 1e-8, constant_v_high)?;
                    // wgfmu.add_vector("v1", pulse_duration / 2.0 - delay, constant_v_high)?;
                    waveform.push(VoltageWaveFormPoint {
                        dtime: 1e-8,
                        voltage: constant_v_high,
                    });
                    waveform.push(VoltageWaveFormPoint {
                        dtime: pulse_duration / 2.0 - delay,
                        voltage: constant_v_high,
                    });

                    // Lower
                    // wgfmu.add_vector("v1", delay, 0.0)?;
                    waveform.push(VoltageWaveFormPoint {
                        dtime: delay,
                        voltage: 0.0,
                    });
                } else {
                    // wgfmu.add_vector("v1", wait_time, 0.0)?;
                    waveform.push(VoltageWaveFormPoint {
                        dtime: wait_time,
                        voltage: 0.0,
                    });
                }

                // wgfmu.add_vector("v1", wait_time, 0.0)?;
                waveform.push(VoltageWaveFormPoint {
                    dtime: wait_time,
                    voltage: 0.0,
                });

                if !noise {
                    add_waveform(&mut wgfmu, &waveform, "v1")?;
                } else {
                    add_noisy_waveform(
                        &mut wgfmu,
                        &waveform,
                        points as usize,
                        "v1",
                        Noise::Gaussian(GaussianNoise {
                            mean: 0.0,
                            sigma: noise_std,
                        }),
                    )?;
                }

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
    #[allow(dead_code)]
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
    noise: bool,
    noise_std: f64,
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

    let max_delay = pulse_duration / 2.0 * 0.9;

    let base_conductance = measure_conductance_fastiv(None)?;

    info!("-------------------------------");
    info!(
        "BaseConductance: {:.1$} uS",
        base_conductance * 1_000_000.0,
        2
    );
    info!("-------------------------------");

    let mut collection = vec![];
    let mut delays = (0..(delay_points + 2))
        .into_iter()
        .map(|idx| max_delay / (delay_points as f64 + 2.0 - 1.0) * idx as f64)
        .collect::<Vec<f64>>();

    // Remove first element
    delays.remove(0);
    // Remove last element
    delays.pop();
    delays.reverse();

    for delay in delays {
        let get_meas = || -> Result<StdpMeasurementWrapper, Error> {
            Ok(StdpMeasurementWrapper {
                stdp_measurement: measure_stdp_fastiv(
                    None,
                    delay,
                    amplitude,
                    pulse_duration,
                    wait_time,
                    n_points,
                    avg_time,
                    stdp_type,
                    noise,
                    noise_std,
                )?,
                delay: match stdp_type {
                    StdpType::Depression => -delay,
                    StdpType::Potenciation => delay,
                },
            })
        };

        let mut meas = get_meas()?;
        match meas_mode {
            StdpCollectionMeasMode::SequentialMeasurement => {
                collection.push(meas);
            }
            StdpCollectionMeasMode::ForceConductanceMeasurement => {
                let prev_conductance = if collection.len() == 0 {
                    base_conductance
                } else {
                    let conductance_getter = |m: &&StdpMeasurementWrapper| -> usize {
                        (m.stdp_measurement.conductance * 1_000_000_000.0) as usize
                    };
                    match stdp_type {
                        StdpType::Depression => {
                            collection
                                .iter()
                                .min_by_key(conductance_getter)
                                .unwrap()
                                .stdp_measurement
                                .conductance
                        }
                        StdpType::Potenciation => {
                            collection
                                .iter()
                                .max_by_key(conductance_getter)
                                .unwrap()
                                .stdp_measurement
                                .conductance
                        }
                    }
                };
                let conductance_ok = |conductance: f64| match stdp_type {
                    StdpType::Depression => conductance <= prev_conductance,
                    StdpType::Potenciation => conductance >= prev_conductance,
                };

                // The higher the better the measurement
                // let goodness_test = |curr_best_conductance: f64, test_conductance: f64| {
                //     let diff = test_conductance - curr_best_conductance;
                //     match stdp_type {
                //         StdpType::Depression =>
                //             if diff <= 0.0 {
                //                 f64::abs(diff)
                //             } else {
                //                 0.0
                //             }
                //         ,
                //         StdpType::Potenciation =>
                //             if diff >= 0.0 {
                //                 f64::abs(diff)
                //             } else {
                //                 0.0
                //             }

                //     }
                // };

                info!("-------------------------------");
                info!(
                    "Conductance: {:.1$} uS",
                    meas.stdp_measurement.conductance * 1_000_000.0,
                    2
                );
                info!("-------------------------------");

                // let mut best_meas = meas.clone();

                let mut ntries = 0;

                collection.push(meas.clone());

                while ntries < MAX_FORCE_CONDUCTANCE_TRIES
                    && !conductance_ok(meas.stdp_measurement.conductance)
                {
                    meas = get_meas()?;
                    // if goodness_test(best_meas.stdp_measurement.conductance, meas.stdp_measurement.conductance) > 0.0 {
                    //     best_meas = meas.clone();
                    // }
                    collection.push(meas.clone());

                    info!("-------------------------------");
                    info!(
                        "Conductance: {} uS , vs {} uS",
                        format!("{:.1$}", meas.stdp_measurement.conductance * 1_000_000.0, 2),
                        format!("{:.1$}", prev_conductance * 1_000_000.0, 2)
                    );
                    info!("-------------------------------");

                    ntries += 1;
                }
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