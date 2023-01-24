import { useState } from "react"
import { HiLockClosed, HiLockOpen } from "react-icons/hi"
import { Number, Slider } from "../../../../components/Input"
import SciNumberInput from "../../../../components/Input/SciNumberInput"
import { useAppDispatch, useAppSelector } from "../../../../store/hooks"
import { selectPulseParams, setPulseParamsField } from "../measurementControlsSlice"
import { PulseTrain } from "../types"

export default function CollectionControls() {
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

    const onValidateCurry = (id: keyof PulseTrain | "nPointsHigh" | "nPointsLow") => {
        return (isValid: boolean) => setValid({ ...valid, [id]: isValid })
    }



    return (<>
            <div className="py-4 w-full">
                <Number
                    label="Max Voltage"
                    onChange={(value) => {
                        // setVHigh(value)
                        dispatch(setPulseParamsField({ val: value, key: 'vHigh' }))
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
                        dispatch(setPulseParamsField({ val: value, key: 'vLow' }))
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
                        dispatch(setPulseParamsField({ val: value, key: 'nPulses' }))
                    }}
                    value={params.nPulses}
                    onValidate={onValidateCurry("nPulses")}
                />
            </div>
            <div className="py-4 w-full">
                <Number
                    label="Cycle time"
                    onChange={(value) => {
                        dispatch(setPulseParamsField({ val: value, key: 'cycleTime' }))
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
                        dispatch(setPulseParamsField({ val: value, key: 'dutyCycle' }))
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
                                dispatch(setPulseParamsField({ val: value, key: 'nPointsHigh' }))
                                samplingPointsTied && dispatch(setPulseParamsField({ val: value, key: 'nPointsLow' }))
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

                                samplingPointsTied && dispatch(setPulseParamsField({ val: params.nPointsHigh, key: 'nPointsLow' }))
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
                                dispatch(setPulseParamsField({ val: value, key: 'nPointsLow' }))
                                samplingPointsTied && dispatch(setPulseParamsField({ val: value, key: 'nPointsHigh' }))
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
            <div className='py-4 w-full border-b border-solid border-neutral-600'>
                <div className={'flex flex-col ' + (params.noise ? 'justify-between' : 'justify-around')}>

                    {params.noise &&
                        <div className='flex justify-between pb-2 px-1'>
                            <div>
                                Noise STD
                            </div>
                            <div className='ml-2 w-20 text-center my-auto'>
                                <SciNumberInput
                                    label=''
                                    value={params.noiseStd}
                                    unit='V'
                                    onChange={(value) => {
                                        dispatch(setPulseParamsField({ val: value, key: 'noiseStd' }))
                                    }}
                                ></SciNumberInput>
                            </div>
                        </div>
                    }
                    <div
                        className={'p-2 py-1 ease-in-out cursor-pointer hover:bg-neutral-500 rounded-xl border border-solid border-neutral-600 flex justify-center' + (params.noise ? ' bg-red-500' : '')}
                        onClick={() => dispatch(setPulseParamsField({ val: !params.noise, key: 'noise' }))}
                    >

                        {params.noise ? 'Disable' : 'Enable Noise'}
                    </div>
                </div>
            </div>
        </>
    )
}