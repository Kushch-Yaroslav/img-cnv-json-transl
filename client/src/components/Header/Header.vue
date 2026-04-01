<template>
  <header :class="s.header">
    <!-- внутренний аурора-слой, не зависит от FXLayout -->
    <div :class="s.aurora" aria-hidden="true"></div>

    <div :class="s.row">
      <!-- ЛОГО-БЕЙДЖ с градиентной рамкой -->
      <RouterLink to="/home" :class="s.logoBadge" aria-label="Image Tools — Home">
        <span :class="s.logoMain">Image</span>
        <span :class="s.logoAccent">Tools</span>
      </RouterLink>

      <!-- НАВИГАЦИЯ -->
      <nav :class="s.nav">
        <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :class="[s.navItem, { [s.active]: route.path === link.to }]"
        >
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>

      <!-- АККАУНТ -->
      <div :class="s.account">
        <span :class="s.plan">Premium</span>
        <button type="button" :class="s.avatarBtn" aria-label="Profile">👤</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import s from "./Header.module.css";

const route = useRoute();
const links = [
  { to: "/home",      label: "Home" },
  { to: "/convert",   label: "Convert" },
  { to: "/remove-bg", label: "Remove BG" },
  { to: "/upscale",   label: "Upscale" },
  { to: "/translate", label: "Translate" },
];
</script>
