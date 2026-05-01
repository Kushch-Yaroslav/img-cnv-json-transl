<template>
  <section :class="s.wrap">
    <div :class="s.controlsCard">
      <h1 :class="s.title">Перевод JSON</h1>

      <!-- МОДЕЛИ — наверху -->
      <div :class="s.models">
        <button type="button" :class="[s.modelCard, s.modelDisabled]" title="Скоро" disabled>
          <div :class="s.mIcon">⚙️</div>
          <div :class="s.mTitle">600M</div>
          <div :class="s.mDesc">легкая</div>
        </button>

        <button type="button" :class="[s.modelCard, s.modelDisabled]" title="Скоро" disabled>
          <div :class="s.mIcon">🧩</div>
          <div :class="s.mTitle">1.3B</div>
          <div :class="s.mDesc">сбалансированная</div>
        </button>

        <button type="button" :class="[s.modelCard, s.modelActive]" @click="force33B()">
          <div :class="s.mIcon">🧠</div>
          <div :class="s.mTitle">3.3B</div>
          <div :class="s.mDesc">текущая</div>
          <span :class="s.check">✓</span>
        </button>
      </div>

      <!-- Файл -->
      <div :class="s.row">
        <label :class="s.label">JSON-файл</label>
        <div :class="s.filePicker" @click="pickFile">
          <input
              ref="fileInputRef"
              type="file"
              accept="application/json"
              :class="s.fileInput"
              @change="onPick"
          />
          <div :class="s.fileBtn">Выбрать файл</div>
          <div :class="s.fileInfo" v-if="file">
            <span :class="s.fileName">{{ file?.name }}</span>
            <span :class="s.fileSize">{{ prettyBytes(file?.size || 0) }}</span>
          </div>
          <div v-else :class="s.filePlaceholder">Файл не выбран</div>
        </div>
      </div>

      <!-- Языки -->
      <div :class="s.rowGrid2">
        <div>
          <label :class="s.label">Исходный язык (пусто = авто)</label>
          <input :class="s.input" v-model="src" placeholder="it / ru / en ..." />
        </div>
        <div>
          <label :class="s.label">Целевой язык</label>
          <input :class="s.input" v-model="tgt" placeholder="en" />
        </div>
      </div>

      <!-- Кнопки -->
      <div :class="s.actions">
        <button :class="s.btnPrimary" :disabled="!file || busy || !tgt" @click="doTranslate">Перевести (ZIP)</button>
        <button :class="s.btnGhost" :disabled="!file" @click="toggleJsonView">
          {{ showJson ? 'Скрыть JSON' : 'Просмотреть JSON' }}
        </button>
        <button :class="s.btnGhost" :disabled="!file && !showJson" @click="resetAll">Сбросить</button>
        <span :class="s.status" :data-busy="busy">{{ status }}</span>
      </div>
    </div>

    <!-- Просмотр JSON -->
    <div v-if="showJson" :class="s.previewZone">
      <div :class="s.col">
        <div :class="s.colHead">
          <h3>Исходный JSON</h3>
          <span :class="s.pill">read-only</span>
        </div>
        <div :class="s.codeBox" v-html="highlightedSrc"></div>
      </div>

      <div :class="s.col">
        <div :class="s.colHead">
          <h3>Перевод</h3>
          <span v-if="busy" :class="s.pill">обработка…</span>
          <span v-else :class="[s.pill, s.ok]">готово</span>
        </div>
        <div :class="s.codeBox" v-html="highlightedDst"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import s from './JsonTranslatePage.module.css'
import { ref } from 'vue'
import { useJsonTranslate } from './Composables/useJsonTranslate'

const fileInputRef = ref<HTMLInputElement | null>(null)
const pickFile = () => fileInputRef.value?.click()

const {
  file, src, tgt, busy, status, showJson,
  highlightedSrc, highlightedDst,
  onPick, doTranslate, toggleJsonView, resetAll, prettyBytes, force33B
} = useJsonTranslate()
</script>
