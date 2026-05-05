import { ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

type Params = {
    files: Ref<File[]>
    method: Ref<'nonai'|'realesrgan'|'waifu2x'>
    targetSize: Ref<number>
    aiModel: Ref<'realesrgan-x4plus'|'realesrgan-x4plus-anime'>
    waifuNoise: Ref<0|1|2|3>
}

export function useUpscaleBatch({ files, method, targetSize, aiModel, waifuNoise }: Params) {
    const { t } = useI18n()
    const busy = ref(false)
    const status = ref('')

    async function run() {
        if (!files.value.length) return
        busy.value = true; status.value = t('common.status.processing')
        try {
            const fd = new FormData()
            for (const f of files.value) fd.append('files', f)
            fd.append('method', method.value)
            fd.append('targetSize', String(targetSize.value))
            if (method.value === 'realesrgan') fd.append('aiModel', aiModel.value)
            if (method.value === 'waifu2x')   fd.append('waifuNoise', String(waifuNoise.value))

            const resp = await fetch('/enhance', { method:'POST', body:fd })
            if (!resp.ok) throw new Error(await resp.text().catch(()=> '') || t('upscale.errors.batchFailedFallback'))

            const blob = await resp.blob()
            const u = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = u; a.download = 'enhanced.zip'; a.click()
            URL.revokeObjectURL(u)
            status.value = t('common.status.success')
        } catch (e:any) {
            console.error(e); status.value = e?.message || t('common.status.errorGeneric')
        } finally {
            busy.value = false
        }
    }

    return { busy, status, run }
}
