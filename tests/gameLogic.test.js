import { describe, it, expect } from 'vitest'
import { advanceTime, getPhase, resolveCombat, getCardLimits } from '../src/composables/gameLogic'

describe('advanceTime', () => {
  it('advances position by sum of both players time points', () => {
    expect(advanceTime(0, 2, 3)).toBe(5)
  })
  it('wraps around at 18 (position 0 = Midnight)', () => {
    expect(advanceTime(16, 2, 2)).toBe(2)
  })
  it('wraps from 17 to 0 with 1 point total', () => {
    expect(advanceTime(17, 1, 0)).toBe(0)
  })
  it('handles large jump spanning multiple cycles', () => {
    expect(advanceTime(0, 9, 9)).toBe(0)
  })
})

describe('getPhase', () => {
  it('returns night for positions 0–4', () => {
    [0, 1, 4].forEach(p => expect(getPhase(p)).toBe('night'))
  })
  it('returns day for positions 5–13', () => {
    [5, 9, 13].forEach(p => expect(getPhase(p)).toBe('day'))
  })
  it('returns night for positions 14–17', () => {
    [14, 15, 17].forEach(p => expect(getPhase(p)).toBe('night'))
  })
})

describe('resolveCombat', () => {
  it('night wins and day loses HP equal to difference', () => {
    const result = resolveCombat(10, 5, 100, 100)
    expect(result.winner).toBe('night')
    expect(result.damage).toBe(5)
    expect(result.nightHp).toBe(100)
    expect(result.dayHp).toBe(95)
  })
  it('day wins and night loses HP equal to difference', () => {
    const result = resolveCombat(5, 10, 100, 100)
    expect(result.winner).toBe('day')
    expect(result.damage).toBe(5)
    expect(result.nightHp).toBe(95)
    expect(result.dayHp).toBe(100)
  })
  it('draw when attack values are equal — no damage', () => {
    const result = resolveCombat(8, 8, 100, 100)
    expect(result.winner).toBeNull()
    expect(result.damage).toBe(0)
    expect(result.nightHp).toBe(100)
    expect(result.dayHp).toBe(100)
  })
  it('HP floor is 0 — cannot go negative', () => {
    const result = resolveCombat(100, 1, 100, 5)
    expect(result.dayHp).toBe(0)
  })
})

describe('getCardLimits', () => {
  it('night winner gets 1 card, day loser gets 2', () => {
    expect(getCardLimits('night')).toEqual({ night: 1, day: 2 })
  })
  it('day winner gets 1 card, night loser gets 2', () => {
    expect(getCardLimits('day')).toEqual({ night: 2, day: 1 })
  })
  it('draw gives 1 card to each player', () => {
    expect(getCardLimits(null)).toEqual({ night: 1, day: 1 })
  })
})
