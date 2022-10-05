import * as d3 from 'd3'

import { Dimensions } from "./types"
import math, { formatCfg } from '../../utils/math'

export interface Parameters {
    dimensions: Dimensions
}

export interface Scaling {
    scalingFactor: number,
    scaleUnit: string
}

// This functions returns a scaler number and a unit,
// for example given:
// data: [0.01, 0.001, 0.02]
// baseUnit: 's'
// getter: (d) => d
// It would return:
// {
//   scalingFactor: 1000
//   scaleUnit: 'ms'
//}
export function getScaling<T>(data: T[], baseUnit: string, getter: (d: T) => number): Scaling {
    if (data.length == 0) {
        return {
            scalingFactor: 1,
            scaleUnit: 's'
        }
    }

    let max = Math.max(...(data.map(getter)))

    let maxUnit = math.unit(math.unit(max.toString() + baseUnit).format(formatCfg).toString())
    let scaleUnit = maxUnit.toString().split(" ")[1]

    //@ts-expect-error
    let scalingFactor = Math.ceil(1 / maxUnit.units[0].prefix.value)
    if (scalingFactor < 1) {
        scalingFactor = 1
    }
    return {
        scalingFactor,
        scaleUnit
    }
}

export function getMargin(margin: number, extent: [number, number]) {
    return margin * (extent[1] - extent[0])
}

export function getMarginY(extent: [number, number]) {
    return getMargin(0.05, extent)
}

export function getMarginX(extent: [number, number]) {
    return getMargin(0.02, extent)
}

export function getX(extent: [number, number], margin: number, dimensions: Dimensions) {
    return d3.scaleLinear()
        .domain([extent[0] - margin, extent[1] + margin])
        .range([0, dimensions.width])
}

export function getY(extent: [number, number], margin: number, dimensions: Dimensions) {
    return d3.scaleLinear()
        .domain([extent[0] - margin, extent[1] + margin])
        .range([dimensions.height, 0])
}

export default {
    rightAxisLabel: {
        transform: ({ }: Parameters) => "rotate(90)",
        y: ({ dimensions }: Parameters) => 0 - dimensions.width - dimensions.margin.left * 0.8,
        x: ({ dimensions }: Parameters) => 0 + dimensions.height / 2,
        dy: ({ }: Parameters) => "1em",
        "fill": ({ }: Parameters) => "orange",
        "font-size": ({ }: Parameters) => "2em"
    },
    axisLabelLeft: {
        transform: ({ }: Parameters) => "rotate(-90)",
        y: ({ dimensions }: Parameters) => 0 - dimensions.margin.left * 0.8,
        x: ({ dimensions }: Parameters) => 0 + 0 - (dimensions.height / 2),
        dy: ({ }: Parameters) => "1em",
        "fill": ({}: Parameters) => "#03c2fc",
        "font-size": ({ }: Parameters) => "2em"
    },
    axisLabelBottom: {
        y: ({ dimensions }: Parameters) => 0 + dimensions.height + 30,
        x: ({ dimensions }: Parameters) => 0 + dimensions.width / 2,
        dy: ({ }: Parameters) => "1em",
        fill: ({ }: Parameters) => "white",
        "font-size": ({ }: Parameters) => "2em"
    },
    bottomAxisTicks: {
        transform: ({ dimensions }: Parameters) => `translate(0,${dimensions.height})`,
        "font-size": ({ dimensions }: Parameters) => "1em"
    },
    rightAxisTicks: {
        transform: ({dimensions}: Parameters) => `translate(${dimensions.width}, 0)`,
        "font-size": ({}: Parameters) => "1em",
    },
    leftAxisTicks: {
        "font-size": ({}: Parameters) => "1em",
    }
}