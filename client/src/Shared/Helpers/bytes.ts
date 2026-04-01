export function fmtBytes(b: number) {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`
    return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`
}
