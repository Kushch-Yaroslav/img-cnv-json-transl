import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/Pages/MainPage/MainPage.vue'
import HomePage from '@/Pages/Home/HomePage.vue'
import ConvertPage from '@/Pages/ConvertPage/ConvertPage.vue'
import RemoveBgPage from '@/Pages/RemoveBgPage/RemoveBgPage.vue'
import UpscalePage from '@/Pages/UpscalePage/UpscalePage.vue'
import JsonTranslatePage from '@/Pages/JsonTranslatePage/JsonTranslatePage.vue'
import type { OptimizerMode } from '@/Pages/Home/config/toolsConfig'

const optimizerMeta = (optimizerMode: OptimizerMode) => ({ optimizerMode })

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', redirect: '/home' },
        { path: '/home', name: 'home', component: HomePage },
        { path: '/main', name: 'main', component: MainPage },
        { path: '/convert', name: 'convert', component: ConvertPage, meta: optimizerMeta('all-in-one') },
        { path: '/compress', name: 'compress', component: ConvertPage, meta: optimizerMeta('compress') },
        { path: '/resize', name: 'resize', component: ConvertPage, meta: optimizerMeta('resize') },
        { path: '/convert-format', name: 'convertFormat', component: ConvertPage, meta: optimizerMeta('format') },
        { path: '/crop', name: 'crop', component: ConvertPage, meta: optimizerMeta('crop') },
        { path: '/remove-bg', name: 'removeBg', component: RemoveBgPage },
        { path: '/upscale', name: 'upscale', component: UpscalePage },
        { path: '/translate', name: 'translate', component: JsonTranslatePage },
        { path: '/:pathMatch(.*)*', redirect: '/home' },
    ],
})
