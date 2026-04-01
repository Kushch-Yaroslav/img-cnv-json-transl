import { ref, type Ref } from 'vue'

type ConvertDeps<OptionsModel> = {
    files: Ref<File[]>
    opts: OptionsModel
}

export function useConvert<
    OptionsModel extends Record<string, any> & { inFolders?: boolean }
>({ files, opts }: ConvertDeps<OptionsModel>) {
    const busy = ref(false)
    const status = ref('')

    async function convert() {
        try {
            if (!files.value.length) return
            busy.value = true
            status.value = 'Обработка...'

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
                    .filter((v: any) => (v.w && v.w > 0) || (v.h && v.h > 0))
                    .map((v: any) => ({ w: v.w ?? undefined, h: v.h ?? undefined }))
                if (clean.length) fd.append('resizeVariants', JSON.stringify(clean))
            }

            // !!! НОВАЯ ОПЦИЯ
            fd.append('inFolders', String(!!opts.inFolders))

            const resp = await fetch('/convert', { method: 'POST', body: fd })
            if (!resp.ok) throw new Error('Server error')

            const blob = await resp.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'converted_images.zip'
            a.click()
            URL.revokeObjectURL(url)

            status.value = 'Готово ✔'
        } catch (e) {
            console.error(e)
            status.value = 'Ошибка :('
        } finally {
            busy.value = false
        }
    }

    return { busy, status, convert }
}
