import { ReactNode, useState } from 'react'
import { TbWaveSquare, TbWaveSawTool } from 'react-icons/tb'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectAvgTime, setAvgTime, measurePulse, measureStdp } from './MeasurementsControls/waveformSlice';
import { PulseControls, RampControls } from './MeasurementsControls'
import TopBar from '../../components/TopBar';
import Tabs from '../../components/Tabs'
import Graph from '../../components/Graph'
import Visualizer from './Visualizer'
import SciNumberInput from '../../components/Input/SciNumberInput'
import MeasurementsDropdown from './MeasurementsDropdown'

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
    const dispatch = useAppDispatch()
    const avgTime = useAppSelector(selectAvgTime)

    const [[page, direction], setPage] = useState([0, -1]);
    const paginate = (dir: number) => {
        page + dir >= 0 ? setPage([page + dir, dir]) : setPage([0, dir])
    }

    const tabs: { body: React.ReactElement }[] = [
        { body: <PulseControls /> },
        { body: <RampControls /> }
    ]


    return (
        <div className='flex flex-col h-full w-full absolute'>
            <TopBar>
                <div className="h-full w-full flex justify-between">
                    <MeasurementsDropdown></MeasurementsDropdown>
                    
                    <div className='flex items-center justify-end'>
                        <div className='flex flex-col items-center justify-center px-3 h-full border-l border-solid border-neutral-600'>
                            <div className='flex'>
                                <div>
                                    Avg time:
                                </div>
                                <div className='ml-2 w-20 text-center'>
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
                            className='h-full bg-orange-800 px-3 font-bold text-xl border-l border-solid border-neutral-600 hover:bg-orange-600 hover:animate-pulse transition-all duration-200 ease-in-oute'
                            onClick={() => dispatch(measurementAction[page]())}
                        >
                            Measure
                        </button>
                    </div>
                </div>
            </TopBar>
            <div className="w-full h-full flex">
                <div className="flex flex-col border-r-[1px] border-neutral-600">
                    <div id="measurement-types" className="px-5 py-5 flex flex-col border-b border-neutral-600">
                        <div className="font-semibold text-xl mb-5">
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
                </div>
                <div className='grow relative overflow-auto'>
                    <div className='absolute w-full h-full flex flex-col'>
                        <Visualizer></Visualizer>
                    </div>
                </div>
            </div>
        </div>
    )
}