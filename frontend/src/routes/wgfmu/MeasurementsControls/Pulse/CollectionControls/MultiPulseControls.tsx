import { boolean } from "mathjs"
import { useState } from "react"
import { HiLockClosed, HiLockOpen } from "react-icons/hi"
import { Slider, Number } from "../../../../../components/Input"
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks"
import { MultiPulseControls as MultiPulseControlsInterface } from "../../types"
import {
  selectMultiPulseParams,
  setMultiPulseParamsField as setParamsField,
  updateState,
} from "./collectionControlsSlice"

type ValidateInterface = {
  [k in keyof MultiPulseControlsInterface]: boolean
}

export default function MultiPulseControls() {
  const dispatch = useAppDispatch()
  const params = useAppSelector(selectMultiPulseParams)

  const [valid, setValid] = useState<ValidateInterface>({
    cycleTime: true,
    dutyCycle: true,
    firstCycleType: true,
    nPointsHigh: true,
    nPointsLow: true,
    nPulses: true,
    nReps: true,
    resetDutyCycle: true,
    resetVoltages: true,
    setDutyCycle: true,
    setVoltages: true,
  }) // wether or not this settings are valid

  const [samplingPointsTied, setSamplingPointsTied] = useState(true)

  const onValidateCurry = (id: keyof MultiPulseControlsInterface) => {
    return (isValid: boolean) => setValid({ ...valid, [id]: isValid })
  }

  return (
    <>
      <div className="py-4 w-full border-b border-solid border-neutral-600">
        <Number
          label="Number of repetitions"
          onChange={(value) => {
            dispatch(setParamsField({ val: value, key: "nReps" }))
          }}
          value={params.nReps}
          onValidate={onValidateCurry("nReps")}
        />
      </div>
      <div className="py-4 w-full">
        <Number
          label="Cycle time"
          onChange={(value) => {
            dispatch(setParamsField({ val: value, key: "cycleTime" }))
          }}
          value={params.cycleTime}
          onValidate={onValidateCurry("cycleTime")}
          type={{
            type: "sci",
            unit: "s",
          }}
          min={0}
        />
      </div>
      <div className="pb-4 w-full border-b border-solid border-neutral-600">
        <Slider
          label="Duty cycle"
          onChange={(value) => {
            dispatch(
              setParamsField({
                val: value,
                key: "dutyCycle",
              })
            )
          }}
          step={10}
          min={0}
          max={100}
          value={params.dutyCycle}
          format={(dc: string) => dc + "%"}
        />
      </div>
      <div className="flex flex-col w-full py-4 border-b border-solid border-neutral-600">
        <div className="mb-2">Number of sampling points</div>
        <div className="flex w-full justify-around">
          <div className="flex flex-col justify-center items-center">
            <Number
              label="Sampling points high"
              onChange={(value) => {
                dispatch(setParamsField({ val: value, key: "nPointsHigh" }))
                samplingPointsTied &&
                  dispatch(setParamsField({ val: value, key: "nPointsLow" }))
              }}
              value={params.nPointsHigh}
              onValidate={onValidateCurry("nPointsHigh")}
              vertical={true}
              min={1}
            />
            <div className="font-bold mt-2">High</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <button
              className="rounded-full p-2 transition-all duration-200 ease-in-out hover:bg-neutral-500"
              onClick={() => {
                if (samplingPointsTied) {
                  setSamplingPointsTied(false)
                  return
                }

                samplingPointsTied &&
                  dispatch(
                    setParamsField({
                      val: params.nPointsHigh,
                      key: "nPointsLow",
                    })
                  )
                setSamplingPointsTied(true)
              }}
            >
              {samplingPointsTied ? (
                <HiLockClosed size={20}></HiLockClosed>
              ) : (
                <HiLockOpen size={20}></HiLockOpen>
              )}
            </button>
            {/* This is just to set everything nicely */}
            <div className="font-bold text-transparent">High</div>
          </div>
          <div className=" flex flex-col justify-center items-center">
            <Number
              label="Sampling points low"
              onChange={(value) => {
                dispatch(setParamsField({ val: value, key: "nPointsLow" }))
                samplingPointsTied &&
                  dispatch(setParamsField({ val: value, key: "nPointsHigh" }))
              }}
              value={params.nPointsLow}
              onValidate={onValidateCurry("nPointsLow")}
              vertical={true}
              min={1}
            />
            <div className="font-bold mt-2">Low</div>
          </div>
        </div>
      </div>
    </>
  )
}
