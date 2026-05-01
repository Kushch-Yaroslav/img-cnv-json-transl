import { onMounted, onBeforeUnmount, type Ref } from 'vue'

type ParallaxOpts = {
    onMove?: (p: { dx: number; dy: number }) => void
    strength?: number
}

export function useParallax(rootEl: Ref<HTMLElement | null>, opts: ParallaxOpts = {}) {
    const { onMove, strength = 1 } = opts

    function handler(e: MouseEvent) {
        const el = rootEl.value
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        const dx = (x - 0.5) * 2 * strength
        const dy = (y - 0.5) * 2 * strength
        onMove?.({ dx, dy })
    }

    onMounted(() => {
        const el = rootEl.value
        if (!el) return
        el.addEventListener('mousemove', handler, { passive: true })
    })

    onBeforeUnmount(() => {
        const el = rootEl.value
        if (!el) return
        el.removeEventListener('mousemove', handler)
    })
}
