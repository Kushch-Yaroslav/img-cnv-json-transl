<template>
  <div
      class="cmp"
      :style="{ width: size + 'px', height: size + 'px' }"
      @mousedown.prevent="start"
      @touchstart.prevent="startTouch"
      @dragstart.prevent
  >
    <!-- after снизу -->
    <img class="img base" :src="after" alt="" draggable="false" />
    <!-- before сверху, режем clipPath -->
    <img class="img top"  :src="before" alt="" draggable="false"
         :style="{ clipPath: `inset(0 ${100 - pos}% 0 0)` }" />
    <div class="handle" :style="{ left: pos + '%' }">
      <div class="bar"></div>
      <div class="knob"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, toRefs, withDefaults, defineProps } from 'vue'

const _props = withDefaults(defineProps<{
  before: string
  after: string
  size?: number
}>(), { size: 1000 })

const { before, after, size } = toRefs(_props)

const pos = ref(50)
let dragging = false

function setByEvent(e: MouseEvent | Touch) {
  const el = (e.target as HTMLElement).closest('.cmp') as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = ('clientX' in e ? e.clientX : 0) - rect.left
  pos.value = Math.min(100, Math.max(0, (x / rect.width) * 100))
}

function onMove(e: MouseEvent) {
  if (dragging) {
    e.preventDefault()
    setByEvent(e)
  }
}
function onTouchMove(e: TouchEvent) {
  if (dragging) {
    e.preventDefault() // важно: скролл/перетаскивание страницы
    setByEvent(e.touches[0])
  }
}

function start(e: MouseEvent) {
  e.preventDefault()
  dragging = true
  setByEvent(e)
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', stop, { once: true })
}
function startTouch(e: TouchEvent) {
  e.preventDefault()
  dragging = true
  setByEvent(e.touches[0])
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', stop, { once: true })
}

function stop() {
  dragging = false
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('touchmove', onTouchMove)
}
onBeforeUnmount(stop)
</script>

<style scoped>
.cmp {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #222;
  cursor: ew-resize;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;      /* всё ловит контейнер */
  -webkit-user-drag: none;   /* запрет drag ghost */
  user-drag: none;
}

.handle {
  position: absolute;
  top: 0; bottom: 0;
  width: 0;
  transform: translateX(-50%);
  pointer-events: none;
}
.bar {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 2px; background: rgba(255,255,255,.9);
}
.knob {
  position: absolute;
  top: 50%; left: 0;
  transform: translate(-50%, -50%);
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; box-shadow: 0 0 0 2px rgba(0,0,0,.35);
}
</style>
