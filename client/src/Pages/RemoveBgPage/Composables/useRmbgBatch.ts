import { ref, type Ref } from 'vue'

type Params = {
    files: Ref<File[]>
    outputFormat: Ref<'png'|'webp'|'jpeg'|'avif'>
    bgColor: Ref<string>
}
export function useRmbgBatch({ files, outputFormat, bgColor }: Params) {
    const busy = ref(false)
    const status = ref('')

    async function removeBatch() {
        if (!files.value.length) return
        busy.value = true; status.value = 'Обработка…'
        try {
            const fd = new FormData()
            for (const f of files.value) fd.append('files', f)
            fd.append('outputFormat', outputFormat.value)
            if (bgColor.value) fd.append('bgColor', bgColor.value)

            const resp = await fetch('/remove-bg', { method: 'POST', body: fd })
            if (!resp.ok) throw new Error(await resp.text().catch(()=>'') || 'remove error')

            const blob = await resp.blob()
            const u = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = u; a.download = 'bg_removed.zip'; a.click()
            URL.revokeObjectURL(u)
            status.value = 'Готово ✔'
        } catch (e:any) {
            console.error(e); status.value = e?.message || 'Ошибка :('
        } finally {
            busy.value = false
        }
    }
    return { busy, status, removeBatch }
}
