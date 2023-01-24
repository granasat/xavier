import { PulseControls, StdpCollectionControls, StdpControls } from './types'
import math from '../../../utils/math'
import { ConductanceMeasurement } from '../../../utils/types'
import { buildUrl } from '../../../utils'

const MEASUREMENT_ENDPOINT = buildUrl("measurements/")
const PULSE_MEASUREMENT_ENDPOINT = buildUrl("measurements/pulse")
const STDP_MEASUREMENT_ENDPOINT = buildUrl("measurements/stdp")
const STDP_COLLECTION_MEASUREMENT_ENDPOINT = buildUrl("measurements/stdp-collection")
const CONDUCTANCE_MEASUREMENT_ENDPOINT = buildUrl("measurements/conductance")


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
        avgTime: math.unit(avgTime).value,
        noise: params.noise,
        noiseStd: math.unit(params.noiseStd).value
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
        stdpType: params.stdpType,
        avgTime: math.unit(avgTime).value,
        noise: params.noise,
        noiseStd: math.unit(params.noiseStd).value
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

export async function stdpCollectionMeasurement(params: StdpCollectionControls, avgTime: string) {

    let reqParams = {
        amplitude: math.unit(params.amplitude).value,
        delayPoints: parseInt(params.delayPoints),
        waitTime: math.unit(params.waitTime).value,
        pulseDuration: math.unit(params.pulseDuration).value,
        stdpType: params.stdpType,
        nPoints: parseInt(params.nPoints),
        avgTime: math.unit(avgTime).value,
        noise: params.noise,
        noiseStd: math.unit(params.noiseStd).value
    }

    const response = await fetch(STDP_COLLECTION_MEASUREMENT_ENDPOINT, {
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

export async function conductanceMeasurement() {

    const response = await fetch(CONDUCTANCE_MEASUREMENT_ENDPOINT, {
        method: 'POST',
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