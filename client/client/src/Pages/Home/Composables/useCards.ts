import { ref, nextTick } from 'vue'
import type { Router } from 'vue-router'
import { useMagnet } from './useMagnet'
import { useTilt } from './useTilt'

export function useCards(router: Router, s: Record<string, string>) {
    const cardEls = ref<HTMLElement[]>([])
    const tiltEls = ref<HTMLElement[]>([])
    const seenCard = new WeakSet<HTMLElement>()
    const seenTilt = new WeakSet<HTMLElement>()
    const cardTilt = ref<ReturnType<typeof useTilt>[]>([])
    const magnets: Array<ReturnType<typeof useMagnet>> = []

    function setCardRef(el: Element | null) {
        const node = el as HTMLElement
        if (!node || node.nodeType !== 1) return
        if (!seenCard.has(node)) { seenCard.add(node); cardEls.value.push(node) }
    }

    function setTiltRef(el: Element | null) {
        if (el instanceof HTMLElement && !seenTilt.has(el)) {
            seenTilt.add(el); tiltEls.value.push(el)
        }
    }

    async function initCards(titleEl: HTMLElement | null) {
        await nextTick()
        // отладка:
        console.log('cards:', cardEls.value.length, cardEls.value)
        console.log('tilts:', tiltEls.value.length, tiltEls.value)

        if (titleEl) {
            const m = useMagnet(titleEl, { radius: 260, strength: 0.28, maxRotateDeg: 6, scale: 1.02 })
            m.attach(); magnets.push(m)
        }

        cardEls.value.forEach((el, i) => {
            el.style.setProperty('--enter-delay', `${i * 80}ms`)

            const m = useMagnet(el, {
                radius: 220, strength: 0.35, maxRotateDeg: 6,
                scale: 1, onlyHover: true,
            })

            // можно без таймера — pointerenter сам включит hover
            m.attach(); magnets.push(m)
        })

        const localTilts: ReturnType<typeof useTilt>[] = []
        tiltEls.value.forEach((innerEl, i) => {
            innerEl.style.setProperty('--enter-delay', `${i * 80}ms`)
            const t = useTilt(innerEl, { maxTilt: 10, scale: 1.04, glare: true, shadow: true, spring: true })
            localTilts.push(t)
        })
        cardTilt.value = localTilts
    }

    function onCardClick(ev: MouseEvent, to: string) {
        const target = ev.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        target.style.setProperty('--ripple-x', `${x}px`)
        target.style.setProperty('--ripple-y', `${y}px`)
        target.classList.add(s.cardRippling)
        setTimeout(() => { target.classList.remove(s.cardRippling); router.push(to) }, 260)
    }

    function cleanup() { magnets.forEach(m => m.detach()) }

    return { setCardRef, setTiltRef, cardTilt, initCards, onCardClick, cleanup }
}
