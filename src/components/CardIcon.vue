<script setup>
defineProps({ size: { type: Number, default: 14 } })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" class="card-icon">
    <rect x="3" y="2" width="18" height="20" rx="2.5" ry="2.5"
      fill="none" stroke="currentColor" stroke-width="1.8"/>
    <!-- top-left pip -->
    <polygon points="7,5 8.2,7 7,9 5.8,7" fill="currentColor"/>
    <!-- bottom-right pip (rotated) -->
    <polygon points="17,15 18.2,17 17,19 15.8,17" fill="currentColor"/>
  </svg>
</template>

<style scoped>
.card-icon { vertical-align: -0.2em; flex-shrink: 0; display: inline-block; }
</style>
