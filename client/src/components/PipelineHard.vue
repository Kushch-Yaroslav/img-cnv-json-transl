<template>
  <div class="panel">
    <h2>{{ $t('pipeline.title') }}</h2>

    <DropZone @picked="onPicked" />
    <div v-if="files.length" class="muted">{{ $t('pipeline.stats.files') }} {{ files.length }}</div>

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
      <button :disabled="busy || !files.length" @click="run">{{ $t('pipeline.actions.submit') }}</button>
      <span class="muted" style="margin-left:8px">{{ status }}</span>
    </div>

    <div class="muted" style="margin-top:8px">
      {{ $t('pipeline.description.steps') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import DropZone from "@/Shared/Components/DropZone.vue";

const { t } = useI18n()
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
    status.value = t('common.status.processing')

    const fd = new FormData()
    for (const f of files.value) fd.append('files', f)

    const resp = await fetch('/pipeline/hard', { method: 'POST', body: fd })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(text || t('pipeline.errors.batchFailedFallback'))
    }

    const blob = await resp.blob()
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = u
    a.download = 'pipeline_1080_webp.zip'
    a.click()
    URL.revokeObjectURL(u)
    status.value = t('common.status.success')
  } catch (e:any) {
    console.error(e)
    status.value = e?.message || t('common.status.errorGeneric')
  } finally {
    busy.value = false
  }
}

onBeforeUnmount(() => {
  urls.value.forEach(u => URL.revokeObjectURL(u))
})
</script>
