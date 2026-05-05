import { reactive } from 'vue'
import type { ConvertOptions, MultiResizeMode } from '@/shared/types/image'

export type MultiMode = MultiResizeMode

export function useOptions<T extends ConvertOptions = ConvertOptions>(initial?: Partial<T>) {
    const defaults: ConvertOptions = {
        outputFormat: 'same',
        resize: false,
        maxWidth: undefined,
        maxHeight: undefined,
        lossless: false,
        quality: 85,
        useTarget: false,
        targetKb: undefined,
        stripMetadata: true,
        minSize: true,
        smartSubsample: true,
        removeBg: false,
        bgColor: '#ffffff',
        rembgModel: '',
        rembgSession: '',

        // мульти-ресайз
        multiResize: false,
        variants: [],
        multiMode: 'switch' as MultiMode, // NEW: 'switch' | 'add'
        inFolders: false,
    }

    const opts = reactive<T>({ ...defaults, ...(initial as T) } as T)
    return { opts }
}
