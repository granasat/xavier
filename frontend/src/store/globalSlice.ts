import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk } from './store';
import { MeasurementList } from '../utils/types'
import { fetchMeasurements as fetchMeasurementsFromAPI } from './api';
import { dispatch } from 'd3';

export interface GlobalState {
    measurements: MeasurementList
}

const initialState: GlobalState = {
    measurements: []
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,

  reducers: {
    setMeasurements: (state, action: PayloadAction<MeasurementList> ) => {
      state.measurements = action.payload
    }
  },
});

export const { setMeasurements } = globalSlice.actions;


export const selectMeasurements = (state: RootState) => state.global.measurements;
  
export const fetchMeasurements = createAsyncThunk<void, void, {state: RootState}>(
  'global/fetch-measurements',
  async (arg: void, thunkAPI) => {
    const measurements = await fetchMeasurementsFromAPI()
    console.log(measurements)
    thunkAPI.dispatch(setMeasurements(measurements))
  }
)

export default globalSlice.reducer;
