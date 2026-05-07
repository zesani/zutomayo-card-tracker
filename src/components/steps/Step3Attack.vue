<script setup>
import { ref } from 'vue'
import PhaseIcon from '../PhaseIcon.vue'

const nightAttack = defineModel('nightAttack', { default: 0 })
const dayAttack = defineModel('dayAttack', { default: 0 })
const props = defineProps({
  phase:         { type: String, required: true },
  prevPhase:     { type: String, default: null },
  position:      { type: Number, default: 0 },
  nightAttack:   { type: Number, default: 0 },
  dayAttack:     { type: Number, default: 0 },
  currentHp:     { type: Object, default: () => ({ night: 0, day: 0 }) },
  previewCombat: { type: Object, default: null },
})
const emit = defineEmits(['next', 'back'])

const PRESETS = [0, 10, 30, 50, 100, 150]

function fillPct(side) {
  const cur = props.currentHp[side]
  if (!cur) return 100
  const newHp = props.previewCombat ? props.previewCombat[side + 'Hp'] : cur
  return (newHp / cur) * 100
}

function damagePct(side) {
  const cur = props.currentHp[side]
  if (!cur || !props.previewCombat) return 0
  return ((cur - props.previewCombat[side + 'Hp']) / cur) * 100
}

const nightSelected = ref(-1)
const daySelected = ref(-1)

function selectNight(val, idx) {
  nightSelected.value = idx
  nightAttack.value = val
}

function selectDay(val, idx) {
  daySelected.value = idx
  dayAttack.value = val
}

function adjustNight(delta) {
  nightAttack.value = Math.max(0, nightAttack.value + delta)
  nightSelected.value = -1
}

function adjustDay(delta) {
  dayAttack.value = Math.max(0, dayAttack.value + delta)
  daySelected.value = -1
}
</script>

<template>
  <div class="step">
    <div class="phase-hero" :class="phase === 'night' ? 'phase-hero-night' : 'phase-hero-day'">
      <span class="phase-hero-icon"><PhaseIcon :phase="phase" :size="28" /></span>
      <span class="phase-hero-text">{{ phase === 'night' ? 'NIGHT' : 'DAY' }}</span>
      <div v-if="prevPhase && prevPhase !== phase" class="phase-change-badge">
        <span :class="'phase-tag-' + prevPhase">{{ prevPhase === 'night' ? 'Night' : 'Day' }}</span>
        <span class="phase-arrow">→</span>
        <span :class="'phase-tag-' + phase">{{ phase === 'night' ? 'Night' : 'Day' }}</span>
      </div>
    </div>

    <h2 class="step-title">Attack Power</h2>

    <!-- HP preview -->
    <div class="hp-preview">
      <div v-for="side in ['night', 'day']" :key="side" class="hp-row">
        <div class="hp-label">
          <span class="hp-label-name"><PhaseIcon :phase="side" :size="14" /> {{ side === 'night' ? 'Night' : 'Day' }}</span>
          <span class="hp-numbers">
            {{ currentHp[side] }}
            <template v-if="previewCombat && currentHp[side] > previewCombat[side + 'Hp']">
              → {{ previewCombat[side + 'Hp'] }}
              <span class="hp-dmg-num">(-{{ currentHp[side] - previewCombat[side + 'Hp'] }})</span>
            </template>
          </span>
        </div>
        <div class="hp-bar-track">
          <div class="hp-fill"
            :class="side === 'night' ? 'hp-fill-night' : 'hp-fill-day'"
            :style="{ width: fillPct(side) + '%' }"></div>
          <div class="hp-damage" :style="{ width: damagePct(side) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Night Attack -->
    <div class="chip-selector">
      <div class="chip-selector-label"><PhaseIcon phase="night" :size="14" /> Night Attack</div>
      <div class="chip-row">
        <button
          v-for="(val, idx) in PRESETS" :key="val"
          class="chip"
          :class="nightSelected === idx ? 'chip-active-night chip-night' : 'chip-night'"
          @click="selectNight(val, idx)"
        >{{ val }}</button>
      </div>
      <div class="stepper">
        <button class="stepper-btn" @click="adjustNight(-10)">–10</button>
        <span class="stepper-val">{{ nightAttack }}</span>
        <button class="stepper-btn" @click="adjustNight(10)">+10</button>
      </div>
    </div>

    <!-- Day Attack -->
    <div class="chip-selector">
      <div class="chip-selector-label"><PhaseIcon phase="day" :size="14" /> Day Attack</div>
      <div class="chip-row">
        <button
          v-for="(val, idx) in PRESETS" :key="val"
          class="chip"
          :class="daySelected === idx ? 'chip-active-day chip-day' : 'chip-day'"
          @click="selectDay(val, idx)"
        >{{ val }}</button>
      </div>
      <div class="stepper">
        <button class="stepper-btn" @click="adjustDay(-10)">–10</button>
        <span class="stepper-val">{{ dayAttack }}</span>
        <button class="stepper-btn" @click="adjustDay(10)">+10</button>
      </div>
    </div>

    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary" @click="emit('next')">Continue →</button>
    </div>
  </div>
</template>

<style scoped>
.phase-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.6rem;
  border-radius: var(--radius);
  flex: 1;
  min-height: 50px;
  max-height: 140px;
  position: relative;
}
.phase-hero-night { background: rgba(139, 124, 240, 0.08); border: 1px solid rgba(139, 124, 240, 0.15); }
.phase-hero-day   { background: rgba(240, 160, 64, 0.06);  border: 1px solid rgba(240, 160, 64, 0.12); }
.phase-hero-icon { font-size: 1.8rem; line-height: 1; }
.phase-hero-text {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: var(--font-display);
  letter-spacing: 0.08em;
}
.phase-hero-night .phase-hero-text { color: var(--accent-light); }
.phase-hero-day   .phase-hero-text { color: var(--day); }

.phase-change-badge {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(0,0,0,0.45);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  white-space: nowrap;
}
.phase-arrow { color: var(--text-muted); }
.phase-tag-night { color: var(--accent-light); }
.phase-tag-day   { color: var(--day); }

.hp-preview { display: flex; flex-direction: column; gap: 0.35rem; }
.hp-row { display: flex; flex-direction: column; gap: 0.15rem; }
.hp-label { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; }
.hp-label-name { flex-shrink: 0; }
.hp-numbers { color: var(--text-muted, #9ca3af); white-space: nowrap; }
.hp-dmg-num { color: #ef4444; }
.hp-bar-track { display: flex; height: 10px; border-radius: 5px; overflow: hidden; background: var(--surface-2, #1f2937); }
.hp-fill { height: 100%; transition: width 0.5s ease; }
.hp-fill-night { background: #7c3aed; }
.hp-fill-day   { background: #d97706; }
.hp-damage     { background: #ef4444; opacity: 0.75; height: 100%; }

.stepper-btn { width: 48px; height: 48px; padding: 0; font-size: 1.1rem; font-weight: 600; border-radius: var(--radius-sm); }
.stepper-val { font-size: 1.3rem; min-width: 4ch; }
.chip-selector .chip { width: 48px; height: 48px; font-size: 1.1rem; }
.chip-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.6rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.chip-selector .chip-row { justify-content: center; width: 100%; }
.chip-selector .stepper { max-width: 300px; margin: 0 auto; width: 100%; }
.step-nav { margin-top: auto; }

@media (max-height: 500px) {
  .phase-hero { max-height: 80px; min-height: 40px; }
  .phase-hero-icon { font-size: 1.5rem; }
  .phase-hero-text { font-size: 1.25rem; }
  .chip-row { display: none; }
}
@media (max-height: 380px) {
  .step { gap: 0.3rem; }
  .step-title { display: none; }
  .phase-hero { flex-direction: row; max-height: 34px; min-height: 30px; padding: 0.2rem 0.5rem; gap: 0.35rem; }
  .phase-hero-icon { font-size: 1rem; }
  .phase-hero-text { font-size: 0.9rem; }
  .hp-preview { gap: 0.2rem; }
  .hp-label { font-size: 0.78rem; }
  .hp-bar-track { height: 6px; }
  .chip-selector { padding: 0.15rem 0.4rem; gap: 0.1rem; }
  .stepper-btn { width: 36px; height: 36px; font-size: 0.85rem; }
  .stepper-val { font-size: 1rem; }
}
</style>
