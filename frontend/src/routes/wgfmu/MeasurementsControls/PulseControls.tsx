import { useEffect, useState } from 'react'
import { Number, Slider } from "../../../components/Input"
import { number } from 'mathjs';
import { HiLockOpen, HiLockClosed } from 'react-icons/hi'
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { setPoints, setPulseParamsField, selectPulseParams, setTimeScale } from './measurementControlsSlice';
import { VoltageWaveform } from './types'
import math from '../../../utils/math'

type ValidateId =
   "vHigh" | "vLow" |  "nPulses" | "cycleTime" | "dutyCycle" | "nPointsHigh" | "nPointsLow"

type PulseWaveFormParams = {
    vHigh: number,
    vLow: number,
    nPulses: number,
    dutyCycle: number,
    cycleTime: number,
    nPointsHigh: number,
    nPointsLow: number,
}

async function GenerateWaveform(params: PulseWaveFormParams) {
    let cycle: VoltageWaveform  = [];

    // First halve
    let timeHigh = params.cycleTime * params.dutyCycle / 100
    let samplingTimeHigh = timeHigh / (params.nPointsHigh + 1)
    cycle.push({time: 0, voltage: params.vHigh})
    // for (let i = 0; i < params.nPointsHigh; i++) {{
    //     cycle.push({time: (i+1) * samplingTimeHigh, voltage: params.vHigh})
    // }}
    cycle.push({time: timeHigh, voltage: params.vHigh})

    // Second halve
    let timeLow = params.cycleTime * (1 - params.dutyCycle / 100);
    let samplingTimeLow = timeLow / (params.nPointsLow + 1)
    cycle.push({time: timeHigh, voltage: params.vLow})
    // for (let i = 0; i < params.nPointsLow; i++) {{
    //     cycle.push({time: (i+1) * samplingTimeLow + timeHigh, voltage: params.vLow})
    // }}
    cycle.push({time: params.cycleTime, voltage: params.vLow})


    let waveForm: VoltageWaveform = [];
    for (let i = 0; i < params.nPulses; i++) {
        waveForm.push(
            ...cycle.map((point) => (
                {
                    time: point.time + (params.cycleTime * i),
                    voltage: point.voltage
                }
            ))
        )
    }

    return waveForm

}

export default function PulseControls() {
    const dispatch = useAppDispatch()
    const params = useAppSelector(selectPulseParams)

    const [samplingPointsTied, setSamplingPointsTied] = useState(true)

    const [valid, setValid] = useState({
        vHigh: true,
        vLow: true,
        nPulses: true,
        cycleTime: true,
        dutyCycle: true,
        nPointsHigh: true,
        nPointsLow: true
    }) // wether or not this settings are valid

    useEffect(() => {
        if (!Object.values(valid).every( v => v ))
            return
        try {
            let unitCycleTime = math.unit(params.cycleTime)

            //@ts-expect-error
            let scaling = Math.ceil(1 / unitCycleTime.units[0].prefix.value)
            if (scaling < 1) {
                scaling = 1
            }
            dispatch(setTimeScale(scaling))

            let nPulses = parseInt(params.nPulses) > 100 ? 100 : parseInt(params.nPulses);
            GenerateWaveform({
                vHigh:          math.unit(params.vHigh).value,
                vLow:           math.unit(params.vLow).value,
                nPulses:        nPulses,
                cycleTime:      unitCycleTime.value,
                dutyCycle:      parseFloat(params.dutyCycle !== "" ? params.dutyCycle : "0"),
                nPointsHigh:    parseInt(params.nPointsHigh),
                nPointsLow:     parseInt(params.nPointsLow),
            }).then((waveForm) => {
                dispatch(setPoints(waveForm))
            })
        } catch {}       

    }, [params])

    const onValidateCurry = (id: ValidateId) => {
        return (isValid: boolean) => setValid({ ...valid, [id]: isValid })
    }

    return (
        <div className="w-full flex flex-col items-center ">
            <div className="py-4 w-full">
                <Number
                    label="Max Voltage"
                    onChange={(value) => {
                        // setVHigh(value)
                        dispatch(setPulseParamsField({val: value, key: 'vHigh'}))
                    }}
                    value={params.vHigh}
                    onValidate={onValidateCurry("vHigh")}
                    type={{
                        type: "sci",
                        unit: "V"
                    }}
                />
            </div>
            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <Number
                    label="Min Voltage"
                    onChange={(value) => {
                        dispatch(setPulseParamsField({val: value, key: 'vLow'}))
                    }}
                    value={params.vLow}
                    onValidate={onValidateCurry("vLow")}
                    type={{
                        type: "sci",
                        unit: "V"
                    }}
                />
            </div>
            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <Number
                    label="Number of pulses"
                    onChange={(value) => {
                        dispatch(setPulseParamsField({val: value, key: 'nPulses'}))
                    }}
                    value={params.nPulses}
                    onValidate={onValidateCurry("nPulses")}
                />
            </div>
            <div className="py-4 w-full">
                <Number
                    label="Cycle time"
                    onChange={(value) => {
                        dispatch(setPulseParamsField({val: value, key: 'cycleTime'}))
                    }}
                    value={params.cycleTime}
                    onValidate={onValidateCurry("cycleTime")}
                    type={{
                        type: "sci",
                        unit: "s"
                    }}
                    min={0}
                />
            </div>
            <div className="pb-4 w-full border-b border-solid border-neutral-600">
                <Slider
                    label="Duty cycle"
                    onChange={(value) => {
                        dispatch(setPulseParamsField({val: value, key: 'dutyCycle'}))
                    }}
                    step={10}
                    min={0}
                    max={100}
                    value={params.dutyCycle}
                    format={(dc: string) => dc + '%'}
                />
            </div>
            <div className='flex flex-col w-full py-4 border-b border-solid border-neutral-600'>
                <div className='mb-2'>
                    Number of sampling points
                </div>
                <div className="flex w-full justify-around">
                    <div className="flex flex-col justify-center items-center">
                        <Number
                            label="Sampling points high"
                            onChange={(value) => {
                                dispatch(setPulseParamsField({val: value, key: 'nPointsHigh'}))
                                samplingPointsTied && dispatch(setPulseParamsField({val: value, key: 'nPointsLow'}))
                            }}
                            value={params.nPointsHigh}
                            onValidate={onValidateCurry("nPointsHigh")}
                            vertical={true}
                            min={1}
                        />
                        <div className="font-bold mt-2">
                            High
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center'>
                        <button
                            className='rounded-full p-2 transition-all duration-200 ease-in-out hover:bg-neutral-500'
                            onClick={() => {
                                if (samplingPointsTied) {
                                    setSamplingPointsTied(false)
                                    return
                                }

                                samplingPointsTied && dispatch(setPulseParamsField({val: params.nPointsHigh, key: 'nPointsLow'}))
                                setSamplingPointsTied(true)
                            }}
                        >
                            {samplingPointsTied ?
                                <HiLockClosed size={20}>
                                </HiLockClosed>
                                :
                                <HiLockOpen size={20}>
                                </HiLockOpen>
                            }
                        </button>
                        {/* This is just to set everything nicely */}
                        <div className="font-bold text-transparent">
                            High
                        </div>
                    </div>
                    <div className=" flex flex-col justify-center items-center">
                        <Number
                            label="Sampling points low"
                            onChange={(value) => {
                                dispatch(setPulseParamsField({val: value, key: 'nPointsLow'}))
                                samplingPointsTied && dispatch(setPulseParamsField({val: value, key: 'nPointsHigh'}))
                            }}
                            value={params.nPointsLow}
                            onValidate={onValidateCurry("nPointsLow")}
                            vertical={true}
                            min={1}
                        />
                        <div className="font-bold mt-2">
                            Low
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
