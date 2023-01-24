import { useEffect, useState } from 'react'
import { Number, Slider } from "../../../../components/Input"
import { number } from 'mathjs';
import { HiLockOpen, HiLockClosed } from 'react-icons/hi'
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { setPoints, setPulseParamsField, selectPulseParams, setTimeScale, selectPulseType, setPulseType, selectPulseCollectionParams } from '../measurementControlsSlice';
import { VoltageWaveform } from '../types'
import math from '../../../../utils/math'
import SciNumberInput from '../../../../components/Input/SciNumberInput';
import { LayoutGroup, motion } from 'framer-motion';
import AnimateHeight from '../../../../components/Graph/AnimateHeight';
import CollectionControls from './CollectionControls';
import SingleControls from './SingleControls';

type ValidateId =
    "vHigh" | "vLow" | "nPulses" | "cycleTime" | "dutyCycle" | "nPointsHigh" | "nPointsLow"

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
    let cycle: VoltageWaveform = [];

    // First halve
    let timeHigh = params.cycleTime * params.dutyCycle / 100
    let samplingTimeHigh = timeHigh / (params.nPointsHigh + 1)
    cycle.push({ time: 0, voltage: params.vHigh })
    // for (let i = 0; i < params.nPointsHigh; i++) {{
    //     cycle.push({time: (i+1) * samplingTimeHigh, voltage: params.vHigh})
    // }}
    cycle.push({ time: timeHigh, voltage: params.vHigh })

    // Second halve
    let timeLow = params.cycleTime * (1 - params.dutyCycle / 100);
    let samplingTimeLow = timeLow / (params.nPointsLow + 1)
    cycle.push({ time: timeHigh, voltage: params.vLow })
    // for (let i = 0; i < params.nPointsLow; i++) {{
    //     cycle.push({time: (i+1) * samplingTimeLow + timeHigh, voltage: params.vLow})
    // }}
    cycle.push({ time: params.cycleTime, voltage: params.vLow })


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
    const collectionParams = useAppSelector(selectPulseCollectionParams)
    const measurementType = useAppSelector(selectPulseType)

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
        if (!Object.values(valid).every(v => v))
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
                vHigh: math.unit(params.vHigh).value,
                vLow: math.unit(params.vLow).value,
                nPulses: nPulses,
                cycleTime: unitCycleTime.value,
                dutyCycle: parseFloat(params.dutyCycle !== "" ? params.dutyCycle : "0"),
                nPointsHigh: parseInt(params.nPointsHigh),
                nPointsLow: parseInt(params.nPointsLow),
            }).then((waveForm) => {
                dispatch(setPoints(waveForm))
            })
        } catch { }

    }, [params])

    const onValidateCurry = (id: ValidateId) => {
        return (isValid: boolean) => setValid({ ...valid, [id]: isValid })
    }

    return (
        <div className="w-full flex flex-col items-center ">

            <div className="py-4 pb-2 pt-6 w-full border-neutral-600 flex">
                <div className='p-2 w-full border border-solid flex justify-around items-center border-neutral-600 rounded-lg'>
                    <LayoutGroup>
                        <button
                            className="font-bold rounded-lg w-full"
                            onClick={() => dispatch(setPulseType("Single"))}
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
                            onClick={() => dispatch(setPulseType("Collection"))}
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


            <AnimateHeight isOpen={measurementType == "Collection"}>
                <CollectionControls/>
            </AnimateHeight>                

            <AnimateHeight isOpen={measurementType == "Single"}>
                <SingleControls/>
            </AnimateHeight>

        </div>
    )
}
