<template>
  <form :class="s.panel" @submit.prevent>
    <!-- Формат -->
    <div v-if="showFormatSection" :class="s.row">
      <label :class="s.label">Формат вывода</label>
      <select v-model="model.outputFormat" :class="s.select">
        <option value="same">Сохранить как есть</option>
        <option value="webp">WebP</option>
        <option value="jpeg">JPEG</option>
        <option value="png">PNG</option>
        <option value="avif">AVIF</option>
      </select>
    </div>

    <!-- Изменить размер -->
    <div v-if="showResizeSection" :class="s.row">
      <label :class="s.checkbox">
        <input type="checkbox" v-model="model.resize"> Изменить размер
      </label>
      <div :class="s.grid2">
        <label :class="s.inline">Max width
          <input type="number" :class="s.input" v-model.number="model.maxWidth" :disabled="!model.resize" placeholder="напр. 1600">
        </label>
        <label :class="s.inline">Max height
          <input type="number" :class="s.input" v-model.number="model.maxHeight" :disabled="!model.resize" placeholder="опционально">
        </label>
      </div>
    </div>


    <!-- Мульти-размеры -->
    <div v-if="showMultiResizeSection" :class="[s.row, multiResizeDisabled && s.disabledRow]">
      <label :class="s.checkbox">
        <input type="checkbox" v-model="model.multiResize" :disabled="multiResizeDisabled"> Мульти-размеры
      </label>

      <div v-if="model.multiResize" :class="s.variants">
        <div :class="s.actionsRow">
          <button type="button" :class="s.btnGhost" :disabled="multiResizeDisabled" @click="addVariant()">+ Добавить размер</button>
          <button type="button" :class="s.btnGhost" :disabled="multiResizeDisabled" @click="resetAll()">Сбросить всё</button>
          <button type="button" :class="s.btnGhost" :disabled="multiResizeDisabled" @click="sortAll()">Сортировать</button>
        </div>

        <div :class="s.presetArea">
          <!-- левая колонка: режим -->
          <div :class="s.modeCol">
            <div :class="s.inline">
              <strong>Режим наборов</strong>
              <div :class="s.modeToggle">
                <button
                    type="button"
                    :class="[s.modeOption, model.multiMode === 'switch' && s.modeOptionActive]"
                    :aria-pressed="model.multiMode === 'switch'"
                    :disabled="multiResizeDisabled"
                    @click="setMode('switch')"
                >Переключать</button>

                <label :class="s.switch" :title="model.multiMode === 'add' ? 'Добавлять' : 'Переключать'">
                  <input type="checkbox" :checked="model.multiMode === 'add'" :disabled="multiResizeDisabled" @change="onToggleMode" />
                  <span :class="s.slider"></span>
                </label>

                <button
                    type="button"
                    :class="[s.modeOption, model.multiMode === 'add' && s.modeOptionActive]"
                    :aria-pressed="model.multiMode === 'add'"
                    :disabled="multiResizeDisabled"
                    @click="setMode('add')"
                >Добавлять</button>
              </div>
            </div>
          </div>

          <!-- правая колонка: сетка пресетов -->
          <div :class="s.buttonsCol">
            <div :class="s.presetGrid">
              <button type="button" :class="[s.presetBtn, isSetActive('desktop') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="applySet('desktop')">Десктопы</button>
              <button type="button" :class="[s.presetBtn, isSetActive('tablet') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="applySet('tablet')">Планшеты</button>
              <button type="button" :class="[s.presetBtn, isSetActive('phone') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="applySet('phone')">Телефоны</button>
              <button type="button" :class="[s.presetBtn, isSetActive('all') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="applySet('all')">Все сразу</button>
              <button type="button" :class="[s.presetBtn, isSetActive('macro1') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="applySet('macro1')">Макрос 1</button>
            </div>
          </div>
        </div>


        <!-- текущие размеры -->
        <div v-for="v in model.variants" :key="v._k" :class="s.grid3">
          <label :class="s.inline">W
            <input type="number" min="1" :class="s.input" v-model.number="v.w" :disabled="multiResizeDisabled" placeholder="напр. 1080">
          </label>
          <label :class="s.inline">H
            <input type="number" min="1" :class="s.input" v-model.number="v.h" :disabled="multiResizeDisabled" placeholder="опц.">
          </label>
          <button type="button" :class="s.btnSmall" :disabled="multiResizeDisabled" @click="removeByKey(v._k!)">Удалить</button>
        </div>


        <p :class="s.muted">Если указать только ширину — высота подберётся пропорционально (fit: inside).</p>
      </div>
    </div>

    <div v-if="showFoldersSection" :class="s.row">
      <label :class="s.checkbox">
        <input
            type="checkbox"
            :checked="model.inFolders"
            @change="onInFoldersChange"
        >
        Сохранять в папках
      </label>
    </div>


    <!-- Остальные опции -->
    <div v-if="showLosslessSection" :class="s.row">
      <label :class="s.checkbox"><input type="checkbox" v-model="model.lossless"> Lossless (без потерь)</label>
    </div>

    <div v-if="showQualitySection" :class="s.row">
      <label :class="s.label">Качество (для lossy): <span :class="s.kv">{{ model.quality }}</span></label>
      <input type="range" min="30" max="100" v-model.number="model.quality" :class="s.range">
    </div>

    <div v-if="showTargetSizeSection" :class="s.row">
      <label :class="s.checkbox"><input type="checkbox" v-model="model.useTarget"> Целевой вес (KB)</label>
      <input type="number" :class="s.input" v-model.number="model.targetKb" :disabled="!model.useTarget" min="10" step="10" placeholder="например 180">
    </div>

    <div v-if="showOptimizeSection" :class="s.row">
      <label :class="s.checkbox"><input type="checkbox" v-model="model.stripMetadata"> Удалить EXIF/метаданные</label>
      <label :class="s.checkbox"><input type="checkbox" v-model="model.minSize"> minSize</label>
      <label :class="s.checkbox"><input type="checkbox" v-model="model.smartSubsample"> smartSubsample</label>
    </div>

    <slot />
  </form>
</template>

<script setup lang="ts">
import s from './OptionsPanel.module.css'
import { useMultiResize } from '@/Pages/ConvertPage/Composables/useMultiResize'
import { computed, ref, watch } from 'vue'   // 👈 добавляем
import type { ConvertOptions, MultiResizeMode } from '@/shared/types/image'
import type { OptimizerMode } from '@/Pages/Home/config/toolsConfig'
import type { AppMode } from '@/shared/types/appConfig'

export type OptionsModel = ConvertOptions

const props = withDefaults(defineProps<{
  mode?: OptimizerMode
  appMode?: AppMode
}>(), {
  mode: 'all-in-one',
  appMode: 'development',
})

const model = defineModel<OptionsModel>({ required: true })
const { addVariant, removeByKey, resetAll, sortAll, applySet, isSetActive } = useMultiResize(model)

const isAllInOne = computed(() => props.mode === 'all-in-one')
const isCompress = computed(() => props.mode === 'compress')
const isResize = computed(() => props.mode === 'resize')
const isFormat = computed(() => props.mode === 'format')
const isFreeMode = computed(() => props.appMode === 'free')
const isLossyFormat = computed(() =>
    model.value.outputFormat === 'jpeg' ||
    model.value.outputFormat === 'webp' ||
    model.value.outputFormat === 'avif'
)

const showFormatSection = computed(() => isAllInOne.value || isResize.value || isFormat.value)
const showResizeSection = computed(() => isAllInOne.value || isResize.value)
const showMultiResizeSection = computed(() => isAllInOne.value || isResize.value)
const showFoldersSection = computed(() => isAllInOne.value || (isResize.value && !isFreeMode.value))
const showLosslessSection = computed(() => isAllInOne.value)
const showQualitySection = computed(() =>
    isAllInOne.value ||
    isCompress.value ||
    (isFormat.value && isLossyFormat.value && !isFreeMode.value)
)
const showTargetSizeSection = computed(() => isAllInOne.value || isCompress.value)
const showOptimizeSection = computed(() => isAllInOne.value || isCompress.value)
const multiResizeDisabled = computed(() => isFreeMode.value && showMultiResizeSection.value)

// --- режим мультисетов
function onToggleMode(e: Event) {
  if (multiResizeDisabled.value) return
  const checked = (e.target as HTMLInputElement).checked
  model.value.multiMode = checked ? 'add' : 'switch'
}

function setMode(m: MultiResizeMode) {
  if (multiResizeDisabled.value) return
  model.value.multiMode = m
}

// --- НОВОЕ: логика галки "Сохранять в папках"

// пользователь уже трогал галку вручную?
const userTouchedInFolders = ref(false)

function onInFoldersChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  userTouchedInFolders.value = true
  model.value.inFolders = checked
}

// авто-включаем inFolders, если включили resize или multiResize
watch(
    () => [model.value.resize, model.value.multiResize],
    ([resize, multi]) => {
      if (!userTouchedInFolders.value) {
        // если хотя бы один из режимов ресайза включён — галка включается
        model.value.inFolders = !!(resize || multi)
      }
    },
    { immediate: true }
)

watch(
    () => [props.appMode, props.mode] as const,
    ([appMode, mode]) => {
      if (appMode === 'free' && (mode === 'all-in-one' || mode === 'resize')) {
        model.value.multiResize = false
      }

      if (appMode === 'free' && mode === 'format') {
        model.value.quality = 100
      }
    },
    { immediate: true }
)
</script>


<style module src="./OptionsPanel.module.css" />
