import React, { useEffect, useRef } from 'react'
import { graph, ImplementedGraphs } from './graph'
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
    timeScale: number,
    type: keyof ImplementedGraphs
}

function Graph(props: Props) {

    const svgRef = useRef<SVGSVGElement>(null)
    
    const createGraph = async () => {
        graph(svgRef, props.data, props.dimensions, props.type)
    }

    useEffect(() => {
        createGraph()
    }, [])

    createGraph()

    return (
        <div className="flex justify-center items-center">
            <svg ref={svgRef}/>
        </div>
    )
}

export default Graph