export type UseTiltOptions = {
    maxTilt?: number;   // градусов
    scale?: number;     // масштаб при ховере
    glare?: boolean;
    shadow?: boolean;
    spring?: boolean;   // пружинка при отпускании
}

export function useTilt(
    el: HTMLElement,
    opts: UseTiltOptions = {}
) {
    const {
        maxTilt = 10,
        scale = 1.03,
        glare = true,
        shadow = true,
        spring = true,
    } = opts

    let raf = 0

    function setStyle(rx: number, ry: number, k: number) {
        el.style.setProperty('--tilt-rx', `${rx}deg`)
        el.style.setProperty('--tilt-ry', `${ry}deg`)
        el.style.setProperty('--tilt-scale', `${1 + (scale - 1) * k}`)
        el.style.setProperty('--glare', glare ? String(k) : '0')
        if (shadow) {
            const d = Math.max(Math.abs(rx), Math.abs(ry))
            el.style.boxShadow = `0 10px ${30 + d * 1.2}px rgba(0,0,0,0.28)`
        }
    }

    function onEnter() {
        cancelAnimationFrame(raf)
    }

    function onMove(e: MouseEvent) {
        const rect = el.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const py = (e.clientY - rect.top) / rect.height
        const rx = (py - 0.5) * -2 * maxTilt
        const ry = (px - 0.5) *  2 * maxTilt
        const k  = 0.4 + 0.6 * Math.hypot(px - 0.5, py - 0.5) * 2 // ~от 0.4 до 1.0
        setStyle(rx, ry, Math.min(1, Math.max(0.4, k)))
    }

    function onLeave() {
        if (!spring) {
            setStyle(0, 0, 0)
            return
        }
        // простая пружинка
        const start = performance.now()
        const dur = 350
        const rx0 = parseFloat(getComputedStyle(el).getPropertyValue('--tilt-rx')) || 0
        const ry0 = parseFloat(getComputedStyle(el).getPropertyValue('--tilt-ry')) || 0
        const s0  = parseFloat(getComputedStyle(el).getPropertyValue('--tilt-scale')) || 1

        cancelAnimationFrame(raf)
        const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur)
            // easeOutBack
            const c1 = 1.70158; const c3 = c1 + 1
            const e = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
            setStyle(rx0 * (1 - e), ry0 * (1 - e), (s0 - 1) * (1 - e))
            if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
    }

    return { onEnter, onMove, onLeave }
}
