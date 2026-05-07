<script setup>
import PhaseIcon from './PhaseIcon.vue'

defineProps({
  side: { type: String, required: true },
  hp: { type: Number, required: true },
  cardLimit: { type: Number, required: true },
})

const label = { night: 'Night', day: 'Day' }
</script>

<template>
  <div class="player-panel">
    <div class="panel-row">
      <span class="player-name"><PhaseIcon :phase="side" :size="16" /> {{ label[side] }}</span>
      <div class="hp-bar-track">
        <div class="hp-bar-fill" :class="'hp-fill-' + side" :style="{ width: hp + '%' }"></div>
      </div>
      <span class="hp-value">{{ hp }}<small>HP</small></span>
      <span class="card-limit">{{ cardLimit }}</span>
    </div>
  </div>
</template>

<style scoped>
.player-panel {
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: clamp(0.4rem, 1.2dvh, 0.75rem) 0.75rem;
  flex-shrink: 0;
  border: 1px solid var(--border);
}
.panel-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.player-name { font-weight: 600; font-size: 0.82rem; white-space: nowrap; font-family: var(--font-display); letter-spacing: 0.02em; }
.hp-bar-track {
  flex: 1;
  height: clamp(10px, 2dvh, 24px);
  background: var(--surface-2);
  border-radius: 5px;
  overflow: hidden;
  min-width: 40px;
}
.hp-bar-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease; }
.hp-fill-night { background: #7c3aed; }
.hp-fill-day   { background: #d97706; }
.hp-value { font-size: 0.82rem; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
.hp-value small { font-size: 0.62rem; opacity: 0.5; margin-left: 1px; }
.card-limit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.5rem;
  padding: 0 0.2rem;
  border: 1px solid var(--border-light);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
