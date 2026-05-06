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
