import { Ref } from 'vue'
import type { MultiResizeMode, ResizeVariant } from '@/shared/types/image'

// Типы
export type Variant = ResizeVariant
export type SetKey = 'desktop' | 'tablet' | 'phone' | 'all' | 'macro1'
export type MultiMode = MultiResizeMode

export interface OptionsLike {
    multiResize?: boolean
    variants?: Variant[]
    multiMode?: MultiMode
}

// Константы пресетов
const SETS = {
    desktop: [
        { w: 3840, h: 2160 },
        { w: 3440, h: 1440 },
        { w: 2560, h: 1440 },
        { w: 2560, h: 1080 },
        { w: 1920, h: 1080 },
        { w: 1680, h: 1050 },
        { w: 1600, h: 900 },
        { w: 1536, h: 864 },
        { w: 1440, h: 900 },
        { w: 1366, h: 768 },
        { w: 1280, h: 720 },
    ],
    tablet: [
        { w: 1536, h: 2048 },
        { w: 1488, h: 2266 },
        { w: 1280, h: 800 },
        { w: 1200, h: 1920 },
        { w: 1024, h: 1366 },
    ],
    phone: [
        { w: 430, h: 932 },
        { w: 414, h: 896 },
        { w: 393, h: 852 },
        { w: 390, h: 844 },
        { w: 360, h: 800 },
        { w: 360, h: 780 },
        { w: 320, h: 568 },
    ],
    macro1: [
        { w: 1080 }, { w: 720 }, { w: 540 }, { w: 360 },
    ],
}

// Утилиты
const MACRO1_WIDTHS = [1080, 720, 540, 360]
const vKeyWH = (v: { w?: number; h?: number }) => `${v.w ?? ''}x${v.h ?? ''}`
const makeKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
const isMacro1 = (v: Variant) => v.h == null && v.w != null && MACRO1_WIDTHS.includes(v.w)

function ensureKeys(list: Variant[]) {
    return list.map(v => (v._k ? v : { ...v, _k: `${vKeyWH(v)}-${makeKey()}` }))
}
function uniqByWH(arr: Variant[]) {
    const seen = new Set<string>()
    const out: Variant[] = []
    for (const v of arr) {
        const k = vKeyWH(v)
        if (!seen.has(k)) { seen.add(k); out.push(v) }
    }
    return out
}
function sortKeepMacro1(list: Variant[]) {
    const macro: Variant[] = []
    for (const w of MACRO1_WIDTHS) {
        const f = list.find(v => v.w === w && v.h == null)
        if (f) macro.push(f)
    }
    const others = list.filter(v => !isMacro1(v)).slice()
    others.sort((a, b) => {
        const wa = a.w ?? 0, wb = b.w ?? 0
        if (wa !== wb) return wb - wa
        const ha = a.h ?? 0, hb = b.h ?? 0
        return hb - ha
    })
    return [...macro, ...others]
}

function equalsSet(a: Variant[], b: Variant[]) {
    if (a.length !== b.length) return false
    const A = new Set(a.map(vKeyWH))
    const B = new Set(b.map(vKeyWH))
    if (A.size !== B.size) return false
    for (const k of A) if (!B.has(k)) return false
    return true
}
function arrayHasAll(base: Variant[], pack: { w?: number; h?: number }[]) {
    const B = new Set(base.map(vKeyWH))
    return pack.every(v => B.has(vKeyWH(v)))
}

// Паблик API
export function useMultiResize(model: Ref<OptionsLike>) {
    // дефолты (на случай старого состояния)
    if (model.value.multiResize == null) model.value.multiResize = false
    if (!Array.isArray(model.value.variants)) model.value.variants = []
    if (!model.value.multiMode) model.value.multiMode = 'switch'
    model.value.variants = ensureKeys(model.value.variants!)

    function addVariant(w = 1080, h?: number) {
        const next: Variant = { w, h, _k: `${vKeyWH({ w, h })}-${makeKey()}` }
        model.value.variants = [...(model.value.variants || []), next]
    }
    function removeByKey(k: string) {
        model.value.variants = (model.value.variants || []).filter(v => v._k !== k)
    }
    function resetAll() {
        model.value.variants = []
    }
    function sortAll() {
        model.value.variants = sortKeepMacro1(model.value.variants || [])
    }

    function applySet(key: SetKey) {
        const packWH = key === 'all'
            ? [...SETS.desktop, ...SETS.tablet, ...SETS.phone]
            : SETS[key]

        model.value.multiResize = true
        const cur = model.value.variants || []

        const byWH = new Map<string, Variant>()
        cur.forEach(v => byWH.set(vKeyWH(v), v))

        if (model.value.multiMode === 'switch') {
            const curWH = cur.map(vKeyWH).sort().join('|')
            const packWHKey = packWH.map(vKeyWH).sort().join('|')
            if (curWH === packWHKey) { model.value.variants = []; return }

            const next = packWH.map(v => byWH.get(vKeyWH(v)) ?? { ...v, _k: `${vKeyWH(v)}-${makeKey()}` })
            model.value.variants = (key === 'macro1') ? ensureKeys(next) : sortKeepMacro1(ensureKeys(next))
            return
        }

        if (arrayHasAll(cur, packWH)) {
            const removeSet = new Set(packWH.map(vKeyWH))
            model.value.variants = cur.filter(v => !removeSet.has(vKeyWH(v)))
            return
        } else {
            const addList: Variant[] = packWH.map(v => byWH.get(vKeyWH(v)) ?? { ...v, _k: `${vKeyWH(v)}-${makeKey()}` })
            const merged = uniqByWH([...(cur || []), ...addList])
            model.value.variants = (key === 'macro1') ? ensureKeys(merged) : sortKeepMacro1(ensureKeys(merged))
            return
        }
    }
    function getPack(key: SetKey) {
        return key === 'all'
            ? [...SETS.desktop, ...SETS.tablet, ...SETS.phone]
            : SETS[key]
    }

    function isSetActive(key: SetKey): boolean {
        const pack = getPack(key)
        return arrayHasAll(model.value.variants || [], pack)
    }

    return {
        addVariant,
        removeByKey,
        resetAll,
        sortAll,
        applySet,
        getPack,
        isSetActive,
    }
}
