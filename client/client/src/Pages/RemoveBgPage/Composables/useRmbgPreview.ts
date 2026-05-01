import { ref, watch, type Ref } from 'vue'
import type { RItem } from './useRmbgFiles'
import type { PreviewState } from '@/shared/types/operations'

type PState = PreviewState

export function useRmbgPreviews() {
    const states = ref<Record<string, PState>>({})  // key: item.id
    let controllers = new Map<string, AbortController>()

    function reset(id: string) {
        const st = states.value[id]
        if (st?.url) URL.revokeObjectURL(st.url)
        states.value = { ...states.value, [id]: { loading: false } }
    }

    async function buildPreview(item: RItem, bgColor: string) {
        const { id, file } = item
        reset(id)
        const ctrl = new AbortController()
        controllers.set(id, ctrl)
        states.value = { ...states.value, [id]: { loading: true } }

        try {
            const fd = new FormData()
            fd.append('file', file)
            if (bgColor) fd.append('bgColor', bgColor)

            const resp = await fetch('/remove-bg/preview', {
                method: 'POST',
                body: fd,
                signal: ctrl.signal,
                headers: { 'x-preview': Date.now().toString() },
            })
            if (!resp.ok) throw new Error(await resp.text().catch(()=>'') || 'preview error')

            const blob = await resp.blob()
            const url = URL.createObjectURL(blob)
            states.value = { ...states.value, [id]: { loading: false, url } }
        } catch (e:any) {
            if (e?.name === 'AbortError') return
            states.value = { ...states.value, [id]: { loading: false, error: e?.message || 'Ошибка предпросмотра' } }
        }
    }

    function prefetchAll(items: Ref<RItem[]>, bgColor: Ref<string>) {
        watch([items, bgColor], ([arr, bg]) => {
            for (const it of arr) buildPreview(it, bg)
        }, { immediate: true })
    }

    function ensureOne(item: RItem, bgColor: string) {
        const st = states.value[item.id]
        if (!st?.url && !st?.loading) buildPreview(item, bgColor)
    }

    function clearAll() {
        Object.values(states.value).forEach(s => s?.url && URL.revokeObjectURL(s.url!))
        states.value = {}
        controllers.forEach(c => c.abort())
        controllers.clear()
    }

    return { states, prefetchAll, ensureOne, clearAll }
}
