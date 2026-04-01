// src/Pages/Home/Composables/useMagnet.ts
import { gsap } from '@/Lib/gsapClient'

type Opts = {
    radius?: number
    strength?: number
    ease?: number
    maxRotateDeg?: number
    scale?: number
    onlyHover?: boolean
}

export function useMagnet(el: HTMLElement, opts: Opts = {}) {
    const {
        radius = 180,
        strength = 0.35,
        ease = 0.16,
        maxRotateDeg = 10,
        scale = 1,
        onlyHover = false,
    } = opts

    gsap.set(el, {
        x: 0, y: 0, rotation: 0,
        transformOrigin: '50% 50%',
        force3D: true,
        // чуть-чуть форсируем отдельный слой
        z: 0.01,
        willChange: 'transform',
    })

    const setX = gsap.quickTo(el, 'x',        { duration: ease, ease: 'power3.out', overwrite: 'auto' })
    const setY = gsap.quickTo(el, 'y',        { duration: ease, ease: 'power3.out', overwrite: 'auto' })
    const setR = gsap.quickTo(el, 'rotation', { duration: ease, ease: 'power3.out', overwrite: 'auto' })

    let hover = !onlyHover // если onlyHover=false — активен всегда
    let listening = false
    let rect: DOMRect | null = null
    let cx = 0, cy = 0
    let mx = 0, my = 0
    let ticking = false
    let ro: ResizeObserver | null = null

    let inside = false
    let scalingTween: gsap.core.Tween | null = null
    const radius2 = radius * radius

    const measure = () => {
        rect = el.getBoundingClientRect()
        cx = rect.left + rect.width  * 0.5
        cy = rect.top  + rect.height * 0.5
    }

    const setScaleTo = (val: number) => {
        if (scale === 1) return
        scalingTween?.kill()
        scalingTween = gsap.to(el, { scale: val, duration: ease, ease: 'power3.out', overwrite: 'auto' })
    }

    const tick = () => {
        ticking = false
        if (!rect) return

        if (!hover) {
            setX(0); setY(0); setR(0)
            if (inside) { inside = false; setScaleTo(1) }
            return
        }

        const dx = mx - cx
        const dy = my - cy
        const dist2 = dx*dx + dy*dy

        if (dist2 < radius2) {
            const dist = Math.sqrt(dist2)
            const ratio = 1 - dist / radius
            const pull = strength * ratio
            const tx = dx * pull
            const ty = dy * pull
            const rot = (dx / (rect!.width || 1)) * maxRotateDeg

            setX(tx); setY(ty); setR(rot)
            if (!inside) { inside = true; setScaleTo(scale) }
        } else {
            setX(0); setY(0); setR(0)
            if (inside) { inside = false; setScaleTo(1) }
        }
    }

    const onMove = (e: PointerEvent) => {
        mx = e.clientX; my = e.clientY
        if (!ticking) { ticking = true; requestAnimationFrame(tick) }
    }

    const addMouse = () => {
        if (listening) return
        listening = true
        window.addEventListener('pointermove', onMove, { passive: true })
    }
    const removeMouse = () => {
        if (!listening) return
        listening = false
        window.removeEventListener('pointermove', onMove)
    }

    // ВАЖНО: pointerenter/pointerleave вместо mouseenter/mouseleave
    const onEnter = () => { hover = true; addMouse() }
    const onLeave = () => { hover = false }

    function attach() {
        if (!el.isConnected) return
        measure()
        ro = new ResizeObserver(measure)
        ro.observe(el)
        window.addEventListener('resize', measure, { passive: true })
        window.addEventListener('scroll',  measure, { passive: true })

        if (onlyHover) {
            el.addEventListener('pointerenter', onEnter)
            el.addEventListener('pointerleave', onLeave)
        } else {
            addMouse()
        }
    }

    function detach() {
        removeMouse()
        ro?.disconnect(); ro = null
        window.removeEventListener('resize', measure)
        window.removeEventListener('scroll',  measure)
        el.removeEventListener('pointerenter', onEnter)
        el.removeEventListener('pointerleave', onLeave)
        scalingTween?.kill(); scalingTween = null
        gsap.set(el, { x:0, y:0, rotation:0, ...(scale === 1 ? {} : { scale: 1 }) })
    }

    return { attach, detach, onEnter, onLeave, measure }
}
