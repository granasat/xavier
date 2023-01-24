import { boolean } from "mathjs"
import { useState } from "react"
import { HiLockClosed, HiLockOpen } from "react-icons/hi"
import { Slider, Number } from "../../../../../components/Input"
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks"
import { EpscControls as EpscControlsInterface } from "../../types"
import {
  selectEpscParams,
  setEpscParamsField,
  setMultiPulseParamsField as setParamsField,
  updateState,
} from "./collectionControlsSlice"

type ValidateInterface = {
  [k in keyof EpscControlsInterface]: boolean
}

export default function EpscControls() {
  const dispatch = useAppDispatch()
  const params = useAppSelector(selectEpscParams)

  const [valid, setValid] = useState<ValidateInterface>({
    frequencies: true,
    interTrainsTime: true,
    spikeTime: true,
  }) // wether or not this settings are valid

  const [samplingPointsTied, setSamplingPointsTied] = useState(true)

  const onValidateCurry = (id: keyof EpscControlsInterface) => {
    return (isValid: boolean) => setValid({ ...valid, [id]: isValid })
  }

  return (
    <>
      <div className="py-4 w-full border-b border-solid border-neutral-600">
        <Number
          label="Inter trains time"
          onChange={(value) => {
            dispatch(setEpscParamsField({ val: value, key: "interTrainsTime" }))
          }}
          value={params.interTrainsTime}
          onValidate={onValidateCurry("interTrainsTime")}
          type={{
            type: "sci",
            unit: "s",
          }}
          min={0}
        />
      </div>
      <div className="py-4 w-full">
        <Number
          label="Spike time"
          onChange={(value) => {
            dispatch(setEpscParamsField({ val: value, key: "spikeTime" }))
          }}
          value={params.spikeTime}
          onValidate={onValidateCurry("spikeTime")}
          type={{
            type: "sci",
            unit: "s",
          }}
          min={0}
        />
      </div>
    </>
  )
}
