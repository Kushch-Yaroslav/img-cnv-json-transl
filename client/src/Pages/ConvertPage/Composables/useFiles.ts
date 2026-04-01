import { computed, ref } from 'vue'

export type UFile = {
    id: string
    original: File
    current: File
    cropped: boolean
}

function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function isImage(f: File) {
    return f.type.startsWith('image/')
}

export function useFiles() {
    const items = ref<UFile[]>([])

    function onPicked(list: File[]) {
        // отбрасываем не-картинки (видео, pdf и т.п.)
        const images = list.filter(isImage)
        if (!images.length) return

        const mapped = images.map((f) => ({
            id: uid(),
            original: f,
            current: f,
            cropped: false,
        }))

        items.value = [...items.value, ...mapped]
    }

    function clearFiles() {
        items.value = []
    }

    function removeById(id: string) {
        items.value = items.value.filter((x) => x.id !== id)
    }

    function replaceById(id: string, file: File) {
        const it = items.value.find((x) => x.id === id)
        if (it) {
            it.current = file
            it.cropped = true
        }
    }

    function restoreById(id: string) {
        const it = items.value.find((x) => x.id === id)
        if (it) {
            it.current = it.original
            it.cropped = false
        }
    }

    const files = computed(() => items.value.map((x) => x.current))

    const totalSize = computed(() => {
        const b = files.value.reduce((s, f) => s + f.size, 0)
        if (b < 1024) return `${b} B`
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
        return `${(b / 1024 / 1024).toFixed(2)} MB`
    })

    return {
        items,
        files,
        totalSize,
        onPicked,
        clearFiles,
        removeById,
        replaceById,
        restoreById,
    }
}
