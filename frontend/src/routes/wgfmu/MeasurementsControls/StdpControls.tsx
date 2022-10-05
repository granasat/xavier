import { Number, Slider } from '../../../components/Input'
import math, { formatCfg } from '../../../utils/math'

import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { useAppSelector, useAppDispatch } from '../../../store/hooks'
import { selectStdpParams, setStdpParamsField, setPoints, setTimeScale } from './waveformSlice'
import { StdpControls as StdpControlsInterface, VoltageWaveform, StdpWaveform } from './types'
import { boolean, minTransformDependencies } from 'mathjs'
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
    let stdpType = params.stdpType

    let maxV = amplitude / 2
    let constantVHigh = (amplitude/2) / (pulseDuration / 2) * delay
    let cuttingV = (amplitude/2) / (pulseDuration / 2) * (pulseDuration/2 - delay)

    let multiplier = stdpType == 'Depression' ? 1 : -1


    let time = 0

    equivalentWaveForm.push({time, voltage: 0})
    time += waitTime
    equivalentWaveForm.push({time, voltage: 0 })

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

    const [maxV, setMaxV] = useState(0)
    const [minV, setMinV] = useState(0)
    const [maxAmplitude, setMaxAmplitude] = useState(0)

    const onValidateCurry = (id: keyof StdpControlsInterface) => {
        return (isValid: boolean) => setValid({ ...valid, [id]: isValid })
    }

    function getMaxV(params: StdpControlsInterface) {
        let pulseDuration = getValue(params.pulseDuration)
        let delay = getValue(params.delay)
        let amplitude = getValue(params.amplitude)
        let constantVHigh = (amplitude/2) / (pulseDuration / 2) * delay
        let constantVlow = (constantVHigh - amplitude / 2)

        return Math.abs(params.stdpType == 'Depression' ? constantVHigh : constantVlow)
    }

    function getMinV(params: StdpControlsInterface) {
        let pulseDuration = getValue(params.pulseDuration)
        let delay = getValue(params.delay)
        let amplitude = getValue(params.amplitude)
        let constantVHigh = (amplitude/2) / (pulseDuration / 2) * delay
        let constantVlow = (constantVHigh - amplitude / 2)

        return -Math.abs(params.stdpType == 'Depression' ? constantVlow : constantVHigh)
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

    useEffect(() => {

        if (!Object.values(valid).every( v => v ))
            return
        try {
            let maxAmplitudetmp = params.stdpType == 'Depression' ?
                            10 * (getValue(params.pulseDuration) / 2) / getValue(params.delay) * 2
                            :
                            Math.abs(10 / (getValue(params.delay)/getValue(params.pulseDuration) - 1/2))
                            

            setMaxAmplitude(maxAmplitudetmp)

            setMaxV( getMaxV(params) )
            setMinV( getMinV(params) )
        } catch {}
        // set()
    }, [params])

    return (
        <div className="w-full flex flex-col items-center">
            <div className='py-4 w-full border-b border-solid border-neutral-600'>
                <Slider
                    label="Delay"
                    onChange={(value) => {
                        // if (getMaxV({...params, delay: value}) <=  10 && getMinV({...params, delay: value}) >=  -10) {
                        // }
                        dispatch(setStdpParamsField({ val: value, key: 'delay' }))
                    }}
                    value={params.delay}
                    onValidate={onValidateCurry("delay")}
                    type={{
                        type: "sci",
                        unit: "s"
                    }}
                    step={(() => {
                        try {
                            return math.unit(params.pulseDuration).value/2 / 100
                        } catch {
                            return 1
                        }   
                    })()}
                    min={0}
                    max={
                        (() => {
                            try {
                                let unit = math.unit(params.pulseDuration)
                                //@ts-expect-error
                                let v = Math.round(unit.value / 2 * 1/unit.units[0].prefix.value * 100) / (100*1/unit.units[0].prefix.value)
                                return v
                            } catch {
                                return 0
                            }   
                        })()
                    }
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
                    // max={maxAmplitude}
                    // min={minAmplitude}
                    max={maxAmplitude}
                    min={0}
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
            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <Number
                    label="Number of points"
                    onChange={(value) => {
                        dispatch(setStdpParamsField({ val: value, key: 'nPoints' }))
                    }}
                    value={params.nPoints}
                    onValidate={onValidateCurry("nPoints")}
                />
            </div>
            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <div className='w-full border border-solid flex-col justify-around items-center border-neutral-600 rounded-lg p-2'>
                    <button
                        className="font-bold rounded-lg w-full"
                        onClick={() => dispatch(setStdpParamsField({ val: "Depression", key: 'stdpType' }))}
                    >
                       <div className='relative w-full h-full text-start'>
                            <div className='p-2'>
                                Depression
                            </div>
                            {params.stdpType === 'Depression' ? (
                            <motion.div className="absolute h-full w-full bg-neutral-700 top-0 -z-10 rounded-lg" layoutId="depressionselector" />
                            ) : null}
                        </div>
                    </button>
                    <button
                        className="font-bold rounded-lg w-full text-start"
                        onClick={() => dispatch(setStdpParamsField({ val: "Potenciation", key: 'stdpType' }))}
                    >
                        <div className='relative w-full h-full'>
                            <div className='p-2'>

                                Potenciation
                            </div>
                            {params.stdpType === 'Potenciation' ? (
                            <motion.div className="absolute h-full w-full bg-neutral-700 top-0 -z-10 rounded-lg" layoutId="depressionselector" />
                            ) : null}
                        </div>
                    </button>
                </div>
            </div>
            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <div className="flex justify-between">
                    <div className='font-bold inline pr-5'>
                        Max V:
                    </div>
                    <div className=' text-end inline'>
                        {(() => {
                            try {
                                return math.unit(maxV.toString() + 'V').format(formatCfg)
                            }catch {
                                return ""
                            }
                        })()}
                    </div>
                </div>
                <div className="flex justify-between">
                    <div className='font-bold inline pr-5'>
                        Min V: 
                    </div>
                    <div className=' text-end inline'>
                        {(() => {
                            try {
                                return math.unit(minV.toString() + 'V').format(formatCfg)
                            }catch {
                                return ""
                            }
                        })()}
                    </div>
                </div>
            </div>
        </div>
    )
}
