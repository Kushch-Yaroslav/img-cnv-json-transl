import type { AppLimits, AppMode, FeatureFlags } from '@/shared/types/appConfig'

export type AppConfig = {
    mode: AppMode
    apiBaseUrl: string
    features: FeatureFlags
    limits: AppLimits
}

const APP_MODES: AppMode[] = ['local', 'development', 'free', 'pro']

const DEFAULT_FEATURES: FeatureFlags = {
    removeBg: true,
    upscaleAi: true,
    batchExport: true,
    pipelineHard: true,
}

const DISABLED_LIMITS: AppLimits = {
    maxFiles: Infinity,
    maxFileSizeMb: Infinity,
    maxBatchMegapixels: Infinity,
    previewConcurrency: Infinity,
}

function resolveAppMode(value: string | undefined): AppMode {
    if (value && APP_MODES.includes(value as AppMode)) {
        return value as AppMode
    }

    return import.meta.env.DEV ? 'development' : 'local'
}

const appConfig: AppConfig = {
    mode: resolveAppMode(import.meta.env.VITE_APP_MODE),
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    features: DEFAULT_FEATURES,
    limits: DISABLED_LIMITS,
}

export function getAppConfig(): AppConfig {
    return appConfig
}

export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
    return appConfig.features[featureName]
}

export function getAppLimits(): AppLimits {
    return appConfig.limits
}
