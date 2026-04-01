export function fmtJsonPretty(raw: string): string {
    try {
        const data = JSON.parse(raw)
        return JSON.stringify(data, null, 2)
    } catch {
        return raw || ''
    }
}
