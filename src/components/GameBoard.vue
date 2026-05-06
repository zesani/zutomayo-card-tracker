<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import PlayerPanel from './PlayerPanel.vue'
import TimeWheel from './TimeWheel.vue'
import TurnModal from './TurnModal.vue'

const store = useGameStore()
const showModal = ref(false)

function newGame() {
  if (window.confirm('เริ่มเกมใหม่? ข้อมูลทั้งหมดจะหายไป')) {
    store.startGame()
  }
}
</script>

<template>
  <TurnModal v-if="showModal" @close="showModal = false" />
  <div v-else class="board">
    <PlayerPanel
      side="night"
      :hp="store.hp.night"
      :card-limit="store.cardLimit.night"
    />
    <div class="wheel-wrap">
      <TimeWheel />
    </div>
    <PlayerPanel
      side="day"
      :hp="store.hp.day"
      :card-limit="store.cardLimit.day"
    />
    <div class="turn-area">
      <div class="turn-info">Turn {{ store.turnNumber }}</div>
      <button class="btn-start-turn" @click="showModal = true">START TURN</button>
      <button class="btn-new-game" @click="newGame">New Game</button>
    </div>
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  height: 100dvh;
  overflow: hidden;
  box-sizing: border-box;
}
.wheel-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin: -0.25rem 0;
}
.turn-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
.turn-info {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: var(--font-display);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.btn-start-turn {
  background: var(--accent);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.75rem 2rem;
  letter-spacing: 0.04em;
  width: 100%;
  max-width: 320px;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  transition: all 0.2s ease;
}
.btn-start-turn:hover { background: #9d6fff; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); }
.btn-new-game {
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-family: var(--font-display);
  letter-spacing: 0.05em;
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}
.btn-new-game:hover { color: var(--text); border-color: var(--text-muted); }
</style>
