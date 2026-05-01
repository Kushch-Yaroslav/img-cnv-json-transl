<template>
  <section :class="[s.wrap, s.ready]">
    <div :class="s.container">
      <header :class="s.header">
        <h1 :class="s.title">
          Remove <span :class="s.accent">Background</span>
        </h1>
        <p :class="s.subtitle">
          Удаление фона AI с предпросмотром. Модель и сессия — auto.
        </p>
      </header>

      <div :class="s.grid">
        <!-- Левая колонка: загрузка + миниатюры -->
        <div :class="[s.card, s.left]">
          <DropZone @picked="onPicked" />

          <div v-if="items.length" :class="s.stats">
            <span :class="s.badge">Файлов: {{ items.length }}</span>
            <span :class="[s.badge, s.alt]">Суммарно: {{ totalSize }}</span>
          </div>

          <div v-if="items.length" :class="s.previewGrid">
            <button
                v-for="it in items"
                :key="it.id"
                type="button"
                :class="[s.thumb, selectedId === it.id && s.thumbActive]"
                @click="select(it.id)"
                title="Предпросмотр"
            >
              <img :src="it.url" alt="" />
              <div :class="s.meta">
                <div :class="s.name" :title="it.file.name">{{ it.file.name }}</div>
                <div :class="s.sub">
                  <span>{{ it.dims?.w ?? '–' }}×{{ it.dims?.h ?? '–' }}</span>
                  <span>•</span>
                  <span>{{ fmtBytes(it.file.size) }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Правая колонка: настройки + сравнения для всех -->
        <div :class="[s.card, s.right]">
          <div :class="s.panel">
            <div :class="s.row">
              <label :class="s.label">Выходной формат</label>
              <select v-model="outputFormat" :class="s.select">
                <option value="png">PNG (прозрачность)</option>
                <option value="webp">WEBP</option>
                <option value="jpeg">JPEG (без прозрачности)</option>
                <option value="avif">AVIF</option>
              </select>
            </div>

            <div :class="s.row">
              <label :class="s.label">Цвет фона (для JPEG / опционально)</label>
              <input v-model="bgColor" type="color" :class="s.color" />
            </div>
          </div>

          <div v-if="items.length" :class="s.compare">
            <template v-for="it in items" :key="it.id">
              <div :class="s.col" @click="largeId = it.id; ensureOne(it, bgColor)">
                <div :class="s.caption">Оригинал</div>
                <div :class="s.checker">
                  <img :src="it.url" alt="" />
                </div>
              </div>

              <div :class="s.col" @click="largeId = it.id; ensureOne(it, bgColor)">
                <div :class="s.caption">Без фона</div>
                <div v-if="states[it.id]?.loading" :class="s.note">Обработка…</div>
                <div v-else-if="states[it.id]?.error" :class="[s.note, s.error]">{{ states[it.id]?.error }}</div>
                <div v-else :class="s.checker">
                  <img v-if="states[it.id]?.url" :src="states[it.id]?.url" alt="" />
                </div>
              </div>
            </template>
          </div>

          <div :class="s.actions">
            <button :disabled="busy || !items.length" :class="s.btnPrimary" @click="removeBatch">
              Удалить фон (ZIP)
            </button>
            <button type="button" :disabled="!items.length" :class="s.btnGhost" @click="clearFiles">
              Очистить файлы
            </button>
            <span :class="[s.muted, s.status]">{{ status }}</span>
          </div>
        </div>
      </div>

      <!-- Большой слайдер 1000×1000 снизу -->
      <div v-if="largeItem && states[largeItem.id]?.url" style="padding:16px">
        <h3 style="margin:0 0 8px; font-weight:900; letter-spacing:.3px">
          Сравнение 1000×1000 — {{ largeItem.file.name }}
        </h3>
        <CompareSlider :before="largeBefore" :after="largeAfter" :size="1000" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from 'vue'
import s from './RemoveBgPage.module.css'

import { fmtBytes } from '@/Shared/Helpers/bytes'
import DropZone from '@/Shared/Components/DropZone.vue'

import { useRmbgFiles, type RItem } from './Composables/useRmbgFiles'
import { useRmbgBatch } from './Composables/useRmbgBatch'
import {useRmbgPreviews} from "@/Pages/RemoveBgPage/Composables/useRmbgPreview";
import CompareSlider from "@/Pages/RemoveBgPage/Components/CompareSlider.vue";
import type { ImageOutputFormat } from '@/shared/types/image'

const { items, selectedId, onPicked, select, clearAll: clearFiles } = useRmbgFiles()

const outputFormat = ref<ImageOutputFormat>('png')
const bgColor = ref('') // пусто => прозрачность

// Предпросмотры: либо префетчим все, либо делаем лениво через ensureOne()
const { states, prefetchAll, ensureOne, clearAll: clearPreviews } = useRmbgPreviews()
prefetchAll(items, bgColor) // убери эту строку, если хочешь ленивую генерацию по клику

// Для большого «до/после»
const largeId = ref<string | null>(null)
const largeItem = computed(() => items.value.find(i => i.id === largeId.value) || null)
const largeBefore = computed(() => largeItem.value?.url || '')
const largeAfter  = computed(() => (largeItem.value && states.value[largeItem.value.id]?.url) || '')

// useRmbgBatch ожидает Ref<File[]>
const filesRef = computed(() => items.value.map(i => i.file))
const { busy, status, removeBatch } = useRmbgBatch({ files: filesRef, outputFormat, bgColor })

const totalSize = computed(() => {
  const sum = items.value.reduce((a, it) => a + it.file.size, 0)
  return fmtBytes(sum)
})

onBeforeUnmount(() => {
  clearFiles()
  clearPreviews()
})
</script>
