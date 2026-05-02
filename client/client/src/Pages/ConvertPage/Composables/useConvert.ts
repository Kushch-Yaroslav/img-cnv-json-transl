import { ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { downloadBlob } from '@/shared/platform/downloadAdapter'
import type { ConvertOptions, ResizeVariant } from '@/shared/types/image'

type ConvertDeps<OptionsModel> = {
    files: Ref<File[]>
    opts: OptionsModel
}

export function useConvert<
    OptionsModel extends ConvertOptions = ConvertOptions
>({ files, opts }: ConvertDeps<OptionsModel>) {
    const { t } = useI18n()
    const busy = ref(false)
    const status = ref('')

    async function convert(): Promise<boolean> {
        try {
            if (!files.value.length) return false
            busy.value = true
            status.value = t('common.status.processing')

            const fd = new FormData()
            for (const f of files.value) fd.append('files', f)

            fd.append('outputFormat', String(opts.outputFormat))
            fd.append('lossless', String(!!opts.lossless))
            fd.append('quality', String(opts.quality))
            fd.append('stripMetadata', String(!!opts.stripMetadata))
            fd.append('minSize', String(!!opts.minSize))
            fd.append('smartSubsample', String(!!opts.smartSubsample))

            if (opts.resize) {
                if (opts.maxWidth) fd.append('maxWidth', String(opts.maxWidth))
                if (opts.maxHeight) fd.append('maxHeight', String(opts.maxHeight))
            }

            if (opts.useTarget && opts.targetKb) {
                fd.append('targetKb', String(opts.targetKb))
            }

            fd.append('removeBg', String(!!opts.removeBg))
            if (opts.bgColor) fd.append('bgColor', String(opts.bgColor))
            if (opts.rembgModel) fd.append('rembgModel', String(opts.rembgModel))
            if (opts.rembgSession) fd.append('rembgSession', String(opts.rembgSession))

            if (opts.multiResize && Array.isArray(opts.variants) && opts.variants.length) {
                const clean = opts.variants
                    .filter((v: ResizeVariant) => (v.w && v.w > 0) || (v.h && v.h > 0))
                    .map((v: ResizeVariant) => ({ w: v.w ?? undefined, h: v.h ?? undefined }))
                if (clean.length) fd.append('resizeVariants', JSON.stringify(clean))
            }

            // !!! НОВАЯ ОПЦИЯ
            fd.append('inFolders', String(!!opts.inFolders))

            const resp = await fetch('/convert', { method: 'POST', body: fd })
            if (!resp.ok) throw new Error('Server error')

            const blob = await resp.blob()
            downloadBlob(blob, 'converted_images.zip')

            status.value = t('common.status.success')
            return true
        } catch (e) {
            console.error(e)
            status.value = t('common.status.errorGeneric')
            return false
        } finally {
            busy.value = false
        }
    }

    return { busy, status, convert }
}
