export interface MeasurementPoint {
    voltage: number,
    time: number,
    current: number
}

export type MeasurementData = MeasurementPoint[]

export interface Measurement {
    id: number,
    status: string,
    date: string,
    category: string,
    parameters: any,
    data: MeasurementData
}

export type MeasurementList = Measurement[]