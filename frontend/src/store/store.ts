import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import waveformReducer from '../routes/wgfmu/MeasurementsControls/measurementControlsSlice';
import { loadState, saveState } from '../utils/localstorage';
import globalReducer from './globalSlice';

export const store = configureStore({
  reducer: {
    global: globalReducer,
    waveform: waveformReducer
  },
  preloadedState: loadState()
});

store.subscribe(() => {
  saveState(store.getState());
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
