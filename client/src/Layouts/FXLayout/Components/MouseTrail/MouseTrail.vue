<template>
  <canvas ref="cv" :class="s.c"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import s from '@/Layouts/FXLayout/Components/MouseTrail/MouseTrail.module.css'

type P = { x: number; y: number; vx: number; vy: number; life: number; max: number }

const cv = ref<HTMLCanvasElement|null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
const parts: P[] = []
const mouse = { x: window.innerWidth/2, y: window.innerHeight/2 }
const N = 60

function resize() {
  if (!cv.value) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  cv.value.width = Math.floor(window.innerWidth * dpr)
  cv.value.height = Math.floor(window.innerHeight * dpr)
  cv.value.style.width = '100vw'
  cv.value.style.height = '100vh'
  ctx = cv.value.getContext('2d')
  ctx?.scale(dpr, dpr)
}

function spawn(i: number) {
  parts[i] = {
    x: mouse.x, y: mouse.y,
    vx: (Math.random()-0.5)*1.2,
    vy: (Math.random()-0.5)*1.2,
    life: 0,
    max: 60 + Math.random()*40
  }
}
function loop() {
  if (!ctx) return
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0,0,window.innerWidth,window.innerHeight)

  for (let i = 0; i < N; i++) {
    const p = parts[i]
    p.vx += (mouse.x - p.x)*0.0025
    p.vy += (mouse.y - p.y)*0.0025
    p.vx *= 0.92
    p.vy *= 0.92
    p.x += p.vx
    p.y += p.vy
    p.life++

    const t = 1 - p.life / p.max
    const r = 2 + 6*(1-t)
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI*2)
    ctx.fillStyle = `rgba(180,120,255,${0.13 * t})`
    ctx.fill()

    if (p.life > p.max) spawn(i)
  }

  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  resize()
  for (let i=0;i<N;i++) spawn(i)
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY }, { passive: true })
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  cancelAnimationFrame(raf)
})
</script>

<style module>

</style>
