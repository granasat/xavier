import { selectWaveform, selectMeasurement, selectTimeScale } from './MeasurementsControls/measurementControlsSlice'
import { useAppSelector, } from '../../store/hooks'
import { AnimatePresence, motion } from "framer-motion"

import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { TbFileDownload } from 'react-icons/tb'
import GraphOrig, { Dimensions } from "../../components/Graph"
import Tabs from "../../components/Tabs"
import { Measurement, StdpMeasurement } from '../../utils/types';
import math, { formatCfg } from '../../utils/math';
import { StdpWaveform, VoltageWaveform } from './MeasurementsControls/types';
import { ImplementedGraphs } from '../../components/Graph/graph';
import { isMobile, clone } from "../../utils"

function getDataFromMeasurement(measurement: Measurement | null) {
    if (!measurement || !measurement.data || measurement.status == "Error") {
        return []
    }

    if (measurement.category == "StdpCollection") {
        return measurement.data
    }


    // Pulse measurement
    if (Array.isArray(measurement.data)) {
        return measurement.data
    }

    return (measurement.data as StdpMeasurement).iv
}

function getTypeFromMeasurement(measurement: Measurement | null): keyof ImplementedGraphs {
    if (!measurement || !measurement.data || measurement.status == "Error") {
        return "ivMeasurement"
    }

    if (measurement.category == "StdpCollection") {
        return "stdpCollection"
    }


    return "ivMeasurement"
}

function getTypeFromWaveform(waveform: VoltageWaveform | StdpWaveform): keyof ImplementedGraphs {
    if (Object.prototype.hasOwnProperty.call(waveform, 'equivalent')) {
        return "stdp"
    }

    return "voltage"
}

const initialDimensions: Dimensions = {
    width: 460,
    height: 400,
    margin: { top: 10, right: 130, bottom: 70, left: 130 }
}

const initialDimensionsMobile: Dimensions = {
    width: 460,
    height: 400,
    margin: { top: 10, right: 100, bottom: 100, left: 100 }
}

const Graph = React.memo(GraphOrig)


export default function Visualizer() {
    const waveformPoints = useAppSelector(selectWaveform)
    const measurement = useAppSelector(selectMeasurement)
    const timeScale = useAppSelector(selectTimeScale)
    const [dimensionChangedHelper, setDimensionChangedHelper] = useState(false)
    const [dimensions, setDimensions] = useState(initialDimensions)
    const [[page, direction], setPage] = useState([0, -1]);
    const divCallback = useCallback((node: HTMLDivElement) => resizeGraphs(node), [dimensionChangedHelper, page])

    useEffect(() => {
        window.addEventListener("resize", () => {
            setDimensionChangedHelper(d => !d)
        })
    }, [])

    function resizeGraphs(node: HTMLDivElement) {
        if (!node)
            return

        let mobile = isMobile()
        let margin = clone(mobile ? initialDimensionsMobile.margin : initialDimensions.margin)
        console.log(`mobile: ${mobile}`)
        if (page == 0) { // Previsualization, no current so no right margin is needed
            // margin.right = 50
        }

        console.log(`margin: ${margin.right}, ${margin.left}`)
        setDimensions((d: Dimensions) => ({
            ...d,
            width: Math.max(node.clientWidth - margin.left - margin.right, 900),
            height: Math.min(node.clientHeight - margin.top - margin.bottom - 32 - 8, 600),
            margin: margin
            // height: node.clientHeight*.9 - d.margin.top - d.margin.bottom,
        }))
    }


    const paginate = (dir: number) => {
        page + dir >= 0 ? setPage([page + dir, dir]) : setPage([0, dir])
    }

    const tabs: { body: React.ReactElement }[] = [
        {
            body: (
                <Graph
                    dimensions={{ ...dimensions, margin: { ...dimensions.margin, right: 50 } }}
                    data={waveformPoints}
                    timeScale={timeScale}
                    type={getTypeFromWaveform(waveformPoints)}
                ></Graph>
            )
        },
        {
            body: (
                <Graph
                    dimensions={dimensions}
                    data={getDataFromMeasurement(measurement)}
                    timeScale={timeScale}
                    type={getTypeFromMeasurement(measurement)}
                ></Graph>
            )
        },
    ]


    return (
        <div className="w-full h-full flex flex-col justify-between items-center relative" ref={divCallback}>
            <div className='w-full flex'>
                <div className='grow'>
                    <button
                        className='w-full rounded-md text-2xl'
                        onClick={() => setPage([0, -1])}
                    >
                        Preview
                    </button>
                    {page === 0 ? (
                        <motion.div className=" -mb-1 mx-0 h-1 bg-neutral-500" layoutId="underline" />
                    ) : null}
                </div>
                <div className='grow'>
                    <button
                        className='w-full rounded-md text-2xl'
                        onClick={() => setPage([1, 1])}
                    >
                        Measurement
                    </button>
                    {page === 1 ? (
                        <motion.div className=" -mb-1 mx-0 h-1 bg-neutral-500" layoutId="underline" />
                    ) : null}
                </div>
            </div>
            <div className='w-full grow flex flex-col items-center justify-center pt-2'>

                <Tabs
                    tabs={tabs}
                    direction={direction as -1 | 1}
                    page={page}
                    paginate={paginate}
                    height={dimensions.height + dimensions.margin.top + dimensions.margin.bottom}
                    noSwipe={true}
                ></Tabs>
                {/* {tabs[page].body} */}
                {/* <Graph
                        dimensions={dimensions}
                        data={ measurement ? measurement : waveformPoints}
                        timeScale={timeScale}
                    ></Graph> */}
            </div>
            <AnimatePresence>
                {page == 1 && measurement &&
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{
                            y: 0
                        }}
                        exit={{
                            y: "200%"
                        }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className='w-full flex justify-between items-center px-14 mb-10'
                    >
                            <div
                                className={' text-white text-5xl font-bold' + (measurement.status == 'Error' ? ' text-red-600 ' : '')}
                            >
                                {measurement.id} {measurement.status == 'Error' ? ' - Error' : ''}
                            </div>
                            {
                                measurement.category == "Stdp" && measurement.data && !Array.isArray(measurement.data) ?
                                    <div
                                        className={'w-full text-2xl font-light flex justify-center items-center'}
                                    >
                                        Conductance: {math.unit((measurement.data as StdpMeasurement).conductance.toString() + 'S').format(formatCfg)}
                                    </div> : null
                            }
                            {measurement.status == "Done" &&
                                <a
                                    className='text-white transition ease-in-out duration-200 rounded-full p-2 bg-neutral-700 hover:bg-neutral-200 hover:text-neutral-800'
                                    href={`http://localhost:8000/api/measurements/file/${measurement.id}`}
                                    target="_blank"
                                >
                                    <div className='pointer-events-none '>
                                        <TbFileDownload size={40}>

                                        </TbFileDownload>
                                    </div>

                                </a>
                            }
                    </motion.div>
                }
            </AnimatePresence>

        </div>
    )
}