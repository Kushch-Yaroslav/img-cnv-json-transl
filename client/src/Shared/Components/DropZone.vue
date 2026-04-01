<template>
  <div
      :class="[s.drop, hovering && s.hover]"
      @dragenter.prevent="hovering = true"
      @dragover.prevent="hovering = true"
      @dragleave.prevent="hovering = false"
      @drop.prevent="onDrop"
      @click="open"
  >
    <input
        ref="fileEl"
        type="file"
        multiple
        accept="image/*"
        :class="s.native"
        @change="onChange"
    />

    <div :class="s.icon" aria-hidden="true">⬆</div>
    <h3 :class="s.title">Перетащи сюда файлы</h3>
    <p :class="s.subtitle">…или нажми, чтобы выбрать</p>

    <div :class="s.hintRow">
      <span class="chip">JPG</span>
      <span class="chip">PNG</span>
      <span class="chip">WEBP</span>
      <span class="chip">AVIF</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import s from './DropZone.module.css'

const hovering = ref(false)
const fileEl = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{ (e: 'picked', files: File[]): void }>()

function open() {
  fileEl.value?.click()
}

function filterImages(arr: File[]) {
  return arr.filter(f => f.type.startsWith('image/'))
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    const arr = Array.from(input.files)
    emit('picked', filterImages(arr))
  }
}

function onDrop(e: DragEvent) {
  hovering.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    const arr = Array.from(files)
    emit('picked', filterImages(arr))
  }
}
</script>


<style module src="./DropZone.module.css" />
