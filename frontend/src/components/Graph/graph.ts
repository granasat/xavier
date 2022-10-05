import { current } from '@reduxjs/toolkit'
import * as d3 from 'd3'
import { ScaleLinear, transition } from 'd3'
import math, { formatCfg } from '../../utils/math'

import { StdpWaveform, VoltageWaveform } from '../../routes/wgfmu/MeasurementsControls/types'
import { MeasurementData } from '../../utils/types'
import { Dimensions, Movement } from './types'
import React from 'react'
import StdpControls from '../../routes/wgfmu/MeasurementsControls/StdpControls'

import * as stdp from './plots/stdp'
import * as measurement from './plots/measurement'
import * as voltage from './plots/voltage'

type Data = StdpWaveform | VoltageWaveform | MeasurementData
type Parameters = measurement.MeasurementGraphParameters | stdp.StdpGraphParameters | voltage.VoltageGraphParameters

function isMeasurement(data: Data): boolean {
    return Array.isArray(data) && data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'current')
}

function isStdpWaveform(data: Data): boolean {
    return Object.prototype.hasOwnProperty.call(data, 'equivalent')
}

function isVoltageWaveform(data: Data): boolean {
    return !isStdpWaveform(data) && !isMeasurement(data)
}

export function graph(svgRef: React.RefObject<SVGSVGElement>, data: Data, dimensions: Dimensions) {
    if (dimensions === undefined) {
        return
    }
    const { margin, width, height } = dimensions

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();
    const svg = svgEl
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add a clipPath: everything out of this area won't be drawn.
    const clip = svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    // Create the area variable: where both the area and the brush take place
    const area = svg.append('g')
        .attr("clip-path", "url(#clip)")

    // Add brushing
    const brush = d3.brushX()               // Add the brush feature using the d3.brush function
        .extent([[0, 0], [width, height]])  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    let parameters: Parameters | null = null
    // Get parameters
    if (isMeasurement(data))
        parameters = measurement.getParameters(data as MeasurementData, dimensions)
    else if (isStdpWaveform(data))
        parameters = stdp.getParameters(data as StdpWaveform, dimensions)
    else if (isVoltageWaveform(data))
        parameters = voltage.getParameters(data as VoltageWaveform, dimensions)
    
    // Append axis
    if (isMeasurement(data) && parameters)
        measurement.appendAxis(svg, parameters as measurement.MeasurementGraphParameters)
    else if (isStdpWaveform(data) && parameters)
        stdp.appendAxis(svg, parameters as stdp.StdpGraphParameters)
    else if (isVoltageWaveform(data) && parameters)
        voltage.appendAxis(svg, parameters as voltage.VoltageGraphParameters)
    

    // TODO - Append paths
    if (isMeasurement(data) && parameters)
        measurement.appendPaths(area, parameters as measurement.MeasurementGraphParameters)
    else if (isStdpWaveform(data) && parameters)
        stdp.appendPaths(area, parameters as stdp.StdpGraphParameters)
    else if (isVoltageWaveform(data) && parameters)
        voltage.appendPaths(area, parameters as voltage.VoltageGraphParameters)


    // d3.select("svg").on("dblclick.zoom", null)

    // Add the brushing
    area
        .append("g")
        .attr("class", "brush")
        .call(brush);

    let zoomer = d3.zoom<SVGGElement, unknown>().scaleExtent([1, 1])
        .on("zoom", zoom)

    svg.call(zoomer)
        .on("mousedown.zoom", null)
        .on("wheel.zoom", null) // disables default zoom wheel behavior
        .on("wheel", pan)
        .on("dblclick.zoom", () => {console.log("double click!")})

    function pan(ev: any) {

        zoomer.translateBy(svg, ev.wheelDeltaY / 10, 0)
        
        if (isMeasurement(data) && parameters)
            measurement.transformPathsMovement(area, parameters as measurement.MeasurementGraphParameters, movement, false)
        else if (isStdpWaveform(data) && parameters)
            stdp.transformPathsMovement(area, parameters as stdp.StdpGraphParameters, movement, false)
        else if (isVoltageWaveform(data) && parameters)
            voltage.transformPathsMovement(area, parameters as voltage.VoltageGraphParameters, movement, false)

    }

    let movement: Movement = { k: 1, x: 0, y: 0 }

    function zoom(ev: any) {
        movement = ev.transform
    }

    // TODO - Fix this
    // A function that update the chart for given boundaries
    function updateChart(event: any) {

        // What are the selected boundaries?
        let extent = event.selection

        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!extent) {
            return
            // console.log(extent)
            // if (!idleTimeout) return idleTimeout = setTimeout(idled, 350) // This allows to wait a little bit
            // x.domain([4, 8])
        } else {
            console.log('hah')
            if (movement) {
                if (isMeasurement(data) && parameters)
                    measurement.zoom(area, parameters as measurement.MeasurementGraphParameters, movement, extent)
                else if (isStdpWaveform(data) && parameters)
                    stdp.zoom(area, parameters as stdp.StdpGraphParameters, movement, extent)
                else if (isVoltageWaveform(data) && parameters)
                    voltage.zoom(area, parameters as voltage.VoltageGraphParameters, movement, extent)

                movement.x = 0

            } else {

                if (isMeasurement(data) && parameters)
                    measurement.restoreDomain(area, parameters as measurement.MeasurementGraphParameters)
                else if (isStdpWaveform(data) && parameters)
                    stdp.restoreDomain(area, parameters as stdp.StdpGraphParameters)
                else if (isVoltageWaveform(data) && parameters)
                    voltage.restoreDomain(area, parameters as voltage.VoltageGraphParameters)
                // x.domain([x.invert(extent[0]), x.invert(extent[1])])
            }
            // area.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            area.select(".brush").remove()
        }

        // Update axis and area position
        if (isMeasurement(data) && parameters)
            measurement.transformPathsMovement(area, parameters as measurement.MeasurementGraphParameters, movement, true)
        else if (isStdpWaveform(data) && parameters)
            stdp.transformPathsMovement(area, parameters as stdp.StdpGraphParameters, movement, true)
        else if (isVoltageWaveform(data) && parameters)
            voltage.transformPathsMovement(area, parameters as voltage.VoltageGraphParameters, movement, true)
        
        area
            .append("g")
            .attr("class", "brush")
            .call(brush);
    }

    // TODO - Fix this
    // If user double click, reinitialize the chart
    svg.on("dblclick", function () {
        try {
            //  area.select(".brush").call(brush.move, null)
        } catch {}



        if (isMeasurement(data) && parameters)
            measurement.restoreDomain(area, parameters as measurement.MeasurementGraphParameters)
        else if (isStdpWaveform(data) && parameters)
            stdp.restoreDomain(area, parameters as stdp.StdpGraphParameters)
        else if (isVoltageWaveform(data) && parameters)
            voltage.restoreDomain(area, parameters as voltage.VoltageGraphParameters)

        zoomer.translateBy(svg.transition().duration(500), -movement.x, 0)

        movement = {k:1, x: 0, y:0}

        // Update axis and area position
        if (isMeasurement(data) && parameters)
            measurement.transformPathsMovement(area, parameters as measurement.MeasurementGraphParameters, movement, true)
        else if (isStdpWaveform(data) && parameters)
            stdp.transformPathsMovement(area, parameters as stdp.StdpGraphParameters, movement, true)
        else if (isVoltageWaveform(data) && parameters)
            voltage.transformPathsMovement(area, parameters as voltage.VoltageGraphParameters, movement, true)
        
    });
}

export default graph