<template>
  <div v-if="items.length" :class="s.grid">
    <div :class="[s.item, it.cropped && s.itemCropped]" v-for="it in items" :key="it.id">
      <div :class="s.thumbWrap" @click="$emit('edit', it.id)">
        <button type="button" :class="s.closeBtn" :title="$t('previewGrid.remove.title')" @click.stop="$emit('remove', it.id)">×</button>
        <img :src="urls.get(it.current)!" :alt="it.current.name" :class="s.thumb" />
        <div :class="s.thumbGlow" aria-hidden="true"></div>
      </div>
      <div :class="s.meta">
        <div :class="s.name" :title="it.current.name">{{ it.current.name }}</div>
        <div :class="s.row">
          <span :class="s.size">{{ fmtBytes(it.current.size) }}</span>
          <span :class="[s.badge, it.cropped && s.badgeOn]">{{ it.cropped ? $t('previewGrid.badges.cropped') : $t('previewGrid.badges.original') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watchEffect } from 'vue'
import s from './PreviewGrid.module.css'
import type { UFile } from '@/Pages/ConvertPage/Composables/useFiles'

const props = defineProps<{ items: UFile[] }>()
defineEmits<{ (e:'remove', id:string):void, (e:'edit', id:string):void }>()

const urls = ref(new Map<File, string>())

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1024/1024).toFixed(2)} MB`
}

watchEffect(() => {
  urls.value.forEach((u) => URL.revokeObjectURL(u))
  urls.value = new Map()
  for (const it of props.items) {
    const u = URL.createObjectURL(it.current)
    urls.value.set(it.current, u)
  }
})

onBeforeUnmount(() => { urls.value.forEach(u => URL.revokeObjectURL(u)) })
</script>

<style module src="./PreviewGrid.module.css" />
