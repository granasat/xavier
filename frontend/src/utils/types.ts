import { PulseControls, StdpControls } from "../routes/wgfmu/MeasurementsControls/types"

export interface MeasurementPoint {
    voltage: number,
    time: number,
    current: number
}

export type MeasurementData = MeasurementPoint[]

export type MeasurementType = "Single" | "Collection"

export interface StdpMeasurement {
    conductance: number,
    iv: MeasurementData
}

export interface StdpMeasurementWrapper {
    stdpMeasurement: StdpMeasurement,
    delay: number
}

export interface StdpCollectionMeasurement {
    baseConductance: number
    collection: StdpMeasurementWrapper[],
}

export interface ConductanceMeasurement {
    conductance: number
}

export interface Measurement {
    id: number,
    status: string,
    date: string,
    category: "Pulse" | "PulseCollection" | "Stdp" | "StdpCollection",
    parameters: StdpControls | PulseControls,
    data: MeasurementData | StdpMeasurement | StdpCollectionMeasurement
}

export type MeasurementList = Measurement[]