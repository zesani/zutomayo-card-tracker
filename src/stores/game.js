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

const STORAGE_KEY = 'zutomayo-card-save'

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    timePosition: state.timePosition,
    hp: { ...state.hp },
    cardLimit: { ...state.cardLimit },
    turnNumber: state.turnNumber,
    started: state.started,
    history: state.history.map(s => ({ ...s, hp: { ...s.hp }, cardLimit: { ...s.cardLimit } })),
    future: state.future.map(s => ({ ...s, hp: { ...s.hp }, cardLimit: { ...s.cardLimit } })),
  }))
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
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

    loadGame() {
      const save = loadSave()
      if (save && save.started && save.hp.night > 0 && save.hp.day > 0) {
        this.timePosition = save.timePosition
        this.hp = save.hp
        this.cardLimit = save.cardLimit
        this.turnNumber = save.turnNumber
        this.started = save.started
        this.history = save.history
        this.future = save.future
      }
    },
  },
})
