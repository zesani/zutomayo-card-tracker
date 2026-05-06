export function advanceTime(currentPosition, nightPoints, dayPoints) {
  return (currentPosition + nightPoints + dayPoints) % 18
}

export function getPhase(position) {
  return position <= 4 || position >= 14 ? 'night' : 'day'
}

export function resolveCombat(nightAttack, dayAttack, nightHp, dayHp) {
  const damage = Math.abs(nightAttack - dayAttack)
  if (nightAttack > dayAttack) {
    return { winner: 'night', damage, nightHp, dayHp: Math.max(0, dayHp - damage) }
  }
  if (dayAttack > nightAttack) {
    return { winner: 'day', damage, nightHp: Math.max(0, nightHp - damage), dayHp }
  }
  return { winner: null, damage: 0, nightHp, dayHp }
}

export function getCardLimits(winner) {
  if (winner === 'night') return { night: 1, day: 2 }
  if (winner === 'day') return { night: 2, day: 1 }
  return { night: 1, day: 1 }
}
