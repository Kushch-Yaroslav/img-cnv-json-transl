<template>
  <form :class="s.panel" @submit.prevent>
    <!-- Формат -->
    <div :class="s.row">
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
    <div :class="s.row">
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
    <div :class="s.row">
      <label :class="s.checkbox">
        <input type="checkbox" v-model="model.multiResize"> Мульти-размеры
      </label>

      <div v-if="model.multiResize" :class="s.variants">
        <div :class="s.actionsRow">
          <button type="button" :class="s.btnGhost" @click="addVariant()">+ Добавить размер</button>
          <button type="button" :class="s.btnGhost" @click="resetAll()">Сбросить всё</button>
          <button type="button" :class="s.btnGhost" @click="sortAll()">Сортировать</button>
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
                    @click="setMode('switch')"
                >Переключать</button>

                <label :class="s.switch" :title="model.multiMode === 'add' ? 'Добавлять' : 'Переключать'">
                  <input type="checkbox" :checked="model.multiMode === 'add'" @change="onToggleMode" />
                  <span :class="s.slider"></span>
                </label>

                <button
                    type="button"
                    :class="[s.modeOption, model.multiMode === 'add' && s.modeOptionActive]"
                    :aria-pressed="model.multiMode === 'add'"
                    @click="setMode('add')"
                >Добавлять</button>
              </div>
            </div>
          </div>

          <!-- правая колонка: сетка пресетов -->
          <div :class="s.buttonsCol">
            <div :class="s.presetGrid">
              <button type="button" :class="[s.presetBtn, isSetActive('desktop') && s.presetBtnActive]" @click="applySet('desktop')">Десктопы</button>
              <button type="button" :class="[s.presetBtn, isSetActive('tablet') && s.presetBtnActive]" @click="applySet('tablet')">Планшеты</button>
              <button type="button" :class="[s.presetBtn, isSetActive('phone') && s.presetBtnActive]" @click="applySet('phone')">Телефоны</button>
              <button type="button" :class="[s.presetBtn, isSetActive('all') && s.presetBtnActive]" @click="applySet('all')">Все сразу</button>
              <button type="button" :class="[s.presetBtn, isSetActive('macro1') && s.presetBtnActive]" @click="applySet('macro1')">Макрос 1</button>
            </div>
          </div>
        </div>


        <!-- текущие размеры -->
        <div v-for="v in model.variants" :key="v._k" :class="s.grid3">
          <label :class="s.inline">W
            <input type="number" min="1" :class="s.input" v-model.number="v.w" placeholder="напр. 1080">
          </label>
          <label :class="s.inline">H
            <input type="number" min="1" :class="s.input" v-model.number="v.h" placeholder="опц.">
          </label>
          <button type="button" :class="s.btnSmall" @click="removeByKey(v._k!)">Удалить</button>
        </div>


        <p :class="s.muted">Если указать только ширину — высота подберётся пропорционально (fit: inside).</p>
      </div>
    </div>

    <div :class="s.row">
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
    <div :class="s.row">
      <label :class="s.checkbox"><input type="checkbox" v-model="model.lossless"> Lossless (без потерь)</label>
    </div>

    <div :class="s.row">
      <label :class="s.label">Качество (для lossy): <span :class="s.kv">{{ model.quality }}</span></label>
      <input type="range" min="30" max="100" v-model.number="model.quality" :class="s.range">
    </div>

    <div :class="s.row">
      <label :class="s.checkbox"><input type="checkbox" v-model="model.useTarget"> Целевой вес (KB)</label>
      <input type="number" :class="s.input" v-model.number="model.targetKb" :disabled="!model.useTarget" min="10" step="10" placeholder="например 180">
    </div>

    <div :class="s.row">
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
import { ref, watch } from 'vue'   // 👈 добавляем

export interface OptionsModel {
  outputFormat: 'same'|'webp'|'jpeg'|'png'|'avif',
  resize: boolean,
  maxWidth?: number,
  maxHeight?: number,
  lossless: boolean,
  quality: number,
  useTarget: boolean,
  targetKb?: number,
  stripMetadata: boolean,
  minSize: boolean,
  smartSubsample: boolean,
  removeBg: boolean,
  bgColor: string,
  rembgModel: string,
  rembgSession: string,
  multiResize?: boolean,
  variants?: Array<{ w?: number; h?: number; _k?: string }>,
  multiMode?: 'switch' | 'add',
  inFolders: boolean
}

const model = defineModel<OptionsModel>({ required: true })
const { addVariant, removeByKey, resetAll, sortAll, applySet, isSetActive } = useMultiResize(model)

// --- режим мультисетов
function onToggleMode(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  model.value.multiMode = checked ? 'add' : 'switch'
}

function setMode(m: 'switch' | 'add') {
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
</script>


<style module src="./OptionsPanel.module.css" />
