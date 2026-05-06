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
    <h2 class="step-title">Result</h2>
    <div class="combat-result" :class="combat.winner ?? 'draw'">
      <template v-if="combat.winner">
        <span class="result-winner"><PhaseIcon :phase="combat.winner" :size="16" /> {{ combat.winner === 'night' ? 'Night' : 'Day' }} wins!</span>
        <span class="result-damage">Damage: {{ combat.damage }}</span>
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
    <div class="card-limit-box">
      <h3>Cards next turn</h3>
      <div class="limit-row">
        <span><PhaseIcon phase="night" :size="14" /> Night</span>
        <strong>{{ cardLimit.night }} card{{ cardLimit.night > 1 ? 's' : '' }}</strong>
      </div>
      <div class="limit-row">
        <span><PhaseIcon phase="day" :size="14" /> Day</span>
        <strong>{{ cardLimit.day }} card{{ cardLimit.day > 1 ? 's' : '' }}</strong>
      </div>
    </div>
    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary btn-end" @click="emit('endTurn')">End Turn ✓</button>
    </div>
  </div>
</template>

<style scoped>
.hp-preview { display: flex; flex-direction: column; gap: 0.4rem; margin: 0.4rem 0; }
.hp-row { display: flex; flex-direction: column; gap: 0.2rem; }
.hp-label { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; }
.hp-label-name { flex-shrink: 0; }
.hp-numbers { color: var(--text-muted, #9ca3af); white-space: nowrap; }
.hp-dmg-num { color: #ef4444; }
.hp-bar-track { display: flex; height: 10px; border-radius: 5px; overflow: hidden; background: var(--surface-2, #1f2937); }
.hp-fill { height: 100%; transition: width 0.5s ease; }
.hp-fill-night { background: #7c3aed; }
.hp-fill-day   { background: #d97706; }
.hp-damage     { background: #ef4444; opacity: 0.75; height: 100%; }
.step-nav { margin-top: auto; }
</style>
