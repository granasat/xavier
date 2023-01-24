import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Root } from "react-dom/client"
import { RootState } from "../../../../../store/store"
import { PulseCollectionControls, MultiPulseControls, EpscControls } from "../../types"

export const initialState: PulseCollectionControls = {
  epscControls: {
    frequencies: ["20", "50", "100"],
    interTrainsTime: "1 ms",
    spikeTime: "100 us",
  },
  multipulseControls: {
    firstCycleType: "Potenciation",
    nPulses: ["50", "50", "50"],
    nReps: "3",
    resetDutyCycle: ["0.5", "0.5", "0.5"],
    setDutyCycle: ["0.5", "0.5", "0.5"],
    resetVoltages: ["-1", "-1", "-1"],
    setVoltages: ["1", "1", "1"],
    cycleTime: "10 us",
    dutyCycle: "50",
    nPointsHigh: "10",
    nPointsLow: "10",
  },
  ppfControls: {
    spikeVoltage: "0.95 V",
    spikeTime: "1 ms",
    startInterSpikeTime: "0.05 ms",
    stopInterSpikeTime: "1 ms",
    nMeas: "5",
  },
  collectionType: "MultiPulse",
  pulseTrainCollection: [],
  nPointsHigh: "100",
  nPointsLow: "100",
  noise: false,
  noiseStd: "0.0",
}

export const collectionControlsSlice = createSlice({
  name: "pulseCollectionControls",
  initialState,
  reducers: {
    setMultiPulseParamsField: (
      state,
      action: PayloadAction<{
        val: MultiPulseControls[keyof MultiPulseControls]
        key: keyof MultiPulseControls
      }>
    ) => {
      state.multipulseControls = {
        ...state.multipulseControls,
        [action.payload.key]: action.payload.val,
      }
      // return state
    },
    setEpscParamsField: (
      state,
      action: PayloadAction<{
        val: EpscControls[keyof EpscControls],
        key: keyof EpscControls
      }>
    ) => {
      state.epscControls = {
        ...state.epscControls,
        [action.payload.key]: action.payload.val
      }
    },
    setParamsField: (
      state,
      action: PayloadAction<{
        val: PulseCollectionControls[keyof PulseCollectionControls]
        key: keyof PulseCollectionControls
      }>
    ) => {
      // console.log('maldita sea')
      state = {
        ...state,
        [action.payload.key]: action.payload.val,
      }
      return state
    },
    updateState: (state) => {
      return state
    },
  },
})

export const selectParams = (state: RootState) =>
  state.waveform.pulse.collectionParams
export const selectControlsType = (state: RootState) =>
  state.waveform.pulse.collectionParams.collectionType
export const selectMultiPulseParams = (state: RootState) =>
  state.waveform.pulse.collectionParams.multipulseControls
export const selectEpscParams = (state: RootState) =>
  state.waveform.pulse.collectionParams.epscControls

export const { setMultiPulseParamsField, setEpscParamsField, setParamsField, updateState } =
  collectionControlsSlice.actions

export default collectionControlsSlice.reducer
