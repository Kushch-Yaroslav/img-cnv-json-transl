<template>
  <Teleport to="body">
    <div v-if="open" :class="s.backdrop" @click.self="close">
      <div :class="s.modal">
        <header :class="s.header">
          <h3 :class="s.title">{{ file?.name }}</h3>
          <div :class="s.actions">
            <button :class="s.btnGhost" @click="resetCrop" :disabled="!canReset">Сбросить область</button>
            <button :class="s.btnGhost" @click="restoreOriginal" :disabled="!canRestore">Восстановить исходник</button>
            <button :class="s.btnPrimary" @click="saveCrop" :disabled="!file">Сохранить</button>
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
          <span :class="s.shapeLabel">Форма:</span>
          <button
              type="button"
              :class="[s.shapeBtn, shape === 'rect' && s.shapeBtnActive]"
              @click="shape = 'rect'"
          >
            Прямоугольник
          </button>
          <button
              type="button"
              :class="[s.shapeBtn, shape === 'circle' && s.shapeBtnActive]"
              @click="shape = 'circle'"
          >
            Круг
          </button>
        </div>

        <div :class="s.stage" @mousedown="onDown" @touchstart.prevent="onDownTouch">
          <canvas ref="canvas" :class="s.canvas"></canvas>
          <div :class="s.mask">
            <div
                :class="[s.cropRect, shape === 'circle' && s.cropCircle]"
                :style="cropStyle"
                @mousedown.stop="onRectDown"
                @touchstart.stop.prevent="onRectDownTouch"
            >
              <div
                  v-for="h in handles"
                  :key="h"
                  :data-handle="h"
                  :class="[s.handle, s['h_'+h]]"
                  @mousedown.stop="onHandleDown"
                  @touchstart.stop.prevent="onHandleDownTouch"
              />
            </div>
          </div>
        </div>


        <footer :class="s.footer">
          <div :class="s.hint">Тяни рамку или углы. Область всегда внутри изображения.</div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>


<script setup lang="ts">
type Shape = 'rect' | 'circle'

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import s from './CropModal.module.css'

const shape = ref<Shape>('rect')

const props = defineProps<{
  open: boolean
  file?: File
}>()

// Вверху файла (рядом с остальными ref/const)
type RatioKey = 'free' | '1:1' | '4:3' | '3:2' | '16:9' | '21:9'| '3:4'

const ratio = ref<RatioKey>('free')
const ratioOptions = [
  { key: 'free' as RatioKey, label: 'Свободно' },
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
const bmp = ref<ImageBitmap|null>(null)

const view = ref({ // viewport рисования (в CSS px)
  w: 920, h: 520, scale: 1,
  imgW: 0, imgH: 0, // реальные пиксели исходника
})

// crop в координатах исходника (нативные px)
const crop = ref({ x: 0, y: 0, w: 0, h: 0 })

const handles = ['nw','n','ne','e','se','s','sw','w'] as const

const canRestore = computed(() => !!props.file)
const canReset = computed(() => crop.value.w > 0 && crop.value.h > 0)

function close(){ emit('close') }

// загрузка битмапа
async function loadBitmap() {
  if (!props.file) return
  // избегаем авто-ориентации браузера — пусть как есть
  bmp.value = await createImageBitmap(props.file)
  view.value.imgW = bmp.value.width
  view.value.imgH = bmp.value.height

  // подгоним viewport под канвас
  await nextTick()
  const el = canvas.value!
  const dpr = window.devicePixelRatio || 1
  const rect = el.getBoundingClientRect()
  el.width = Math.round(rect.width * dpr)
  el.height = Math.round(rect.height * dpr)
  const ctx = el.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // масштаб, чтобы целиком влезло
  const scale = Math.min(rect.width / view.value.imgW, rect.height / view.value.imgH)
  view.value.scale = scale

  // дефолтный crop: квадрат вписанный
  const vw = view.value.imgW
  const vh = view.value.imgH
  const side = Math.min(vw, vh) * 0.8
  crop.value = { x: Math.round((vw-side)/2), y: Math.round((vh-side)/2), w: Math.round(side), h: Math.round(side) }

  draw()
}

function draw() {
  if (!canvas.value || !bmp.value) return
  const el = canvas.value
  const ctx = el.getContext('2d')!
  const rect = el.getBoundingClientRect()
  ctx.clearRect(0,0,rect.width,rect.height)
  const s = view.value.scale
  ctx.drawImage(bmp.value, 0, 0, view.value.imgW*s, view.value.imgH*s)
}

const cropStyle = computed(() => {
  const s = view.value.scale
  const x = crop.value.x * s
  const y = crop.value.y * s
  const w = crop.value.w * s
  const h = crop.value.h * s
  return { transform: `translate(${x}px, ${y}px)`, width: `${w}px`, height: `${h}px` }
})

watch(() => props.file, async () => {
  if (!props.open || !props.file) return
  await loadBitmap()
})
watch(() => props.open, async (v) => {
  if (v && props.file) await loadBitmap()
})

onMounted(() => {
  window.addEventListener('resize', draw)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', draw)
  if (bmp.value) bmp.value.close()
})

/* --- Перемещение рамки --- */
let dragStart: {x:number,y:number}|null = null
function onRectDown(e: MouseEvent) {
  dragStart = { x: e.clientX, y: e.clientY }
  window.addEventListener('mousemove', onRectMove)
  window.addEventListener('mouseup', onRectUp, { once: true })
}
function onRectMove(e: MouseEvent) {
  if (!dragStart) return
  const dx = (e.clientX - dragStart.x) / view.value.scale
  const dy = (e.clientY - dragStart.y) / view.value.scale
  moveCrop(dx, dy)
  dragStart = { x: e.clientX, y: e.clientY }
}
function onRectUp() {
  dragStart = null
  window.removeEventListener('mousemove', onRectMove)
}
function onRectDownTouch(e: TouchEvent) {
  const t = e.touches[0]
  dragStart = { x: t.clientX, y: t.clientY }
  window.addEventListener('touchmove', onRectMoveTouch, { passive: false })
  window.addEventListener('touchend', onRectUpTouch, { once: true })
}
function onRectMoveTouch(e: TouchEvent) {
  e.preventDefault()
  if (!dragStart) return
  const t = e.touches[0]
  const dx = (t.clientX - dragStart.x) / view.value.scale
  const dy = (t.clientY - dragStart.y) / view.value.scale
  moveCrop(dx, dy)
  dragStart = { x: t.clientX, y: t.clientY }
}
function onRectUpTouch() {
  dragStart = null
  window.removeEventListener('touchmove', onRectMoveTouch)
}

function moveCrop(dx:number, dy:number) {
  const nx = clamp(crop.value.x + dx, 0, view.value.imgW - crop.value.w)
  const ny = clamp(crop.value.y + dy, 0, view.value.imgH - crop.value.h)
  crop.value.x = Math.round(nx)
  crop.value.y = Math.round(ny)
}

/* --- Ресайз рамки за ручки --- */
let handle: string|undefined
let start: {x:number,y:number,cx:number,cy:number,cw:number,ch:number}|null = null

function onHandleDown(e: MouseEvent) {
  handle = (e.currentTarget as HTMLElement).dataset.handle
  start = { x:e.clientX, y:e.clientY, cx:crop.value.x, cy:crop.value.y, cw:crop.value.w, ch:crop.value.h }
  window.addEventListener('mousemove', onHandleMove)
  window.addEventListener('mouseup', onHandleUp, { once: true })
}
function onHandleMove(e: MouseEvent) {
  if (!start || !handle) return
  const dx = (e.clientX - start.x) / view.value.scale
  const dy = (e.clientY - start.y) / view.value.scale
  resizeFromHandle(handle, dx, dy)
}
function onHandleUp() {
  start = null
  handle = undefined
  window.removeEventListener('mousemove', onHandleMove)
}
function onHandleDownTouch(e: TouchEvent) {
  handle = (e.currentTarget as HTMLElement).dataset.handle
  const t = e.touches[0]
  start = { x:t.clientX, y:t.clientY, cx:crop.value.x, cy:crop.value.y, cw:crop.value.w, ch:crop.value.h }
  window.addEventListener('touchmove', onHandleMoveTouch, { passive:false })
  window.addEventListener('touchend', onHandleUpTouch, { once:true })
}
function onHandleMoveTouch(e: TouchEvent) {
  e.preventDefault()
  if (!start || !handle) return
  const t = e.touches[0]
  const dx = (t.clientX - start.x) / view.value.scale
  const dy = (t.clientY - start.y) / view.value.scale
  resizeFromHandle(handle, dx, dy)
}
function onHandleUpTouch() {
  start = null; handle = undefined
  window.removeEventListener('touchmove', onHandleMoveTouch)
}

function resizeFromHandle(h:string, dx:number, dy:number) {
  let { cx, cy, cw, ch } = start!
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

function onDown(e: MouseEvent) {
  // фокус на stage (для будущих хоткеев), пока не нужен
}
function onDownTouch(){}

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
  close()
}

watch(() => props.open, (v) => {
  if (v) {
    const prev = document.body.style.overflow
    document.body.dataset.prevOverflow = prev
    document.body.style.overflow = 'hidden'
  } else {
    const prev = document.body.dataset.prevOverflow ?? ''
    document.body.style.overflow = prev
  }
})
onBeforeUnmount(() => {
  // на всякий случай восстановим
  const prev = document.body.dataset.prevOverflow ?? ''
  document.body.style.overflow = prev
})

</script>

<style module src="./CropModal.module.css" />
