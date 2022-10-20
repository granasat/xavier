import * as d3 from 'd3'
import { string } from 'mathjs'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { setStdpParamsField } from '../routes/wgfmu/MeasurementsControls/measurementControlsSlice'
import { Dimensions } from './Graph'
import { getScaling } from './Graph/default'

export interface Props {
    label?: string
    unit?: string
    points: number[]
    min: number
    max: number
}


export default function MultiSlider(props: Props) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [dimensions, setDimensions] = useState({
        width: 10,
        height: 40,
        margin: {
            top: 0,
            bottom: 40,
            left: 15,
            right: 20
        }
    } as Dimensions)
    const containerRef = useCallback((node: HTMLDivElement) => {
        if (!node) {return}
            
        setDimensions({...dimensions, width: node.clientWidth })
        console.log('a ', node.clientWidth * 0.8)
    }, [])



    useEffect(() => {
        createSlider(svgRef, props, dimensions)
        console.log('b ', dimensions.width)
        //a b c
    }, [dimensions, props])

    return (
        <div className='flex justify-center items-center w-full h-18'>
            <div className='w-11/12 h-18' ref={containerRef}>
                <svg
                    ref={svgRef}
                />
            </div>
        </div>
    )
}

function createSlider(svgRef: React.RefObject<SVGSVGElement>, props: Props, dimensions: Dimensions) {
    const { margin, width, height } = dimensions

    if (!svgRef.current)
        return
    
    const svgEl = d3.select(svgRef.current);
    
    svgEl.selectAll("*").remove();


    const svg = svgEl
        // .attr("width", width + margin.left + margin.right)
        // .attr("height", height)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    let scaling = getScaling([props.min, props.max], props.unit ? props.unit : "s", (d) => d)

    console.log(scaling)

    let extent = [props.min * scaling.scalingFactor, props.max * scaling.scalingFactor]

    let x = d3.scaleLinear()
        .domain([extent[0], extent[1]])
        .range([0, dimensions.width])

    let y = d3.scaleLinear()
        .domain([0, dimensions.height])
        .range([dimensions.height, 0])

    // Bottom axis ticks
    let bottomAxisTicks = svg.append("g")
        .attr("transform", `translate(${0},${dimensions.height/2})`)
    bottomAxisTicks
        .call(d3.axisBottom(x).ticks(4))
        .attr("font-size", "1.1em")

    if (props.label !== undefined) {
        let bottomAxisLabel = svg.append("text")
            .attr("y", dimensions.height)
            .attr("x", 0 + dimensions.width / 2)
            .attr("dy", "1.3em")
            .attr("fill", "white")

        bottomAxisLabel
            .style("text-anchor", "middle")
            .text(props.unit ? (`${props.label} (${scaling.scaleUnit})`) : props.label)
            .attr("transform", `translate(${0},${0})`)
            .attr("font-size", "1.5em")
    }

    svg.append('g')
        .selectAll("dot")
        .data(props.points)
        .enter()
        .append("circle")
          .attr("cx", function (d) { return x(d * scaling.scalingFactor); } )
          .attr("cy", function (d) { return y(dimensions.height/2); } )
          .attr("r", 5)
          .attr("transform", `translate(${0},${0})`)
          .style("fill", "white")

}