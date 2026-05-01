<template>
  <div :class="s.root">
    <!-- уже открытые страницы -->
    <transition-group name="dockcard" tag="div" :class="s.cards">
      <div v-for="it in opened" :key="it.path" :class="s.card">
        <header :class="s.cardHead">
          <span :class="s.cardIcon">{{ it.icon }}</span>
          <strong :class="s.cardTitle">{{ it.title }}</strong>
          <button :class="s.close" @click="remove(it)">✕</button>
        </header>

        <div :class="s.cardBody">
          <!-- реальный компонент страницы -->
          <Suspense>
            <KeepAlive>
              <component
                  :is="componentMap[it.path]"
                  :key="it.path"
                  v-bind="getComponentProps(it)"
              />
            </KeepAlive>
          </Suspense>
        </div>
      </div>
    </transition-group>

    <!-- зона дропа -->
    <transition name="dock">
      <div v-if="visible" ref="zone" :class="[s.zone, { [s.zoneArmed]: armed }]">
        <div :class="s.zoneGlow" />
        <div :class="s.zoneLabel">Перетащите сюда карточку</div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, type Component } from 'vue'
import s from './DropDock.module.css'
import type { OptimizerMode } from '@/Pages/Home/config/toolsConfig'

export type DockItem = {
  title: string
  desc: string
  path: string
  icon: string
  badge: string
  optimizerMode?: OptimizerMode
}

const props = defineProps<{
  componentMap: Record<string, Component>   // path -> компонент страницы
}>()

const opened = reactive<DockItem[]>([])
const visible = ref(false)
const armed = ref(false)
const zone = ref<HTMLElement|null>(null)

function show(from: 'hover'|'drag' = 'hover') { visible.value = true; armed.value = from === 'drag' }
function hide() { visible.value = false; armed.value = false }
function getZoneRect() { return zone.value?.getBoundingClientRect() ?? null }

function getComponentProps(item: DockItem) {
  return item.optimizerMode ? { optimizerMode: item.optimizerMode } : {}
}

const emit = defineEmits<{
  'opened:add': [DockItem],
  'opened:remove': [DockItem]
}>()

function add(item: DockItem | null) {
  if (!item) return
  if (item.path === '/home' || item.path === '/main') return  // защита
  opened.push(item)
  emit('opened:add', item)        // ⬅️
  hide()
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
}

function remove(item: DockItem) {
  const i = opened.findIndex(x => x.path === item.path)
  if (i >= 0) opened.splice(i, 1)
  emit('opened:remove', item)     // ⬅️
}
defineExpose({ show, hide, getZoneRect, add, remove, opened })
</script>
