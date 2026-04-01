import { ref, onBeforeUnmount } from 'vue'

export function useUpscaleFiles() {
    const files = ref<File[]>([])
    const urls  = ref(new Map<File, string>())
    const dims  = ref(new Map<File, { w:number, h:number }>())
    const selected = ref<File|null>(null)

    const revokeAll = () => urls.value.forEach(u => URL.revokeObjectURL(u))
    function clearAll() {
        revokeAll()
        urls.value.clear()
        dims.value.clear()
        files.value = []
        selected.value = null
    }

    function onPicked(list: File[]) {
        revokeAll()
        urls.value = new Map()
        dims.value = new Map()
        files.value = list
        selected.value = list[0] ?? null

        for (const f of list) {
            const u = URL.createObjectURL(f)
            urls.value.set(f, u)
            getImageSize(f).then(d => dims.value.set(f, d))
        }
    }
    function select(f: File) { selected.value = f }

    onBeforeUnmount(clearAll)
    return { files, urls, dims, selected, onPicked, select, clearAll }
}

function getImageSize(file: File): Promise<{w:number;h:number}> {
    return new Promise((resolve) => {
        const u = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(u) }
        img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(u) }
        img.src = u
    })
}
