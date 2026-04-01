export function prettyJson(obj: any): string {
    return JSON.stringify(obj, null, 2)
}

export function prettyBytes(b: number): string {
    if (!b) return '0 B'
    const u = ['B','KB','MB','GB','TB']
    const i = Math.floor(Math.log(b)/Math.log(1024))
    return `${(b/Math.pow(1024,i)).toFixed(i ? 2 : 0)} ${u[i]}`
}

export function highlightJson(input: string): string {
    // Экраним HTML
    const esc = (s: string) =>
        s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

    // Пробуем слегка распарсить и собрать назад,
    // чтобы ключи/значения обернуть в span-ы.
    // Если не JSON — подсветим «как есть».
    try {
        const obj = JSON.parse(input)
        const raw = JSON.stringify(obj, null, 2)
        return esc(raw)
            // ключи "key":
            .replace(/(&quot;)([^"]+)(&quot;)(\s*:)/g,
                (_m, q1, key, q3, colon) => `<span class="str">${q1}</span><span class="key">${key}</span><span class="str">${q3}</span>${colon}`)
            // строки-значения
            .replace(/(:\s*)(&quot;.*?&quot;)/g,
                (_m, pre, val) => `${pre}<span class="str">${val}</span>`)
            // числа
            .replace(/(:\s*)(-?\d+(?:\.\d+)?)/g,
                (_m, pre, num) => `${pre}<span class="num">${num}</span>`)
            // true/false/null
            .replace(/(:\s*)(true|false|null)/g,
                (_m, pre, kw) => `${pre}<span class="${kw === 'null' ? 'null' : 'bool'}">${kw}</span>`)
    } catch {
        return esc(input)
    }
}
