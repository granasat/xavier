import { Number, Slider } from '../../../../components/Input'
import math, { formatCfg, getValueFromUnit } from '../../../../utils/math'

import { useState, useEffect } from 'react'
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useAppSelector, useAppDispatch } from '../../../../store/hooks'
import { selectStdpParams, setStdpParamsField, setPoints, selectMeasurement, selectStdpMeasuredConductance, setStdpMeasuredConductance, selectStdpType, setStdpType, setStdpCollectionParamsField, selectStdpCollectionParams } from '../measurementControlsSlice'
import { StdpControls as StdpControlsInterface, VoltageWaveform, StdpWaveform, StdpCollectionControls } from '../types'
import { conductanceMeasurement } from '../api'
import { ConductanceMeasurement } from '../../../../utils/types'
import generateWaveform, { getMaxV, getMinV } from './generateWaveform'
import AnimateHeight from './AnimateHeight'
import MultiSlider from '../../../../components/MultiSlider'
import SciNumberInput from '../../../../components/Input/SciNumberInput'

type SingleValidations = {
    [key in `${keyof StdpControlsInterface}`]: boolean
}
type CollectionValidations = {
    [key in `${keyof StdpCollectionControls}`]: boolean
}

export default function StdpControls() {

    const params = useAppSelector(selectStdpParams)
    const collectionParams = useAppSelector(selectStdpCollectionParams)
    const measurement = useAppSelector(selectMeasurement)
    const conductance = useAppSelector(selectStdpMeasuredConductance)
    const measurementType = useAppSelector(selectStdpType)
    const dispatch = useAppDispatch()

    const [valid, setValid] = useState({
        params: {
            delay: true,
            amplitude: true,
            pulseDuration: true,
            waitTime: true
        } as SingleValidations,
        collectionParams: {
            delayPoints: true
        } as CollectionValidations
    })

    const [maxV, setMaxV] = useState(0)
    const [minV, setMinV] = useState(0)
    const maxAmplitude = 10
    const [fetchingConductance, setFetchingConductance] = useState<boolean>(false)

    const onValidateCurrySingle = (id: keyof StdpControlsInterface) => {
        return (isValid: boolean) => setValid({ ...valid, params: { ...valid.params, [id]: isValid } })

    }

    const onValidateCurryCollection = (id: keyof StdpCollectionControls) => {
        return (isValid: boolean) => setValid({ ...valid, collectionParams: { ...valid.collectionParams, [id]: isValid } })
    }

    const onValidateCurry = (id: (keyof StdpControlsInterface) | (keyof StdpCollectionControls)) => {
        switch (measurementType) {
            case "Single":
                return onValidateCurrySingle(id as keyof StdpControlsInterface)
            // Collection
            default:
                return onValidateCurryCollection(id as keyof StdpCollectionControls)
        }
    }

    const getValue = (id: (keyof StdpControlsInterface) | (keyof StdpCollectionControls)) => {
        switch (measurementType) {
            case "Single":
                return params[id as keyof StdpControlsInterface]
            // Collection
            default:
                return collectionParams[id as keyof StdpCollectionControls]
        }
    }

    function setConductance(c: null | number) {
        dispatch(setStdpMeasuredConductance(c))
    }

    function checkValid(): boolean {
        return (
                (measurementType == "Single" && Object.values(valid.params).every(v => v)) 
                ||
                (measurementType == "Collection" && Object.values(valid.collectionParams).every(v => v))
        )
    }

    function maxDelay(): number {
        try {
            let unit = math.unit(getValue("pulseDuration") as string)
            //@ts-expect-error
            let v = Math.round(unit.value / 2 * 1 / unit.units[0].prefix.value * 100) / (100 * 1 / unit.units[0].prefix.value)
            return v
        } catch {
            return 0
        }
    }

    function collectionDelayPoints(): number[] {
        let maxDelayLocal = maxDelay()
        let delayPoints = parseInt(collectionParams.delayPoints)

        return (new Array(parseInt(collectionParams.delayPoints)))
            .fill(0)
            .map((_, i) => maxDelayLocal / delayPoints * (i + 1))
    }

    useEffect(() => {
        // console.log(valid)
        if (!checkValid())
            return
        try {
            generateWaveform(params).then((waveForm) => {
                dispatch(setPoints(waveForm))
            })
        } catch {

        }
    }, [params])

    useEffect(() => {

        if (!checkValid())
            return
        try {
            if (measurementType == "Single") {

                setMaxV(getMaxV(params))
                setMinV(getMinV(params))
            }

            if (measurementType == "Collection") {

                let maxVs = []
                
                maxVs.push(...collectionDelayPoints().map((delay) => getMaxV({
                    ...collectionParams,
                    delay: (delay.toString() + "s"),
                    stdpType: "Depression"
                } as StdpControlsInterface)))
                
                maxVs.push(...collectionDelayPoints().map((delay) => getMaxV({
                    ...collectionParams,
                    delay: (delay.toString() + "s"),
                    stdpType: "Potenciation"
                } as StdpControlsInterface)))

                console.log(maxVs)

                let minVs = []
                
                minVs.push(...collectionDelayPoints().map((delay) => getMinV({
                    ...collectionParams,
                    delay: (delay.toString() + "s"),
                    stdpType: "Depression"
                } as StdpControlsInterface)))
                
                minVs.push(...collectionDelayPoints().map((delay) => getMinV({
                    ...collectionParams,
                    delay: (delay.toString() + "s"),
                    stdpType: "Potenciation"
                } as StdpControlsInterface)))

                setMaxV(Math.max(...maxVs))
                setMinV(Math.min(...minVs))
            }

        } catch { }
        // set()
    }, [params, collectionParams, measurementType])

    return (
        <div className="w-full flex flex-col items-center overflow-hidden">

            <div className="py-4 pt-6 w-full border-b border-solid border-neutral-600 flex">
                <div className='p-2 w-full border border-solid flex justify-around items-center border-neutral-600 rounded-lg'>
                    <LayoutGroup>
                    <button
                        className="font-bold rounded-lg w-full"
                        onClick={() => dispatch(setStdpType("Single"))}
                    >
                        <div className='relative w-full h-full text-start'>
                            <div className='p-2'>
                                Single
                            </div>
                            {measurementType == "Single" ? (
                                <motion.div className="absolute h-full w-full bg-neutral-700 top-0 -z-10 rounded-lg" layoutId="collectionSelector" />
                            ) : null}
                        </div>
                    </button>
                    <button
                        className="font-bold rounded-lg w-full text-start"
                        onClick={() => dispatch(setStdpType("Collection"))}
                    >
                        <div className='relative w-full h-full'>
                            <div className='p-2'>
                                Collection
                            </div>
                            {measurementType == "Collection" ? (
                                <motion.div className="absolute h-full w-full bg-neutral-700 top-0 -z-10 rounded-lg" layoutId="collectionSelector" />
                            ) : null}
                        </div>
                    </button>
                    </LayoutGroup>
                </div>
            </div>

            <AnimateHeight isOpen={measurementType == "Single"}>

                <div className='pb-4 pt-2 w-full border-b border-solid border-neutral-600'>
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
                                return math.unit(params.pulseDuration).value / 2 / 100
                            } catch {
                                return 1
                            }
                        })()}
                        min={0}
                        max={
                            maxDelay()
                        }
                    />

                </div>

            </AnimateHeight>

            <AnimateHeight isOpen={measurementType == "Collection"}>
                <motion.div className='pb-2 pt-2 w-full border-b border-solid border-neutral-600 flex flex-col'>


                    <Number
                        label="Number of delay steps"
                        onChange={(value) => {
                            dispatch(setStdpCollectionParamsField({ val: value, key: 'delayPoints' }))
                        }}
                        value={collectionParams.delayPoints}
                        onValidate={onValidateCurry("delayPoints")}
                        min={1}
                        max={20}
                    />
                    
                    <MultiSlider
                        max={maxDelay()}
                        min={0}
                        points={
                            collectionDelayPoints()
                        }
                        unit={"s"}
                        label={"Delay"}
                    />

                </motion.div>
                {/* Hola */}
            </AnimateHeight>



            <div className="py-4 w-full border-b border-solid border-neutral-600">
                <Number
                    label="Amplitude"
                    onChange={(value) => {
                        dispatch(setStdpParamsField({ val: value, key: 'amplitude' }))
                    }}
                    value={getValue("amplitude") as string}
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
                    value={getValue("pulseDuration") as string}
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
                    value={getValue("waitTime") as string}
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
                    value={getValue("nPoints") as string}
                    onValidate={onValidateCurry("nPoints")}
                />
            </div>


            <div className="py-4 w-full border-b border-solid border-neutral-600 flex">
                <div className='p-2 w-full border border-solid flex-col justify-around items-center border-neutral-600 rounded-lg'>
                    <LayoutGroup>
                    <button
                        className="font-bold rounded-lg w-full"
                        onClick={() => dispatch(setStdpParamsField({ val: "Depression", key: 'stdpType' }))}
                    >
                        <div className='relative w-full h-full text-start'>
                            <div className='p-2'>
                                Depression
                            </div>
                            {getValue("stdpType") === 'Depression' ? (
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
                            {getValue("stdpType") === 'Potenciation' ? (
                                <motion.div className="absolute h-full w-full bg-neutral-700 top-0 -z-10 rounded-lg" layoutId="depressionselector" />
                            ) : null}
                        </div>
                    </button>
                    </LayoutGroup>
                </div>
            </div>






            <div className="py-4 w-full border-b border-solid border-neutral-600 flex justify-between">
                <button
                    className={"bg-neutral-600 hover:text-neutral-900 hover:bg-neutral-400 hover:font-normal rounded-lg p-2 flex justify-center transition-all ease-in-out duration-500 " + (conductance ? "" : "w-full")}
                    onClick={async () => {
                        try {
                            setFetchingConductance(true)
                            setConductance(null)
                            setConductance(((await conductanceMeasurement()) as ConductanceMeasurement).conductance)
                            setFetchingConductance(false)
                        } catch {
                            setFetchingConductance(false)
                        }
                    }}
                >
                    {fetchingConductance ?
                        <div className='flex flex-col items-center justify-center'>
                            <svg className={"h-4 w-4 mr-1 text-white inline " + (fetchingConductance ? " animate-spin" : "")} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        :
                        null
                    }
                    <div className='flex flex-col items-center justify-center text-xs'>
                        Test conductance
                    </div>
                </button>
                {conductance ?
                    <>
                        {/* <div className='border-r border-neutral-600 ml-1 grow'>
                        </div> */}
                        <div className='my-auto grow text-end'>
                            {math.unit(conductance.toString() + 'S').format(formatCfg)}
                        </div>
                    </>
                    :
                    null
                }
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
                            } catch {
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
                            } catch {
                                return ""
                            }
                        })()}
                    </div>
                </div>
            </div>
            
            <div className='py-4 w-full border-b border-solid border-neutral-600'>
                <div className={'flex flex-col ' + (params.noise ? 'justify-between' : 'justify-around')}>
                    
                    { params.noise &&
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
                                    dispatch(setStdpParamsField({val: value, key: 'noiseStd'}))
                                }}
                            ></SciNumberInput>
                        </div>
                    </div>
                    }
                    <div
                        className={'p-2 py-1 ease-in-out cursor-pointer hover:bg-neutral-500 rounded-xl border border-solid border-neutral-600 flex justify-center' + (params.noise ? ' bg-red-500' : '')}
                        onClick={() => dispatch(setStdpParamsField({val: !params.noise, key: 'noise'}))}
                    >

                            { params.noise ? 'Disable' : 'Enable Noise' }
                    </div>
                </div>
            </div>
        </div>
    )
}
