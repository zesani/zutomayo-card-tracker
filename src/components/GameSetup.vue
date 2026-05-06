<script setup>
import { useGameStore } from '../stores/game'
import PhaseIcon from './PhaseIcon.vue'

const store = useGameStore()
</script>

<template>
  <div class="setup">
    <div class="setup-center">
      <h1 class="setup-title">ZUTOMAYO</h1>
      <p class="setup-sub">Card Tracker</p>
      <div class="players-preview">
        <div class="player-badge night"><PhaseIcon phase="night" :size="14" /> Night</div>
        <span class="vs">VS</span>
        <div class="player-badge day"><PhaseIcon phase="day" :size="14" /> Day</div>
      </div>
      <button class="btn-start" @click="store.startGame()">New Game</button>
    </div>
  </div>
</template>

<style scoped>
.setup {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  padding: 1.5rem 2rem 0.75rem;
  box-sizing: border-box;
}
.setup-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
.setup-title {
  font-size: 1.6rem;
  font-weight: 800;
  font-family: var(--font-display);
  letter-spacing: 0.06em;
  background: linear-gradient(135deg, #b4a7f0 0%, #c4b5fd 30%, #f0a040 70%, #fcd34d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.setup-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-family: var(--font-display);
  margin-top: -0.3rem;
}
.players-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}
.player-badge {
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.85rem;
}
.player-badge.night { background: rgba(139, 124, 240, 0.12); color: var(--accent-light); border: 1px solid rgba(139, 124, 240, 0.2); }
.player-badge.day   { background: rgba(240, 160, 64, 0.1);  color: var(--day);           border: 1px solid rgba(240, 160, 64, 0.2); }
.vs { color: var(--text-muted); font-weight: 700; font-size: 0.8rem; }
.btn-start {
  background: var(--accent);
  color: white;
  font-weight: 700;
  padding: 0.85rem 2.8rem;
  font-size: 1.05rem;
  border-radius: var(--radius-sm);
  margin-top: 0.25rem;
  font-family: var(--font-display);
  letter-spacing: 0.03em;
  transition: all 0.2s ease;
}
.btn-start:hover { background: #9d6fff; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); }
</style>
