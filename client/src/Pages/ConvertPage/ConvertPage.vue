<template>
  <section :class="[s.wrap, ready && s.ready]">
    <div :class="s.container">
      <header :class="s.header">
        <h1 :class="s.title">Image <span :class="s.accent">Tools</span> — Convert</h1>
        <p :class="s.subtitle">
          Конвертируй и оптимизируй изображения мгновенно. Красиво. Удобно. Быстро.
        </p>
      </header>

      <div :class="s.card">
        <DropZone @picked="onPicked" />
      </div>

      <div v-if="files.length" :class="s.stats">
        <div :class="s.badge">Файлов: <strong>{{ files.length }}</strong></div>
        <div :class="s.badge">Суммарно: <strong>{{ totalSize }}</strong></div>
      </div>

      <div :class="s.grid">
        <div :class="s.card">
          <PreviewGrid
              :items="items"
              @remove="removeById"
              @edit="openCrop"
          />

          <CropModal
              :open="cropOpen"
              :file="cropTarget?.current"
              @close="closeCrop"
              @save="saveCropped"
              @restore="restoreOriginal"
          />        </div>

        <div :class="s.card">
          <OptionsPanel v-model="opts">

            <div :class="s.actions">
              <button
                  :class="s.btnPrimary"
                  :disabled="busy || !files.length"
                  @click="convert"
              >
                {{ busy ? 'Конвертирую…' : 'Конвертировать' }}
              </button>
              <button
                  type="button"
                  :class="s.btnGhost"
                  :disabled="!files.length || busy"
                  @click="clearFiles"
              >
                Очистить файлы
              </button>
              <span :class="[s.muted, s.status]">{{ status }}</span>
            </div>
          </OptionsPanel>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DropZone from '@/Shared/Components/DropZone.vue'

import {UFile, useFiles} from '@/Pages/ConvertPage/Composables/useFiles'
import { useOptions } from '@/Pages/ConvertPage/Composables/useOptions'
import { useConvert } from '@/Pages/ConvertPage/Composables/useConvert'

import s from './ConvertPage.module.css'
import PreviewGrid from "@/Pages/ConvertPage/Components/PreviewGrid/PreviewGrid.vue";
import OptionsPanel, {OptionsModel} from "@/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue";
import CropModal from "@/Pages/ConvertPage/Components/CropModal/CropModal.vue";

const ready = ref(false)

const { items, files, onPicked, clearFiles, totalSize,
  removeById, replaceById, restoreById } = useFiles()

// для модалки
const cropOpen = ref(false)
const cropTarget = ref<UFile|null>(null)

function openCrop(id: string) {
  const it = items.value.find(x => x.id === id) || null
  if (!it) return
  cropTarget.value = it
  cropOpen.value = true
}
function closeCrop(){ cropOpen.value = false }
function saveCropped(file: File) {
  if (!cropTarget.value) return
  replaceById(cropTarget.value.id, file)
}
function restoreOriginal() {
  if (!cropTarget.value) return
  restoreById(cropTarget.value.id)
}
const { opts } = useOptions<OptionsModel>()
const { busy, status, convert } = useConvert<OptionsModel>({ files, opts })

onMounted(() => {
  requestAnimationFrame(() => (ready.value = true))
})
</script>

<style module src="./ConvertPage.module.css" />
