import { ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

type HookArgs = {
    selected: Ref<File|null>
    method: Ref<'nonai'|'realesrgan'|'waifu2x'>
    targetSize: Ref<number>
    aiModel: Ref<'realesrgan-x4plus'|'realesrgan-x4plus-anime'>
    waifuNoise: Ref<0|1|2|3>
}

export function useUpscalePreview() {
    const { t } = useI18n()
    const previewUrl   = ref<string>()
    const loadingPrev  = ref(false)
    const previewError = ref('')

    function clear() {
        previewError.value = ''
        loadingPrev.value = false
        if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = undefined }
    }

    let timer: number | undefined
    async function requestPreview(args: HookArgs) {
        const f = args.selected.value
        if (!f) return
        loadingPrev.value = true
        previewError.value = ''
        try {
            const fd = new FormData()
            fd.append('file', f)
            fd.append('method', args.method.value)
            fd.append('targetSize', String(args.targetSize.value))
            if (args.method.value === 'realesrgan') fd.append('aiModel', args.aiModel.value)
            if (args.method.value === 'waifu2x')   fd.append('waifuNoise', String(args.waifuNoise.value))

            const resp = await fetch('/enhance/preview', { method:'POST', body:fd })
            if (!resp.ok) throw new Error(await resp.text().catch(()=> '') || t('upscale.errors.previewFailedFallback'))
            const blob = await resp.blob()
            clear()
            previewUrl.value = URL.createObjectURL(blob)
        } catch (e:any) {
            if (e?.name === 'AbortError') return
            clear()
            previewError.value = e?.message || t('upscale.errors.previewGeneric')
        } finally {
            loadingPrev.value = false
        }
    }

    function hookTo(args: HookArgs) {
        watch([args.selected, args.method, args.targetSize, args.aiModel, args.waifuNoise], () => {
            clear()
            if (timer) window.clearTimeout(timer)
            timer = window.setTimeout(() => requestPreview(args), 160)
        }, { immediate: true })
    }

    return { previewUrl, loadingPrev, previewError, hookTo, clear }
}
