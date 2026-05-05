<template>
  <form :class="s.panel" @submit.prevent>
    <!-- Формат -->
    <div v-if="showFormatSection" :class="s.row">
      <label :class="s.label">{{ $t('convert.options.outputFormat.label') }}</label>
      <select v-model="model.outputFormat" :class="s.select">
        <option value="same">{{ $t('convert.options.outputFormat.same') }}</option>
        <option value="webp">WebP</option>
        <option value="jpeg">JPEG</option>
        <option value="png">PNG</option>
        <option value="avif">AVIF</option>
      </select>
    </div>

    <!-- Изменить размер -->
    <div v-if="showResizeSection" :class="s.row">
      <label :class="s.checkbox">
        <input type="checkbox" v-model="model.resize"> {{ $t('convert.options.resize.toggle') }}
      </label>
      <div :class="s.grid2">
        <label :class="s.inline">{{ $t('convert.options.resize.maxWidth') }}
          <input type="number" :class="s.input" v-model.number="model.maxWidth" :disabled="!model.resize" :placeholder="$t('convert.options.resize.maxWidthPlaceholder')">
        </label>
        <label :class="s.inline">{{ $t('convert.options.resize.maxHeight') }}
          <input type="number" :class="s.input" v-model.number="model.maxHeight" :disabled="!model.resize" :placeholder="$t('common.placeholders.optional')">
        </label>
      </div>
    </div>


    <!-- Мульти-размеры -->
    <div v-if="showMultiResizeSection" :class="[s.row, multiResizeDisabled && s.disabledRow]">
      <label :class="s.checkbox">
        <input type="checkbox" v-model="model.multiResize" :disabled="multiResizeDisabled"> {{ $t('convert.options.multiResize.toggle') }}
      </label>

      <div v-if="model.multiResize" :class="s.variants">
        <div :class="s.actionsRow">
          <button type="button" :class="s.btnGhost" :disabled="multiResizeDisabled" @click="onAddVariant">{{ $t('convert.options.multiResize.addVariant') }}</button>
          <button type="button" :class="s.btnGhost" :disabled="multiResizeDisabled" @click="resetAll()">{{ $t('common.actions.resetAll') }}</button>
          <button type="button" :class="s.btnGhost" :disabled="multiResizeDisabled" @click="sortAll()">{{ $t('common.actions.sort') }}</button>
        </div>

        <div v-if="showSelectedSizesCounter" :class="[s.limitBadge, selectedSizesOverLimit && s.limitBadgeWarn]">
          {{ $t('convert.options.multiResize.selectedSizes') }} <strong>{{ validVariantCount }} / 10</strong>
        </div>

        <p v-if="showSelectedSizesCounter && selectedSizesOverLimit" :class="[s.muted, s.warningText]">
          {{ $t('convert.limits.freeResizeMultiSelectedSizes', { count: 10 }) }}
        </p>

        <div :class="s.presetArea">
          <!-- левая колонка: режим -->
          <div :class="s.modeCol">
            <div :class="s.inline">
              <strong>{{ $t('convert.options.multiResize.modeLabel') }}</strong>
              <div :class="s.modeToggle">
                <button
                    type="button"
                    :class="[s.modeOption, model.multiMode === 'switch' && s.modeOptionActive]"
                    :aria-pressed="model.multiMode === 'switch'"
                    :disabled="multiResizeDisabled"
                    @click="setMode('switch')"
                >{{ $t('convert.options.multiResize.mode.switch') }}</button>

                <label :class="s.switch" :title="model.multiMode === 'add' ? $t('convert.options.multiResize.mode.add') : $t('convert.options.multiResize.mode.switch')">
                  <input type="checkbox" :checked="model.multiMode === 'add'" :disabled="multiResizeDisabled" @change="onToggleMode" />
                  <span :class="s.slider"></span>
                </label>

                <button
                    type="button"
                    :class="[s.modeOption, model.multiMode === 'add' && s.modeOptionActive]"
                    :aria-pressed="model.multiMode === 'add'"
                    :disabled="multiResizeDisabled"
                    @click="setMode('add')"
                >{{ $t('convert.options.multiResize.mode.add') }}</button>
              </div>
            </div>
          </div>

          <!-- правая колонка: сетка пресетов -->
          <div :class="s.buttonsCol">
            <div :class="s.presetGrid">
              <button type="button" :class="[s.presetBtn, isSetActive('desktop') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="onApplySet('desktop')">{{ $t('convert.options.multiResize.presets.desktop') }}</button>
              <button type="button" :class="[s.presetBtn, isSetActive('tablet') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="onApplySet('tablet')">{{ $t('convert.options.multiResize.presets.tablet') }}</button>
              <button type="button" :class="[s.presetBtn, isSetActive('phone') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="onApplySet('phone')">{{ $t('convert.options.multiResize.presets.phone') }}</button>
              <button type="button" :class="[s.presetBtn, isSetActive('all') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="onApplySet('all')">{{ $t('convert.options.multiResize.presets.all') }}</button>
              <button type="button" :class="[s.presetBtn, isSetActive('macro1') && s.presetBtnActive]" :disabled="multiResizeDisabled" @click="onApplySet('macro1')">{{ $t('convert.options.multiResize.presets.macro1') }}</button>
            </div>
          </div>
        </div>


        <!-- текущие размеры -->
        <div v-for="v in model.variants" :key="v._k" :class="s.grid3">
          <label :class="s.inline">{{ $t('convert.options.multiResize.variantWidth') }}
            <input type="number" min="1" :class="s.input" v-model.number="v.w" :disabled="multiResizeDisabled" :placeholder="$t('convert.options.multiResize.variantWidthPlaceholder')">
          </label>
          <label :class="s.inline">{{ $t('convert.options.multiResize.variantHeight') }}
            <input type="number" min="1" :class="s.input" v-model.number="v.h" :disabled="multiResizeDisabled" :placeholder="$t('common.placeholders.optionalShort')">
          </label>
          <button type="button" :class="s.btnSmall" :disabled="multiResizeDisabled" @click="removeByKey(v._k!)">{{ $t('common.actions.remove') }}</button>
        </div>


        <p :class="s.muted">{{ $t('convert.options.multiResize.hint') }}</p>
      </div>
    </div>

    <div v-if="showFoldersSection" :class="s.row">
      <label :class="s.checkbox">
        <input
            type="checkbox"
            :checked="model.inFolders"
            @change="onInFoldersChange"
        >
        {{ $t('convert.options.export.inFolders') }}
      </label>
    </div>


    <!-- Остальные опции -->
    <div v-if="showLosslessSection" :class="s.row">
      <label :class="s.checkbox"><input type="checkbox" v-model="model.lossless"> {{ $t('convert.options.compression.lossless') }}</label>
    </div>

    <div v-if="showQualitySection" :class="s.row">
      <label :class="s.label">{{ $t('convert.options.compression.quality') }} <span :class="s.kv">{{ model.quality }}</span></label>
      <input type="range" min="30" max="100" v-model.number="model.quality" :class="s.range">
    </div>

    <div v-if="showTargetSizeSection" :class="s.row">
      <label :class="s.checkbox"><input type="checkbox" v-model="model.useTarget"> {{ $t('convert.options.compression.targetWeight') }}</label>
      <input type="number" :class="s.input" v-model.number="model.targetKb" :disabled="!model.useTarget" min="10" step="10" :placeholder="$t('convert.options.compression.targetWeightPlaceholder')">
    </div>

    <div v-if="showOptimizeSection" :class="s.row">
      <label :class="s.checkbox"><input type="checkbox" v-model="model.stripMetadata"> {{ $t('convert.options.optimize.stripMetadata') }}</label>
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
import type { SetKey } from '@/Pages/ConvertPage/Composables/useMultiResize'

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
const isResizeFreeMode = computed(() => isFreeMode.value && isResize.value)
const isLossyFormat = computed(() =>
    model.value.outputFormat === 'jpeg' ||
    model.value.outputFormat === 'webp' ||
    model.value.outputFormat === 'avif'
)

const showFormatSection = computed(() => isAllInOne.value || isFormat.value)
const showResizeSection = computed(() => isAllInOne.value || isResize.value)
const showMultiResizeSection = computed(() => isAllInOne.value || isResize.value)
const showFoldersSection = computed(() => isAllInOne.value || isResize.value)
const showLosslessSection = computed(() => isAllInOne.value)
const showQualitySection = computed(() =>
    isAllInOne.value ||
    isCompress.value ||
    (isFormat.value && isLossyFormat.value && !isFreeMode.value)
)
const showTargetSizeSection = computed(() => isAllInOne.value || isCompress.value)
const showOptimizeSection = computed(() => isAllInOne.value || isCompress.value)
const multiResizeDisabled = computed(() => false)
const validVariantCount = computed(() =>
    (model.value.variants || []).filter((variant) => (variant.w && variant.w > 0) || (variant.h && variant.h > 0)).length
)
const showSelectedSizesCounter = computed(() =>
    isFreeMode.value &&
    (isResize.value || isAllInOne.value) &&
    !!model.value.multiResize
)
const selectedSizesOverLimit = computed(() =>
    showSelectedSizesCounter.value && validVariantCount.value > 10
)

function onAddVariant() {
  addVariant()
}

function onApplySet(key: SetKey) {
  applySet(key)
}

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
      if (mode === 'all-in-one' || mode === 'compress') {
        model.value.minSize = true
        model.value.smartSubsample = true
      }

      if (appMode === 'free' && mode === 'format') {
        model.value.quality = 100
      }
    },
    { immediate: true }
)
</script>


<style module src="./OptionsPanel.module.css" />
