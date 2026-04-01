<template>
  <section class="app-wrapper">
    <ConvertPage/>
    <RemoveBgPage/>
    <PipelineHard/>
    <UpscalePage/>
    <JsonTranslatePage/>
  </section>
</template>

<script setup lang="ts">
import RemoveBgPage from "@/Pages/RemoveBgPage/RemoveBgPage.vue";
import PipelineHard from "@/components/PipelineHard.vue";
import UpscalePage from "@/Pages/UpscalePage/UpscalePage.vue";
import JsonTranslatePage from "@/Pages/JsonTranslatePage/JsonTranslatePage.vue";
import ConvertPage from "@/Pages/ConvertPage/ConvertPage.vue";


</script>
