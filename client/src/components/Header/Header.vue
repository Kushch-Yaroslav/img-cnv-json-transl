<template>
  <header :class="s.header">
    <!-- внутренний аурора-слой, не зависит от FXLayout -->
    <div :class="s.aurora" aria-hidden="true"></div>

    <div :class="s.row">
      <!-- ЛОГО-БЕЙДЖ с градиентной рамкой -->
      <RouterLink to="/home" :class="s.logoBadge" :aria-label="$t('header.logo.ariaLabel')">
        <span :class="s.logoMain">Image</span>
        <span :class="s.logoAccent">Tools</span>
      </RouterLink>

      <!-- НАВИГАЦИЯ -->
      <nav :class="s.nav">
        <template v-for="link in links" :key="link.to">
          <RouterLink
              v-if="link.available"
              :to="link.to"
              :class="[s.navItem, { [s.active]: isActive(link) }]"
          >
            <span>{{ link.label }}</span>
            <span v-if="link.badge" :class="s.navBadge">{{ link.badge }}</span>
          </RouterLink>
          <span
              v-else
              :class="[s.navItem, s.navDisabled]"
              aria-disabled="true"
          >
            <span>{{ link.label }}</span>
            <span :class="s.navBadge">{{ link.badge }}</span>
          </span>
        </template>
      </nav>

      <!-- АККАУНТ -->
      <div :class="s.account">
        <!-- I18N SWITCHER -->
        <div :class="s.langWrap">
          <button
            ref="langBtnRef"
            type="button"
            :class="s.langBtn"
            @click="toggleLangMenu"
          >
            <span :class="s.langFlag">{{ currentLanguage?.flag }}</span>
            <span :class="s.langName">{{ currentLanguage?.nativeName }}</span>
            <span :class="s.langArrow">▾</span>
          </button>
        </div>

        <div :class="s.modeWrap">
          <button
              ref="modeBadgeRef"
              type="button"
              :class="[s.modeBadge, s[`mode_${displayMode}`], { [s.modeClickable]: canPreviewMode }]"
              :aria-haspopup="canPreviewMode ? 'listbox' : undefined"
              :aria-expanded="canPreviewMode ? String(modeMenuOpen) : undefined"
              :disabled="!canPreviewMode"
              @click="toggleModeMenu"
          >
            {{ modeLabel(displayMode) }}
          </button>
        </div>
        <button type="button" :class="s.avatarBtn" :aria-label="$t('header.profile.ariaLabel')">👤</button>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <!-- LANGUAGE MENU -->
    <div
      v-if="langMenuOpen"
      ref="langMenuRef"
      :class="s.langMenu"
      :style="langMenuStyle"
    >
      <button
        v-for="lang in languages"
        :key="lang.code"
        type="button"
        :class="[s.langOption, $i18n.locale === lang.code && s.langOptionActive]"
        @click="selectLanguage(lang.code)"
      >
        <span :class="s.langFlag">{{ lang.flag }}</span>
        <span :class="s.langName">{{ lang.nativeName }}</span>
      </button>
    </div>

    <!-- MODE MENU -->
    <div
        v-if="canPreviewMode && modeMenuOpen"
        ref="modeMenuRef"
        :class="s.modeMenu"
        :style="modeMenuStyle"
        role="listbox"
    >
      <button
          v-for="mode in modeOptions"
          :key="mode"
          type="button"
          :class="[s.modeOption, previewMode === mode && s.modeOptionActive]"
          role="option"
          :aria-selected="previewMode === mode"
          @click="selectPreviewMode(mode)"
      >
        {{ modeLabel(mode) }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute } from "vue-router";
import { useI18n } from 'vue-i18n';
import s from "./Header.module.css";
import { getAppConfig } from '@/shared/config/appConfig'
import type { AppMode } from '@/shared/types/appConfig'
import {
  APP_MODE_OPTIONS,
  canPreviewAppMode,
  getEffectiveAppMode,
  getStoredPreviewMode,
  setStoredPreviewMode,
} from '@/shared/config/appModePreview'
import { languages } from '@/localization/languages'
import { setLanguage } from '@/localization'

const { t, locale } = useI18n()
const route = useRoute();
const appConfig = getAppConfig()
const actualMode = appConfig.mode
const canPreviewMode = canPreviewAppMode(actualMode)
const modeOptions = APP_MODE_OPTIONS
const previewMode = ref<AppMode>(getStoredPreviewMode(actualMode))
const modeMenuOpen = ref(false)
const modeBadgeRef = ref<HTMLButtonElement | null>(null)
const modeMenuRef = ref<HTMLElement | null>(null)
const modeMenuPosition = ref({ top: 0, left: 0, minWidth: 128 })

// i18n
const langMenuOpen = ref(false)
const langBtnRef = ref<HTMLButtonElement | null>(null)
const langMenuRef = ref<HTMLElement | null>(null)
const langMenuPosition = ref({ top: 0, left: 0, minWidth: 160 })

const displayMode = computed(() => canPreviewMode ? previewMode.value : actualMode)
const effectiveMode = computed(() => canPreviewMode ? previewMode.value : getEffectiveAppMode(actualMode))

const modeMenuStyle = computed(() => ({
  top: `${modeMenuPosition.value.top}px`,
  left: `${modeMenuPosition.value.left}px`,
  minWidth: `${modeMenuPosition.value.minWidth}px`,
}))

const langMenuStyle = computed(() => ({
  top: `${langMenuPosition.value.top}px`,
  left: `${langMenuPosition.value.left}px`,
  minWidth: `${langMenuPosition.value.minWidth}px`,
}))

const currentLanguage = computed(() => languages.find(l => l.code === locale.value))

type NavLink = {
  to: string
  label: string
  available: boolean
  badge?: string
}

function canOpenExperimentalTools(mode: AppMode) {
  return mode === 'local' || mode === 'development'
}

const links = computed<NavLink[]>(() => {
  const experimentalAvailable = canOpenExperimentalTools(effectiveMode.value)

  return [
    { to: "/home",      label: t('header.nav.home'),       available: true },
    { to: "/convert",   label: t('header.nav.allInOne'), available: true },
    { to: "/remove-bg", label: t('header.nav.removeBg'),  available: experimentalAvailable, badge: experimentalAvailable ? undefined : t('common.badges.soon') },
    { to: "/upscale",   label: t('header.nav.upscale'),    available: experimentalAvailable, badge: experimentalAvailable ? undefined : t('common.badges.soon') },
    { to: "/translate", label: t('header.nav.translate'),  available: experimentalAvailable, badge: experimentalAvailable ? undefined : t('common.badges.soon') },
  ]
})

function isActive(link: NavLink) {
  return route.path === link.to
}

function modeLabel(mode: AppMode) {
  if (mode === 'development') return t('appMode.development.short')
  return t(`appMode.${mode}.label`)
}

function toggleModeMenu() {
  if (!canPreviewMode) return
  if (modeMenuOpen.value) {
    closeModeMenu()
    return
  }
  closeLangMenu()
  openModeMenu()
}

function toggleLangMenu() {
  if (langMenuOpen.value) {
    closeLangMenu()
    return
  }
  closeModeMenu()
  openLangMenu()
}

function selectPreviewMode(mode: AppMode) {
  previewMode.value = mode
  setStoredPreviewMode(mode)
  closeModeMenu()
}

function selectLanguage(code: string) {
  setLanguage(code)
  closeLangMenu()
}

async function openModeMenu() {
  updateModeMenuPosition()
  modeMenuOpen.value = true
  await nextTick()
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  document.addEventListener('keydown', onDocumentKeydown)
  window.addEventListener('resize', closeModeMenu)
  window.addEventListener('scroll', closeModeMenu, true)
}

function closeModeMenu() {
  modeMenuOpen.value = false
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  document.removeEventListener('keydown', onDocumentKeydown)
  window.removeEventListener('resize', closeModeMenu)
  window.removeEventListener('scroll', closeModeMenu, true)
}

async function openLangMenu() {
  updateLangMenuPosition()
  langMenuOpen.value = true
  await nextTick()
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  document.addEventListener('keydown', onDocumentKeydown)
  window.addEventListener('resize', closeLangMenu)
  window.addEventListener('scroll', closeLangMenu, true)
}

function closeLangMenu() {
  langMenuOpen.value = false
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  document.removeEventListener('keydown', onDocumentKeydown)
  window.removeEventListener('resize', closeLangMenu)
  window.removeEventListener('scroll', closeLangMenu, true)
}

function updateModeMenuPosition() {
  const badge = modeBadgeRef.value
  if (!badge) return

  const rect = badge.getBoundingClientRect()
  const minWidth = Math.max(128, rect.width)
  const viewportGap = 8
  const left = Math.max(
      viewportGap,
      Math.min(window.innerWidth - minWidth - viewportGap, rect.right - minWidth)
  )

  modeMenuPosition.value = {
    top: rect.bottom + 8,
    left,
    minWidth,
  }
}

function updateLangMenuPosition() {
  const btn = langBtnRef.value
  if (!btn) return

  const rect = btn.getBoundingClientRect()
  const minWidth = 160
  const viewportGap = 8
  const left = Math.max(
    viewportGap,
    Math.min(window.innerWidth - minWidth - viewportGap, rect.left)
  )

  langMenuPosition.value = {
    top: rect.bottom + 8,
    left,
    minWidth,
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target) return
  
  if (modeMenuOpen.value) {
    if (modeBadgeRef.value?.contains(target)) return
    if (modeMenuRef.value?.contains(target)) return
    closeModeMenu()
  }

  if (langMenuOpen.value) {
    if (langBtnRef.value?.contains(target)) return
    if (langMenuRef.value?.contains(target)) return
    closeLangMenu()
  }
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeModeMenu()
    closeLangMenu()
  }
}

onBeforeUnmount(() => {
  closeModeMenu()
  closeLangMenu()
})
</script>
