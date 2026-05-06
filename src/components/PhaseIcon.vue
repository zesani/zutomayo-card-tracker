<script>
let _uid = 0
</script>

<script setup>
defineProps({
  phase: { type: String, required: true },
  size: { type: Number, default: 20 },
})

const uid = _uid++
</script>

<template>
  <svg
    v-if="phase === 'night'"
    :width="size" :height="size" viewBox="0 0 24 24"
    class="phase-icon"
  >
    <defs>
      <mask :id="`pi-moon-${uid}`">
        <circle cx="12" cy="12" r="10" fill="white"/>
        <circle cx="16" cy="10" r="7.6" fill="black"/>
      </mask>
    </defs>
    <circle cx="12" cy="12" r="10" fill="#8b7cf0" :mask="`url(#pi-moon-${uid})`"/>
  </svg>

  <svg
    v-else
    :width="size" :height="size" viewBox="0 0 24 24"
    class="phase-icon"
  >
    <path
      v-for="i in 8"
      :key="i"
      :d="(() => {
        const a = ((i - 1) * 2 * Math.PI / 8) - Math.PI / 2
        const half = 16 * Math.PI / 180
        const tx = 12 + 10 * Math.cos(a)
        const ty = 12 + 10 * Math.sin(a)
        const ax = 12 + 4.5 * Math.cos(a - half)
        const ay = 12 + 4.5 * Math.sin(a - half)
        const bx = 12 + 4.5 * Math.cos(a + half)
        const by = 12 + 4.5 * Math.sin(a + half)
        return `M${ax.toFixed(2)},${ay.toFixed(2)} L${tx.toFixed(2)},${ty.toFixed(2)} L${bx.toFixed(2)},${by.toFixed(2)} Z`
      })()"
      fill="#d97706"
    />
    <circle cx="12" cy="12" r="3.5" fill="#d97706"/>
  </svg>
</template>

<style scoped>
.phase-icon {
  vertical-align: middle;
  flex-shrink: 0;
  display: inline-block;
}
</style>
