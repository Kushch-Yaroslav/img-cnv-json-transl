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
        Быстрые модули для конвертации, улучшения и перевода изображений — в одном месте.
      </p>
    </header>

    <main :class="s.grid" ref="gridRef">
      <RouterLink v-for="(item, i) in visibleItems" :key="item.path" :to="item.path" custom v-slot="{ href }">
        <a
            :href="href"
            :class="[s.cardLink, { [s.cardReady]: ready }]"
            @click.prevent="(e) => onCardClick(e, item.path)"
            @mousemove="(e) => cardTilt[i]?.onMove(e)"
            @mouseenter="() => { cardTilt[i]?.onEnter(); onCardHoverStart() }"
            @mouseleave="() => { cardTilt[i]?.onLeave(); onCardHoverEnd() }"
        >
          <div
              :class="s.cardMover"
              :ref="setCardRef"
              @pointerdown.stop.prevent="(e)=> (items[i].path === '/home' || items[i].path === '/main') ? null : onCardPointerDown(i, e)"
          >
            <div :class="s.cardBox">
              <div :class="s.cardShine" aria-hidden="true"></div>
              <div :class="s.cardInner" :ref="setTiltRef">
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
import {ref, onMounted, onBeforeUnmount, reactive, computed} from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import s from './HomePage.module.css'
import { useCards } from '@/Pages/Home/Composables/useCards'
import {useDragCards} from "@/Pages/Home/Composables/useDragCards";
import DropDock from "@/components/DropDock/DropDock.vue";

type GridItem = {
  title: string
  desc: string
  path: string
  icon: string
  badge: string
}

const items = ref<GridItem[]>([
  { title: 'All-in-One', desc: 'Все инструменты сразу', path: '/main',     icon: '🧰', badge: 'Starter' },
  { title: 'Convert',    desc: 'Форматы, качество, ресайз', path: '/convert',   icon: '🔁', badge: 'Core' },
  { title: 'Remove BG',  desc: 'Магия вырезания фона',      path: '/remove-bg', icon: '🪄', badge: 'Soon' },
  { title: 'UpscalePage',desc: 'Резкость, апскейл, шум',    path: '/upscale',   icon: '✨', badge: 'Soon' },
  { title: 'Translate',  desc: 'OCR + перевод',             path: '/translate', icon: '🌐', badge: 'Soon' },
  { title: 'Pipeline',   desc: 'Сборки под задачу',         path: '/pipeline',  icon: '🧬', badge: 'Soon' },
])
const dockRef = ref<InstanceType<typeof DropDock> | null>(null)
const router = useRouter()
const titleEl = ref<HTMLElement | null>(null)
const ready = ref(false)


const gridRef = ref<HTMLElement|null>(null)

const { setCardRef, setTiltRef, cardTilt, initCards, onCardClick, cleanup } = useCards(router, s)

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
  dropToDock: (item) => dockRef.value?.add(item),
  getItemByIndex: (i) => items.value[i],
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
  '/remove-bg': RemoveBgPage,
  '/upscale': UpscalePage,
  '/translate': JsonTranslatePage,
}

const hiddenPaths = ref<Set<string>>(new Set())

const visibleItems = computed(() =>
    items.value.filter(it => !hiddenPaths.value.has(it.path))
)

onMounted(() => {
  initCards(titleEl.value)
  requestAnimationFrame(() => (ready.value = true))
})
onBeforeUnmount(cleanup)
</script>
