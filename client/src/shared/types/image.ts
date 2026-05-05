export type ExportFormat = 'same' | 'webp' | 'jpeg' | 'png' | 'avif'

export type ImageOutputFormat = Exclude<ExportFormat, 'same'>

export type ResizeVariant = {
    w?: number
    h?: number
    _k?: string
}

export type MultiResizeMode = 'switch' | 'add'

export interface ConvertOptions {
    outputFormat: ExportFormat
    resize: boolean
    maxWidth?: number
    maxHeight?: number
    lossless: boolean
    quality: number
    useTarget: boolean
    targetKb?: number
    stripMetadata: boolean
    minSize: boolean
    smartSubsample: boolean
    removeBg: boolean
    bgColor: string
    rembgModel: string
    rembgSession: string
    multiResize?: boolean
    variants?: ResizeVariant[]
    multiMode?: MultiResizeMode
    inFolders: boolean
}
