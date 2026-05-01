// src/Pages/Home/Composables/useDragCards.ts
import {ref, type Ref} from 'vue'

type DragCtx = {
    i: number
    el: HTMLElement
    linkEl: HTMLElement
    avatar: HTMLElement | null
    startX: number
    startY: number
    shiftX: number
    shiftY: number
    detached: boolean
    spacerCollapsed: boolean
    currentIndex: number
    startIndex: number              // ⬅ исходная позиция
    ghostEl: HTMLElement | null     // ⬅ плейсхолдер в гриде
    started: boolean              // drag уже запущен?
    longPressTimer: number | null


}

type Opts<TItem> = {
    gridRef: () => HTMLElement | null
    getCardElByIndex: (i: number) => HTMLElement | null
    getLinkElByCard: (cardEl: HTMLElement) => HTMLElement | null
    itemsRef: Ref<TItem[]>                             // ⬅ список для перестановки
    onDropOutside?: (index: number, el: HTMLElement, ev: PointerEvent) => void
    s: Record<string, string>
    getDockRect?: () => DOMRect | null
    dropToDock?: (item: TItem | null) => void
    getItemByIndex?: (i:number)=>TItem
    onDragStart?: () => void
    onDragEnd?:   () => void
}



export function useDragCards<TItem>(opts: Opts<TItem>) {
    const dragging = ref(false)
    const ctx = ref<DragCtx | null>(null)

    const LONG_PRESS_MS = 100
    const TAP_SLOP = 6
    const DETACH_PX = 16
    const GRID_ACTIVE_MARGIN = 40
    const GRID_DEAD_MARGIN   = 200   // ← было 16, сделай 180–220 по вкусу
    const MOVE_THRESHOLD = 6
    let lastMoveX = 0, lastMoveY = 0
    let reorderRAF = 0


    function makeGhost(fromLink: HTMLElement) {
        // плейсхолдер такого же размера, чтобы сетка не «прыгала»
        const g = document.createElement('div')
        g.className = opts.s.cardGhost ?? 'card-ghost'
        const r = fromLink.getBoundingClientRect()
        g.style.width = `${r.width}px`
        g.style.height = `${r.height}px`
        fromLink.after(g)
        return g
    }

    function removeGhost(g?: HTMLElement|null) {
        if (g && g.isConnected) g.remove()
    }

    function measureMap(grid: HTMLElement) {
        const map = new Map<HTMLElement, DOMRect>()
        const nodes = Array.from(grid.querySelectorAll(`.${opts.s.cardLink}, .${opts.s.cardGhost ?? 'card-ghost'}`)) as HTMLElement[]
        nodes.forEach(n => map.set(n, n.getBoundingClientRect()))
        return map
    }

    function playFlip(grid: HTMLElement, first: Map<HTMLElement, DOMRect>) {
        const nodes = Array.from(grid.querySelectorAll(`.${opts.s.cardLink}, .${opts.s.cardGhost ?? 'card-ghost'}`)) as HTMLElement[]
        nodes.forEach(el => {
            const a = first.get(el); if (!a) return
            const b = el.getBoundingClientRect()
            const dx = a.left - b.left
            const dy = a.top  - b.top
            if (!dx && !dy) return
            el.style.willChange = 'transform'
            el.style.transform = `translate(${dx}px,${dy}px) scale(.97)`
            requestAnimationFrame(() => {
                el.classList.add(opts.s.flipAnim)
                el.style.removeProperty('transition-delay')
                el.style.setProperty('--flip-dur', `320ms`)
                el.style.transform = 'translate(0,0) scale(1)'
                const done = () => {
                    el.classList.remove(opts.s.flipAnim)
                    el.style.willChange = ''
                    el.style.transform = ''
                    el.style.removeProperty('--flip-dur')
                    el.removeEventListener('transitionend', done)
                }
                el.addEventListener('transitionend', done)
            })
        })
    }

    function moveGhostToIndex(grid: HTMLElement, ghost: HTMLElement, toIndex: number) {
        const first = measureMap(grid)               // FIRST
        const children = Array.from(grid.children) as HTMLElement[]
        const target = children[toIndex]
        if (!target || target === ghost) return
        // переставляем ghost ДО target
        grid.insertBefore(ghost, target)
        // PLAY FLIP
        playFlip(grid, first)
    }





    function outsideDistance(r: DOMRect, x: number, y: number) {
        let dx = 0, dy = 0
        if (x < r.left) dx = r.left - x
        else if (x > r.right) dx = x - r.right
        if (y < r.top) dy = r.top - y
        else if (y > r.bottom) dy = y - r.bottom
        return Math.hypot(dx, dy)
    }


    function makeAvatar(fromEl: HTMLElement) {
        const avatar = fromEl.cloneNode(true) as HTMLElement
        avatar.classList.add(opts.s.dragAvatar)

        // размеры
        const r = fromEl.getBoundingClientRect()
        avatar.style.width = `${r.width}px`
        avatar.style.height = `${r.height}px`
        avatar.style.left = `0px`
        avatar.style.top  = `0px`
        avatar.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`

        // 🔴 ключ: наследуем базовый цвет и CSS-переменные от исходной ссылки
        const host = (fromEl.closest(`.${opts.s.cardLink}`) as HTMLElement) ?? fromEl
        const cs = getComputedStyle(host)
        avatar.style.color = cs.color

        // если используешь CSS-переменные (--...): скопируем их
        for (let i = 0; i < cs.length; i++) {
            const prop = cs.item(i)
            if (prop.startsWith('--')) {
                avatar.style.setProperty(prop, cs.getPropertyValue(prop))
            }
        }

        document.body.appendChild(avatar)
        return avatar
    }

    function setAvatarPos(avatar: HTMLElement, x: number, y: number, shiftX: number, shiftY: number) {
        avatar.style.transform = `translate3d(${x - shiftX}px, ${y - shiftY}px, 0)`
    }

    function startDrag(c: DragCtx) {
        c.started = true
        dragging.value = true                 // ⬅️ добавь
        c.avatar = makeAvatar(c.el)
        document.body.classList.add('bodyDragging')
        c.linkEl.classList.add(opts.s.cardDragging)
        if (!c.ghostEl) { c.ghostEl = makeGhost(c.linkEl); c.linkEl.style.display = 'none' }
        opts.onDragStart?.()                  // уже было/добавь
    }



    // ===== handlers =====
    function onPointerDown(i: number, ev: PointerEvent) {
        const cardEl = opts.getCardElByIndex(i); if (!cardEl) return
        const linkEl = opts.getLinkElByCard(cardEl) ?? (cardEl.closest('a') as HTMLElement | null)
        if (!linkEl) return
        (ev.target as HTMLElement)?.closest('a')?.addEventListener('dragstart', e => e.preventDefault(), { once: true })

        const rect = cardEl.getBoundingClientRect()
        const shiftX = ev.clientX - rect.left
        const shiftY = ev.clientY - rect.top

        ctx.value = {
            i, el: cardEl, linkEl, avatar: null,
            startX: ev.clientX, startY: ev.clientY,
            shiftX, shiftY,
            detached: false, spacerCollapsed: false,
            currentIndex: i, startIndex: i,
            ghostEl: null,
            started: false,
            longPressTimer: null
        }

        lastMoveX = ev.clientX; lastMoveY = ev.clientY

        // только слушатели; drag пока НЕ начат
        document.addEventListener('pointermove', onPointerMove, { passive: false })
        document.addEventListener('pointerup', onPointerUp, { once: true })
        document.addEventListener('pointercancel', onPointerUp, { once: true })

        // таймер долгого тапа
        ctx.value.longPressTimer = window.setTimeout(() => {
            const c = ctx.value; if (!c || c.started) return
            startDrag(c) // ← запустим drag (создадим аватар/ghost и т.д.)
        }, LONG_PRESS_MS)
    }



    function onPointerMove(ev: PointerEvent) {
        const c = ctx.value; if (!c) return

        if (!c.started) {
            const drift = Math.hypot(ev.clientX - c.startX, ev.clientY - c.startY)
            if (drift > TAP_SLOP) {
                if (c.longPressTimer) { clearTimeout(c.longPressTimer); c.longPressTimer = null }
                // тут выходим: это обычный клик/скролл, drag не запускаем
            }
            return
        }

        // drag идёт:
        if (!c.avatar) return
        setAvatarPos(c.avatar, ev.clientX, ev.clientY, c.shiftX, c.shiftY)
        if (!c.detached) {
            const d = Math.hypot(ev.clientX - c.startX, ev.clientY - c.startY)
            if (d <= DETACH_PX) return
            c.detached = true

            if (!c.ghostEl) {
                c.ghostEl = makeGhost(c.linkEl)
                c.linkEl.style.display = 'none'
            }
        }

        // 2) Зоны
        const grid = opts.gridRef(); if (!grid) return
        const gr = grid.getBoundingClientRect()
        const dist = outsideDistance(gr, ev.clientX, ev.clientY)
        if (dist > GRID_DEAD_MARGIN) return

        const activeRect = new DOMRect(gr.left - GRID_ACTIVE_MARGIN, gr.top - GRID_ACTIVE_MARGIN,
            gr.width + GRID_ACTIVE_MARGIN*2, gr.height + GRID_ACTIVE_MARGIN*2)
        if (ev.clientX < activeRect.left || ev.clientX > activeRect.right ||
            ev.clientY < activeRect.top  || ev.clientY > activeRect.bottom) return

        // 3) Троттлинг и порог
        if (Math.hypot(ev.clientX - lastMoveX, ev.clientY - lastMoveY) < MOVE_THRESHOLD) return
        lastMoveX = ev.clientX; lastMoveY = ev.clientY
        if (reorderRAF) return
        reorderRAF = requestAnimationFrame(() => {
            reorderRAF = 0
            const links = Array.from(grid.querySelectorAll(`.${opts.s.cardLink}`)) as HTMLElement[]
            let over = -1
            for (let k=0;k<links.length;k++){
                const r = links[k].getBoundingClientRect()
                if (ev.clientX>=r.left && ev.clientX<=r.right && ev.clientY>=r.top && ev.clientY<=r.bottom){ over=k; break }
            }
            if (over < 0 || !c.ghostEl) return

            const r = links[over].getBoundingClientRect()
            const passedHalf = ev.clientY > r.top + r.height/2 || ev.clientX > r.left + r.width/2
            const targetIndex = passedHalf ? over + 1 : over

            if (targetIndex !== c.currentIndex) {
                moveGhostToIndex(grid, c.ghostEl, targetIndex)
                c.currentIndex = targetIndex
            }
        })
    }



    function onPointerUp(ev: PointerEvent) {
        const c = ctx.value; if (!c) return
        document.removeEventListener('pointermove', onPointerMove)

        // Всегда гасим (если таймер ещё жил)
        if (c.longPressTimer) { clearTimeout(c.longPressTimer); c.longPressTimer = null }

        // 1) long-press не случился → это клик, drag не стартовал
        if (!c.started) {
            ctx.value = null
            return
        }

        // 2) Проверяем дроп в док
        const dockR = opts.getDockRect?.()
        const toDock = !!dockR &&
            ev.clientX >= dockR.left && ev.clientX <= dockR.right &&
            ev.clientY >= dockR.top  && ev.clientY <= dockR.bottom

        if (toDock && opts.dropToDock) {
            const item = opts.getItemByIndex ? opts.getItemByIndex(c.startIndex) : null

            // Плавный релиз аватара в центр зоны
            if (c.avatar && dockR) {
                c.avatar.style.transition = 'opacity 180ms ease, transform 260ms cubic-bezier(.2,.9,.2,1)'
                const cx = dockR.left + dockR.width  / 2 - c.shiftX
                const cy = dockR.top  + dockR.height / 2 - c.shiftY
                requestAnimationFrame(() => { c.avatar!.style.transform = `translate3d(${cx}px, ${cy}px, 0)` })
                c.avatar.addEventListener('transitionend', () => c.avatar && c.avatar.remove(), { once: true })
            }

            // Показать компонент в доке (порядок в гриде НЕ меняем)
            opts.dropToDock(item)

            // Общая уборка
            dragging.value = false
            opts.onDragEnd?.()
            document.body.classList.remove('bodyDragging')
            c.linkEl.classList.remove(opts.s.cardDragging)
            c.linkEl.style.display = ''
            removeGhost(c.ghostEl)
            ctx.value = null
            return
        }

        // 3) Обычное завершение внутри грида: commit перестановки
        dragging.value = false
        opts.onDragEnd?.()
        document.body.classList.remove('bodyDragging')
        c.linkEl.classList.remove(opts.s.cardDragging)

        const from = c.startIndex
        const toRaw = Math.max(0, Math.min(c.currentIndex, opts.itemsRef.value.length))
        const to = (toRaw > from ? toRaw - 1 : toRaw)
        if (from !== to) {
            const arr = opts.itemsRef.value.slice()
            const [moved] = arr.splice(from, 1)
            arr.splice(to, 0, moved)
            opts.itemsRef.value = arr
        }

        // Релиз аватара к ghost (если он есть)
        if (c.avatar) {
            c.avatar.style.transition = 'opacity 160ms ease, transform 240ms cubic-bezier(.2,.9,.2,1)'
            const ghostRect = c.ghostEl?.getBoundingClientRect()
            requestAnimationFrame(() => {
                if (ghostRect) {
                    c.avatar!.style.transform = `translate3d(${ghostRect.left}px, ${ghostRect.top}px, 0)`
                    c.avatar!.style.opacity = '0.95'
                } else {
                    c.avatar!.style.opacity = '0'
                    c.avatar!.style.transform += ' scale(.94)'
                }
            })
            c.avatar.addEventListener('transitionend', () => c.avatar && c.avatar.remove(), { once: true })
        }

        c.linkEl.style.display = ''
        removeGhost(c.ghostEl)
        ctx.value = null
    }



    return { dragging, onPointerDown }
}
