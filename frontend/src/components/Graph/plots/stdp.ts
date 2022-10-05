import * as d3 from 'd3'
import { StdpWaveform, VoltagePoint, VoltageWaveform } from '../../../routes/wgfmu/MeasurementsControls/types'
import { Scaling, getScaling, getMarginY, getMarginX, getY, getX, Parameters as DefaultParameters } from '../default'
import { Area, Dimensions, Movement, Svg } from '../types'
import defaults from '../default'

export interface StdpGraphGenerators {
    voltage: any
}

export interface StdpGraphParameters {
    generators: StdpGraphGenerators,
    timeScaling: Scaling,
    data: StdpWaveform,
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

export function getParameters(data: StdpWaveform, dimensions: Dimensions): StdpGraphParameters {

    function getTimeSeries(data: VoltageWaveform): number[] {
        return data.map(d => d.time)
    }

    function getVoltageSeries(data: VoltageWaveform): number[] {
        return data.map(d => d.voltage)
    }

    let timeSeries = [...getTimeSeries(data.equivalent), ...getTimeSeries(data.waveformA), ...getTimeSeries(data.waveformB)]
    let voltageSeries = [...getVoltageSeries(data.equivalent), ...getVoltageSeries(data.waveformA), ...getVoltageSeries(data.waveformB)]

    let timeScaling = getScaling<number>(
        timeSeries,
        's',
        (d) => d
    )

    let xExtentTime: [number, number] = [0, 0]
    let aux = d3.extent(timeSeries, d => d * timeScaling.scalingFactor)
    aux[0] != undefined && aux[1] != undefined && (xExtentTime = aux)

    let yExtentVoltage: [number, number] = [0, 0]
    aux = d3.extent(voltageSeries, d => d)
    aux[0] != undefined && aux[1] != undefined && (yExtentVoltage = aux)

    const marginYVoltage = getMarginY(yExtentVoltage)
    const yVoltage = getY(yExtentVoltage, marginYVoltage, dimensions)

    const marginXTime = getMarginX(xExtentTime)
    const xTime = getX(xExtentTime, marginXTime, dimensions)

    let generators: StdpGraphGenerators = {
        voltage: (
            d3.line<VoltagePoint>()
                .x(d => xTime(d.time * timeScaling.scalingFactor))
                .y(d => yVoltage(d.voltage))
        )
    }

    let leftAxisLabel = `Voltage (V)`
    let bottomAxisLabel = `Time (${timeScaling.scaleUnit})`

    return {
        data,
        dimensions,
        generators,
        leftAxisLabel,
        bottomAxisLabel,
        timeScaling,

        xExtentTime,
        yExtentVoltage,

        xTime,
        yVoltage,

        xAxisTime: null,
        yAxisVoltage: null
    }

}

export function appendPaths(area: Area, params: StdpGraphParameters) {
    area.append("path")
        .datum(params.data.waveformA)
        .attr("class", "waveformA")  // I add the class myArea to be able to modify it later on.
        // .attr("fill", "#ffffff")
        .attr("fill-opacity", 0)
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("d", params.generators.voltage)

    // Add the waveformB from stdp
    area.append("path")
        .datum(params.data.waveformB)
        .attr("class", "waveformB")  // I add the class myArea to be able to modify it later on.
        // .attr("fill", "#ffffff")
        .attr("fill-opacity", 0)
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", params.generators.voltage)

    // Add the equivalentWaveform from stdp
    area.append("path")
        .datum(params.data.equivalent)
        .attr("class", "equivalent")  // I add the class myArea to be able to modify it later on.
        // .attr("fill", "#ffffff")
        .attr("fill-opacity", 0)
        .attr("stroke", "#03c2fc")
        .attr("stroke-width", 2)
        .attr("d", params.generators.voltage)
}

export function appendAxis(svg: Svg, params: StdpGraphParameters) {
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

export function transformPathsMovement(area: Area, params: StdpGraphParameters, movement: Movement, transition: boolean) {
    params.xAxisTime && params.xAxisTime.transition().duration(200).call(d3.axisBottom(params.xTime))

    for (let classname of ["waveformA", "waveformB", "equivalent"]) {
        area
            .select(`.${classname}`)
            .transition()
            .duration(transition ? 500 : 0)
            .attr("d", params.generators.voltage)
            .attr("transform", `translate(${movement.x}, ${movement.y}) scale(${movement.k})`)
    }    
}

export function zoom(area: Area, params: StdpGraphParameters, movement: Movement, extent: [number, number]) {
    params.xTime.domain([
        params.xTime.invert(extent[0]-movement.x),
        params.xTime.invert(extent[1]-movement.x)
    ])
}

export function restoreDomain(area: Area, params: StdpGraphParameters) {
    params.xTime.domain([
        params.xExtentTime[0],
        params.xExtentTime[1]
    ])
}