<template>
  <section :class="[s.wrap, ready && s.ready]">
    <div :class="s.container">
      <header :class="s.header">
        <h1 :class="s.title">{{ modeCopy.titleStart }} <span :class="s.accent">{{ modeCopy.titleAccent }}</span></h1>
        <p :class="s.subtitle">
          {{ modeCopy.subtitle }}
        </p>
      </header>

      <div :class="s.card">
        <DropZone @picked="onPicked" />
      </div>

      <div v-if="files.length || showSourceCounter" :class="s.stats">
        <div v-if="files.length" :class="s.badge">Файлов: <strong>{{ files.length }}</strong></div>
        <div v-if="files.length" :class="s.badge">Суммарно: <strong>{{ totalSize }}</strong></div>
        <div v-if="showSourceCounter" :class="[s.badge, sourceLimitExceeded && s.badgeWarn]">
          Source images: <strong>{{ sourceCounterText }}</strong>
        </div>
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
          <OptionsPanel v-model="opts" :mode="optimizerMode" :app-mode="effectiveAppMode">

            <div :class="s.actions">
              <button
                  :class="s.btnPrimary"
                  :disabled="busy || !files.length"
                  @click="runConvert"
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
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import DropZone from '@/Shared/Components/DropZone.vue'

import {UFile, useFiles} from '@/Pages/ConvertPage/Composables/useFiles'
import { useOptions } from '@/Pages/ConvertPage/Composables/useOptions'
import { useConvert } from '@/Pages/ConvertPage/Composables/useConvert'

import s from './ConvertPage.module.css'
import PreviewGrid from "@/Pages/ConvertPage/Components/PreviewGrid/PreviewGrid.vue";
import OptionsPanel, {OptionsModel} from "@/Pages/ConvertPage/Components/OptionsPanel/OptionsPanel.vue";
import CropModal from "@/Pages/ConvertPage/Components/CropModal/CropModal.vue";
import { getAppConfig } from '@/shared/config/appConfig'
import type { OptimizerMode } from '@/Pages/Home/config/toolsConfig'
import {
  APP_MODE_PREVIEW_CHANGE_EVENT,
  getEffectiveAppMode,
} from '@/shared/config/appModePreview'

const ready = ref(false)
const route = useRoute()
const appConfig = getAppConfig()
const effectiveAppMode = ref(getEffectiveAppMode(appConfig.mode))
const props = defineProps<{
  optimizerMode?: OptimizerMode
}>()

const optimizerModes: OptimizerMode[] = ['all-in-one', 'compress', 'resize', 'format', 'crop']
const optimizerMode = computed<OptimizerMode>(() => {
  if (props.optimizerMode && optimizerModes.includes(props.optimizerMode)) {
    return props.optimizerMode
  }

  const mode = route.meta.optimizerMode
  return typeof mode === 'string' && optimizerModes.includes(mode as OptimizerMode)
      ? mode as OptimizerMode
      : 'all-in-one'
})

const modeCopyMap: Record<OptimizerMode, { titleStart: string; titleAccent: string; subtitle: string }> = {
  'all-in-one': {
    titleStart: 'All-in-One',
    titleAccent: 'Image Optimizer',
    subtitle: 'Convert, compress, resize, crop and export in one workflow',
  },
  compress: {
    titleStart: 'Compress',
    titleAccent: 'Images',
    subtitle: 'Reduce file size for faster web pages',
  },
  resize: {
    titleStart: 'Resize',
    titleAccent: 'Images',
    subtitle: 'Prepare exact sizes for web and marketplaces',
  },
  format: {
    titleStart: 'Convert',
    titleAccent: 'Format',
    subtitle: 'Switch between JPEG, PNG, WebP and AVIF',
  },
  crop: {
    titleStart: 'Crop',
    titleAccent: 'Images',
    subtitle: 'Frame product images and thumbnails',
  },
}
const modeCopy = computed(() => modeCopyMap[optimizerMode.value])

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

const usedSourceImagesCount = ref(0)
const pendingSourceImagesCount = computed(() => files.value.length)
const showSourceCounter = computed(() => effectiveAppMode.value === 'free')
const sourceImagesLimit = computed<number | null>(() => {
  if (!showSourceCounter.value) return null
  return optimizerMode.value === 'all-in-one' ? 5 : 20
})
const sourceLimitExceeded = computed(() =>
    sourceImagesLimit.value !== null &&
    usedSourceImagesCount.value + pendingSourceImagesCount.value > sourceImagesLimit.value
)
const sourceCounterText = computed(() => {
  const limit = sourceImagesLimit.value
  if (limit === null) return ''
  const pending = pendingSourceImagesCount.value
  const used = usedSourceImagesCount.value
  return pending > 0 ? `${used}(+${pending})/${limit}` : `${used}/${limit}`
})

async function runConvert() {
  if (sourceLimitExceeded.value) {
    status.value = `Free limit: ${sourceImagesLimit.value} source images`
    return
  }
  const pending = pendingSourceImagesCount.value
  const converted = await convert()
  if (converted && showSourceCounter.value) {
    usedSourceImagesCount.value += pending
  }
}

function syncAppMode() {
  effectiveAppMode.value = getEffectiveAppMode(appConfig.mode)
}

onMounted(() => {
  window.addEventListener(APP_MODE_PREVIEW_CHANGE_EVENT, syncAppMode)
  requestAnimationFrame(() => (ready.value = true))
})

onBeforeUnmount(() => {
  window.removeEventListener(APP_MODE_PREVIEW_CHANGE_EVENT, syncAppMode)
})
</script>

<style module src="./ConvertPage.module.css" />
