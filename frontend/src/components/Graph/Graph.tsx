import React, { useEffect, useRef } from 'react'
import { graph } from './graph'
import PulseChart from './pulseGraph'
import { Dimensions } from '.'

const dimensions = {
    width: 460,
    height: 400,
    margin: { top: 10, right: 30, bottom: 30, left: 60 }
}

interface Props {
    data: any,
    dimensions: Dimensions,
    timeScale: number
}

function Graph(props: Props) {

    const svgRef = useRef<SVGSVGElement>(null)
    
    const createGraph = async () => {
        graph(svgRef, props.data, props.dimensions)
    }

    useEffect(() => {
        createGraph()
    }, [])

    createGraph()

    return (
        <div>
            <svg ref={svgRef}/>
        </div>
    )
}

export default Graph