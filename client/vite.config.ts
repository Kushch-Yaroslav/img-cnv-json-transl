import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    plugins: [vue()],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },

    css: {
        devSourcemap: true,
    },

    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-vue': ['vue', 'vue-router'],
                    'vendor-gsap': ['gsap'],
                },
            },
        },
    },

    server: {
        port: 5173,
        proxy: {
            '/convert': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                bypass(req) {
                    if (req.headers.accept?.includes('text/html')) return '/index.html'
                },
            },
            '/remove-bg': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                bypass(req) {
                    if (req.headers.accept?.includes('text/html')) return '/index.html'
                },
            },
            '/pipeline': { target: 'http://localhost:3000', changeOrigin: true, bypass(req){ if (req.headers.accept?.includes('text/html')) return '/index.html' } },
            '/enhance':  { target: 'http://localhost:3000', changeOrigin: true, bypass(req){ if (req.headers.accept?.includes('text/html')) return '/index.html' } },
            '/translate':{ target: 'http://localhost:3000', changeOrigin: true, bypass(req){ if (req.headers.accept?.includes('text/html')) return '/index.html' } },
        },
    }

})
