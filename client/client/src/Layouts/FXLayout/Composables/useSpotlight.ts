import {Ref, ref} from 'vue'
import { gsap } from '@/Lib/gsapClient'

export function useSpotlight(stageRef: Ref<HTMLElement | null>) {
    const spotRef = ref<HTMLElement | null>(null)
    let setX: ((v: number) => void) | null = null
    let setY: ((v: number) => void) | null = null
    let setO: ((v: number) => void) | null = null
    let mx = 0, my = 0, ticking = false

    const tick = () => {
        ticking = false
        if (!spotRef.value) return
        setX?.(mx - 260)
        setY?.(my - 260)
        setO?.(1)
    }

    const onMove = (e: MouseEvent) => {
        const el = stageRef.value
        if (!el) return
        const r = el.getBoundingClientRect()
        mx = e.clientX - r.left
        my = e.clientY - r.top
        if (!ticking) { ticking = true; requestAnimationFrame(tick) }
    }

    const onLeave = () => setO?.(0)

    const init = () => {
        if (spotRef.value) {
            setX = gsap.quickTo(spotRef.value, 'x', { duration: 0.10, ease: 'power3.out' })
            setY = gsap.quickTo(spotRef.value, 'y', { duration: 0.10, ease: 'power3.out' })
            setO = gsap.quickTo(spotRef.value, 'opacity', { duration: 0.15, ease: 'power2.out' })
        }
    }

    return { spotRef, init, onMove, onLeave }
}
