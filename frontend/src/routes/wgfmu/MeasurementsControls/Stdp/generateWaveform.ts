import { getValueFromUnit, randn } from "../../../../utils/math"
import { StdpControls, StdpWaveform, VoltagePoint, VoltageWaveform } from "../types"

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

    if (params.noise) {
        // Sampling with linear interpolation
        let nPoints = parseInt(params.nPoints)
        let total_time = 2 * getValueFromUnit(params.waitTime) +  getValueFromUnit(params.delay) + getValueFromUnit(params.pulseDuration)
        let sampling_interval = total_time / (nPoints - 1)
        let timePoints =  [...Array(nPoints).keys()].map(p => p * sampling_interval)
        
        let finalWaveform: VoltageWaveform = [...Array(nPoints)].map(p => ({voltage: 0, time: 0} as VoltagePoint))
        let curr_index = 0
        timePoints.forEach( (time, idx) => {
            // if (time == equivalentWaveForm[curr_index + 1].time) {
            //     console.log('aaaa')
            // }
            while (time > equivalentWaveForm[curr_index + 1].time) {
                curr_index += 1
                // console.log('hey')
            }
    
            // linear interpolation
            let y0 = equivalentWaveForm[curr_index].voltage
            let y1 = equivalentWaveForm[curr_index + 1].voltage
            let x0 = equivalentWaveForm[curr_index].time
            let x1 = equivalentWaveForm[curr_index + 1].time
            let x = time 
            let y = y0 + ( x - x0 ) * (y1 - y0) / (x1 - x0)
    
            let voltage = y

            finalWaveform[idx] = { voltage, time}
        })
        let randomArray = randn(getValueFromUnit(params.noiseStd), 0, nPoints)
        finalWaveform = finalWaveform.map((p, idx) => ({...p, voltage: (p.voltage + randomArray[idx])}))
        equivalentWaveForm = finalWaveform
        // console.log(equivalentWaveForm)
    }

    return {
        waveformA,
        waveformB,
        equivalent: equivalentWaveForm
    }
}

export default generateWaveform