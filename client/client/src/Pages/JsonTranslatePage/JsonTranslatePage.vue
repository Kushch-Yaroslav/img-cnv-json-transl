<template>
  <section :class="s.wrap">
    <div :class="s.controlsCard">
      <h1 :class="s.title">{{ $t('jsonTranslate.title') }}</h1>

      <!-- МОДЕЛИ — наверху -->
      <div :class="s.models">
        <button type="button" :class="[s.modelCard, s.modelDisabled]" :title="$t('common.badges.comingSoonShort')" disabled>
          <div :class="s.mIcon">⚙️</div>
          <div :class="s.mTitle">600M</div>
          <div :class="s.mDesc">{{ $t('jsonTranslate.models.small.description') }}</div>
        </button>

        <button type="button" :class="[s.modelCard, s.modelDisabled]" :title="$t('common.badges.comingSoonShort')" disabled>
          <div :class="s.mIcon">🧩</div>
          <div :class="s.mTitle">1.3B</div>
          <div :class="s.mDesc">{{ $t('jsonTranslate.models.medium.description') }}</div>
        </button>

        <button type="button" :class="[s.modelCard, s.modelActive]" @click="force33B()">
          <div :class="s.mIcon">🧠</div>
          <div :class="s.mTitle">3.3B</div>
          <div :class="s.mDesc">{{ $t('jsonTranslate.models.active.description') }}</div>
          <span :class="s.check">✓</span>
        </button>
      </div>

      <!-- Файл -->
      <div :class="s.row">
        <label :class="s.label">{{ $t('jsonTranslate.file.label') }}</label>
        <div :class="s.filePicker" @click="pickFile">
          <input
              ref="fileInputRef"
              type="file"
              accept="application/json"
              :class="s.fileInput"
              @change="onPick"
          />
          <div :class="s.fileBtn">{{ $t('common.actions.selectFile') }}</div>
          <div :class="s.fileInfo" v-if="file">
            <span :class="s.fileName">{{ file?.name }}</span>
            <span :class="s.fileSize">{{ prettyBytes(file?.size || 0) }}</span>
          </div>
          <div v-else :class="s.filePlaceholder">{{ $t('jsonTranslate.file.empty') }}</div>
        </div>
      </div>

      <!-- Языки -->
      <div :class="s.rowGrid2">
        <div>
          <label :class="s.label">{{ $t('jsonTranslate.languages.source') }}</label>
          <input :class="s.input" v-model="src" :placeholder="$t('jsonTranslate.languages.sourcePlaceholder')" />
        </div>
        <div>
          <label :class="s.label">{{ $t('jsonTranslate.languages.target') }}</label>
          <input :class="s.input" v-model="tgt" :placeholder="$t('jsonTranslate.languages.targetPlaceholder')" />
        </div>
      </div>

      <!-- Кнопки -->
      <div :class="s.actions">
        <button :class="s.btnPrimary" :disabled="!file || busy || !tgt" @click="doTranslate">{{ $t('jsonTranslate.actions.submit') }}</button>
        <button :class="s.btnGhost" :disabled="!file" @click="toggleJsonView">
          {{ showJson ? $t('jsonTranslate.actions.hidePreview') : $t('jsonTranslate.actions.showPreview') }}
        </button>
        <button :class="s.btnGhost" :disabled="!file && !showJson" @click="resetAll">{{ $t('common.actions.reset') }}</button>
        <span :class="s.status" :data-busy="busy">{{ status }}</span>
      </div>
    </div>

    <!-- Просмотр JSON -->
    <div v-if="showJson" :class="s.previewZone">
      <div :class="s.col">
        <div :class="s.colHead">
          <h3>{{ $t('jsonTranslate.preview.sourceTitle') }}</h3>
          <span :class="s.pill">{{ $t('jsonTranslate.preview.readOnly') }}</span>
        </div>
        <div :class="s.codeBox" v-html="highlightedSrc"></div>
      </div>

      <div :class="s.col">
        <div :class="s.colHead">
          <h3>{{ $t('jsonTranslate.preview.resultTitle') }}</h3>
          <span v-if="busy" :class="s.pill">{{ $t('common.status.processingLower') }}</span>
          <span v-else :class="[s.pill, s.ok]">{{ $t('common.status.ready') }}</span>
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
