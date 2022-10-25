import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FixedSizeList as List } from "react-window"
import { useAppSelector, useAppDispatch } from "../../store/hooks"
import { selectMeasurements } from "../../store/globalSlice"
import { fetchMeasurement } from "./MeasurementsControls/measurementControlsSlice"

const showMenu = {
    center: {
        opacity: 1,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        transition: {
            duration: 0.1,
        },
    },
    enter: {
        opacity: 0.6,
        translateY: 0,
        scaleX: 0.6,
        scaleY: 0.6,
        transition: {
            duration: 0.1,
        },
        display: "block"
    },
    exit: {
        opacity: 0,
        translateY: 0,
        scaleX: 0.5,
        scaleY: 0,
        transition: {
            duration: 0.1,
        },
        transitionEnd: {
            display: "none"
        }
    }
}


export default function MeasurementsDropdown() {

    const measurements = useAppSelector(selectMeasurements)
    const dispatch = useAppDispatch()

    const [open, setOpen] = useState(false)

    const Row = ({index, style}: {index: number, style: React.CSSProperties}) => {
        let i = measurements.length -1 -index
        
        return (        
            <a
                href="#"
                className="flex-col justify-center items-center ease-in-out duration-200 hover:bg-neutral-700 text-white block px-4 py-2 text-sm w-full"
                role="menuitem"
                tabIndex={-1}
                id="menu-item-0"
                style={style}
                onClick={() => dispatch(fetchMeasurement(measurements[i].id))}

            >
                <div
                    className="pointer-events-none text-white flex justify-between w-full"
                >
                    <div className="text-justify font-bold">
                     {measurements[i].id}
                    </div>
                    <div className="text-justify">
                        {measurements[i].category}
                    </div>
                    <div className="text-justify">
                        {(new Date(measurements[i].date)).toLocaleString("es-ES")}
                    </div>
                </div>
            </a>
        )
    }

    return (
        <div className="h-full relative inline-block text-left border-r border-solid border-neutral-600">
            <div className="h-full">
                <button
                    type="button"
                    className="text-sm sm:text-md flex w-full h-full justify-center rounded-md px-1 sm:px-4 shadow-sm" id="menu-button" aria-expanded="true" aria-haspopup="true"
                    onClick={() => setOpen((prevVal) => !prevVal)}
                >   
                    <div className="h-full flex flex-col justify-center">
                        Measurements                            
                    </div>
                    <div className="h-full flex flex-col justify-center">
                        <svg className="-mr-1 ml-0 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>
            </div>

            <AnimatePresence>
            {open &&
                <motion.div
                    className="absolute left-0 z-[100] w-80 origin-top-left focus:outline-none bg-[#242424] border-t border-solid border-r-4 border-b-4 rounded-br-xl border-neutral-600 max-h-96 overflow-hidden"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex={-1}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    variants={showMenu}
                >
                    <div
                        className="flex flex-col-reverse overflow-hidden"
                        role="none"
                    >
                        <List
                            width={320}
                            height={700}
                            itemCount={measurements.length}
                            itemSize={40}
                        >
                            {Row}
                        </List>
                        
                    </div>
                </motion.div>}
            </AnimatePresence>
        </div>

    )
}