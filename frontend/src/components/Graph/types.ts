export interface Dimensions {

    width: number,
    height: number,
    margin: {
        top: number,
        right: number,
        bottom: number,
        left: number
    }
}

export interface Movement {
    x: number,
    y: number,
    k: number
}

export type Area = d3.Selection<SVGGElement, unknown, null, undefined>
export type Svg = Area
