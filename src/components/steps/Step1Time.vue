<script setup>
import { ref, computed } from 'vue'
import { advanceTime } from '../../composables/gameLogic'
import TimeWheel from '../TimeWheel.vue'
import PhaseIcon from '../PhaseIcon.vue'

const nightTime = defineModel('nightTime', { default: 0 })
const dayTime = defineModel('dayTime', { default: 0 })
const emit = defineEmits(['next', 'back'])
const props = defineProps({ currentPosition: { type: Number, default: 0 } })

const CHIPS = [0, 1, 2, 3, 4, 5, 6]

const nightSelected = ref(-1)
const daySelected = ref(-1)

function selectNightChip(val, idx) {
  nightSelected.value = idx
  nightTime.value = val
}

function selectDayChip(val, idx) {
  daySelected.value = idx
  dayTime.value = val
}

const previewPos = computed(() =>
  advanceTime(props.currentPosition, nightTime.value, dayTime.value)
)
const showPreview = computed(() => nightTime.value > 0 || dayTime.value > 0)
</script>

<template>
  <div class="step">
    <h2 class="step-title">Time Points</h2>
    <p class="step-hint">Choose how far each player advances the clock</p>

    <div class="time-sections">
      <div class="time-section">
        <span class="chip-selector-label"><PhaseIcon phase="night" :size="14" /> Night</span>
        <div class="chip-row time-chips">
          <button
            v-for="(val, idx) in CHIPS" :key="'n'+val"
            class="chip chip-night"
            :class="{ 'chip-active-night': nightSelected === idx }"
            @click="selectNightChip(val, idx)"
          >{{ val }}</button>
        </div>
        <div class="stepper">
          <button class="stepper-btn" @click="nightTime = Math.max(0, nightTime - 1)">–</button>
          <span class="stepper-val">{{ nightTime }}</span>
          <button class="stepper-btn" @click="nightTime++">+</button>
        </div>
      </div>

      <div class="time-section">
        <span class="chip-selector-label"><PhaseIcon phase="day" :size="14" /> Day</span>
        <div class="chip-row time-chips">
          <button
            v-for="(val, idx) in CHIPS" :key="'d'+val"
            class="chip chip-day"
            :class="{ 'chip-active-day': daySelected === idx }"
            @click="selectDayChip(val, idx)"
          >{{ val }}</button>
        </div>
        <div class="stepper">
          <button class="stepper-btn" @click="dayTime = Math.max(0, dayTime - 1)">–</button>
          <span class="stepper-val">{{ dayTime }}</span>
          <button class="stepper-btn" @click="dayTime++">+</button>
        </div>
      </div>
    </div>

    <div class="wheel-grow">
      <TimeWheel
        :previewPosition="showPreview ? previewPos : null"
        :showControls="false"
      />
    </div>

    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary" @click="emit('next')">Continue →</button>
    </div>
  </div>
</template>

<style scoped>
.time-sections {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.time-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.6rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.time-section .chip-selector-label {
  font-size: 0.9rem;
}
.time-section .chip-row {
  justify-content: center;
}
.time-section .chip {
  width: 44px;
  height: 44px;
  font-size: 1.05rem;
}
.time-section .chip-row {
  flex-wrap: nowrap;
  gap: 2px;
}
.time-section .stepper {
  width: 100%;
  max-width: 280px;
}
.time-section .stepper-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
}
.time-section .stepper-val {
  font-size: 1.3rem;
}
.wheel-grow { flex: 1; min-height: 80px; }

@media (max-height: 550px) {
  .time-chips { display: none; }
  .step-title, .step-hint { display: none; }
  .time-sections {
    display: flex;
    flex-direction: row;
    gap: 0.4rem;
  }
  .time-section {
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.2rem 0.35rem;
  }
  .time-section .chip-selector-label {
    white-space: nowrap;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  .time-section .stepper {
    max-width: none;
    flex: 1;
  }
  .time-section .stepper-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    font-size: 1rem;
    font-weight: 600;
  }
  .time-section .stepper-val {
    font-size: 1.2rem;
  }
  .wheel-grow { min-height: 0; }
}
</style>
