
const MEASUREMENT_ENDPOINT = "http://localhost:8000/api/measurements/"
const CALIBRATE_ENDPOINT = "http://localhost:8000/api/measurements/calibrate"

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