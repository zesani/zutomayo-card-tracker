<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import PhaseIcon from './PhaseIcon.vue'

const store = useGameStore()

const winner = computed(() => {
  if (store.hp.night <= 0) return { side: 'day', name: 'Day' }
  return { side: 'night', name: 'Night' }
})

function newGame() {
  if (window.confirm('เริ่มเกมใหม่? ข้อมูลทั้งหมดจะหายไป')) {
    store.startGame()
  }
}
</script>

<template>
  <div class="game-over" :class="winner.side">
    <div class="game-over-content">
      <span class="winner-icon"><PhaseIcon :phase="winner.side" :size="80" /></span>
      <h1 class="game-over-title">Game Over</h1>
      <p class="winner-name">{{ winner.name }} wins!</p>
      <div class="final-stats">
        <div class="stat"><span><PhaseIcon phase="night" :size="14" /> Night HP</span> <strong>{{ store.hp.night }}</strong></div>
        <div class="stat"><span><PhaseIcon phase="day" :size="14" /> Day HP</span> <strong>{{ store.hp.day }}</strong></div>
        <div class="stat"><span>Turns</span> <strong>{{ store.turnNumber - 1 }}</strong></div>
      </div>
      <button class="btn-new-game" @click="newGame">New Game</button>
    </div>
  </div>
</template>

<style scoped>
.game-over {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 2rem;
}
.game-over.night { background: radial-gradient(ellipse 60% 40% at 50% 30%, rgba(139, 124, 240, 0.1), transparent); }
.game-over.day   { background: radial-gradient(ellipse 60% 40% at 50% 30%, rgba(240, 160, 64, 0.1), transparent); }
.game-over-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}
.winner-icon { font-size: 5rem; margin-bottom: 0.25rem; }
.game-over-title {
  font-size: 1.6rem;
  font-weight: 800;
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.winner-name { font-size: 1.2rem; font-weight: 600; }
.game-over.night .winner-name { color: var(--accent-light); }
.game-over.day   .winner-name { color: var(--day); }
.final-stats {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1.25rem;
  min-width: 200px;
}
.stat { display: flex; justify-content: space-between; gap: 1.5rem; font-size: 0.85rem; color: var(--text-muted); }
.stat strong { color: var(--text); font-weight: 600; }
.btn-new-game {
  background: var(--accent);
  color: white;
  font-weight: 700;
  padding: 0.85rem 2.5rem;
  font-size: 1.05rem;
  border-radius: var(--radius-sm);
  margin-top: 0.5rem;
  font-family: var(--font-display);
  letter-spacing: 0.03em;
  transition: all 0.2s ease;
}
.btn-new-game:hover { background: #9d6fff; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); }
</style>
