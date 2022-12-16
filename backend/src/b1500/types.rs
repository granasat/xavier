pub struct GaussianNoise {
    pub mean: f64,
    pub sigma: f64
}

pub enum Noise {
    Gaussian(GaussianNoise)
}

#[derive(Copy, Clone, Default)]
pub struct VoltageWaveFormPoint {
    pub voltage: f64,
    pub dtime: f64 // Differential time, specified as time difference between last and current point
}

pub type VoltageWaveForm = Vec<VoltageWaveFormPoint>;