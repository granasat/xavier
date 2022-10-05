import { selectWaveform, selectMeasurement, selectTimeScale } from './MeasurementsControls/waveformSlice'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { motion } from "framer-motion"

import React, { useCallback, useEffect, useState } from 'react';
import { TbFileDownload } from 'react-icons/tb'
import Graph, { Dimensions } from "../../components/Graph"
import Tabs from "../../components/Tabs"

const initialDimensions: Dimensions = {
    width: 460,
    height: 600,
    margin: { top: 10, right: 150, bottom: 100, left: 150 }
}



export default function Visualizer() {
    const waveformPoints = useAppSelector(selectWaveform)
    const measurement = useAppSelector(selectMeasurement)
    const timeScale = useAppSelector(selectTimeScale)
    const [dimensionChangedHelper, setDimensionChangedHelper] = useState(false)
    const [dimensions, setDimensions] = useState(initialDimensions)
    const divCallback = useCallback((node: HTMLDivElement) => resizeGraphs(node), [dimensionChangedHelper])

    useEffect(() => {
        window.addEventListener("resize", () => {
            setDimensionChangedHelper(d => !d)
        })
    }, [])

    function resizeGraphs(node: HTMLDivElement) {
        if (!node)
            return
        setDimensions((d: Dimensions) => ({
            ...d,
            width: node.clientWidth - d.margin.left - d.margin.right,
            // height: node.clientHeight*.9 - d.margin.top - d.margin.bottom,
        }))
    }


    const [[page, direction], setPage] = useState([0, -1]);
    const paginate = (dir: number) => {
        page + dir >= 0 ? setPage([page + dir, dir]) : setPage([0, dir])
    }

    const tabs: { body: React.ReactElement }[] = [
        {
            body: (
                <Graph
                    dimensions={dimensions}
                    data={waveformPoints}
                    timeScale={timeScale}
                ></Graph>
            )
        },
        {
            body: (
                <Graph
                    dimensions={dimensions}
                    data={measurement ? measurement.data : []}
                    timeScale={timeScale}
                ></Graph>
            )
        },
    ]


    return (
        <div className="w-full h-full flex flex-col justify-between items-center overflow-x-hidden relative" ref={divCallback}>

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
            <div className='w-full grow flex flex-col items-center justify-center'>
                <Tabs
                    tabs={tabs}
                    direction={direction as -1 | 1}
                    page={page}
                    paginate={paginate}
                    height={dimensions.height + dimensions.margin.top + dimensions.margin.bottom}
                ></Tabs>
                {/* <Graph
                        dimensions={dimensions}
                        data={ measurement ? measurement : waveformPoints}
                        timeScale={timeScale}
                    ></Graph> */}
            </div>
            { page == 1 && measurement &&
                <>
                {measurement.status == "Done" &&
                    <a
                        className='absolute bottom-11 right-11 text-white transition ease-in-out duration-200 rounded-full p-2 bg-neutral-700 hover:bg-neutral-200 hover:text-neutral-800'
                        href={`http://localhost:8000/api/measurements/file/${measurement.id}`}
                        target="_blank"
                    >
                        <div className='pointer-events-none '>
                            <TbFileDownload size={40}>

                            </TbFileDownload>
                        </div>
                            
                    </a>
                }
                <div
                    className={'absolute bottom-11 left-11 text-white text-5xl font-bold' + (measurement.status == 'Error' ? ' text-red-600 ' : '')}
                >
                    {measurement.id} {measurement.status == 'Error' ? ' - Error' : ''}
                </div>
                </>
            }
        </div>
    )
}