<script setup>
import { onMounted } from 'vue'
import { useGameStore } from './stores/game'
import GameSetup from './components/GameSetup.vue'
import GameBoard from './components/GameBoard.vue'
import GameOver from './components/GameOver.vue'

const store = useGameStore()
onMounted(() => store.loadGame())
</script>

<template>
  <div class="app">
    <GameOver v-if="store.isGameOver" />
    <GameBoard v-else-if="store.started" />
    <GameSetup v-else />
  </div>
</template>
