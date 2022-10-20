import { create, all } from 'mathjs';

const mathjs = create(all);

export const formatCfg = {
    precision: 5
}

export function getValueFromUnit(unitNumber: string) {
    return mathjs.unit(unitNumber).value
}

// mathjs.config({ number: 'BigNumber' });

export default mathjs