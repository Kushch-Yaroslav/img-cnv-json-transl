export type OperationStatus = 'idle' | 'pending' | 'success' | 'error'

export type PreviewState = {
    url?: string
    loading: boolean
    error?: string
}
