import * as d3 from 'd3'

import { MeasurementData, MeasurementPoint, StdpCollectionMeasurement } from "../../../utils/types";
import { Area, Svg, Dimensions, Movement } from "../types";
import defaults, { Parameters as DefaultParameters, Scaling, getScaling, getMarginY, getMarginX, getX, getY } from '../default'

export interface StdpCollectionMeasurementGraphGenerators {
    conductanceRatio: any
}

interface StdpPoint {
    delay: number,
    conductanceRatio: number
}

export interface StdpCollectionMeasurementGraphParameters {
    generators: StdpCollectionMeasurementGraphGenerators,
    delayScaling: Scaling,
    data: StdpPoint[],
    dimensions: Dimensions,
    leftAxisLabel: string,
    bottomAxisLabel: string,

    xExtentDelay: [number, number],
    yExtentConductanceRatio: [number, number],

    xDelay: d3.ScaleLinear<number, number, never>,
    yConductanceRatio: d3.ScaleLinear<number, number, never>,

    xAxisDelay: null | d3.Selection<SVGGElement, unknown, null, undefined>,
    yAxisConductanceRatio: null | d3.Selection<SVGGElement, unknown, null, undefined>,
}

export function getParameters(data: StdpCollectionMeasurement, dimensions: Dimensions): StdpCollectionMeasurementGraphParameters {

    let auxDataConductanceRatio = 
        data.collection.map(meas => (meas.stdpMeasurement.conductance - data.baseConductance) / data.baseConductance)

    let auxDataDelay = data.collection.map(w => w.delay)

    console.log({auxDataConductanceRatio})

    let finalData: StdpPoint[] = []
    auxDataConductanceRatio.forEach((r, i) => finalData.push({delay: auxDataDelay[i], conductanceRatio: r}))

    let delayScaling = getScaling<number>(auxDataDelay, 's', (d) => d)
    // let conductanceScaling = getScaling<number>(auxDataConductance, 'S', (d) => d)
    console.log({sfactor: delayScaling.scalingFactor})

    let xExtentDelay: [number, number] = [0, 0]
    let aux = d3.extent([...auxDataDelay.map(d => -d), ...auxDataDelay], d => d * delayScaling.scalingFactor)
    aux[0] != undefined && aux[1] != undefined && (xExtentDelay = aux)


    let yExtentConductanceRatio: [number, number] = [0, 0]
    aux = d3.extent([...auxDataConductanceRatio.map(c => -c), ...auxDataConductanceRatio], d => d)
    console.log({aux})
    aux[0] != undefined && aux[1] != undefined && (yExtentConductanceRatio = aux)
    if (Math.abs(yExtentConductanceRatio[0]) + Math.abs(yExtentConductanceRatio[1]) == 0) {
        yExtentConductanceRatio = [-1, 1]
    }

    const marginYConductanceRatio = getMarginY(yExtentConductanceRatio)
    const yConductanceRatio = getY(yExtentConductanceRatio, marginYConductanceRatio, dimensions)

    const marginXDelay = getMarginX(xExtentDelay)
    const xDelay = getX(xExtentDelay, marginXDelay, dimensions)

    let generators: StdpCollectionMeasurementGraphGenerators = {
        conductanceRatio: (
            d3.line<StdpPoint>()
                .x(d => xDelay(d.delay * delayScaling.scalingFactor))
                .y(d => yConductanceRatio(d.conductanceRatio))
        ),
    }

    let leftAxisLabel = `Conductance ratio`
    let bottomAxisLabel = `Delay (${delayScaling.scaleUnit})`

    return {
        generators,
        delayScaling: delayScaling,
        data: finalData,
        dimensions,
        leftAxisLabel,
        bottomAxisLabel,

        xExtentDelay,
        yExtentConductanceRatio,

        xDelay,
        yConductanceRatio,

        xAxisDelay: null,
        yAxisConductanceRatio: null
    }
}

export function appendPaths(area: Area, params: StdpCollectionMeasurementGraphParameters) {


    area
      .append("g")
      .attr("class", "conductance")
      .selectAll("dot")
      .data(params.data)
      .enter()
      .append("circle")
        .attr("cx", (d) => params.xDelay(d.delay * params.delayScaling.scalingFactor) )
        .attr("cy", d => params.yConductanceRatio(d.conductanceRatio))
        .attr("r", 6)
        .attr("fill", params.data.every(d => d.delay > 0) ? "#03c2fc" : "orange")

    area
        .append('path')
        .attr("class", "lineY")
        .attr('d', d3.line()([
            [params.xDelay(0), params.yConductanceRatio(params.yExtentConductanceRatio[0])],
            [params.xDelay(0), params.yConductanceRatio(params.yExtentConductanceRatio[1])]
        ]))
        .attr('stroke', 'white')
        // with multiple points defined, if you leave out fill:none,
        // the overlapping space defined by the points is filled with
        // the default value of 'black'
        .attr('fill', 'none'); 
    area
        .append('path')
        .attr("classs", "lineX")
        .attr('d', d3.line()([
            [params.xDelay(params.xExtentDelay[0]), params.yConductanceRatio(0)],
            [params.xDelay(params.xExtentDelay[1]), params.yConductanceRatio(0)]
        ]))
        .attr('stroke', 'white')
        // with multiple points defined, if you leave out fill:none,
        // the overlapping space defined by the points is filled with
        // the default value of 'black'
        .attr('fill', 'none');
}

export function appendAxis(svg: Svg, params: StdpCollectionMeasurementGraphParameters) {
    let defaultParameters = { dimensions: params.dimensions } as DefaultParameters

    // Left axis ticks
    let leftAxisTicks = svg.append("g")
    Object.entries(defaults.leftAxisTicks).forEach(([key, value]) => {
        leftAxisTicks = leftAxisTicks.attr(key, value(defaultParameters))
    })
    leftAxisTicks.call(d3.axisLeft(params.yConductanceRatio))
    leftAxisTicks.attr('font-size', (defaults.leftAxisTicks['font-size'])(defaultParameters))
    params.yAxisConductanceRatio = leftAxisTicks

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
    bottomAxisTicks.call(d3.axisBottom(params.xDelay))
    bottomAxisTicks.attr('font-size', (defaults.bottomAxisTicks['font-size'])(defaultParameters))
    params.xAxisDelay = bottomAxisTicks

    // Bottom axis label
    let bottomAxisLabel = svg.append("text")
    Object.entries(defaults.axisLabelBottom).forEach(([key, value]) => {
        bottomAxisLabel = bottomAxisLabel.attr(key, value(defaultParameters))
        params.xExtentDelay[0] + params.xExtentDelay[1]
    })
    bottomAxisLabel
        .style("text-anchor", "middle")
        .text(params.bottomAxisLabel)
}

export function transformPathsMovement(area: Area, params: StdpCollectionMeasurementGraphParameters, movement: Movement, transition: boolean) {

    movement.x = 0

    if (params.xAxisDelay){
        let x = (Math.abs(params.xExtentDelay[0]) + params.xExtentDelay[1]) / (params.dimensions.width) * movement.x
        !transition && params.xDelay.domain([
            params.xExtentDelay[0] - x,
            params.xExtentDelay[1]- x
        ])
        params.xAxisDelay.transition().duration(transition ? 200 : 0)
            .call(d3.axisBottom(params.xDelay))   
            // .attr("transform", `translate(${movement.x}, ${params.dimensions.height}) scale(${movement.k})`)

    }
    (["conductance", "lineX", "lineY"]).forEach((c) => {
        area
            .selectAll(`.${c}`)
            .transition()
            .duration(transition ? 500 : 0)
            // .attr("d", params.generators.conductanceRatio)
            .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)
    })
}

export function zoom(area: Area, params: StdpCollectionMeasurementGraphParameters, movement: Movement, extent: [number, number]) {
    params.xDelay.domain([
        params.xDelay.invert(extent[0]-movement.x),
        params.xDelay.invert(extent[1]-movement.x)
    ])
}

export function restoreDomain(area: Area, params: StdpCollectionMeasurementGraphParameters) {
    params.xDelay.domain([
        params.xExtentDelay[0],
        params.xExtentDelay[1]
    ])
}