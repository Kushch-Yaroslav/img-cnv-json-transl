<template>
  <Header/>
  <FXLayout :cursor-fx="true" :spotlight="true" :mouse-trail="true" :boids="true" :parallax="true">
    <RouterView/>
  </FXLayout>
</template>

<script setup lang="ts">
import FXLayout from "@/Layouts/FXLayout/FXLayout.vue";
import Header from "@/components/Header/Header.vue";
</script>