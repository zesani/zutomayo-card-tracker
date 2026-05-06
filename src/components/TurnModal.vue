<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { advanceTime, getPhase, resolveCombat, getCardLimits } from '../composables/gameLogic'
import Step1Time from './steps/Step1Time.vue'
import Step3Attack from './steps/Step3Attack.vue'
import Step4Result from './steps/Step4Result.vue'

const emit = defineEmits(['close'])
const store = useGameStore()

const step = ref(1)
const nightTime = ref(0)
const dayTime = ref(0)
const nightAttack = ref(0)
const dayAttack = ref(0)

const previewPosition = computed(() =>
  advanceTime(store.timePosition, nightTime.value, dayTime.value)
)
const previewPhase = computed(() => getPhase(previewPosition.value))
const previewCombat = computed(() =>
  resolveCombat(nightAttack.value, dayAttack.value, store.hp.night, store.hp.day)
)
const previewCardLimit = computed(() => getCardLimits(previewCombat.value.winner))

function endTurn() {
  store.resolveTurn(nightTime.value, dayTime.value, nightAttack.value, dayAttack.value)
  emit('close')
}

</script>

<template>
  <div class="turn-page">
    <div class="turn-content">
      <div class="turn-header">
        <span class="turn-badge">Turn {{ store.turnNumber }}</span>
        <div class="step-dots">
          <span class="step-dot" :class="{ active: step >= 1, current: step === 1 }">1</span>
          <span class="step-dot-sep"></span>
          <span class="step-dot" :class="{ active: step >= 2, current: step === 2 }">2</span>
          <span class="step-dot-sep"></span>
          <span class="step-dot" :class="{ active: step >= 3, current: step === 3 }">3</span>
        </div>
      </div>
      <Step1Time
        v-if="step === 1"
        v-model:nightTime="nightTime"
        v-model:dayTime="dayTime"
        :currentPosition="store.timePosition"
        @next="step++"
        @back="emit('close')"
      />
      <Step3Attack
        v-else-if="step === 2"
        v-model:nightAttack="nightAttack"
        v-model:dayAttack="dayAttack"
        :phase="previewPhase"
        :position="previewPosition"
        :current-hp="store.hp"
        :preview-combat="previewCombat"
        @next="step++"
        @back="step--"
      />
      <Step4Result
        v-else-if="step === 3"
        :combat="previewCombat"
        :card-limit="previewCardLimit"
        :current-hp="store.hp"
        @end-turn="endTurn"
        @back="step--"
      />
    </div>
  </div>
</template>

<style scoped>
.turn-page {
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  z-index: 100;
  height: 100dvh;
  overflow: hidden;
}
.turn-content {
  flex: 1;
  min-height: 0;
  padding: 0.75rem;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.turn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 0.4rem;
}
.turn-badge {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: var(--font-display);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.step-dots { display: flex; align-items: center; gap: 0.35rem; }
.step-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1.5px solid var(--border);
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s ease;
}
.step-dot.active { border-color: var(--accent); background: rgba(139, 92, 246, 0.2); color: var(--accent-light); }
.step-dot.current { background: var(--accent); border-color: var(--accent); color: white; }
.step-dot-sep {
  width: 8px; height: 1px;
  background: var(--border);
}
</style>
