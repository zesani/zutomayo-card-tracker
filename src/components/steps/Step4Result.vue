<script setup>
import PhaseIcon from '../PhaseIcon.vue'

const props = defineProps({
  combat:    { type: Object, required: true },
  cardLimit: { type: Object, required: true },
  currentHp: { type: Object, default: () => ({ night: 0, day: 0 }) },
})
const emit = defineEmits(['endTurn', 'back'])

function fillPct(side) {
  const cur = props.currentHp[side]
  if (!cur) return 100
  return (props.combat[side + 'Hp'] / cur) * 100
}

function damagePct(side) {
  const cur = props.currentHp[side]
  if (!cur) return 0
  return ((cur - props.combat[side + 'Hp']) / cur) * 100
}
</script>

<template>
  <div class="step">
    <h2 class="step-title">Summary</h2>
    <div class="combat-result" :class="combat.winner ?? 'draw'">
      <template v-if="combat.winner">
        <span class="result-winner"><PhaseIcon :phase="combat.winner" :size="28" /> {{ combat.winner === 'night' ? 'Night' : 'Day' }} wins!</span>
        <span class="result-damage">
          {{ combat.winner === 'night' ? 'Night' : 'Day' }} deals {{ combat.damage }} dmg to {{ combat.winner === 'night' ? 'Day' : 'Night' }}
        </span>
      </template>
      <template v-else>
        <span class="result-winner">Draw</span>
        <span class="result-damage">No damage</span>
      </template>
    </div>
    <div class="hp-preview">
      <div v-for="side in ['night', 'day']" :key="side" class="hp-row">
        <div class="hp-label">
          <span class="hp-label-name"><PhaseIcon :phase="side" :size="14" /> {{ side === 'night' ? 'Night' : 'Day' }}</span>
          <span class="hp-numbers">
            {{ currentHp[side] }} → {{ combat[side + 'Hp'] }}
            <span v-if="currentHp[side] > combat[side + 'Hp']" class="hp-dmg-num">
              (-{{ currentHp[side] - combat[side + 'Hp'] }})
            </span>
          </span>
        </div>
        <div class="hp-bar-track">
          <div class="hp-fill"
            :class="side === 'night' ? 'hp-fill-night' : 'hp-fill-day'"
            :style="{ width: fillPct(side) + '%' }">
          </div>
          <div class="hp-damage" :style="{ width: damagePct(side) + '%' }"></div>
        </div>
      </div>
    </div>
    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary btn-end" @click="emit('endTurn')">End Turn ✓</button>
    </div>
  </div>
</template>

<style scoped>
.hp-preview { display: flex; flex-direction: column; gap: 0.75rem; margin: 0.5rem 0; }
.hp-row { display: flex; flex-direction: column; gap: 0.35rem; }
.hp-label { display: flex; justify-content: space-between; align-items: center; font-size: 1rem; }
.hp-label-name { flex-shrink: 0; font-weight: 600; }
.hp-numbers { color: var(--text-muted, #9ca3af); white-space: nowrap; font-size: 0.95rem; }
.hp-dmg-num { color: #ef4444; font-weight: 700; }
.hp-bar-track { display: flex; height: 16px; border-radius: 8px; overflow: hidden; background: var(--surface-2, #1f2937); }
.hp-fill { height: 100%; transition: width 0.5s ease; }
.hp-fill-night { background: #7c3aed; }
.hp-fill-day   { background: #d97706; }
.hp-damage     { background: #ef4444; opacity: 0.75; height: 100%; }
.step-nav { margin-top: auto; }

@media (max-height: 500px) {
  .hp-preview { gap: 0.35rem; margin: 0.25rem 0; }
  .hp-label { font-size: 0.82rem; }
  .hp-bar-track { height: 10px; border-radius: 5px; }
}

@media (max-height: 380px) {
  .step-title { display: none; }
  .hp-preview { gap: 0.2rem; margin: 0.15rem 0; }
  .hp-label { font-size: 0.75rem; }
  .hp-bar-track { height: 7px; border-radius: 4px; }
}
</style>
