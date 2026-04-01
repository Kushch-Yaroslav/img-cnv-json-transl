import {ref, onBeforeUnmount} from 'vue'

export type RItem = {
    id: string;
    file: File;
    url: string;
    dims: {
        w: number;
        h: number;
    }
}

export function useRmbgFiles() {
    const items = ref<RItem[]>([]);
    const selectedId = ref<string | null>(null);

    function fileId(f: File) {
        return `${f.name}: ${f.size}: ${f.lastModified}`
    }

    const revokeAll = () => items.value.forEach(item => URL.revokeObjectURL(item.url));
    const clearAll = () => {
        revokeAll();
        items.value = [];
        selectedId.value = null;
    }

    async function onPicked(list: File[]) {
        revokeAll()
        items.value = list.map((f) => ({
            id: fileId(f),
            file: f,
            url: URL.createObjectURL(f),
            dims: undefined
        }))
        selectedId.value = items.value[0]?.id ?? null

        for (const it of items.value) {
            it.dims = await getImageSize(it.url)
        }
    }

    function select(id: string) {
        selectedId.value = id;
    }

    onBeforeUnmount(clearAll)
    return {items, selectedId, onPicked, select, clearAll}
}

function getImageSize(objectUrl: string): Promise<{ w: number; h: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({w: img.naturalWidth, h: img.naturalHeight})
        img.onerror = () => resolve({w: 0, h: 0})
        img.src = objectUrl
    })
}