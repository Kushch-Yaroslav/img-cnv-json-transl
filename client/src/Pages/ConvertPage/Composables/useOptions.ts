import { reactive } from 'vue'

export type MultiMode = 'switch' | 'add'

export function useOptions<T extends Record<string, any>>(initial?: Partial<T>) {
    const defaults: Record<string, any> = {
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
        variants: [] as Array<{ w?: number; h?: number }>,
        multiMode: 'switch' as MultiMode, // NEW: 'switch' | 'add'
        inFolders: false,
    }

    const opts = reactive<T>({ ...(defaults as T), ...(initial as T) })
    return { opts }
}
