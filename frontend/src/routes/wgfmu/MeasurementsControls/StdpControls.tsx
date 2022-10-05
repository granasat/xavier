import { Number, Slider } from '../../../components/Input'
import math, { formatCfg } from '../../../utils/math'

import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../../../store/hooks'
import { selectStdpParams, setStdpParamsField, setPoints, setTimeScale } from './waveformSlice'
import { StdpControls as StdpControlsInterface, VoltageWaveform, StdpWaveform } from './types'
import { boolean } from 'mathjs'
import { interpolate, pointRadial } from 'd3'

type Validations = {
    [key in `${keyof StdpControlsInterface}`]: boolean
}

function getValue(unitNumber: string) {
    return math.unit(unitNumber).value
}

async function generateWaveform(params: StdpControlsInterface): Promise<StdpWaveform> {
    let equivalentWaveForm: VoltageWaveform = []
    
    let waitTime = getValue(params.waitTime)
    let delay = getValue(params.delay)
    let amplitude = getValue(params.amplitude)
    let pulseDuration = getValue(params.pulseDuration)
    
    let maxV = amplitude / 2
    let constantVHigh = (amplitude/2) / (pulseDuration / 2) * delay

    let time = 0

    equivalentWaveForm.push({time, voltage: 0})
    time += waitTime
    equivalentWaveForm.push({time, voltage: 0 })

    time += delay
    // First ramp
    equivalentWaveForm.push({
        time,
        voltage: constantVHigh
    })

    time += pulseDuration / 2 - delay
    // First High constant
    equivalentWaveForm.push({
        time,
        voltage: constantVHigh
    })

    // console.log(`delay: ${delay}`)
    
    if (delay != 0) {
        time += 1e-8
        // Lower pulse
        equivalentWaveForm.push({
            time,
            voltage: constantVHigh - (amplitude / 2)
        })
        time += delay
        equivalentWaveForm.push({
            time,
            voltage: constantVHigh - amplitude / 2
        })
    
        time += 1e-8
        // last High constant
        equivalentWaveForm.push({
            time,
            voltage: constantVHigh
        })
        time += pulseDuration / 2 - delay
        equivalentWaveForm.push({
            time,
            voltage: constantVHigh
        })
    } else {
        time += waitTime
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
            voltage: amplitude / 2
        })
    
        time += 1e-8
        waveform.push({
            time,
            voltage: - amplitude / 2
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

    waveformA.push({time: waveformA[waveformA.length - 1].time + delay, voltage: 0})

    return {
        waveformA,
        waveformB,
        equivalent: equivalentWaveForm
    }
}

export default function StdpControls() {

    const params = useAppSelector(selectStdpParams)
    const dispatch = useAppDispatch()

    const [valid, setValid] = useState({
        delay: true,
        amplitude: true,
        pulseDuration: true,
        waitTime: true
    } as Validations)

    const onValidateCurry = (id: keyof StdpControlsInterface) => {
        return (isValid: boolean) => setValid({ ...valid, [id]: isValid })
    }

    useEffect(() => {
        // console.log(valid)
        if (!Object.values(valid).every( v => v ))
            return
        try {
            generateWaveform(params).then((waveForm) => {
                dispatch(setPoints(waveForm))
            })
        } catch {

        }
    }, [params])

    return (
        <div className="w-full flex flex-col items-center">
            <div className='py-4 w-full border-b border-solid border-neutral-600'>
                <Slider
                    label="Delay"
                    onChange={(value) => {
                        dispatch(setStdpParamsField({ val: value, key: 'delay' }))
                    }}
                    value={params.delay}
                    onValidate={onValidateCurry("delay")}
                    type={{
                        type: "sci",
                        unit: "s"
                    }}
                    step={math.unit(params.pulseDuration).value/2 / 100}
                    min={0}
                    max={math.unit(params.pulseDuration).value/2}
                />

            </div>
            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <Number
                    label="Amplitude"
                    onChange={(value) => {
                        dispatch(setStdpParamsField({ val: value, key: 'amplitude' }))
                    }}
                    value={params.amplitude}
                    onValidate={onValidateCurry("amplitude")}
                    type={{
                        type: "sci",
                        unit: "V"
                    }}
                />
            </div>
            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <Number
                    label="Pulse duration"
                    onChange={(value) => {
                        dispatch(setStdpParamsField({ val: value, key: 'pulseDuration' }))
                    }}
                    value={params.pulseDuration}
                    onValidate={onValidateCurry("pulseDuration")}
                    type={{
                        type: "sci",
                        unit: "s"
                    }}
                />
            </div>
            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <Number
                    label="Wait time"
                    onChange={(value) => {
                        dispatch(setStdpParamsField({ val: value, key: 'waitTime' }))
                    }}
                    value={params.waitTime}
                    onValidate={onValidateCurry("waitTime")}
                    type={{
                        type: "sci",
                        unit: "s"
                    }}
                />
            </div>
            <div className="py-4 w-full">
                <Number
                    label="Number of points"
                    onChange={(value) => {
                        dispatch(setStdpParamsField({ val: value, key: 'nPoints' }))
                    }}
                    value={params.nPoints}
                    onValidate={onValidateCurry("nPoints")}
                />
            </div>
        </div>
    )
}