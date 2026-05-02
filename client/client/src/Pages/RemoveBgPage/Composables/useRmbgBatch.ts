import { ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ImageOutputFormat } from '@/shared/types/image'

type Params = {
    files: Ref<File[]>
    outputFormat: Ref<ImageOutputFormat>
    bgColor: Ref<string>
}
export function useRmbgBatch({ files, outputFormat, bgColor }: Params) {
    const { t } = useI18n()
    const busy = ref(false)
    const status = ref('')

    async function removeBatch() {
        if (!files.value.length) return
        busy.value = true; status.value = t('common.status.processing')
        try {
            const fd = new FormData()
            for (const f of files.value) fd.append('files', f)
            fd.append('outputFormat', outputFormat.value)
            if (bgColor.value) fd.append('bgColor', bgColor.value)

            const resp = await fetch('/remove-bg', { method: 'POST', body: fd })
            if (!resp.ok) throw new Error(await resp.text().catch(()=>'') || t('removeBg.errors.batchFailedFallback'))

            const blob = await resp.blob()
            const u = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = u; a.download = 'bg_removed.zip'; a.click()
            URL.revokeObjectURL(u)
            status.value = t('common.status.success')
        } catch (e:any) {
            console.error(e); status.value = e?.message || t('common.status.errorGeneric')
        } finally {
            busy.value = false
        }
    }
    return { busy, status, removeBatch }
}
