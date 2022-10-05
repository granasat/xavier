
const MEASUREMENT_ENDPOINT = "http://localhost:8000/api/measurements/"

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