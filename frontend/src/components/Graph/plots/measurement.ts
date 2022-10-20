import * as d3 from 'd3'

import { MeasurementData, MeasurementPoint } from "../../../utils/types";
import { Area, Svg, Dimensions, Movement } from "../types";
import defaults, { Parameters as DefaultParameters, Scaling, getScaling, getMarginY, getMarginX, getX, getY } from '../default'

export interface MeasurementGraphGenerators {
    voltage: any,
    current: any
}

export interface MeasurementGraphParameters {
    generators: MeasurementGraphGenerators,
    timeScaling: Scaling,
    currentScaling: Scaling,
    data: MeasurementData,
    dimensions: Dimensions,
    leftAxisLabel: string,
    rightAxisLabel: string,
    bottomAxisLabel: string,

    xExtentTime: [number, number],
    yExtentVoltage: [number, number],
    yExtentCurrent: [number, number],

    xTime: d3.ScaleLinear<number, number, never>,
    yVoltage: d3.ScaleLinear<number, number, never>,
    yCurrent: d3.ScaleLinear<number, number, never>,

    xAxisTime: null | d3.Selection<SVGGElement, unknown, null, undefined>,
    yAxisVoltage: null | d3.Selection<SVGGElement, unknown, null, undefined>,
    yAxisCurrent: null | d3.Selection<SVGGElement, unknown, null, undefined>
}

export function getParameters(data: MeasurementData, dimensions: Dimensions): MeasurementGraphParameters {

    let timeScaling = getScaling<MeasurementPoint>(data, 's', (d) => d.time)
    let currentScaling = getScaling<MeasurementPoint>(data, 'A', (d) => Math.abs(d.current))

    // console.log('currentScaling')
    // console.log(currentScaling)

    let xExtentTime: [number, number] = [0, 0]
    let aux = d3.extent(data, d => d.time * timeScaling.scalingFactor)
    aux[0] != undefined && aux[1] != undefined && (xExtentTime = aux)

    let yExtentVoltage: [number, number] = [0, 0]
    aux = d3.extent(data, d => d.voltage)
    aux[0] != undefined && aux[1] != undefined && (yExtentVoltage = aux)

    let yExtentCurrent: [number, number] = [0, 0]
    aux = d3.extent(data, d => d.current * currentScaling.scalingFactor)
    aux[0] != undefined && aux[1] != undefined && (yExtentCurrent = aux)

    const marginYVoltage = getMarginY(yExtentVoltage)
    const yVoltage = getY(yExtentVoltage, marginYVoltage, dimensions)

    const marginYCurrent = getMarginY(yExtentCurrent)
    const yCurrent = getY(yExtentCurrent, marginYCurrent, dimensions)

    const marginXTime = getMarginX(xExtentTime)
    const xTime = getX(xExtentTime, marginXTime, dimensions)

    let generators: MeasurementGraphGenerators = {
        voltage: (
            d3.line<MeasurementPoint>()
                .x(d => xTime(d.time * timeScaling.scalingFactor))
                .y(d => yVoltage(d.voltage))
        ),
        current: (
            d3.line<{ time: number, current: number }>()
                .x(d => xTime(d.time * timeScaling.scalingFactor))
                .y(d => yCurrent(d.current * currentScaling.scalingFactor))
        )
    }

    let leftAxisLabel = `Voltage (V)`
    let rightAxisLabel = `Current (${currentScaling.scaleUnit})`
    let bottomAxisLabel = `Time (${timeScaling.scaleUnit})`

    return {
        generators,
        timeScaling,
        currentScaling,
        data,
        dimensions,
        leftAxisLabel,
        rightAxisLabel,
        bottomAxisLabel,

        xExtentTime,
        yExtentCurrent,
        yExtentVoltage,

        xTime,
        yCurrent,
        yVoltage,

        xAxisTime: null,
        yAxisCurrent: null,
        yAxisVoltage: null
    }
}

export function appendPaths(area: Area, params: MeasurementGraphParameters) {
    area.append("path")
        .datum(params.data)
        .attr("class", "voltage")  // I add the class myArea to be able to modify it later on.
        // .attr("fill", "#ffffff")
        .attr("fill-opacity", 0)
        .attr("stroke", "#03c2fc")
        .attr("stroke-width", 2)
        .attr("d", params.generators.voltage)

    area.append("path")
        .datum(params.data)
        .attr("class", "current")  // I add the class myArea to be able to modify it later on.
        // .attr("fill", "#ffffff")
        .attr("fill-opacity", 0)
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", params.generators.current)

}

export function appendAxis(svg: Svg, params: MeasurementGraphParameters) {
    let defaultParameters = { dimensions: params.dimensions } as DefaultParameters


    // Right axis ticks
    let rightAxisTicks = svg.append("g")
    Object.entries(defaults.rightAxisTicks).forEach(([key, value]) => {
        rightAxisTicks = rightAxisTicks.attr(key, value(defaultParameters))
    })
    rightAxisTicks.call(d3.axisRight(params.yCurrent))
    rightAxisTicks.attr('font-size', (defaults.rightAxisTicks['font-size'])(defaultParameters))
    params.yAxisCurrent = rightAxisTicks

    // Right axis label
    let rightAxisLabel = svg.append("text")
    Object.entries(defaults.rightAxisLabel).forEach(([key, value]) => {
        rightAxisLabel = rightAxisLabel.attr(key, value(defaultParameters))

    })
    rightAxisLabel
        .style("text-anchor", "middle")
        .text(params.rightAxisLabel)

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

export function transformPathsMovement(area: Area, params: MeasurementGraphParameters, movement: Movement, transition: boolean) {
    params.xAxisTime && params.xAxisTime.transition().duration(200).call(d3.axisBottom(params.xTime))
    area
        .select('.voltage')
        .transition()
        .duration(transition ? 500 : 0)
        .attr("d", params.generators.voltage)
        .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)

    area
        .select('.current')
        .transition()
        .duration(transition ? 500 : 0)
        .attr("d", params.generators.current)
        .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)
}

export function zoom(area: Area, params: MeasurementGraphParameters, movement: Movement, extent: [number, number]) {
    params.xTime.domain([
        params.xTime.invert(extent[0]-movement.x),
        params.xTime.invert(extent[1]-movement.x)
    ])
}

export function restoreDomain(area: Area, params: MeasurementGraphParameters) {
    params.xTime.domain([
        params.xExtentTime[0],
        params.xExtentTime[1]
    ])
}

// export function createCursor(svg: Svg, params: MeasurementGraphParameters) {
//     let width = params.dimensions.width - params.dimensions.margin.right - params.dimensions.margin.left
//     let height = params.dimensions.height - params.dimensions.margin.top - params.dimensions.margin.bottom
    
//     svg
//         .append('rect')
//         .style("fill", "none")
//         .style("pointer-events", "all")
//         .attr('width', width)
//         .attr('height', height)
//         .on('mouseover', mouseOver)
//         .on('mousemove', mouseMove)
//         .on('mouseout', mouseOut)

//     let focus = svg
//         .append('g')
//         .append('circle')
//             .style("fill", "none")
//             .attr("stroke", "black")
//             .attr('r', 8.5)
//             .style("opacity", 0)

//     let focusText = svg
//         .append('g')
//         .append('text')
//             .style("opacity", 0)
//             .attr("text-anchor", "left")
//             .attr("alignment-baseline", "middle")

//     function mouseOver() {

//     }

//     function mouseMove(event) {
//         // recover coordinate we need
//         var x0 = params.xTime.invert(d3.mouse(svg)[0]);
//         var i = d3.bisect(params.data, x0, 1);
//         selectedData = params.data[i]
//         focus
//             .attr("cx", x(selectedData.x))
//             .attr("cy", y(selectedData.y))
//         focusText
//             .html("x:" + selectedData.x + "  -  " + "y:" + selectedData.y)
//             .attr("x", params.xTime(selectedData.x)+15)
//             .attr("y", params.yCurrent(selectedData.y))
//     }

//     function mouseOut() {

//     }
// }