<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import PlayerPanel from './PlayerPanel.vue'
import TimeWheel from './TimeWheel.vue'
import TurnModal from './TurnModal.vue'

const store = useGameStore()
const showModal = ref(false)
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
      <TimeWheel>
        <button class="btn-start-turn" @click="showModal = true">START</button>
      </TimeWheel>
    </div>
    <PlayerPanel
      side="day"
      :hp="store.hp.day"
      :card-limit="store.cardLimit.day"
    />
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
.btn-start-turn {
  background: var(--accent);
  color: white;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0 1rem;
  height: 2.4rem;
  letter-spacing: 0.04em;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  flex-shrink: 0;
  position: absolute;
  right: 0;
  transition: all 0.2s ease;
}
.btn-start-turn:hover { background: #9d6fff; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
</style>
