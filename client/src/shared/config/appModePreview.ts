import type { AppMode } from '@/shared/types/appConfig'

export const APP_MODE_PREVIEW_STORAGE_KEY = 'image-tools-preview-mode'
export const APP_MODE_PREVIEW_CHANGE_EVENT = 'image-tools-preview-mode-change'

export const APP_MODE_OPTIONS: AppMode[] = ['local', 'development', 'free', 'pro']

export function canPreviewAppMode(actualMode: AppMode): boolean {
    return actualMode === 'local' || actualMode === 'development'
}

export function getStoredPreviewMode(actualMode: AppMode): AppMode {
    if (!canPreviewAppMode(actualMode) || typeof window === 'undefined') {
        return actualMode
    }

    const stored = window.localStorage.getItem(APP_MODE_PREVIEW_STORAGE_KEY)
    return isAppMode(stored) ? stored : actualMode
}

export function getEffectiveAppMode(actualMode: AppMode): AppMode {
    return canPreviewAppMode(actualMode) ? getStoredPreviewMode(actualMode) : actualMode
}

export function setStoredPreviewMode(mode: AppMode): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(APP_MODE_PREVIEW_STORAGE_KEY, mode)
    window.dispatchEvent(new CustomEvent<AppMode>(APP_MODE_PREVIEW_CHANGE_EVENT, { detail: mode }))
}

function isAppMode(value: string | null): value is AppMode {
    return !!value && APP_MODE_OPTIONS.includes(value as AppMode)
}
