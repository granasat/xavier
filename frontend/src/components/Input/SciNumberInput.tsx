import { formatPrefix } from 'd3'
import { keys } from 'localforage'
import React, { useState, useEffect, KeyboardEventHandler } from 'react'
import { MdKeyboardArrowUp } from 'react-icons/md'
import math, { formatCfg } from '../../utils/math'


type Props = {
    label: string,
    value: string,
    unit: string,
    onChange: (number: string) => void,
    onValidate?: (valid: boolean) => void,
    min?: number,
    max?: number,
    vertical?: boolean
}

export default function SciNumberInput(props: Props) {

    const [value, setValue] = useState(appendUnit(props.value, props.unit))
    const [isValid, setIsValid] = useState(true)

    const onKeyDown = (event: React.KeyboardEvent) => {

        if (event.key == "ArrowUp") {
            add(1)
            return
        }
        if (event.key == "ArrowDown") {
            add(-1)
            return
        }

    }

    function onChange(e: React.ChangeEvent<InputEvent>) {
        
    }

    function appendUnit(value: string, unit: string) {
        if (value[value.length-1] != unit) {
            return value + unit
        }
        return value
    }

    function checkValid() {
        try {
            let tmpValue = appendUnit(props.value, props.unit)
            console.log(`checking valid ${tmpValue}`)
            let m = math.unit(tmpValue as string)
            console.log(m)
            if (m.value == null )
                throw(null)
            props.onChange(m.format(formatCfg))
            setIsValid(true)
            if (props.onValidate)
                props.onValidate(true)
        } catch {
            setIsValid(false)
            if (props.onValidate)
                props.onValidate(false)
        }
    }

    function add(n: number) {
        let m = math.unit(props.value)
        let mSplit = m.format(formatCfg).split(' ')
        let newVal = (parseFloat(mSplit[0]) + n)

        props.min != undefined && newVal < props.min && (newVal = props.min)
        props.max != undefined && newVal > props.max && (newVal = props.max)

        props.onChange(math.unit(newVal.toString() + ' ' + mSplit[1]).format(formatCfg))
    }

    return (
        <div className={""}>
            {!props.vertical && props.label !== "" && <label htmlFor="custom-input-number" className="relative w-full">
                {props.label}
            </label>}
            <input
                type={"text"}
                // className={" outline-none focus:outline-none text-center bg-neutral-600 font-semibold text-md hover:text-white focus:text-white md:text-basecursor-default text-neutral-400 outline-none " + (isValid ? '' : 'text-red-400 font-extrabold')}
                className={"text-center w-full px-1 rounded-md outline-none focus:outline-non bg-neutral-600 font-semibold text-md hover:text-white focus:text-white md:text-basecursor-default text-neutral-400 outline-none " + (isValid ? '' : 'text-red-900 bg-red-400 font-extrabold')}
                name=""
                value={props.value}
                onKeyDown={(e) => {onKeyDown(e)}}
                onBlur={checkValid}
                onChange={(e) => {
                    let v = e.target.value
                    props.onChange(v)
                }}
                // min={0}    
            >

            </input>
        </div>
    )
}