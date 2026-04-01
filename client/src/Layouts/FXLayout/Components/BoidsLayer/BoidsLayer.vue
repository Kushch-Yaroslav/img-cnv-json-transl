<template>
  <canvas ref="cv" class="boids"></canvas>
</template>

<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref} from 'vue'

type Boid = { x: number; y: number; vx: number; vy: number }
const cv = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
const N = 60
const boids: Boid[] = []
const mouse = {x: innerWidth / 2, y: innerHeight / 2, down: false}

function resize() {
  if (!cv.value) return
  const dpr = Math.min(2, devicePixelRatio || 1)
  cv.value.width = Math.floor(innerWidth * dpr)
  cv.value.height = Math.floor(innerHeight * dpr)
  cv.value.style.width = '100vw'
  cv.value.style.height = '100vh'
  ctx = cv.value.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function spawn(b: Boid) {
  b.x = Math.random() * innerWidth
  b.y = Math.random() * innerHeight
  b.vx = (Math.random() - 0.5) * 2
  b.vy = (Math.random() - 0.5) * 2
}

function loop() {
  if (!ctx) return
  ctx.clearRect(0, 0, innerWidth, innerHeight)
  ctx.globalCompositeOperation = 'source-over'

  for (let i = 0; i < N; i++) {
    const b = boids[i]

    // базовая «стая» (align/cohesion/separation)
    let ax = 0, ay = 0, cx = 0, cy = 0, count = 0, sepx = 0, sepy = 0
    for (let j = 0; j < N; j++) if (i !== j) {
      const o = boids[j]
      const dx = o.x - b.x;
      const dy = o.y - b.y
      const d2 = dx * dx + dy * dy
      if (d2 < 160 * 160) {
        ax += o.vx;
        ay += o.vy;
        cx += o.x;
        cy += o.y;
        count++
      }
      if (d2 < 40 * 40) {
        sepx -= dx;
        sepy -= dy
      }
    }
    if (count > 0) {
      ax = ax / count;
      ay = ay / count
      cx = (cx / count - b.x) * 0.005
      cy = (cy / count - b.y) * 0.005
    }
    // курсор — как аттрактор/репеллер (при нажатии мыши — сильнее)
    const mx = mouse.x - b.x, my = mouse.y - b.y
    const md = Math.hypot(mx, my) || 1
    const pull = mouse.down ? 0.12 : 0.06
    const attractX = mx / md * pull
    const attractY = my / md * pull

    b.vx += ax * 0.02 + cx + sepx * 0.005 + attractX
    b.vy += ay * 0.02 + cy + sepy * 0.005 + attractY

    // ограничить скорость
    const sp = Math.hypot(b.vx, b.vy)
    const max = 3.2
    if (sp > max) {
      b.vx = b.vx / sp * max;
      b.vy = b.vy / sp * max
    }

    b.x += b.vx;
    b.y += b.vy
    if (b.x < -20) b.x = innerWidth + 20;
    if (b.x > innerWidth + 20) b.x = -20
    if (b.y < -20) b.y = innerHeight + 20;
    if (b.y > innerHeight + 20) b.y = -20

    // рисуем «неон»
    const s = 2.5
    const alpha = 0.12 + 0.12 * Math.min(1, sp / max)
    ctx.beginPath()
    ctx.arc(b.x, b.y, s, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(185,139,255,${alpha})`
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(b.x, b.y)
    ctx.lineTo(b.x - b.vx * 4, b.y - b.vy * 4)
    ctx.lineWidth = 1.3
    ctx.strokeStyle = `rgba(110,0,255,${alpha * 0.7})`
    ctx.stroke()
  }

  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  resize()
  for (let i = 0; i < N; i++) {
    boids.push({x: 0, y: 0, vx: 0, vy: 0});
    spawn(boids[i])
  }
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY
  }, {passive: true})
  window.addEventListener('mousedown', () => mouse.down = true)
  window.addEventListener('mouseup', () => mouse.down = false)
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
})
</script>

<style scoped>
.boids {
  position: fixed;
  inset: 0;
  z-index: 2; /* над three, под контентом */
  pointer-events: none;
  mix-blend-mode: screen;
}

@media (pointer: coarse) {
  .boids {
    display: none
  }
}
</style>
