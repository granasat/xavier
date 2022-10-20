import { getValueFromUnit } from "../../../../utils/math"
import { StdpControls, StdpWaveform, VoltageWaveform } from "../types"

export function getConstantVHigh(amplitude: number, pulseDuration: number, delay: number) {
    return (amplitude / 2) / (pulseDuration / 2) * delay
}

export function getCuttingV(amplitude: number, pulseDuration: number, delay: number) {
    return (amplitude / 2) / (pulseDuration / 2) * (pulseDuration / 2 - delay)
}

export function getConstantVlow(amplitude: number, pulseDuration: number, delay: number) {
    return (-getCuttingV(amplitude, pulseDuration, delay) - amplitude / 2)
}

export function getMaxV(params: StdpControls) {
    let pulseDuration = getValueFromUnit(params.pulseDuration)
    let delay = getValueFromUnit(params.delay)
    let amplitude = getValueFromUnit(params.amplitude)

    let constantVHigh = getConstantVHigh(amplitude, pulseDuration, delay)
    let constantVlow = getConstantVlow(amplitude, pulseDuration, delay)

    return Math.abs(params.stdpType == 'Depression' ? constantVHigh : constantVlow)
}

export function getMinV(params: StdpControls) {
    let pulseDuration = getValueFromUnit(params.pulseDuration)
    let delay = getValueFromUnit(params.delay)
    let amplitude = getValueFromUnit(params.amplitude)

    let constantVHigh = getConstantVHigh(amplitude, pulseDuration, delay)
    let constantVlow = getConstantVlow(amplitude, pulseDuration, delay)

    return -Math.abs(params.stdpType == 'Depression' ? constantVlow : constantVHigh)
}

async function generateWaveform(params: StdpControls): Promise<StdpWaveform> {
    let equivalentWaveForm: VoltageWaveform = []

    let waitTime = getValueFromUnit(params.waitTime)
    let delay = getValueFromUnit(params.delay)
    let amplitude = getValueFromUnit(params.amplitude)
    let pulseDuration = getValueFromUnit(params.pulseDuration)
    let stdpType = params.stdpType

    let maxV = amplitude / 2
    let constantVHigh = (amplitude / 2) / (pulseDuration / 2) * delay
    let cuttingV = (amplitude / 2) / (pulseDuration / 2) * (pulseDuration / 2 - delay)

    let multiplier = stdpType == 'Depression' ? 1 : -1


    let time = 0

    equivalentWaveForm.push({ time, voltage: 0 })
    time += waitTime
    equivalentWaveForm.push({ time, voltage: 0 })

    time += delay
    // First ramp
    equivalentWaveForm.push({
        time,
        voltage: constantVHigh * multiplier
    })

    time += pulseDuration / 2 - delay
    // First High constant
    equivalentWaveForm.push({
        time,
        voltage: constantVHigh * multiplier
    })

    // console.log(`delay: ${delay}`)

    if (delay != 0) {
        time += 1e-8
        // Lower pulse
        equivalentWaveForm.push({
            time,
            voltage: (-cuttingV - amplitude / 2) * multiplier
        })
        time += delay
        equivalentWaveForm.push({
            time,
            voltage: (-cuttingV - amplitude / 2) * multiplier
        })

        time += 1e-8
        // last High constant
        equivalentWaveForm.push({
            time,
            voltage: constantVHigh * multiplier
        })
        time += pulseDuration / 2 - delay
        equivalentWaveForm.push({
            time,
            voltage: constantVHigh * multiplier
        })
    } else {
        time += waitTime + pulseDuration / 2
        // last High constant
        equivalentWaveForm.push({
            time,
            voltage: 0
        })
    }

    time += delay
    // last Ramp
    equivalentWaveForm.push({
        time,
        voltage: 0
    })

    time += waitTime
    equivalentWaveForm.push({
        time,
        voltage: 0
    })

    // equivalentWaveForm = equivalentWaveForm.map(point => ({...point, voltage: point.voltage/100}))


    async function parentWaveform(delay: number): Promise<VoltageWaveform> {

        let waveform: VoltageWaveform = []

        time = 0
        waveform.push({
            time,
            voltage: 0
        })

        time += waitTime + delay
        waveform.push({
            time,
            voltage: 0
        })

        time += pulseDuration / 2
        waveform.push({
            time,
            voltage: amplitude / 2 * multiplier
        })

        time += 1e-8
        waveform.push({
            time,
            voltage: - amplitude / 2 * multiplier
        })

        time += pulseDuration / 2
        waveform.push({
            time,
            voltage: 0
        })

        time += waitTime
        waveform.push({
            time,
            voltage: 0
        })

        return waveform
    }

    let waveformA = await parentWaveform(0)
    let waveformB = await parentWaveform(delay)

    waveformA.push({ time: waveformA[waveformA.length - 1].time + delay, voltage: 0 })

    return {
        waveformA,
        waveformB,
        equivalent: equivalentWaveForm
    }
}

export default generateWaveform