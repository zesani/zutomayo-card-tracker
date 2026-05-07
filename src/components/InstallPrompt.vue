<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const show = ref(false)
const isIos = ref(false)
const isStandalone = ref(false)
let deferredPrompt = null

function onBeforeInstall(e) {
  e.preventDefault()
  deferredPrompt = e
  show.value = true
}

async function install() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') show.value = false
    deferredPrompt = null
  } else if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen()
    show.value = false
  }
}

function dismiss() {
  show.value = false
}

onMounted(() => {
  isStandalone.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true

  if (isStandalone.value) return

  isIos.value = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream

  if (isIos.value) {
    show.value = true
  } else {
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    // Fallback: show fullscreen button after short delay if no install prompt
    setTimeout(() => {
      if (!deferredPrompt && document.fullscreenEnabled) show.value = true
    }, 1500)
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall)
})
</script>

<template>
  <div v-if="show" class="install-banner">
    <template v-if="isIos">
      <span class="install-text">แตะ <strong>Share</strong> → <strong>Add to Home Screen</strong> เพื่อเปิดเต็มจอ</span>
      <button class="install-dismiss" @click="dismiss">✕</button>
    </template>
    <template v-else>
      <span class="install-text">เพิ่มไปยังหน้าจอหลักเพื่อเปิดเต็มจอ</span>
      <button class="install-btn" @click="install">{{ deferredPrompt ? 'ติดตั้ง' : 'เต็มจอ' }}</button>
      <button class="install-dismiss" @click="dismiss">✕</button>
    </template>
  </div>
</template>

<style scoped>
.install-banner {
  position: fixed;
  bottom: max(0.75rem, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 1.5rem);
  max-width: 440px;
  z-index: 500;
  background: var(--surface-2);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  padding: 0.65rem 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}
.install-text {
  flex: 1;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}
.install-btn {
  background: var(--accent);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.install-dismiss {
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 0.3rem;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
</style>
