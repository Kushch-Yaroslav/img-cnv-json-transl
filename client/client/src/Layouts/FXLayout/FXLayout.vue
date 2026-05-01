<!-- src/layouts/FXLayout.vue -->
<template>
  <section
      :class="s.stage"
      ref="stageRef"
      @mousemove="onStageMove"
      @mouseleave="resetSpotlight"
  >
    <!-- Кастомный курсор -->
    <CursorFX v-if="cursorFx"/>

    <!-- Слоистый фон -->
    <div :class="s.bg">
      <div :class="s.auroraLayer"></div>
      <div :class="s.gradientLayer"></div>
      <div :class="s.noiseLayer"></div>
      <div :class="s.glowLayer"></div>
      <div :class="s.contrastLayer"></div>
      <div v-if="spotlight" :class="s.spot" ref="spotRef"></div>
      <div :class="s.scanlines"></div>
    </div>

    <!-- Доп эффекты -->
    <MouseTrail v-if="mouseTrail"/>
    <BoidsLayer v-if="boids" :class="s.boids"/>

    <!-- Контент страницы -->
    <div :class="s.content">
      <slot/>
    </div>

    <!-- Низ страницы — опционально через именованный слот -->
    <footer v-if="$slots.footer" :class="s.footer">
      <slot name="footer"/>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import s from './FXLayout.module.css'
import CursorFX from '@/Layouts/FXLayout/Components/CursorFX/CursorFX.vue'
import MouseTrail from '@/Layouts/FXLayout/Components/MouseTrail/MouseTrail.vue'
import BoidsLayer from '@/Layouts/FXLayout/Components/BoidsLayer/BoidsLayer.vue'
import { useParallax } from '@/Layouts/FXLayout/Composables/useParallax'
import { useSpotlight } from '@/Layouts/FXLayout/Composables/useSpotlight'

type Props = {
  cursorFx?: boolean
  spotlight?: boolean
  mouseTrail?: boolean
  boids?: boolean
  parallax?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  cursorFx: true,
  spotlight: true,
  mouseTrail: true,
  boids: true,
  parallax: true,
})

const stageRef = ref<HTMLElement|null>(null)
const { spotRef, init: initSpot, onMove: onStageMove, onLeave: resetSpotlight } = useSpotlight(stageRef)

if (props.parallax) {
  useParallax(stageRef, {
    onMove: ({ dx, dy }) => {
      const el = stageRef.value
      if (!el) return
      el.style.setProperty('--parallax-x', `${dx * 12}px`)
      el.style.setProperty('--parallax-y', `${dy * 12}px`)
      el.style.setProperty('--glow-x', `${dx * 24}px`)
      el.style.setProperty('--glow-y', `${dy * 24}px`)
    },
  })
}

onMounted(() => { if (props.spotlight) initSpot() })
onBeforeUnmount(() => { /* всё чистится внутри composables */ })
</script>
