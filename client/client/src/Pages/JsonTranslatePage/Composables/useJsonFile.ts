import { ref } from 'vue'
import {fmtJsonPretty} from "@/Shared/Helpers/jsonPretty";

export function useJsonFile() {
    const file = ref<File|null>(null)
    const originalText = ref<string>('')

    async function onPick(e: Event) {
        const input = e.target as HTMLInputElement
        const f = input.files?.[0] || null
        file.value = f
        originalText.value = ''
        if (f) {
            const text = await f.text().catch(()=>'')
            originalText.value = fmtJsonPretty(text)
        }
    }

    function clearFiles() {
        file.value = null
        originalText.value = ''
    }

    return { file, originalText, onPick, clearFiles }
}
