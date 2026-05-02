import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import {router} from "@/Router/router";
import i18n from "@/localization";

createApp(App).use(router).use(i18n).mount('#app')