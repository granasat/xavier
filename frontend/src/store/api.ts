import { buildUrl } from "../utils"

const MEASUREMENT_ENDPOINT = buildUrl("measurements/")
const CALIBRATE_ENDPOINT = buildUrl("calibrate")

export async function fetchMeasurements() {
    const response = await fetch(MEASUREMENT_ENDPOINT, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    })

    return response.json()
}

export async function calibrate() {

    const response = await fetch(CALIBRATE_ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    })

    return response.json()
}