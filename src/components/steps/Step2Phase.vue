<script setup>
import PhaseIcon from '../PhaseIcon.vue'

defineProps({ position: Number, phase: String })
const emit = defineEmits(['next', 'back'])
</script>

<template>
  <div class="step">
    <h2 class="step-title">Step 2 — Phase</h2>
    <div class="phase-result">
      <span class="result-icon"><PhaseIcon :phase="phase" :size="48" /></span>
      <span class="result-label">{{ phase === 'night' ? 'Night Phase' : 'Day Phase' }}</span>
    </div>
    <p class="step-hint">Apply phase modifiers to your character's attack before the next step.</p>
    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary" @click="emit('next')">Continue →</button>
    </div>
  </div>
</template>
