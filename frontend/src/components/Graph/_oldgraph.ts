import { current } from '@reduxjs/toolkit'
import * as d3 from 'd3'
import { ScaleLinear } from 'd3'
import math, { formatCfg } from '../../utils/math'

import { StdpWaveform, VoltageWaveform } from '../../routes/wgfmu/MeasurementsControls/types'
import { MeasurementData } from '../../utils/types'
import { Dimensions } from './types'
import React from 'react'
import StdpControls from '../../routes/wgfmu/MeasurementsControls/StdpControls'

import * as stdp from './plots/stdp'

type Data = StdpWaveform | VoltageWaveform | MeasurementData

function isMeasurement(data: Data) {
    return Array.isArray(data) && data.some(d => Object.prototype.hasOwnProperty.call(data, 'current'))
}

function isStdpWaveform(data: Data) {
    return Object.prototype.hasOwnProperty.call(data, 'equivalent')
} 

export function graph(svgRef: React.RefObject<SVGSVGElement>, data: Data, dimensions: Dimensions) {
    if (dimensions === undefined) {
        return
    }
    const {margin, width, height} = dimensions

    let currentScale = 1
    let currentScaleUnit = 'A'
    
    if (Array.isArray(data) && isMeasurement(data)) {
        let maxCurrent = Math.max(...(data as MeasurementData).map(d => d.current ? Math.abs(d.current) : 0))
        console.log({maxCurrent})
        let maxCurrentUnit = math.unit(math.unit(maxCurrent.toString() + currentScaleUnit).format(formatCfg).toString())
        currentScaleUnit = maxCurrentUnit.toString().split(" ")[1]

        console.log({maxCurrentUnit})
        
        //@ts-expect-error
        let scaling = Math.ceil(1 / maxCurrentUnit.units[0].prefix.value)
        if (scaling < 1) {
            scaling = 1
        }
        currentScale = scaling
        console.log({currentScale})
    }

    let timeScale = 1
    let timeScaleUnit = 's'

    let maxTime = 0
    if (!isStdpWaveform(data))
        maxTime = Math.max(...(data as ({time: number}[])).map(d => d.time ? Math.abs(d.time) : 0))
    else
        maxTime = Math.max(...(data as StdpWaveform).map(d => d.equivalent.time ? Math.abs(d.equivalent.time) : 0))
    
    let maxTimeUnit = math.unit(math.unit(maxTime.toString() + timeScaleUnit).format(formatCfg).toString())
    timeScaleUnit = maxTimeUnit.toString().split(" ")[1]

    //@ts-expect-error
    let scaling = Math.ceil(1 / maxTimeUnit.units[0].prefix.value)
    if (scaling < 1) {
        scaling = 1
    }
    timeScale = scaling

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();
    const svg = svgEl
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add X axis
    let xExtent: [undefined, undefined] | [number, number] = [0, 0]
    if (!isStdpWaveform(data)) {
        xExtent = d3.extent(data as ({time: number}[]), d => d.time * timeScale)
    } else {
        let auxData = data as StdpWaveform
        xExtent = [
            Math.min(...auxData.equivalent.map(p => p.time * timeScale), ...auxData.waveformA.map(p => p.time * timeScale), ...auxData.waveformB.map(p => p.time * timeScale)),
            Math.max(...auxData.equivalent.map(p => p.time * timeScale), ...auxData.waveformA.map(p => p.time * timeScale), ...auxData.waveformB.map(p => p.time * timeScale))
        ]
    }

    (xExtent[0] == undefined || xExtent[1] == undefined) && (xExtent = [0, 0])

    let marginX = 0.02 * (xExtent[1] - xExtent[0])
    const x = d3.scaleLinear()
        .domain([xExtent[0]-marginX, xExtent[1]+marginX])
        .range([0, width]);
    let xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .attr("font-size", "1.5em")

    // Add Y axis for voltage
    let yExtentVoltage = [0, 0]
    if (!isStdpWaveform(data)) {
        let aux = d3.extent(data as {voltage: number}[], d => d.voltage)
        aux[0] != undefined && aux[1] != undefined && (yExtentVoltage = aux)
    } else {
        let aux = data as StdpWaveform
        yExtentVoltage = [
            Math.min(...aux.equivalent.map(p => p.voltage), ...aux.waveformA.map(p => p.voltage), ...aux.waveformB.map(p => p.voltage)),
            Math.max(...aux.equivalent.map(p => p.voltage), ...aux.waveformA.map(p => p.voltage), ...aux.waveformB.map(p => p.voltage))
        ]
    }
    let marginYVoltage = 0.05 * (yExtentVoltage[1] - yExtentVoltage[0])
    const yVoltage = d3.scaleLinear()
        .domain([yExtentVoltage[0]-marginYVoltage, yExtentVoltage[1]+marginYVoltage])
        .range([height, 0]);
    let yAxisVoltage = svg.append("g")
        .call(d3.axisLeft(yVoltage))
        .attr("font-size", "1.5em")

    // xAxis
    //     .attr("font-size", "1em")
    // yAxisVoltage
    //     .attr("font-size", "1em")
    // yAxisCurrent
    //     .attr("font-size", "1em")

    // Add Y axis for current
    let yAxisCurrent = null
    let yExtentCurrent = [0, 0]
    let yCurrent: null | ScaleLinear<number, number, never> = null 
    if (isMeasurement(data)) {

        let auxExtent = d3.extent(data as MeasurementData, d => d.current ? d.current * currentScale : 0)
        auxExtent[0] != undefined && auxExtent[1] != undefined && (yExtentCurrent = auxExtent)

        let marginYCurrent = 0.1 * (yExtentCurrent[1] - yExtentCurrent[0])
        yCurrent = d3.scaleLinear()
            .domain([yExtentCurrent[0]-marginYCurrent, yExtentCurrent[1]+marginYCurrent])
            .range([height, 0]);
        yAxisCurrent = svg.append("g")
            .attr("transform", `translate(${dimensions.width}, 0)`)
            .call(d3.axisRight(yCurrent))
            .attr("font-size", "1.5em")
    }

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left*0.8)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "2em")
        .text("Voltage (V)")


    svg.append("text")
        .attr("y", 0 + height + 30  )
        .attr("x", 0 + width / 2 )
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "2em")
        .text(`Time (${timeScaleUnit})`)


    const color = d3.scaleOrdinal()
        .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])

    // Add a clipPath: everything out of this area won't be drawn.
    const clip = svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    // Add brushing
    const brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent([[0, 0], [width, height]])  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the area variable: where both the area and the brush take place
    const area = svg.append('g')
        .attr("clip-path", "url(#clip)")

    let generators: any = {}

    // Create an area generator
    if (!isStdpWaveform(data)) {

        const areaGeneratorVoltage = d3.line<{time: number, voltage: number}>()
            .x(d => x(d.time * timeScale))
            .y(d => yVoltage(d.voltage))

        generators = {...generators, areaGeneratorVoltage}
        
        if (yCurrent  && isMeasurement(data)) {
            const areaGeneratorCurrent = d3.line<{time: number, current: number}>()
                .x(d => x(d.time * timeScale))
                .y(d => {
                    if (!yCurrent)
                        return 0
                    return yCurrent(d.current ? d.current * currentScale : 0)
                })
            generators = {...generators, areaGeneratorCurrent}
        }
    }
        // .y0(y(0))


    // Add the voltage
    if (generators.areaGeneratorVoltage != undefined)
        area.append("path")
            .datum(data)
            .attr("class", "voltage")  // I add the class myArea to be able to modify it later on.
            // .attr("fill", "#ffffff")
            .attr("fill-opacity", 0)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("d", generators.areaGeneratorVoltage)
    
    if (isStdpWaveform(data)) {
        stdp.appendPaths(area, generators, data as StdpWaveform)
    }

    if (generators.areaGeneratorCurrent) {
        area.append("path")
            .datum(data)
            .attr("class", "current")  // I add the class myArea to be able to modify it later on.
            // .attr("fill", "#ffffff")
            .attr("fill-opacity", 0)
            .attr("stroke", "#03c2fc")
            .attr("stroke-width", 2)
            .attr("d", generators.areaGeneratorCurrent)

        svg.append("text")
            .attr("transform", "rotate(90)")
            .attr("y", 0 - width - margin.left*0.8 )
            .attr("x", 0 + height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("fill", "#03c2fc")
            .attr("font-size", "2em")
            .text(`Current (${currentScaleUnit})`)
    }
    
    // Add the brushing
    area
        .append("g")
        .attr("class", "brush")
        .call(brush);

    // A function that set idleTimeOut to null
    let idleTimeout
    function idled() { idleTimeout = null; }

    let zoomer = d3.zoom<SVGGElement, unknown>().scaleExtent([1, 1 ]).on("zoom", zoom)

    svg.call(zoomer)
        .on("dblclick.zoom", null)
        .on("mousedown.zoom", null)
        .on("wheel.zoom", null) // disables default zoom wheel behavior
        .on("wheel", pan);

    function pan(ev: any) {
        zoomer.translateBy(svg, ev.wheelDeltaY/10, 0);
    }

    let movement = {k:1, x: 0, y:0}

    function zoom(ev: any) {
        movement = ev.transform
        // console.log(ev.transform)
        area
            .select('.voltage')
            .attr("transform", ev.transform)
        area
            .select('.current')
            .attr("transform", ev.transform)
        
    }

    // A function that update the chart for given boundaries
    function updateChart(event: any) {

        // What are the selected boundaries?
        let extent = event.selection

        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!extent) {
            return
            // console.log(extent)
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            x.domain([4, 8])


        } else {
            if (movement && xExtent[0] && xExtent[0]) {
                let xRange = xExtent[1] - xExtent[0]
                x.domain([x.invert(extent[0]-movement.x), x.invert(extent[1]-movement.x)])
                movement.x = 0
            } else {
                x.domain([x.invert(extent[0]), x.invert(extent[1])])
            }
            // area.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            area.select(".brush").remove()
        }

        // Update axis and area position
        xAxis.transition().duration(200).call(d3.axisBottom(x))
        area
            .select('.voltage')
            .transition()
            .duration(500)
            .attr("d", areaGeneratorVoltage)
            .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)

        area
            .select('.current')
            .transition()
            .duration(500)
            .attr("d", areaGeneratorCurrent     )
            .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)

        area
            .append("g")
            .attr("class", "brush")
            .call(brush);
    }

    // If user double click, reinitialize the chart
    svg.on("dblclick", function () {
        try {
            //  area.select(".brush").call(brush.move, null)
        } catch {}
        x.domain(d3.extent(data, d => d.time * timeScale))
        xAxis.transition().duration(1000).call(d3.axisBottom(x))
        
        zoomer.translateBy(svg.transition().duration(500), -movement.x, 0)
        
        movement = {k:1, x: 0, y:0}
        
        area
            .select('.voltage')
            .transition()
            .duration(500)
            .attr("d", areaGeneratorVoltage)
            // .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)

        area
            .select('.current')
            .transition()
            .duration(500)
            .attr("d", areaGeneratorCurrent)
            // .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)
    });
}

export default graph