use std::sync::{MutexGuard, Arc, PoisonError};

use log::info;
use rand_distr::{Distribution, Normal, NormalError};
use sea_orm::strum::Display;

use super::types::{Noise, VoltageWaveForm, VoltageWaveFormPoint};
use super::wgfmu::driver::{OperationMode, MeasureMode};
use super::wgfmu::{self, WgfmuDriver};
use super::{WGFMU, CHANNEL1, CHANNEL2};

#[derive(Debug, Display)]
pub enum Error {
    BadArguments(String),
    WgfmuError(wgfmu::Error),
    RandomDistributionError(NormalError),
    WgfmuMutexLockError
}

impl From<wgfmu::Error> for Error {
    fn from(error: wgfmu::Error) -> Self {
        Error::WgfmuError(error)
    }
}

impl From<NormalError> for Error {
    fn from(error: NormalError) -> Self {
        Error::RandomDistributionError(error)
    }
}

impl<T> From<PoisonError<T>> for Error {
    fn from(_: PoisonError<T>) -> Error {
        Error::WgfmuMutexLockError
    }
}

/// Provided an arbitrary voltage waveform this functions, samples the waveform, using the number of specified
/// points, adds noise, with a custom generator, and then sends it to the specified pattern.
///
/// # Arguments
///
/// * `wgfmu` - WGFMU static object, used when adding the waveform to the specified pattern.
/// * `waveform` - Non sampled voltage waveform to add noise to.
/// * `n_points` - Number of sampling points to use.
/// * `pattern` - Pattern name where to add the sampled waveform.
///
/// # Example
///
/// // Have this unsampled waveform (each * is a point in the waveform):
///    |  <------------ [Time] ------------>
///    |          *......*      *......*
///   [V]         .      .      .      .
///    |   *......*      *......*      *......*
///
///  // When adding noise to it whe need to upsample it, so we can specify the noise points,
/// this function converts it to this:
///    |  <------------ [Time] ------------>
///    |         *.*.*.*     *.*.*.*
///   [V]        .     .     .     .
///    |   *.*.*.*     *.*.*.*     *.*.*.*
/// // In this case, `n_points` is 20.
pub fn add_noisy_waveform<D: WgfmuDriver>(
    wgfmu: &mut MutexGuard<D>,
    waveform: &VoltageWaveForm,
    n_points: usize,
    pattern: &str,
    noise: Noise,
) -> Result<(), Error> {
    if waveform.len() < 2 {
        // 2 is the minimum we will accept
        return Result::Err(Error::BadArguments(
            "`waveform` param needs to have at least 2 elements".to_owned(),
        ));
    }

    let mut rng = rand::thread_rng();
    let distribution = match noise {
        Noise::Gaussian(params) => Normal::new(params.mean, params.sigma)?,
        // _ => Normal::new(0.0, 1.0)
    };

    let initial_t = waveform
        .get(0)
        .ok_or(Error::BadArguments(
            "Error getting index 0 of `waveform`".to_owned(),
        ))?
        .dtime;
    let total_time = waveform.iter().fold(0.0, |sum, val| sum + val.dtime) - initial_t;

    let sampling_time = total_time / (n_points - 1) as f64;
    let final_time_points = (0..n_points)
        .map(|p| p as f64 * sampling_time)
        .collect::<Vec<f64>>();
    let mut final_waveform: VoltageWaveForm = vec![
        VoltageWaveFormPoint {
            ..Default::default()
        };
        n_points
    ];

    // We llok at two adjacent points and linearly interpolate between them
    let mut current_index = 0; // Index of the of the first of the two points we are looking at in the provided waveform
    let mut current_time = 0.0; // Absolute time of the first of the two points we are looking at in the provided waveform
    for (idx, &time) in final_time_points[..n_points - 1].iter().enumerate() {
        while time > current_time + waveform[current_index + 1].dtime {
            current_time += waveform[current_index + 1].dtime;
            current_index += 1;
        }

        // Linear interpolation
        let y_0 = waveform[current_index].voltage;
        let x_0 = current_time;
        let y_1 = waveform[current_index + 1].voltage;
        let x_1 = current_time + waveform[current_index + 1].dtime;
        let x = time;
        let y = y_0 + (x - x_0) * (y_1 - y_0) / (x_1 - x_0);

        final_waveform[idx].voltage = y + distribution.sample(&mut rng);
        final_waveform[idx].dtime = sampling_time;
    }

    let min = final_waveform
        .iter()
        .fold(final_waveform.get(0).unwrap().voltage, |min, &el| {
            min.min(el.voltage)
        });
    let max = final_waveform
        .iter()
        .fold(final_waveform.get(0).unwrap().voltage, |max, &el| {
            max.max(el.voltage)
        });
    let max_diff = max - min;
    info!("Diff: {} V", max_diff);

    for voltage_point in final_waveform {
        wgfmu.add_vector(pattern, sampling_time, voltage_point.voltage)?;
    }

    Ok(())
}

pub fn add_waveform<D: WgfmuDriver>(
    wgfmu: &mut MutexGuard<D>,
    waveform: &VoltageWaveForm,
    pattern: &str,
) -> Result<(), Error> {
    for voltage_point in waveform {
        wgfmu.add_vector(pattern, voltage_point.dtime, voltage_point.voltage)?;
    }

    Ok(())
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
