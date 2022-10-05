import math, { formatCfg } from '../../utils/math'
import { useState, useEffect, KeyboardEventHandler } from 'react'
import './Slider.css'
import { format, number } from 'mathjs'


type Props = {
    label: string,
    step: number,
    value: string,
    onChange: (value: string) => void,
    type?: {
        type: "sci",
        unit: string
    },
    min: number,
    max: number,
    format?: (value: string) => string
    onValidate?: (valid: boolean) => void,
}

export default function Slider(props: Props) {

    const [value, setValue] = useState(props.value)
    const [inputFocused, setInputFocused] = useState(false)
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

    function add(n: number) {
        if (props.type) {
            let m = math.unit(props.value)
            let mSplit = m.format(formatCfg).split(' ')
            let newVal = (parseFloat(mSplit[0]) + n)

            newVal < props.min && (newVal = props.min)
            newVal > props.max && (newVal = props.max)

            props.onChange(math.unit(newVal.toString() + ' ' + mSplit[1]).format(formatCfg))
        } else {
            let newVal = parseInt(props.value) + n
            props.min != undefined && newVal < props.min && (newVal = props.min)
            props.max != undefined && newVal > props.max && (newVal = props.max)
            props.onChange(newVal.toString())
        }
    }

    function appendUnit(value: string, unit: string) {
        if (value[value.length - 1] != unit) {
            return value + unit
        }
        return value
    }

    function checkValid(v?: string) {
        let value = v ?? props.value
        if (props.type) {
            try {
                let tmpValue = appendUnit(value, props.type.unit)
                let m = math.unit(tmpValue as string)
                // console.log(`value: ${m.value}`)
                if (m.value <= props.max && m.value >= props.min) {
                    v == undefined && props.onChange(m.format(formatCfg))
                    setIsValid(true)
                    props.onValidate != undefined && props.onValidate(true)
                    return true
                }
                // v == undefined && props.onChange(m.format(formatCfg))
                setIsValid(false)
                props.onValidate != undefined && props.onValidate(false)
                return false
            } catch {
                setIsValid(false)
                props.onValidate != undefined && props.onValidate(false)
                return false
            }
        }
    }

    return (
        <div className="relative pt-1 bg-transparent">
            <label htmlFor="customRange3" className="form-label">
                {props.label}
            </label>
            <div className='flex justify-between'>
                <input
                    type="range"
                    min={props.min}
                    max={props.max}
                    step={props.step}
                    value={
                        props.value && props.value.length > 0 ?
                            (
                                props.type == undefined ?
                                    props.value
                                    :
                                    (
                                        (() => {
                                            try {
                                                let v =
                                                    math.unit(props.value.slice(-1) == props.type.unit ?
                                                        props.value
                                                        :
                                                        props.value + props.type.unit
                                                    ).value
                                                return Math.max(props.min, Math.min(props.max, v))
                                            } catch {
                                                return "0"
                                            }
                                        })()
                                    )
                            )
                            :
                            0
                    }
                    onChange={(e) => {
                        if (props.type != undefined) {
                            let num = math.unit(e.target.value.toString() + props.type.unit).format(formatCfg)
                            props.onChange(num)
                            setValue(num)
                            setIsValid(true)
                            props.onValidate != undefined && props.onValidate(true)
                        } else {
                            let n = parseInt(e.target.value)
                            props.onChange(n.toString())
                            setValue(n.toString())
                        }
                    }}
                    className="w-8/12 range range-primary range-sm mt-1"
                />
                <div
                    className='ml-2 w-4/12 text-end'
                >
                    <input
                        type="text"
                        className="rounded outline-none focus:outline-none text-center w-full bg-transparent font-semibold text-md hover:text-white focus:text-white md:text-basecursor-default flex items-center text-neutral-400"
                        value={props.format && !inputFocused ? props.format(props.value ?? "") : (props.value ?? "")}
                        onKeyDown={(e) => onKeyDown(e)}
                        onBlur={(e) => {
                            setInputFocused(false)
                            if (props.type == undefined) {
                                if (parseInt(props.value) > props.max) {
                                    setValue(props.max.toString())
                                    props.onChange(props.max.toString())
                                    return
                                }
                                if (parseInt(props.value) < props.min) {
                                    setValue(props.min.toString())
                                    props.onChange(props.min.toString())
                                    return
                                }
                            } else {
                                checkValid()
                                let v = math.unit(props.value)
                                if (v.value > props.max) {
                                    let finalV = math.unit(props.max.toString() + props.type.unit).format(formatCfg)
                                    setValue(finalV)
                                    props.onChange(finalV)
                                    return
                                }
                                if (v.value < props.min) {
                                    let finalV = math.unit(props.min.toString() + props.type.unit).format(formatCfg)
                                    setValue(finalV)
                                    props.onChange(finalV)
                                    return
                                }
                            }
                        }}
                        onChange={(e) => {
                            e.target.value == "" && (e.target.value = "0")

                            if (props.type == undefined) {
                                e.target.value = e.target.value.replace(/[^0-9.]/g, '')
                                props.onChange(Math.max(
                                    Math.min(
                                        props.max,
                                        parseFloat(e.target.value)
                                    ),
                                    props.min
                                ).toString())
                                return
                            }

                            // let v = 0

                            // try {
                            //     let aux = parseFloat(e.target.value)
                            //     console.log(aux)
                            //     !isNaN(aux) && ((v = aux) || props.onChange(e.target.value))
                            //     return
                            // } catch { }


                            // try {
                            //     v = math.unit(e.target.value).value
                            //     props.onChange(e.target.value)
                            //     return
                            // } catch {}
                            let v = e.target.value.length > 1 ? e.target.value.replace(/^0+/, '') : e.target.value
                            if (v == "") {
                                v = "0"
                            }
                            if (v[0] == ".") {
                                v = "0"+v
                            }
                            // console.log(v)
                            props.onChange(v)
                            checkValid(v)
                            // console.log(checkValid(e.target.value))
                        }}
                        onFocus={() => setInputFocused(true)}
                    ></input>

                </div>
            </div>
        </div>
    )
}