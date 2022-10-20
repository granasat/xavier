import { current } from '@reduxjs/toolkit'
import * as d3 from 'd3'
import { ScaleLinear, transition } from 'd3'
import math, { formatCfg } from '../../utils/math'

import { StdpWaveform, VoltageWaveform } from '../../routes/wgfmu/MeasurementsControls/types'
import { MeasurementData } from '../../utils/types'
import { Area, Dimensions, Movement, Svg } from './types'
import React from 'react'

import * as stdp from './plots/stdp'
import * as stdpCollection from './plots/stdpCollection'
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

export type Graph = {
    "getParameters": (data: any, dimensions: Dimensions) => any
    "appendAxis": (area: Area, params: any) => void,
    "appendPaths": (svg: Svg, params: any) => void,
    "transformPathsMovement": (area: Area, params: any, movement: Movement, transition: boolean) => void,
    "zoom": (area: Area, params: any, movement: Movement, extent: [number, number]) => void,
    "restoreDomain": (area: Area, params: any) => void,
}

export type ImplementedGraphs = {
    "stdp": Graph,
    "stdpCollection": Graph,
    "ivMeasurement": Graph,
    "voltage": Graph,
}

export const IMPLEMENTED_GRAPHS: ImplementedGraphs = {
    "stdp": stdp,
    "stdpCollection": stdpCollection,
    "ivMeasurement": measurement,
    "voltage": voltage
}

export function graph(svgRef: React.RefObject<SVGSVGElement>, data: Data, dimensions: Dimensions, type: keyof ImplementedGraphs) {
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
    parameters = IMPLEMENTED_GRAPHS[type].getParameters(data, dimensions)

    // Append axis
    IMPLEMENTED_GRAPHS[type].appendAxis(svg, parameters)

    // TODO - Append paths
    IMPLEMENTED_GRAPHS[type].appendPaths(area, parameters)

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
        .on("dblclick.zoom", () => {})


    function pan(ev: any) {
        zoomer.translateBy(svg, ev.wheelDeltaY / 10, 0)
        IMPLEMENTED_GRAPHS[type].transformPathsMovement(area, parameters, movement, false)
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
            if (movement) {
                IMPLEMENTED_GRAPHS[type].zoom(area, parameters, movement, extent)
                movement.x = 0

            } else {
                IMPLEMENTED_GRAPHS[type].restoreDomain(area, parameters)
            }

            area.select(".brush").remove()
        }

        // Update axis and area position
        IMPLEMENTED_GRAPHS[type].transformPathsMovement(area, parameters, movement, true)

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


        IMPLEMENTED_GRAPHS[type].restoreDomain(area, parameters)

        zoomer.translateBy(svg.transition().duration(500), -movement.x, 0)

        movement = {k:1, x: 0, y:0}

        // Update axis and area position
        IMPLEMENTED_GRAPHS[type].transformPathsMovement(area, parameters, movement, true)

    });
}

export default graph