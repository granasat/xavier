import { PulseControls, StdpControls } from './types'
import math from '../../../utils/math'

const MEASUREMENT_ENDPOINT = "http://localhost:8000/api/measurements/"
const PULSE_MEASUREMENT_ENDPOINT = "http://localhost:8000/api/measurements/pulse"
const STDP_MEASUREMENT_ENDPOINT = "http://localhost:8000/api/measurements/stdp"

export async function pulseMeasurement(params: PulseControls, avgTime: string) {

    let reqParams = {
        // ...pulseParams,
        vHigh: math.unit(params.vHigh).value,
        vLow: math.unit(params.vLow).value,
        cycleTime: math.unit(params.cycleTime).value,
        dutyCycle: parseFloat(params.dutyCycle)/100,
        nPulses: parseInt(params.nPulses),
        nPointsHigh: parseInt(params.nPointsHigh),
        nPointsLow: parseInt(params.nPointsLow),
        avgTime: math.unit(avgTime).value
    }

    const response = await fetch(PULSE_MEASUREMENT_ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
          },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(reqParams)
    })

    return response.json()
}

export async function stdpMeasurement(params: StdpControls, avgTime: string) {

    let reqParams = {
        amplitude: math.unit(params.amplitude).value,
        delay: math.unit(params.delay).value,
        waitTime: math.unit(params.waitTime).value,
        pulseDuration: math.unit(params.pulseDuration).value,
        nPoints: parseInt(params.nPoints),
        avgTime: math.unit(avgTime).value
    }

    const response = await fetch(STDP_MEASUREMENT_ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
          },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(reqParams)
    })

    return response.json()
}

export async function getMeasurement(id: number) {

    const response = await fetch(MEASUREMENT_ENDPOINT + id.toString(), {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
          },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    })

    return response.json()
}