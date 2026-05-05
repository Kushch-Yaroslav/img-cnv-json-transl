export type ImageDimensions = {
    w: number
    h: number
}

export interface ImageFileItem {
    id: string
    original: File
    current: File
    cropped: boolean
}
