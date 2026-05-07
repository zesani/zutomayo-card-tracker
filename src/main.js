import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css'

document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false })
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault() }, { passive: false })

function resetZoom() {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
}
window.addEventListener('pageshow', resetZoom)
window.addEventListener('load', resetZoom)

createApp(App).use(createPinia()).mount('#app')
