import { defineStore } from 'pinia'
import { advanceTime, getPhase, resolveCombat, getCardLimits } from '../composables/gameLogic'

const INITIAL_STATE = {
  timePosition: 0,
  hp: { night: 100, day: 100 },
  cardLimit: { night: 1, day: 1 },
  turnNumber: 1,
}

function snapshot(state) {
  return {
    timePosition: state.timePosition,
    hp: { ...state.hp },
    cardLimit: { ...state.cardLimit },
    turnNumber: state.turnNumber,
  }
}

export const useGameStore = defineStore('game', {
  state: () => ({
    ...structuredClone(INITIAL_STATE),
    started: false,
    history: [],
    future: [],
  }),

  getters: {
    phase: (state) => getPhase(state.timePosition),
    isGameOver: (state) => state.hp.night <= 0 || state.hp.day <= 0,
    canUndo: (state) => state.history.length > 0,
    canRedo: (state) => state.future.length > 0,
  },

  actions: {
    _save() {
      this.history.push(snapshot(this))
      this.future = []
    },

    startGame() {
      Object.assign(this, structuredClone(INITIAL_STATE))
      this.started = true
      this.history = []
      this.future = []
    },

    resolveTurn(nightTime, dayTime, nightAttack, dayAttack) {
      this._save()
      this.timePosition = advanceTime(this.timePosition, nightTime, dayTime)
      const result = resolveCombat(nightAttack, dayAttack, this.hp.night, this.hp.day)
      this.hp.night = result.nightHp
      this.hp.day = result.dayHp
      const limits = getCardLimits(result.winner)
      this.cardLimit.night = limits.night
      this.cardLimit.day = limits.day
      this.turnNumber++
      return result
    },

    undo() {
      if (!this.canUndo) return
      this.future.push(snapshot(this))
      Object.assign(this, this.history.pop())
    },

    redo() {
      if (!this.canRedo) return
      this.history.push(snapshot(this))
      Object.assign(this, this.future.pop())
    },
  },
})
