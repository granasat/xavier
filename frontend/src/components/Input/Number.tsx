import React, { useState, useEffect, KeyboardEventHandler } from 'react'
import math, { formatCfg } from '../../utils/math'
import './Number.css'



type Props = {
    label: string,
    value: string,
    onChange: (number: string) => void,
    type?: {
        type: "sci",
        unit: string
    },
    onValidate: (valid: boolean) => void,
    min?: number,
    max?: number,
    vertical?: boolean
}

export default function Number(props: Props) {

    const [value, setValue] = useState(props.type ? appendUnit(props.value, props.type.unit) : props.value )
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
        if (props.type) {
            try {
                let tmpValue = appendUnit(props.value, props.type.unit)
                console.log(`checking valid ${tmpValue}`)
                let m = math.unit(tmpValue as string)
                console.log(m)
                props.onChange(m.format(formatCfg))
                setIsValid(true)
                props.onValidate(true)
            } catch {
                setIsValid(false)
                props.onValidate(false)
            }
        }
    }

    function add(n: number) {
        if (props.type) {
            let m = math.unit(props.value)
            let mSplit = m.format(formatCfg).split(' ')
            let newVal = (parseFloat(mSplit[0]) + n)

            props.min != undefined && newVal < props.min && (newVal = props.min)
            props.max != undefined && newVal > props.max && (newVal = props.max)

            props.onChange(math.unit(newVal.toString() + ' ' + mSplit[1]).format(formatCfg))
        } else {
            let newVal = parseInt(props.value) + n
            props.min != undefined && newVal < props.min && (newVal = props.min)
            props.max != undefined && newVal > props.max && (newVal = props.max)
            props.onChange(newVal.toString())
        }
    }

    return (
        <div className={"custom-number-input"}>
            {!props.vertical && <label htmlFor="custom-input-number" className="relative w-full">
                {props.label}
            </label>}
            <div className={"flex w-full rounded-lg relative bg-transparent mt-1 " + (props.vertical ? ' w-14 h-36 flex-col-reverse items-center' : 'flex-row h-9')}>
                <button data-action="decrement"
                        className={"hover:text-neutral-900 hover:bg-neutral-400 font-thin hover:font-normal bg-neutral-600  cursor-pointer outline-none " + (props.vertical ? " w-full rounded-b " : 'w-20 rounded-l h-full')}
                        onClick={() => add(-1)}

                >   
                    <span className="m-auto text-2xl">−</span>
                </button>
                <input
                    type={"text"}
                    className={"grow outline-none focus:outline-none text-center bg-neutral-600 font-semibold text-md hover:text-white focus:text-white md:text-basecursor-default flex items-center text-neutral-400 outline-none " + (isValid ? 'w-full' : 'text-red-900 bg-red-400 font-extrabold') + ' ' + (props.vertical ? ' h-full ' : ' w-full')}
                    name="custom-input-number"
                    value={props.value}
                    onKeyDown={(e) => onKeyDown(e)}
                    onBlur={checkValid}
                    onChange={(e) => {
                        let v = e.target.value
                        if (!props.type)
                            v = v.replace(/[^0-9.]/g, '')
                        props.onChange(v)
                    }}
                >

                </input>
                <button
                    className={"bg-neutral-600 hover:text-neutral-900 hover:bg-neutral-400 font-thin hover:font-normal cursor-pointer " + (props.vertical ? 'w-full rounded-t ' : 'h-full rounded-r w-20')}
                    onClick={() => add(1)}
                >
                    <span className="m-auto text-2xl">+</span>
                </button>
            </div>
        </div>
    )
}