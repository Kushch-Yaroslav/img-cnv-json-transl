<template>
  <section :class="s.home">
    <header :class="s.header">
      <div :class="s.titleWrap">
        <h1 :class="s.title" ref="titleEl">
          Image <span :class="s.titleAccent">Tools</span>
        </h1>
        <span :class="s.sparkle" aria-hidden="true">✦</span>
      </div>
      <p :class="s.subtitle">
        Local image optimization for web stores, marketplaces and e-commerce content.
      </p>
    </header>

    <RouterLink :to="featuredTool.path" custom v-slot="{ href }">
      <a
          :href="href"
          :class="[s.featuredLink, { [s.cardReady]: ready }]"
          @click.prevent="() => onFeaturedClick(featuredTool.path)"
      >
        <div :class="s.featuredBox">
          <div :class="s.featuredGlow" aria-hidden="true"></div>
          <div :class="s.featuredIcon">{{ featuredTool.icon }}</div>
          <div :class="s.featuredCopy">
            <div :class="s.featuredKicker">Advanced workflow</div>
            <h2 :class="s.featuredTitle">{{ featuredTool.title }}</h2>
            <p :class="s.featuredDesc">{{ featuredTool.desc }}</p>
          </div>
          <div :class="s.featuredBadge">{{ featuredTool.badge }}</div>
        </div>
      </a>
    </RouterLink>

    <main :class="s.grid" ref="gridRef">
      <RouterLink v-for="(item, i) in visibleItems" :key="item.path" :to="item.path" custom v-slot="{ href }">
        <a
            :href="isToolAvailable(item) ? href : undefined"
            :class="[s.cardLink, { [s.cardReady]: ready, [s.cardDisabled]: !isToolAvailable(item) }]"
            :aria-disabled="!isToolAvailable(item)"
            :tabindex="isToolAvailable(item) ? 0 : -1"
            @click.prevent="(e) => onToolClick(e, item)"
            @mousemove="(e) => isToolAvailable(item) && cardTilt[i]?.onMove(e)"
            @mouseenter="() => { if (isToolAvailable(item)) { cardTilt[i]?.onEnter(); onCardHoverStart() } }"
            @mouseleave="() => { if (isToolAvailable(item)) { cardTilt[i]?.onLeave(); onCardHoverEnd() } }"
        >
          <div
              :class="s.cardMover"
              :ref="(el) => { if (isToolAvailable(item)) setCardRef(el) }"
              @pointerdown.stop.prevent="(e)=> isToolAvailable(visibleItems[i]) ? onCardPointerDown(i, e) : null"
          >
            <div :class="s.cardBox">
              <div :class="s.cardShine" aria-hidden="true"></div>
              <div :class="s.cardInner" :ref="(el) => { if (isToolAvailable(item)) setTiltRef(el) }">
                <div :class="s.cardIcon">{{ item.icon }}</div>
                <div :class="s.cardTitle">{{ item.title }}</div>
                <div :class="s.cardDesc">{{ item.desc }}</div>
                <div :class="s.cardBadge">{{ item.badge }}</div>
              </div>
            </div>
          </div>
        </a>

      </RouterLink>

    </main>

    <DropDock
        ref="dockRef"
        :component-map="componentMap"
        @opened:add="it => hiddenPaths.add(it.path)"
    @opened:remove="it => hiddenPaths.delete(it.path)"
    />
    <footer :class="s.footer">
      <span>Made with ❤️ on Vue 3</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount, computed} from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import s from './HomePage.module.css'
import { useCards } from '@/Pages/Home/Composables/useCards'
import {useDragCards} from "@/Pages/Home/Composables/useDragCards";
import DropDock from "@/components/DropDock/DropDock.vue";
import { getAppConfig } from '@/shared/config/appConfig'
import {
  APP_MODE_PREVIEW_CHANGE_EVENT,
  getEffectiveAppMode,
} from '@/shared/config/appModePreview'
import { featuredOptimizerTool, getHomeTools, isToolAvailable, type HomeTool } from '@/Pages/Home/config/toolsConfig'
import type { AppMode } from '@/shared/types/appConfig'

const appConfig = getAppConfig()
const featuredTool = featuredOptimizerTool
const effectiveMode = ref<AppMode>(getEffectiveAppMode(appConfig.mode))
const items = ref<HomeTool[]>(getHomeTools(effectiveMode.value))
const dockRef = ref<InstanceType<typeof DropDock> | null>(null)
const router = useRouter()
const titleEl = ref<HTMLElement | null>(null)
const ready = ref(false)


const gridRef = ref<HTMLElement|null>(null)

const { setCardRef, setTiltRef, cardTilt, initCards, onCardClick, cleanup } = useCards(router, s)

function onFeaturedClick(to: string) {
  router.push(to)
}

function onToolClick(ev: MouseEvent, item: HomeTool) {
  if (!isToolAvailable(item)) return
  onCardClick(ev, item.path)
}

function getCardElByIndex(i: number) {
  const list = gridRef.value?.querySelectorAll(`.${s.cardMover}`) ?? []
  return list[i] as HTMLElement | null
}
function getLinkElByCard(cardEl: HTMLElement) {
  return cardEl.closest(`.${s.cardLink}`) as HTMLElement | null
}

let dockHoverTimer: number | null = null
function onCardHoverStart() {
  if (dockHoverTimer) window.clearTimeout(dockHoverTimer)
  dockHoverTimer = window.setTimeout(() => dockRef.value?.show('hover'), 1000)
}
function onCardHoverEnd() {
  if (dockHoverTimer) window.clearTimeout(dockHoverTimer)
  if (!dragging.value) dockRef.value?.hide()
}

const { dragging,onPointerDown: onCardPointerDown } = useDragCards({
  gridRef: () => gridRef.value,
  getCardElByIndex,
  getLinkElByCard,
  itemsRef: items,
  s,
  getDockRect: () => dockRef.value?.getZoneRect() ?? null,
  dropToDock: (item) => {
    if (item && isToolAvailable(item)) dockRef.value?.add(item)
  },
  getItemByIndex: (i) => visibleItems.value[i],
  onDragStart: () => dockRef.value?.show('drag'),
  onDragEnd:   () => dockRef.value?.hide(),
  onDropOutside: (index, el) => {
    const link = getLinkElByCard(el)?.getAttribute('href')
    if (link) router.push(link)
  }
})




import ConvertPage from '@/Pages/ConvertPage/ConvertPage.vue'
import RemoveBgPage from '@/Pages/RemoveBgPage/RemoveBgPage.vue'
import UpscalePage from '@/Pages/UpscalePage/UpscalePage.vue'
import JsonTranslatePage from '@/Pages/JsonTranslatePage/JsonTranslatePage.vue'

const componentMap = {
  '/convert': ConvertPage,
  '/compress': ConvertPage,
  '/resize': ConvertPage,
  '/convert-format': ConvertPage,
  '/crop': ConvertPage,
  '/remove-bg': RemoveBgPage,
  '/upscale': UpscalePage,
  '/translate': JsonTranslatePage,
}

const hiddenPaths = ref<Set<string>>(new Set())

const visibleItems = computed(() =>
    items.value.filter(it => !hiddenPaths.value.has(it.path))
)

function syncHomeToolsForMode() {
  effectiveMode.value = getEffectiveAppMode(appConfig.mode)
  items.value = getHomeTools(effectiveMode.value)
  hiddenPaths.value = new Set()
  dockRef.value?.hide()

  for (const opened of [...(dockRef.value?.opened ?? [])]) {
    const currentTool = items.value.find((item) => item.path === opened.path)
    if (currentTool && !isToolAvailable(currentTool)) {
      dockRef.value?.remove(opened)
    }
  }
}

onMounted(() => {
  initCards(titleEl.value)
  window.addEventListener(APP_MODE_PREVIEW_CHANGE_EVENT, syncHomeToolsForMode)
  requestAnimationFrame(() => (ready.value = true))
})
onBeforeUnmount(() => {
  window.removeEventListener(APP_MODE_PREVIEW_CHANGE_EVENT, syncHomeToolsForMode)
  cleanup()
})
</script>
