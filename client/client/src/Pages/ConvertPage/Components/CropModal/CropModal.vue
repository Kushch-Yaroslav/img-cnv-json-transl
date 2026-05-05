<template>
  <Teleport to="body">
    <div v-if="open" :class="s.backdrop" @click.self="close">
      <div :class="s.modal">
        <header :class="s.header">
          <h3 :class="s.title">{{ file?.name }}</h3>
          <div :class="s.actions">
            <button :class="s.btnGhost" @click="resetCrop" :disabled="!canReset">{{ $t('cropModal.actions.resetArea') }}</button>
            <button :class="s.btnGhost" @click="restoreOriginal" :disabled="!canRestore">{{ $t('cropModal.actions.restoreOriginal') }}</button>
            <button :class="s.btnPrimary" @click="saveCrop" :disabled="!file">{{ $t('common.actions.save') }}</button>
            <button :class="s.btnClose" @click="close">×</button>
          </div>
        </header>

        <div :class="s.ratioRow">
          <button
              v-for="opt in ratioOptions"
              :key="opt.key"
              type="button"
              :class="[s.presetBtn, ratio === opt.key && s.presetBtnActive]"
              @click="applyRatio(opt.key)"
          >
            {{ opt.label }}
          </button>
        </div>

        <div :class="s.shapeRow">
          <span :class="s.shapeLabel">{{ $t('cropModal.shape.label') }}</span>
          <button
              type="button"
              :class="[s.shapeBtn, shape === 'rect' && s.shapeBtnActive]"
              @click="shape = 'rect'"
          >
            {{ $t('cropModal.shape.rectangle') }}
          </button>
          <button
              type="button"
              :class="[s.shapeBtn, shape === 'circle' && s.shapeBtnActive]"
              @click="shape = 'circle'"
          >
            {{ $t('cropModal.shape.circle') }}
          </button>
        </div>

        <div :class="s.body">
          <section :class="s.editorPanel">
            <div ref="stageViewport" :class="s.stageViewport">
              <div :class="s.stage">
                <canvas ref="canvas" :class="s.canvas"></canvas>
                <div :class="s.mask">
                  <div
                      :class="[s.cropRect, shape === 'circle' && s.cropCircle]"
                      :style="cropStyle"
                      @pointerdown.stop.prevent="onRectDown"
                  >
                    <div
                        v-for="h in handles"
                        :key="h"
                        :data-handle="h"
                        :class="[s.handle, s['h_'+h]]"
                        @pointerdown.stop.prevent="onHandleDown"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside :class="s.previewPanel">
            <div :class="s.previewHeader">
              <h4 :class="s.previewTitle">{{ $t('cropModal.preview.title') }}</h4>
              <p :class="s.previewHint">{{ $t('cropModal.preview.hint') }}</p>
            </div>
            <div :class="s.previewViewport">
              <canvas ref="previewCanvas" :class="s.previewCanvas"></canvas>
            </div>
          </aside>
        </div>


        <footer :class="s.footer">
          <div :class="s.hint">{{ $t('cropModal.hint') }}</div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>


<script setup lang="ts">
type Shape = 'rect' | 'circle'

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import s from './CropModal.module.css'

const { t } = useI18n()
const shape = ref<Shape>('rect')

const props = defineProps<{
  open: boolean
  file?: File
}>()

// Вверху файла (рядом с остальными ref/const)
type RatioKey = 'free' | '1:1' | '4:3' | '3:2' | '16:9' | '21:9'| '3:4'

const ratio = ref<RatioKey>('free')
const ratioOptions = [
  { key: 'free' as RatioKey, label: t('cropModal.ratio.free') },
  { key: '1:1' as RatioKey, label: '1:1' },
  { key: '4:3' as RatioKey, label: '4:3' },
  { key: '3:4' as RatioKey, label: '3:4' },

  { key: '3:2' as RatioKey, label: '3:2' },
  { key: '16:9' as RatioKey, label: '16:9' },
  { key: '21:9' as RatioKey, label: '21:9' },
]
const RATIOS: Record<Exclude<RatioKey,'free'>, number> = {
  '1:1': 1,
  '4:3': 4/3,
  '3:4': 3/4,
  '3:2': 3/2,
  '16:9': 16/9,
  '21:9': 21/9,
}

// Вспомогательная: вписать прямоугольник заданного аспекта в картинку
function fitAspect(imgW: number, imgH: number, r: number) {
  // пробуем максимальную ширину
  let w = Math.min(imgW, Math.round(imgH * r))
  let h = Math.round(w / r)
  if (w > imgW) { // если вдруг ширина вышла за границы
    h = Math.min(imgH, Math.round(imgW / r))
    w = Math.round(h * r)
  }
  // Центрируем
  const x = Math.round((imgW - w) / 2)
  const y = Math.round((imgH - h) / 2)
  return { x, y, w, h }
}

function applyRatio(key: RatioKey) {
  ratio.value = key
  if (key === 'free') return
  const r = RATIOS[key]
  const { imgW, imgH } = view.value
  crop.value = fitAspect(imgW, imgH, r)
  draw()
}


const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', value: File): void
  (e: 'restore'): void
}>()

const canvas = ref<HTMLCanvasElement|null>(null)
const previewCanvas = ref<HTMLCanvasElement|null>(null)
const stageViewport = ref<HTMLElement|null>(null)
const bmp = ref<ImageBitmap|null>(null)
let stageResizeObserver: ResizeObserver | null = null

const view = ref({ // viewport рисования (в CSS px)
  w: 0, h: 0, scale: 1,
  offsetX: 0, offsetY: 0,
  imgW: 0, imgH: 0, // реальные пиксели исходника
})

// crop в координатах исходника (нативные px)
const crop = ref({ x: 0, y: 0, w: 0, h: 0 })

const handles = ['nw','n','ne','e','se','s','sw','w'] as const

const canRestore = computed(() => !!props.file)
const canReset = computed(() => crop.value.w > 0 && crop.value.h > 0)

type IdleInteraction = { mode: 'idle' }
type MoveInteraction = {
  mode: 'move'
  pointerId: number
  lastX: number
  lastY: number
  captureEl: HTMLElement | null
}
type ResizeInteraction = {
  mode: 'resize'
  pointerId: number
  handle: string
  startX: number
  startY: number
  cx: number
  cy: number
  cw: number
  ch: number
  captureEl: HTMLElement | null
}

type InteractionState = IdleInteraction | MoveInteraction | ResizeInteraction

let interaction: InteractionState = { mode: 'idle' }

function close() {
  cleanupInteraction()
  emit('close')
}

// загрузка битмапа
async function loadBitmap() {
  if (!props.file) return
  if (bmp.value) bmp.value.close()
  // избегаем авто-ориентации браузера — пусть как есть
  bmp.value = await createImageBitmap(props.file)
  view.value.imgW = bmp.value.width
  view.value.imgH = bmp.value.height

  // подгоним viewport под канвас
  await nextTick()
  remeasureStage()

  // дефолтный crop: квадрат вписанный
  const vw = view.value.imgW
  const vh = view.value.imgH
  const side = Math.min(vw, vh) * 0.8
  crop.value = { x: Math.round((vw-side)/2), y: Math.round((vh-side)/2), w: Math.round(side), h: Math.round(side) }

  draw()
}

function remeasureStage() {
  const viewportEl = stageViewport.value
  const el = canvas.value
  if (!viewportEl || !el || !bmp.value) return

  const rect = viewportEl.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const dpr = window.devicePixelRatio || 1
  el.width = Math.round(rect.width * dpr)
  el.height = Math.round(rect.height * dpr)
  const ctx = el.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const scale = Math.min(rect.width / view.value.imgW, rect.height / view.value.imgH)
  const drawW = view.value.imgW * scale
  const drawH = view.value.imgH * scale

  view.value.w = rect.width
  view.value.h = rect.height
  view.value.scale = scale
  view.value.offsetX = Math.round((rect.width - drawW) / 2)
  view.value.offsetY = Math.round((rect.height - drawH) / 2)
}

function draw() {
  if (!canvas.value || !bmp.value) return
  const el = canvas.value
  const ctx = el.getContext('2d')!
  ctx.clearRect(0,0,view.value.w,view.value.h)
  const s = view.value.scale
  ctx.drawImage(
      bmp.value,
      view.value.offsetX,
      view.value.offsetY,
      view.value.imgW * s,
      view.value.imgH * s
  )
  drawPreview()
}

const cropStyle = computed(() => {
  const s = view.value.scale
  const x = view.value.offsetX + crop.value.x * s
  const y = view.value.offsetY + crop.value.y * s
  const w = crop.value.w * s
  const h = crop.value.h * s
  return { transform: `translate(${x}px, ${y}px)`, width: `${w}px`, height: `${h}px` }
})

function drawPreview() {
  if (!previewCanvas.value || !bmp.value) return

  const canvasEl = previewCanvas.value
  const rect = canvasEl.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const dpr = window.devicePixelRatio || 1
  canvasEl.width = Math.round(rect.width * dpr)
  canvasEl.height = Math.round(rect.height * dpr)
  const ctx = canvasEl.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)

  let sx = crop.value.x
  let sy = crop.value.y
  let sw = crop.value.w
  let sh = crop.value.h

  if (!sw || !sh) return

  if (shape.value === 'circle') {
    const side = Math.min(sw, sh)
    sx = sx + (sw - side) / 2
    sy = sy + (sh - side) / 2
    sw = side
    sh = side
  }

  const scale = Math.min(rect.width / sw, rect.height / sh)
  const drawW = sw * scale
  const drawH = sh * scale
  const offsetX = (rect.width - drawW) / 2
  const offsetY = (rect.height - drawH) / 2

  if (shape.value === 'circle') {
    const radius = Math.min(drawW, drawH) / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(rect.width / 2, rect.height / 2, radius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
  }

  ctx.drawImage(
      bmp.value,
      sx, sy, sw, sh,
      offsetX, offsetY, drawW, drawH
  )

  if (shape.value === 'circle') {
    ctx.restore()
  }
}

watch(() => props.file, async () => {
  if (!props.open || !props.file) return
  await loadBitmap()
})
watch(() => props.open, async (v) => {
  if (!v) {
    cleanupInteraction()
    return
  }

  await nextTick()

  if (stageResizeObserver && stageViewport.value) {
    stageResizeObserver.disconnect()
    stageResizeObserver.observe(stageViewport.value)
  }

  if (props.file) await loadBitmap()
})
watch([crop, shape], () => {
  drawPreview()
}, { deep: true })

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    stageResizeObserver = new ResizeObserver(() => {
      remeasureStage()
      draw()
    })

    if (stageViewport.value) {
      stageResizeObserver.observe(stageViewport.value)
    }
  }
})
onBeforeUnmount(() => {
  cleanupInteraction()
  stageResizeObserver?.disconnect()
  stageResizeObserver = null
  if (bmp.value) bmp.value.close()
})

function isPrimaryPointer(event: PointerEvent) {
  return event.pointerType !== 'mouse' || event.button === 0
}

function bindInteractionListeners() {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
  window.addEventListener('blur', onWindowBlur)
}

function releaseInteractionCapture(state: InteractionState) {
  if (state.mode === 'idle' || !state.captureEl) return

  try {
    if (state.captureEl.hasPointerCapture?.(state.pointerId)) {
      state.captureEl.releasePointerCapture(state.pointerId)
    }
  } catch {
    // ignore release errors during teardown
  }
}

function cleanupInteraction() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
  window.removeEventListener('blur', onWindowBlur)
  releaseInteractionCapture(interaction)
  interaction = { mode: 'idle' }
}

function startMoveInteraction(event: PointerEvent) {
  cleanupInteraction()

  const captureEl = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  try {
    captureEl?.setPointerCapture?.(event.pointerId)
  } catch {
    // ignore capture errors and keep window listeners as fallback
  }

  interaction = {
    mode: 'move',
    pointerId: event.pointerId,
    lastX: event.clientX,
    lastY: event.clientY,
    captureEl,
  }
  bindInteractionListeners()
}

function startResizeInteraction(event: PointerEvent, handleName: string) {
  cleanupInteraction()

  const captureEl = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  try {
    captureEl?.setPointerCapture?.(event.pointerId)
  } catch {
    // ignore capture errors and keep window listeners as fallback
  }

  interaction = {
    mode: 'resize',
    pointerId: event.pointerId,
    handle: handleName,
    startX: event.clientX,
    startY: event.clientY,
    cx: crop.value.x,
    cy: crop.value.y,
    cw: crop.value.w,
    ch: crop.value.h,
    captureEl,
  }
  bindInteractionListeners()
}

function onRectDown(event: PointerEvent) {
  if (!isPrimaryPointer(event)) return
  startMoveInteraction(event)
}

function onHandleDown(event: PointerEvent) {
  if (!isPrimaryPointer(event)) return
  const handleName = (event.currentTarget as HTMLElement | null)?.dataset.handle
  if (!handleName) return
  startResizeInteraction(event, handleName)
}

function onPointerMove(event: PointerEvent) {
  if (interaction.mode === 'idle' || event.pointerId !== interaction.pointerId) return

  if (interaction.mode === 'move') {
    const dx = (event.clientX - interaction.lastX) / view.value.scale
    const dy = (event.clientY - interaction.lastY) / view.value.scale
    moveCrop(dx, dy)
    interaction = {
      ...interaction,
      lastX: event.clientX,
      lastY: event.clientY,
    }
    return
  }

  const dx = (event.clientX - interaction.startX) / view.value.scale
  const dy = (event.clientY - interaction.startY) / view.value.scale
  resizeFromHandle(interaction.handle, dx, dy, interaction)
}

function onPointerUp(event: PointerEvent) {
  if (interaction.mode === 'idle' || event.pointerId !== interaction.pointerId) return
  cleanupInteraction()
}

function onPointerCancel(event: PointerEvent) {
  if (interaction.mode === 'idle' || event.pointerId !== interaction.pointerId) return
  cleanupInteraction()
}

function onWindowBlur() {
  cleanupInteraction()
}

function moveCrop(dx:number, dy:number) {
  const nx = clamp(crop.value.x + dx, 0, view.value.imgW - crop.value.w)
  const ny = clamp(crop.value.y + dy, 0, view.value.imgH - crop.value.h)
  crop.value.x = Math.round(nx)
  crop.value.y = Math.round(ny)
}

/* --- Ресайз рамки за ручки --- */
function resizeFromHandle(
    h: string,
    dx: number,
    dy: number,
    startState: Pick<ResizeInteraction, 'cx' | 'cy' | 'cw' | 'ch'>
) {
  let { cx, cy, cw, ch } = startState
  let nx = cx, ny = cy, nw = cw, nh = ch

  if (ratio.value === 'free') {
    if (h.includes('e')) nw = cw + dx
    if (h.includes('s')) nh = ch + dy
    if (h.includes('w')) { nx = cx + dx; nw = cw - dx }
    if (h.includes('n')) { ny = cy + dy; nh = ch - dy }
  } else {
    const r = RATIOS[ratio.value as Exclude<RatioKey,'free'>]

    // Вычислим «базовую» ширину/высоту от дельт
    // Берём доминирующее направление, чтобы ощущение было «естественным»
    const useWidth = Math.abs(dx) >= Math.abs(dy)

    if (h.includes('e')) {
      nw = cw + dx
      nh = nw / r
      if (h.includes('n')) { ny = cy + (ch - nh) } // тянем вверх-вправо
    } else if (h.includes('w')) {
      nw = cw - dx
      nh = nw / r
      nx = cx + dx
      if (h.includes('n')) { ny = cy + (ch - nh) } // тянем вверх-влево
    } else if (h.includes('s')) { // чисто юг/север
      nh = ch + dy
      nw = nh * r
    } else if (h.includes('n')) {
      nh = ch - dy
      nw = nh * r
      ny = cy + dy
    }

    // Если пользователь тянет только по одной оси — синхронизируем вторую ось
    if (!h.match(/[nesw]/) && useWidth) nh = nw / r
    if (!h.match(/[nesw]/) && !useWidth) nw = nh * r
  }

  // Ограничения и попадание внутрь изображения
  nw = clamp(nw, 20, view.value.imgW)
  nh = clamp(nh, 20, view.value.imgH)
  if (nx + nw > view.value.imgW) {
    if (h.includes('w')) nx = view.value.imgW - nw
    else nw = view.value.imgW - nx
  }
  if (ny + nh > view.value.imgH) {
    if (h.includes('n')) ny = view.value.imgH - nh
    else nh = view.value.imgH - ny
  }
  nx = clamp(nx, 0, view.value.imgW - nw)
  ny = clamp(ny, 0, view.value.imgH - nh)

  crop.value = { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) }
}

function clamp(v:number, min:number, max:number){ return Math.max(min, Math.min(max, v)) }

/* --- Действия --- */
function resetCrop() {
  // вернуть дефолтную область (центр 80% кратчайшей стороны)
  const side = Math.min(view.value.imgW, view.value.imgH) * 0.8
  crop.value = {
    x: Math.round((view.value.imgW - side)/2),
    y: Math.round((view.value.imgH - side)/2),
    w: Math.round(side),
    h: Math.round(side),
  }
}

async function saveCrop() {
  if (!bmp.value || !props.file) return

  // базовый прямоугольный кроп
  let sx = crop.value.x
  let sy = crop.value.y
  let sw = crop.value.w
  let sh = crop.value.h

  // создаём канвас
  const off = document.createElement('canvas')
  const ctx = off.getContext('2d')!
  const type = inferMime(props.file)

  if (shape.value === 'circle') {
    // для круга берём минимальную сторону, чтобы круг был ровным
    const side = Math.min(sw, sh)

    // смещаем исходную область так, чтобы круг был по центру выбранного прямоугольника
    sx = sx + (sw - side) / 2
    sy = sy + (sh - side) / 2
    sw = side
    sh = side

    off.width = side
    off.height = side

    ctx.clearRect(0, 0, side, side)
    ctx.save()
    ctx.beginPath()
    ctx.arc(side / 2, side / 2, side / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    ctx.drawImage(
        bmp.value,
        sx, sy, sw, sh,
        0, 0, side, side
    )

    ctx.restore()
  } else {
    // старое поведение для прямоугольника
    off.width = sw
    off.height = sh
    ctx.clearRect(0, 0, sw, sh)
    ctx.drawImage(
        bmp.value,
        sx, sy, sw, sh,
        0, 0, sw, sh
    )
  }

  const blob = await new Promise<Blob>((res) =>
      off.toBlob(b => res(b!), type, 0.92)
  )

  const name = props.file.name.replace(/\.(\w+)$/, (m, ext) => `-cropped.${ext}`)
  const out = new File([blob], name, { type })
  emit('save', out)
  close()
}


function inferMime(file: File) {
  if (file.type) return file.type
  const n = file.name.toLowerCase()
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg'
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.webp')) return 'image/webp'
  return 'image/png'
}

function restoreOriginal() {
  emit('restore')
}

watch(() => props.open, (v) => {
  if (v) {
    const prev = document.body.style.overflow
    document.body.dataset.prevOverflow = prev
    document.body.style.overflow = 'hidden'
  } else {
    cleanupInteraction()
    const prev = document.body.dataset.prevOverflow ?? ''
    document.body.style.overflow = prev
  }
})
onBeforeUnmount(() => {
  cleanupInteraction()
  // на всякий случай восстановим
  const prev = document.body.dataset.prevOverflow ?? ''
  document.body.style.overflow = prev
})

</script>

<style module src="./CropModal.module.css" />
