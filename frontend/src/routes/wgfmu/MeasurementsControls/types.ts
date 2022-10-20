export interface VoltagePoint {
    voltage: number,
    time: number
}

export interface CurrentPoint {
    current: number,
    time: number
}

export interface IVMeasurementPoint {
    current: number,
    voltage: number,
    time: number
}

export type VoltageWaveform = VoltagePoint[]

export interface PulseControls {
    vHigh: string,
    vLow: string,
    nPulses: string,
    dutyCycle: string,
    cycleTime: string,
    nPointsHigh: string,
    nPointsLow: string,
}

export interface StdpControls {
    delay: string,
    amplitude: string,
    pulseDuration: string,
    waitTime: string,
    stdpType: "Depression" | "Potenciation",
    nPoints: string
}

export interface StdpCollectionControls {
    delayPoints: string,
    amplitude: string,
    pulseDuration: string,
    waitTime: string,
    stdpType: "Depression" | "Potenciation",
    nPoints: string
}

export interface StdpWaveform {
    waveformA: VoltageWaveform // not delayed
    waveformB: VoltageWaveform // delayed
    equivalent: VoltageWaveform
}

export interface Cycle {
    type: 'set' | 'reset',
    measurements: IVMeasurementPoint[]
}

export interface SingleTrainMeasurement {
    id: number,
    measurements: IVMeasurementPoint[]
}

export interface CyclingTrainMeasurement {
    id: number,
    measurements: Cycle[]
}