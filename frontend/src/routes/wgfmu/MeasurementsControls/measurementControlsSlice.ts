import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from '../../../store/store';
// import { fetchCount } from './counterApi';
import { VoltageWaveform, PulseControls, StdpControls, StdpWaveform, StdpCollectionControls } from './types'
import { pulseMeasurement, getMeasurement, stdpMeasurement, stdpCollectionMeasurement } from './api'
import { Measurement, MeasurementData, StdpMeasurement, MeasurementType } from '../../../utils/types';
import { fetchMeasurements } from '../../../store/globalSlice';
import math from '../../../utils/math'
import { e } from 'mathjs';

export interface WaveformState {
  waveform: {
    // scaling: {}
    points: VoltageWaveform | StdpWaveform
  },
  measurement: null | Measurement,

  pulse: {
    params: PulseControls,
    type: MeasurementType
  },

  // Stdp
  stdp: {
    params: StdpControls
    collectionParams: StdpCollectionControls
    measuredConductance: null | number,
    type: MeasurementType
  },

  controlsPage: 0 | 1,// Current controls page, STDP or PULSED

  avgTime: string,
  timeScale: number,
  previewWaveform: boolean
}

const initialState: WaveformState = {
  waveform: {
    points: []
  },
  measurement: null,
  // Pulse measurements
  pulse: {
    params: {
      vHigh: "1 V",
      vLow: "0 V",
      nPulses: "10",
      cycleTime: "10 us",
      dutyCycle: "50",
      nPointsHigh: "10",
      nPointsLow: "10",
      noise: false,
      noiseStd: "0 mV"
    },
    type: "Single"
  },
  // Stdp
  stdp: {
    params: {
      delay: "500 ns",
      amplitude: "3 V",
      pulseDuration: "2 us",
      waitTime: "1 us",
      stdpType: "Depression",
      nPoints: "400",
      noise: false,
      noiseStd: "0 mV"
    },
    collectionParams: {
      delayPoints: "5",
      amplitude: "3 V",
      pulseDuration: "2 us",
      stdpType: "Depression",
      waitTime: "1 us",
      nPoints: "400",
      noise: false,
      noiseStd: "0 mV"
    },
    measuredConductance: null,
    type: "Single"
  },

  controlsPage: 0,

  avgTime: "10 ns",
  timeScale: 1, // scale to apply on the x axis,
  previewWaveform: false // wether waveform preview is activated or not
};

export const waveformSlice = createSlice({
  name: 'waveform',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    // increment: (state) => {
    //   // Redux Toolkit allows us to write "mutating" logic in reducers. It
    //   // doesn't actually mutate the state because it uses the Immer library,
    //   // which detects changes to a "draft state" and produces a brand new
    //   // immutable state based off those changes
    //   state.value += 1;
    // },
    // Use the PayloadAction type to declare the contents of `action.payload`
    setPoints: (state, action: PayloadAction<VoltageWaveform | StdpWaveform>) => {
      state.waveform.points = action.payload;
    },
    setPulseParamsField: (state, action: PayloadAction<{ val: string | boolean, key: keyof PulseControls }>) => {

      if (action.payload.key == 'nPointsHigh' || action.payload.key == 'nPointsLow') {
        let totalPoints = parseInt(action.payload.val as string);
        if (action.payload.key == 'nPointsHigh')
          totalPoints = totalPoints + parseInt(state.pulse.params.nPointsLow)
        if (action.payload.key == 'nPointsLow')
          totalPoints = totalPoints + parseInt(state.pulse.params.nPointsHigh)
        if (math.unit(state.pulse.params.cycleTime).value / totalPoints < 10e-8) {

          let actualPoints = parseInt(state.pulse.params.nPointsHigh) + parseInt(state.pulse.params.nPointsLow)

          let maxP = Math.floor(math.unit(state.pulse.params.cycleTime).value / 10e-8)
          if (actualPoints != maxP) {
            state.pulse.params = {
              ...state.pulse.params,
              nPointsHigh: Math.floor(maxP / 2).toString(),
              nPointsLow: Math.floor(maxP / 2).toString()
            }
          }


          return
        }
      }

      state.pulse.params = {
        ...state.pulse.params,
        [action.payload.key]: action.payload.val
      }
    },

    setStdpParamsField: (
      state,
      action: PayloadAction<
      { val: StdpControls[keyof StdpControls] | StdpCollectionControls[keyof StdpCollectionControls],
        key: keyof StdpControls | keyof StdpCollectionControls }>) => {
      switch (state.stdp.type) {
        case "Single":
          state.stdp.params = {
            ...state.stdp.params,
            [action.payload.key]: action.payload.val
          }
          break
        // Collection
        default:
          state.stdp.collectionParams = {
            ...state.stdp.collectionParams,
            [action.payload.key]: action.payload.val
          }
      }
    },
    setStdpCollectionParamsField: (state, action: PayloadAction<{ val: string, key: keyof StdpCollectionControls }>) => {
      state.stdp.collectionParams = {
        ...state.stdp.collectionParams,
        [action.payload.key]: action.payload.val
      }
    },
    setAvgTime(state, action: PayloadAction<string>) {
      state.avgTime = action.payload
    },
    setMeasurement: (state, action: PayloadAction<Measurement>) => {
      state.measurement = action.payload;
    },
    emptyMeasurement: (state) => {
      state.measurement = null;
    },
    setTimeScale: (state, action: PayloadAction<number>) => {
      state.timeScale = action.payload
    },
    setStdpMeasuredConductance: (state, action: PayloadAction<null | number>) => {
      state.stdp.measuredConductance = action.payload;
    },
    setStdpType: (state, action: PayloadAction< MeasurementType >) => {
      state.stdp.type = action.payload;
    },
  },
  // The `extraReducers` field lets the slice handle actions defined elsewhere,
  // including actions generated by createAsyncThunk or in other slices.
  // extraReducers: (builder) => {
  //   builder
  //     .addCase(incrementAsync.pending, (state) => {
  //       state.status = 'loading';
  //     })
  //     .addCase(incrementAsync.fulfilled, (state, action) => {
  //       state.status = 'idle';
  //       state.value += action.payload;
  //     })
  //     .addCase(incrementAsync.rejected, (state) => {
  //       state.status = 'failed';
  //     });
  // },
});

export const {
  setPoints,
  setPulseParamsField,
  setStdpParamsField,
  setStdpCollectionParamsField,
  setStdpMeasuredConductance,
  setStdpType,
  setAvgTime,
  setMeasurement,
  emptyMeasurement,
  setTimeScale
} = waveformSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectWaveform = (state: RootState) => state.waveform.waveform.points;
export const selectPulseParams = (state: RootState) => state.waveform.pulse.params;
export const selectStdpParams = (state: RootState) => state.waveform.stdp.params;
export const selectStdpCollectionParams = (state: RootState) => state.waveform.stdp.collectionParams;
export const selectStdpMeasuredConductance = (state: RootState) => state.waveform.stdp.measuredConductance;
export const selectStdpType = (state: RootState) => state.waveform.stdp.type;
export const selectAvgTime = (state: RootState) => state.waveform.avgTime;
export const selectMeasurement = (state: RootState) => state.waveform.measurement;
export const selectTimeScale = (state: RootState) => state.waveform.timeScale;
export const selectControlsPage = (state: RootState) => state.waveform.controlsPage;

const DATA_LIMIT = 1_000_000

export const fetchMeasurement = createAsyncThunk<void, number, { state: RootState }>(
  'wgfmu/get-measurement',
  async (id: number, thunkAPI) => {
    const response = (await getMeasurement(id)) as Measurement
    if (response.status != "InProgress") {

      let measurement: Measurement

      // Check for array for retrocompatibility
      if (response.category === "Stdp" && !Array.isArray(response.data) && response.data) {
        let data = response.data as StdpMeasurement
        measurement = {
          ...response,
          data: {
            conductance: data.conductance,
            iv: data.iv.length > DATA_LIMIT ? data.iv.slice(0, DATA_LIMIT) : data.iv
          } as StdpMeasurement
        } as Measurement

      } else {
        let data = (response.data ?? []) as MeasurementData
        measurement = {
          ...response,
          data: data.length > DATA_LIMIT ? data.slice(0, DATA_LIMIT) : data
        } as Measurement
      }

      thunkAPI.dispatch(setMeasurement(measurement))
    }
  }
)

export const waitForMeasurement = createAsyncThunk<void, number, { state: RootState }>(
  'wgfmu/wait-measurement',
  async (id: number, thunkAPI) => {
    setTimeout(async () => {
      try {
        await thunkAPI.dispatch(fetchMeasurement(id))
        let state = thunkAPI.getState()
        if (state.waveform.measurement && state.waveform.measurement.id == id && (state.waveform.measurement.status == "Done" || state.waveform.measurement.status == "Error")) {
          thunkAPI.dispatch(fetchMeasurements())
        } else {
          thunkAPI.dispatch(waitForMeasurement(id))
        }
      } catch { }
    }, 500)
  }
)

export const measurePulse = createAsyncThunk<void, void, { state: RootState }>(
  'wgfmu/measure-pulse',
  async (arg: void, thunkAPI) => {


    const pulseParams = selectPulseParams(thunkAPI.getState())
    const avgTime = selectAvgTime(thunkAPI.getState())

    const response = await pulseMeasurement(pulseParams, avgTime);


    const id = response.id;

    if (id == undefined) {
      return
    }

    thunkAPI.dispatch(emptyMeasurement())

    thunkAPI.dispatch(waitForMeasurement(id))

    console.log(response)
  }
)

export const measureStdp = createAsyncThunk<void, void, { state: RootState }>(
  'wgfmu/measure-stdp',
  async (arg: void, thunkAPI) => {

    const type = selectStdpType(thunkAPI.getState())

    const avgTime = selectAvgTime(thunkAPI.getState())

    let getResponse: () => any
    switch (type) {
      case "Single":
        getResponse = async () => {
          const params = selectStdpParams(thunkAPI.getState())
          return await stdpMeasurement(params, avgTime);
        }
        break
      // Collection
      default:
        getResponse = async () => {
          const params = selectStdpCollectionParams(thunkAPI.getState())
          return await stdpCollectionMeasurement(params, avgTime);
        }
    }

    let response = await getResponse()


    const id = response.id;

    if (id == undefined) {
      return
    }

    thunkAPI.dispatch(emptyMeasurement())

    thunkAPI.dispatch(waitForMeasurement(id))

    console.log(response)
  }
)


export default waveformSlice.reducer;
