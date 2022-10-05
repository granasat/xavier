import * as d3 from 'd3'

import { Area, Svg, Dimensions, Movement } from "../types";
import defaults, { Parameters as DefaultParameters, Scaling, getScaling, getMarginY, getMarginX, getX, getY } from '../default'
import { VoltagePoint, VoltageWaveform } from '../../../routes/wgfmu/MeasurementsControls/types';

export interface VoltageGraphGenerators {
    voltage: any,
}

export interface VoltageGraphParameters {
    generators: VoltageGraphGenerators,
    timeScaling: Scaling,
    data: VoltageWaveform,
    dimensions: Dimensions,
    leftAxisLabel: string,
    bottomAxisLabel: string,

    xExtentTime: [number, number],
    yExtentVoltage: [number, number],

    xTime: d3.ScaleLinear<number, number, never>,
    yVoltage: d3.ScaleLinear<number, number, never>,

    xAxisTime: null | d3.Selection<SVGGElement, unknown, null, undefined>,
    yAxisVoltage: null | d3.Selection<SVGGElement, unknown, null, undefined>,
}

export function getParameters(data: VoltageWaveform, dimensions: Dimensions): VoltageGraphParameters {

    // console.log(data)
    let timeScaling = getScaling<VoltagePoint>(data, 's', (d) => d.time)

    let xExtentTime: [number, number] = [0, 0]
    let aux = d3.extent(data, d => d.time * timeScaling.scalingFactor)
    aux[0] != undefined && aux[1] != undefined && (xExtentTime = aux)

    let yExtentVoltage: [number, number] = [0, 0]
    aux = d3.extent(data, d => d.voltage)
    aux[0] != undefined && aux[1] != undefined && (yExtentVoltage = aux)

    const marginYVoltage = getMarginY(yExtentVoltage)
    const yVoltage = getY(yExtentVoltage, marginYVoltage, dimensions)

    const marginXTime = getMarginX(xExtentTime)
    const xTime = getX(xExtentTime, marginXTime, dimensions)

    let generators: VoltageGraphGenerators = {
        voltage: (
            d3.line<VoltagePoint>()
                .x(d => xTime(d.time * timeScaling.scalingFactor))
                .y(d => yVoltage(d.voltage))
        )
    }

    let leftAxisLabel = `Voltage (V)`
    let bottomAxisLabel = `Time (${timeScaling.scaleUnit})`

    return {
        generators,
        timeScaling,
        data,
        dimensions,
        leftAxisLabel,
        bottomAxisLabel,

        xExtentTime,
        yExtentVoltage,

        xTime,
        yVoltage,

        xAxisTime: null,
        yAxisVoltage: null
    }
}

export function appendPaths(area: Area, params: VoltageGraphParameters) {
    area.append("path")
        .datum(params.data)
        .attr("class", "voltage")  // I add the class myArea to be able to modify it later on.
        // .attr("fill", "#ffffff")
        .attr("fill-opacity", 0)
        .attr("stroke", "#03c2fc")
        .attr("stroke-width", 2)
        .attr("d", params.generators.voltage)
}

export function appendAxis(svg: Svg, params: VoltageGraphParameters) {
    let defaultParameters = { dimensions: params.dimensions } as DefaultParameters

    // Left axis ticks
    let leftAxisTicks = svg.append("g")
    Object.entries(defaults.leftAxisTicks).forEach(([key, value]) => {
        leftAxisTicks = leftAxisTicks.attr(key, value(defaultParameters))
    })
    leftAxisTicks.call(d3.axisLeft(params.yVoltage))
    leftAxisTicks.attr('font-size', (defaults.leftAxisTicks['font-size'])(defaultParameters))
    params.yAxisVoltage = leftAxisTicks

    // Left axis label
    let leftAxisLabel = svg.append("text")
    Object.entries(defaults.axisLabelLeft).forEach(([key, value]) => {
        leftAxisLabel = leftAxisLabel.attr(key, value(defaultParameters))

    })
    leftAxisLabel
        .style("text-anchor", "middle")
        .text(params.leftAxisLabel)

    // Bottom axis ticks
    let bottomAxisTicks = svg.append("g")
    Object.entries(defaults.bottomAxisTicks).forEach(([key, value]) => {
        bottomAxisTicks = bottomAxisTicks.attr(key, value(defaultParameters))
    })
    bottomAxisTicks.call(d3.axisBottom(params.xTime))
    bottomAxisTicks.attr('font-size', (defaults.bottomAxisTicks['font-size'])(defaultParameters))
    params.xAxisTime = bottomAxisTicks

    // Bottom axis label
    let bottomAxisLabel = svg.append("text")
    Object.entries(defaults.axisLabelBottom).forEach(([key, value]) => {
        bottomAxisLabel = bottomAxisLabel.attr(key, value(defaultParameters))

    })
    bottomAxisLabel
        .style("text-anchor", "middle")
        .text(params.bottomAxisLabel)
}

export function transformPathsMovement(area: Area, params: VoltageGraphParameters, movement: Movement, transition: boolean) {
    params.xAxisTime && params.xAxisTime.transition().duration(500).call(d3.axisBottom(params.xTime))
    console.log(transition)
    area.select(".voltage")
        .transition()
        .duration(transition ? 500 : 0)
        .attr("d", params.generators.voltage)
        .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)
}

export function zoom(area: Area, params: VoltageGraphParameters, movement: Movement, extent: [number, number]) {
    params.xTime.domain([
        params.xTime.invert(extent[0] - movement.x),
        params.xTime.invert(extent[1] - movement.x)
    ])
}

export function restoreDomain(area: Area, params: VoltageGraphParameters) {
    params.xTime.domain([
        params.xExtentTime[0],
        params.xExtentTime[1]
    ])
}