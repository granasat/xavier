import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Route
} from 'react-router-dom'
import { Provider } from 'react-redux';
import { store } from './store/store';
import Root from './routes/root'
import Wgfmu from './routes/wgfmu/Wgfmu'
import { PulseControls, StdpControls} from './routes/wgfmu/MeasurementsControls'
import ErrorPage from './ErrorPage'
import './index.css'

import { fetchMeasurements } from './store/globalSlice'

store.dispatch(fetchMeasurements())

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root/>,
    errorElement: <ErrorPage/>,
    children: [
      {
        path: 'wgfmu',
        element: <Wgfmu/>,
      },
      {
        path: 'wgfmu2',
        element: <Wgfmu/>,
      }
    ]
  },
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  //   {/* <App /> */}
  // </React.StrictMode>
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
)
