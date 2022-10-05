import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

import Graph from './components/Graph'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <div>
        
        <Graph></Graph>
      </div>
    </div>
  )
}

export default App
