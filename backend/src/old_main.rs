#[macro_use]
extern crate num_derive;

mod b1500;

use log::info;
use b1500::measure::measure_pulse_fastiv;


fn main() {
    env_logger::init();

    let n_pulses = 10;
    let duty_cycle = 0.5;
    let cycle_time = 400e-9;
    let max_v = 0.0;
    let min_v = -1.0;
    let time_sampling_resolution = 10e-9;
    let averaging_time = 5e-9;

    measure_pulse_fastiv(
        "b1500gpib",
        n_pulses,
        duty_cycle,
        cycle_time,
        max_v,
        min_v,
        time_sampling_resolution,
        averaging_time,
    );

    info!("Exiting!");
}
