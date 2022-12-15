import { create, all } from 'mathjs';

const mathjs = create(all);

export const formatCfg = {
    precision: 5
}

export function getValueFromUnit(unitNumber: string) {
    return mathjs.unit(unitNumber).value
}

export function randn(sigma: number, mean: number, nPoints: number) {
    let randomVector1 = [...Array(nPoints)].map(p => Math.random())
    let randomVector2 = [...Array(nPoints)].map(p => Math.random())

    let outV = [...Array(nPoints)]

    // Math.random is uniformly distributed, so Box-Muller transform is needed
    // Box-Muller transform. https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
    outV = outV.map( (p, idx) => {
        let mag = sigma * Math.sqrt(-2.0 * Math.log(randomVector1[idx]))
        let normalRandomValue = mag * Math.cos( 2*Math.PI * randomVector2[idx] ) +  mean
        return normalRandomValue
    })

    return outV
}

// mathjs.config({ number: 'BigNumber' });

export default mathjs