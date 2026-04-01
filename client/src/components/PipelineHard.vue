<template>
  <div class="panel">
    <h2>Конвейер 1080×1080 → RemoveBG → WebP(85)</h2>

    <DropZone @picked="onPicked" />
    <div v-if="files.length" class="muted">Файлов: {{ files.length }}</div>

    <div v-if="files.length" class="preview-grid" style="margin-top:12px">
      <div class="thumb" v-for="f in files" :key="f.name">
        <img :src="urls.get(f)!" alt="">
        <div class="meta">
          <div class="name" :title="f.name">{{ f.name }}</div>
          <div class="size">{{ fmtBytes(f.size) }}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:12px">
      <button :disabled="busy || !files.length" @click="run">Запустить конвейер (ZIP)</button>
      <span class="muted" style="margin-left:8px">{{ status }}</span>
    </div>

    <div class="muted" style="margin-top:8px">
      Шаги: resize до 1080×1080 (fit: inside, без увеличения) → удаление фона (AI) → WebP (quality 85, minSize, smartSubsample) → удаление метаданных.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import DropZone from "@/Shared/Components/DropZone.vue";

const files = ref<File[]>([])
const urls = ref(new Map<File, string>())
const busy = ref(false)
const status = ref('')

function onPicked(list: File[]) {
  urls.value.forEach(u => URL.revokeObjectURL(u))
  urls.value.clear()
  files.value = list
  for (const f of list) {
    const u = URL.createObjectURL(f)
    urls.value.set(f, u)
  }
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1024/1024).toFixed(2)} MB`
}

async function run() {
  try {
    if (!files.value.length) return
    busy.value = true
    status.value = 'Обработка…'

    const fd = new FormData()
    for (const f of files.value) fd.append('files', f)

    const resp = await fetch('/pipeline/hard', { method: 'POST', body: fd })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(text || 'pipeline error')
    }

    const blob = await resp.blob()
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = u
    a.download = 'pipeline_1080_webp.zip'
    a.click()
    URL.revokeObjectURL(u)
    status.value = 'Готово ✔'
  } catch (e:any) {
    console.error(e)
    status.value = e?.message || 'Ошибка :('
  } finally {
    busy.value = false
  }
}

onBeforeUnmount(() => {
  urls.value.forEach(u => URL.revokeObjectURL(u))
})
</script>
