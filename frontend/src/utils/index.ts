export function isMobile() {
    return window.screen.width < 640 // 640 is the default breakpoint for xs
}

export function clone(obj:any) {
    return JSON.parse(JSON.stringify(obj))
}

export default {}