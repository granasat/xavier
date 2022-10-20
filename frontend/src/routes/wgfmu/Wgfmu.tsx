import { ReactNode, useState } from 'react'
import { TbWaveSquare, TbWaveSawTool } from 'react-icons/tb'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectAvgTime, setAvgTime, measurePulse, measureStdp } from './MeasurementsControls/measurementControlsSlice';
import { PulseControls, StdpControls } from './MeasurementsControls'
import TopBar from '../../components/TopBar';
import Tabs from '../../components/Tabs'
import Graph from '../../components/Graph'
import Visualizer from './Visualizer'
import SciNumberInput from '../../components/Input/SciNumberInput'
import MeasurementsDropdown from './MeasurementsDropdown'
import { calibrate } from '../../store/api';
import { AnimatePresence, motion } from 'framer-motion';

type MeasurementType = "pulse" | "ramp";

type MeasurementTypeProps = {
    children: React.ReactNode,
    href: string,
    measurementType: MeasurementType,
    onClick: () => void,
    active: boolean
}

function MeasurementTypeItem({ children, href, measurementType, onClick, active }: MeasurementTypeProps) {

    return (
        <NavLink
            to={""}
            className={({ isActive, isPending }) => {
                return 'transition ease-in-out duration-200 rounded-full p-1 border-none hover:bg-neutral-700 ' + (active ? 'bg-neutral-700' : 'border-transparent')
            }}
            onClick={onClick}
        >
            <div className='pointer-events-none text-white'>
                {children}
            </div>
        </NavLink>
    )
}

const measurementAction = [
    measurePulse, // page 0
    measureStdp // page 1
]


export default function Wgfmu() {

    const [sideBar, setSideBar] = useState(true)

    const dispatch = useAppDispatch()
    const avgTime = useAppSelector(selectAvgTime)

    const [[page, direction], setPage] = useState([0, -1]);
    const paginate = (dir: number) => {
        page + dir >= 0 ? setPage([page + dir, dir]) : setPage([0, dir])
    }

    const [calibrating, setCalibrating] = useState(false)

    const tabs: { body: React.ReactElement }[] = [
        { body: <PulseControls /> },
        { body: <StdpControls /> }
    ]


    return (
        <div className='flex flex-col h-full w-full absolute'>
            <TopBar>
                <div className="h-full w-full flex justify-between">
                    <div className='flex'>
                        <MeasurementsDropdown></MeasurementsDropdown>
                        <button
                            className='h-full px-1 sm:px-3 text-sm sm:text-xl flex justify-center border-r border-solid border-neutral-600 hover:text-neutral-900 hover:bg-neutral-400 transition-all duration-200 ease-in-out'
                            onClick={async () => {
                                try {
                                    setCalibrating(true)
                                    await calibrate()
                                    setCalibrating(false)
                                } catch {
                                    setCalibrating(false)
                                }
                            }}
                        >
                            {calibrating ?
                                <div className='flex flex-col items-center justify-center my-auto'>
                                    <svg className={"h-5 w-5 mr-1 text-white inline " + (calibrating ? " animate-spin" : "")} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                :
                                null
                            }
                            <div className='flex flex-col items-center justify-center my-auto'>
                                Calibrate
                            </div>
                        </button>
                    </div>
                    <div className='flex items-center justify-end'>
                        <div className='flex flex-col items-center justify-center px-1 sm:px-3 h-full border-l border-solid border-neutral-600'>
                            <div className='flex'>
                                <div className='hidden sm:block'>
                                    Avg time:
                                </div>
                                <div className='ml-0 sm:ml-2 w-20 text-center'>
                                    <SciNumberInput
                                        label=''
                                        value={avgTime}
                                        unit='s'
                                        onChange={(value) => {
                                            dispatch(setAvgTime(value))
                                        }}
                                    ></SciNumberInput>
                                </div>
                            </div>
                        </div>
                        <button
                            className='h-full bg-orange-800 px-1 sm:px-3 font-bold text-md sm:text-xl border-l border-solid border-neutral-600 hover:bg-orange-600 hover:animate-pulse transition-all duration-200 ease-in-oute'
                            onClick={() => dispatch(measurementAction[page]())}
                        >
                            Measure
                        </button>
                    </div>
                </div>
            </TopBar>
            <div className="w-full h-full flex">
                <AnimatePresence>
                    {sideBar && (
                        <>
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{
                                    x: 0
                                }}
                                exit={{
                                    x: "100%"
                                }}
                                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                                className="flex flex-col border-r-[1px] border-neutral-600 w-60"                >
                                <div id="measurement-types" className="px-5 py-2 flex flex-col border-b border-neutral-600">
                                    <div className="font-semibold text-xl mb-2 w-full text-center">
                                        Measurement Types
                                    </div>
                                    <div className='flex justify-around'>
                                        <MeasurementTypeItem
                                            href='pulse-measurement'
                                            measurementType='pulse'
                                            onClick={() => { setPage([0, -1]) }}
                                            active={page == 0}
                                        >
                                            <TbWaveSquare size={25}></TbWaveSquare>
                                        </MeasurementTypeItem>

                                        <MeasurementTypeItem
                                            href='ramp-measurement'
                                            measurementType='ramp'
                                            onClick={() => { setPage([1, 1]) }}
                                            active={page == 1}
                                        >
                                            <TbWaveSawTool size={25}></TbWaveSawTool>
                                        </MeasurementTypeItem>
                                    </div>
                                </div>
                                <div className='grow overflow-x-hidden px-2'>
                                    <Tabs
                                        tabs={tabs}
                                        direction={direction as -1 | 1}
                                        page={page}
                                        paginate={paginate}
                                    ></Tabs>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>


                <div className='grow relative overflow-auto'>
                    <div className='absolute w-full h-full flex flex-col'>
                        <Visualizer></Visualizer>
                    </div>
                </div>
            </div>
        </div>
    )
}