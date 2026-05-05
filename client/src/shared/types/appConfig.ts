export type AppMode = 'local' | 'development' | 'free' | 'pro'

export type FeatureFlags = {
    removeBg: boolean
    upscaleAi: boolean
    batchExport: boolean
    pipelineHard: boolean
}

export type AppLimits = {
    maxFiles: number
    maxFileSizeMb: number
    maxBatchMegapixels: number
    previewConcurrency: number
}
