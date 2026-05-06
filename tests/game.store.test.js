import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../src/stores/game'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('initial state', () => {
  it('starts at midnight with full HP and first turn', () => {
    const store = useGameStore()
    expect(store.timePosition).toBe(0)
    expect(store.hp).toEqual({ night: 100, day: 100 })
    expect(store.cardLimit).toEqual({ night: 1, day: 1 })
    expect(store.turnNumber).toBe(1)
    expect(store.started).toBe(false)
  })
})

describe('getters', () => {
  it('phase is night at position 0', () => {
    const store = useGameStore()
    expect(store.phase).toBe('night')
  })
  it('phase is day at position 9', () => {
    const store = useGameStore()
    store.timePosition = 9
    expect(store.phase).toBe('day')
  })
  it('isGameOver is false at start', () => {
    const store = useGameStore()
    expect(store.isGameOver).toBe(false)
  })
  it('isGameOver when night HP is 0', () => {
    const store = useGameStore()
    store.hp.night = 0
    expect(store.isGameOver).toBe(true)
  })
  it('isGameOver when day HP is 0', () => {
    const store = useGameStore()
    store.hp.day = 0
    expect(store.isGameOver).toBe(true)
  })
  it('canUndo is false before any turn', () => {
    const store = useGameStore()
    store.startGame()
    expect(store.canUndo).toBe(false)
  })
  it('canRedo is false before any undo', () => {
    const store = useGameStore()
    store.startGame()
    expect(store.canRedo).toBe(false)
  })
})

describe('startGame', () => {
  it('sets started to true and resets state', () => {
    const store = useGameStore()
    store.startGame()
    expect(store.started).toBe(true)
    expect(store.timePosition).toBe(0)
    expect(store.hp).toEqual({ night: 100, day: 100 })
  })
  it('clears history and future stacks', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(1, 1, 5, 3)
    store.undo()
    store.startGame()
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
  })
})

describe('resolveTurn', () => {
  it('advances time and applies damage in one action', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(2, 3, 10, 5)
    expect(store.timePosition).toBe(5)
    expect(store.hp.day).toBe(95)
    expect(store.hp.night).toBe(100)
  })
  it('sets card limits based on combat winner', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(0, 0, 10, 5)
    expect(store.cardLimit).toEqual({ night: 1, day: 2 })
  })
  it('increments turn number', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(0, 0, 5, 5)
    expect(store.turnNumber).toBe(2)
  })
  it('returns combat result', () => {
    const store = useGameStore()
    store.startGame()
    const result = store.resolveTurn(0, 0, 10, 5)
    expect(result.winner).toBe('night')
    expect(result.damage).toBe(5)
  })
})

describe('undo / redo', () => {
  it('undo restores state before last resolveTurn', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(2, 3, 10, 5)
    store.undo()
    expect(store.timePosition).toBe(0)
    expect(store.hp).toEqual({ night: 100, day: 100 })
    expect(store.turnNumber).toBe(1)
  })
  it('redo reapplies undone action', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(2, 3, 10, 5)
    store.undo()
    store.redo()
    expect(store.timePosition).toBe(5)
    expect(store.hp.day).toBe(95)
  })
  it('new resolveTurn clears redo stack', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(1, 1, 5, 3)
    store.undo()
    store.resolveTurn(0, 0, 5, 5)
    expect(store.canRedo).toBe(false)
  })
  it('canUndo is true after one resolveTurn', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(0, 0, 5, 5)
    expect(store.canUndo).toBe(true)
  })
  it('undo does nothing when history is empty', () => {
    const store = useGameStore()
    store.startGame()
    store.undo()
    expect(store.timePosition).toBe(0)
  })
  it('redo does nothing when future is empty', () => {
    const store = useGameStore()
    store.startGame()
    store.redo()
    expect(store.timePosition).toBe(0)
  })
  it('supports multiple undos back to start', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(1, 1, 5, 5)
    store.resolveTurn(1, 1, 5, 5)
    store.undo()
    store.undo()
    expect(store.timePosition).toBe(0)
    expect(store.turnNumber).toBe(1)
  })
})

describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadGame does nothing when localStorage is empty', () => {
    const store = useGameStore()
    store.loadGame()
    expect(store.started).toBe(false)
    expect(store.turnNumber).toBe(1)
  })

  it('loadGame restores a valid save', () => {
    const save = {
      timePosition: 5,
      hp: { night: 80, day: 90 },
      cardLimit: { night: 2, day: 1 },
      turnNumber: 4,
      started: true,
      history: [{ timePosition: 0, hp: { night: 100, day: 100 }, cardLimit: { night: 1, day: 1 }, turnNumber: 1 }],
      future: [],
    }
    localStorage.setItem('zutomayo-card-save', JSON.stringify(save))
    const store = useGameStore()
    store.loadGame()
    expect(store.started).toBe(true)
    expect(store.timePosition).toBe(5)
    expect(store.hp).toEqual({ night: 80, day: 90 })
    expect(store.turnNumber).toBe(4)
    expect(store.history).toHaveLength(1)
    expect(store.future).toHaveLength(0)
  })

  it('loadGame ignores a save where a side has 0 HP', () => {
    const save = {
      timePosition: 10,
      hp: { night: 0, day: 100 },
      cardLimit: { night: 1, day: 1 },
      turnNumber: 8,
      started: true,
      history: [],
      future: [],
    }
    localStorage.setItem('zutomayo-card-save', JSON.stringify(save))
    const store = useGameStore()
    store.loadGame()
    expect(store.started).toBe(false)
    expect(store.turnNumber).toBe(1)
  })

  it('loadGame ignores a save where started is false', () => {
    const save = {
      timePosition: 3,
      hp: { night: 90, day: 90 },
      cardLimit: { night: 1, day: 1 },
      turnNumber: 2,
      started: false,
      history: [],
      future: [],
    }
    localStorage.setItem('zutomayo-card-save', JSON.stringify(save))
    const store = useGameStore()
    store.loadGame()
    expect(store.started).toBe(false)
  })

  it('loadGame ignores corrupt localStorage data', () => {
    localStorage.setItem('zutomayo-card-save', 'not-json')
    const store = useGameStore()
    expect(() => store.loadGame()).not.toThrow()
    expect(store.started).toBe(false)
  })
})
