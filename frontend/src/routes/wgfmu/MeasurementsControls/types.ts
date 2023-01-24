export interface VoltagePoint {
  voltage: number
  time: number
}

export interface CurrentPoint {
  current: number
  time: number
}

export interface IVMeasurementPoint {
  current: number
  voltage: number
  time: number
}

export interface PulseTrain {
  // The number of pulses the train has
  nPulses: string
  // The duty cycle of the pulses, that is the proportion of the cycle time
  // that the pulse is active (at v_high).
  dutyCycle: string
  // The cycle time, that is the time that it takes to complete a cycle,
  // one v_high, one v_low. (seconds)
  cycleTime: string
  // Active voltage of the pulses, see notes above. (Volts)
  vHigh: string
  // Low voltage of the pulses, see notes above. (Volts)
  vLow: string
  // Initial waiting delay, in seconds. (seconds)
  delay: string
}

export type VoltageWaveform = VoltagePoint[]

export interface PulseControls {
  vHigh: string
  vLow: string
  nPulses: string
  dutyCycle: string
  cycleTime: string
  nPointsHigh: string
  nPointsLow: string
  noise: boolean
  noiseStd: string
}

export interface PulseCollectionControls {
  pulseTrainCollection: PulseTrain[]
  collectionType: "MultiPulse" | "EPSC" | "PPF"
  multipulseControls: MultiPulseControls
  epscControls: EpscControls
  ppfControls: PpfControls
  nPointsHigh: string
  nPointsLow: string
  noise: boolean
  noiseStd: string
}

export interface MultiPulseControls {
  // Number of potenciation + depression trains
  nReps: string
  // Controls the order of the pulses Potenciation -> Depression or
  // Depression -> Potenciation
  firstCycleType: "Potenciation" | "Depression"

  setVoltages: string[]
  resetVoltages: string[]

  setDutyCycle: string[]
  resetDutyCycle: string[]

  nPulses: string[]

  nPointsHigh: string
  nPointsLow: string
  dutyCycle: string
  cycleTime: string
}

export interface EpscControls {
  frequencies: string[]
  spikeTime: string
  interTrainsTime: string
}

export interface PpfControls {
  spikeVoltage: string
  spikeTime: string
  startInterSpikeTime: string
  stopInterSpikeTime: string
  nMeas: string
}

export interface StdpControls {
  delay: string
  amplitude: string
  pulseDuration: string
  waitTime: string
  stdpType: "Depression" | "Potenciation"
  nPoints: string
  noise: boolean
  noiseStd: string
}

export interface StdpCollectionControls {
  delayPoints: string
  amplitude: string
  pulseDuration: string
  waitTime: string
  stdpType: "Depression" | "Potenciation"
  nPoints: string
  noise: boolean
  noiseStd: string
}

export interface StdpWaveform {
  waveformA: VoltageWaveform // not delayed
  waveformB: VoltageWaveform // delayed
  equivalent: VoltageWaveform
}

export interface Cycle {
  type: "set" | "reset"
  measurements: IVMeasurementPoint[]
}

export interface SingleTrainMeasurement {
  id: number
  measurements: IVMeasurementPoint[]
}

export interface CyclingTrainMeasurement {
  id: number
  measurements: Cycle[]
}
