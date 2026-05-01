<template>
  <div :class="s.wrap">
    <div :class="s.dot"  ref="dot"></div>
    <div :class="s.ring" ref="ring"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import s from '@/Layouts/FXLayout/Components/CursorFX/CursorFX.module.css'
import gsap from 'gsap'

const dot  = ref<HTMLElement|null>(null)
const ring = ref<HTMLElement|null>(null)

// функции, которые вернёт gsap.quickTo
let setDotX:  ((v:number)=>void) | undefined
let setDotY:  ((v:number)=>void) | undefined
let setRingX: ((v:number)=>void) | undefined
let setRingY: ((v:number)=>void) | undefined

const onMove = (e: MouseEvent) => {
  // передаём ЧИСЛА (clientX/Y), а не объекты
  setDotX?.(e.clientX);  setDotY?.(e.clientY)
  setRingX?.(e.clientX); setRingY?.(e.clientY)
}

const onDown = () => { if (ring.value) gsap.to(ring.value, { scale: 0.8, duration: 0.12 }) }
const onUp   = () => { if (ring.value) gsap.to(ring.value, { scale: 1.0, duration: 0.20 }) }

onMounted(() => {
  // quickTo возвращает функцию: (value:number) => анимировать к value
  setDotX  = gsap.quickTo(dot.value!,  "x", { duration: 0.08, ease: "power3.out" })
  setDotY  = gsap.quickTo(dot.value!,  "y", { duration: 0.08, ease: "power3.out" })
  setRingX = gsap.quickTo(ring.value!, "x", { duration: 0.18, ease: "power3.out" })
  setRingY = gsap.quickTo(ring.value!, "y", { duration: 0.18, ease: "power3.out" })

  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('mousedown', onDown)
  window.addEventListener('mouseup',   onUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mousedown', onDown)
  window.removeEventListener('mouseup',   onUp)
})
</script>

<style module>

</style>
