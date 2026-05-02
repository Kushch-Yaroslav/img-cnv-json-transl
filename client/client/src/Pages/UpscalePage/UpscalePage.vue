<template>
  <section :class="[s.wrap, s.ready]">
    <div :class="s.container">
      <header :class="s.header">
        <h1 :class="s.title">
          {{ $t('upscale.title.start') }} <span :class="s.accent">{{ $t('upscale.title.accent') }}</span>
        </h1>
        <p :class="s.subtitle">
          {{ $t('upscale.subtitle') }}
        </p>
      </header>

      <div :class="s.grid">
        <div :class="[s.card, s.left]">
          <DropZone @picked="onPicked" />
          <div v-if="files.length" :class="s.stats">
            <span :class="s.badge">{{ $t('upscale.stats.files') }} {{ files.length }}</span>
            <span :class="[s.badge, s.alt]">{{ $t('upscale.stats.totalSize') }} {{ totalSize }}</span>
          </div>

          <div v-if="files.length" :class="s.previewGrid">
            <button
                v-for="f in files"
                :key="f.name + f.size"
                type="button"
                :class="[s.thumb, selected === f && s.thumbActive]"
                @click="select(f)"
                :title="$t('upscale.preview.title')"
            >
              <img :src="urls.get(f)!" alt="" />
              <div :class="s.meta">
                <div :class="s.name" :title="f.name">{{ f.name }}</div>
                <div :class="s.sub">
                  <span>{{ dims.get(f)?.w ?? '–' }}×{{ dims.get(f)?.h ?? '–' }}</span>
                  <span>•</span>
                  <span>{{ fmtBytes(f.size) }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div :class="[s.card, s.right]">
          <div :class="s.panel">
            <div :class="s.row">
              <label :class="s.label">{{ $t('upscale.options.method') }}</label>
              <select v-model="method" :class="s.select">
                <option value="nonai">{{ $t('upscale.options.methodNonAi') }}</option>
                <option value="realesrgan">{{ $t('upscale.options.methodRealEsrgan') }}</option>
                <option value="waifu2x">{{ $t('upscale.options.methodWaifu2x') }}</option>
              </select>
            </div>

            <div :class="s.row">
              <label :class="s.label">{{ $t('upscale.options.targetSize') }}</label>
              <input
                  v-model.number="targetSize"
                  :class="s.input"
                  type="number" min="256" step="64"
                  :placeholder="$t('upscale.options.targetSizePlaceholder')"
              />
            </div>

            <div v-if="method==='realesrgan'" :class="s.row2">
              <div>
                <label :class="s.label">{{ $t('upscale.options.model') }}</label>
                <select v-model="aiModel" :class="s.select">
                  <option value="realesrgan-x4plus">{{ $t('upscale.options.modelX4plus') }}</option>
                  <option value="realesrgan-x4plus-anime">{{ $t('upscale.options.modelX4plusAnime') }}</option>
                </select>
              </div>
              <div :class="s.hint">{{ $t('upscale.hints.gpuAcceleration') }}</div>
            </div>

            <div v-if="method==='waifu2x'" :class="s.row2">
              <div>
                <label :class="s.label">{{ $t('upscale.options.noiseReduction') }}</label>
                <select v-model.number="waifuNoise" :class="s.select">
                  <option :value="0">0</option><option :value="1">1</option>
                  <option :value="2">2</option><option :value="3">3</option>
                </select>
              </div>
              <div :class="s.hint">{{ $t('upscale.hints.artManga') }}</div>
            </div>
          </div>

          <div v-if="selected" :class="s.compare">
            <div :class="s.col">
              <div :class="s.caption">{{ $t('upscale.compare.original') }}</div>
              <div :class="s.checker">
                <img :src="urls.get(selected)!" alt="" />
              </div>
            </div>
            <div :class="s.col">
              <div :class="s.caption">{{ $t('upscale.compare.result') }}</div>
              <div v-if="loadingPrev" :class="s.note">{{ $t('common.status.processing') }}</div>
              <div v-else-if="previewError" :class="[s.note, s.error]">{{ previewError }}</div>
              <div v-else :class="s.checker">
                <img v-if="previewUrl" :src="previewUrl" alt="" />
              </div>
            </div>
          </div>

          <div :class="s.actions">
            <button :disabled="busy || !files.length" :class="s.btnPrimary" @click="run">
              {{ $t('upscale.actions.submit') }}
            </button>
            <button type="button" :disabled="!files.length" :class="s.btnGhost" @click="clearFiles">
              {{ $t('common.actions.clearFiles') }}
            </button>
            <span :class="[s.muted, s.status]">{{ status }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import s from './UpscalePage.module.css'

import { fmtBytes } from '@/Shared/Helpers/bytes'
import { useUpscaleFiles } from './Composables/useUpscaleFiles'
import { useUpscalePreview } from './Composables/useUpscalePreview'
import { useUpscaleBatch } from './Composables/useUpscaleBatch'
import DropZone from "@/Shared/Components/DropZone.vue";

const method = ref<'nonai'|'realesrgan'|'waifu2x'>('nonai')
const targetSize = ref(1000)
const aiModel = ref<'realesrgan-x4plus'|'realesrgan-x4plus-anime'>('realesrgan-x4plus')
const waifuNoise = ref<0|1|2|3>(0)


const { files, urls, dims, onPicked, select, selected, clearAll: clearFiles } = useUpscaleFiles()

const { previewUrl, loadingPrev, previewError, hookTo } = useUpscalePreview()
hookTo({ selected, method, targetSize, aiModel, waifuNoise })

const { busy, status, run } = useUpscaleBatch({ files, method, targetSize, aiModel, waifuNoise })

const totalSize = computed(() => fmtBytes(files.value.reduce((a,f)=>a+f.size,0)))
</script>
