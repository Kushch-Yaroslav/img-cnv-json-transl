import { ref, computed } from 'vue'
import {highlightJson, prettyJson} from "@/Shared/Helpers/jsonFormat";
import prettyBytesLib from 'pretty-bytes'

export function useJsonTranslate() {
    const file = ref<File | null>(null)
    const src  = ref('')
    const tgt  = ref('en')

    const busy   = ref(false)
    const status = ref('')
    const showJson = ref(false)

    const srcText = ref<string>('')
    const dstText = ref<string>('')

    const highlightedSrc = computed(() => highlightJson(srcText.value))
    const highlightedDst = computed(() => highlightJson(dstText.value || '{}'))

    function prettyBytes(n: number) { return prettyBytesLib(n) }

    function onPick(e: Event) {
        const input = e.target as HTMLInputElement
        const f = input.files?.[0] || null
        file.value = f
        dstText.value = ''
        if (f) {
            // читаем файл ради предпросмотра
            f.text().then(t => {
                try {
                    const obj = JSON.parse(t)
                    srcText.value = prettyJson(obj)
                } catch {
                    srcText.value = t
                }
            })
        } else {
            srcText.value = ''
        }
    }

    function toggleJsonView() { showJson.value = !showJson.value }

    async function doTranslate() {
        if (!file.value || !tgt.value) return
        busy.value = true
        status.value = 'Перевод…'
        try {
            const fd = new FormData()
            fd.append('file', file.value)
            if (src.value) fd.append('src', src.value)
            fd.append('tgt', tgt.value)

            // всё равно отправляем 3.3B (под капотом)
            fd.append('ctx', '16000')
            fd.append('ropeScale', '2')
            fd.append('engine', 'vllm')
            fd.append('mode','fp16')
            fd.append('size','3.3B')
            fd.append('batch','8')
            fd.append('max_len','256')

            const resp = await fetch('/translate/json', { method: 'POST', body: fd })
            if (!resp.ok) throw new Error(await resp.text())

            // Для предпросмотра читаем JSON-текст
            const blob = await resp.blob()
            // копию отдадим как загрузку (ZIP/JSON — зависит от бэка)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = (file.value.name.replace(/\.[^.]+$/, '') || 'translated') + `_${tgt.value}.json`
            a.click()
            // и попытаемся распарсить в правое окно
            try {
                const txt = await blob.text()
                const obj = JSON.parse(txt)
                dstText.value = prettyJson(obj)
            } catch {
                dstText.value = '{ /* не удалось отобразить результат как JSON */ }'
            }
            URL.revokeObjectURL(url)

            status.value = 'Готово ✔'
            if (!showJson.value) showJson.value = true
        } catch (e: any) {
            console.error(e)
            status.value = 'Ошибка: ' + (e?.message || 'unknown')
        } finally {
            busy.value = false
        }
    }

    function resetAll() {
        file.value = null
        srcText.value = ''
        dstText.value = ''
        showJson.value = false
        status.value = ''
    }

    return {
        file, src, tgt,
        busy, status, showJson,
        highlightedSrc, highlightedDst,
        onPick, doTranslate, toggleJsonView, resetAll,
        prettyBytes
    }
}
