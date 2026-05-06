# TimeWheel Phase Fix + Step Redesign

## Overview

Three coordinated changes: fix the time wheel visual layout, merge Step 2 into Step 3, and add HP preview bars to Step 4.

---

## 1. TimeWheel + getPhase Fix

### Phase Distribution

The correct night/day split for the 18 positions (0–17):

| Positions | Phase |
|-----------|-------|
| 0–4       | night |
| 5–13      | day   |
| 14–17     | night |

`getPhase` in `gameLogic.js` changes from `pos <= 8 ? 'night' : 'day'` to:
```js
pos <= 4 || pos >= 14 ? 'night' : 'day'
```

### Visual Layout

`posToAngleDeg(pos)` changes to `(270 + pos * 20) % 360`.

- pos 0 = 270° = midnight (top center) ✓
- Positions increase strictly clockwise (20° per step)
- Night positions [0,1,2,3,4,14,15,16,17] all land in top half (y < 100) ✓
- Day positions [5,6,7,8,9,10,11,12,13] all land in bottom half (y > 100) ✓
- Background zones (TOP=night dark, BOTTOM=day dark) remain unchanged

Position arrays in TimeWheel must update:
- `nightPositions` iterates over `[0,1,2,3,4,14,15,16,17]`
- `dayPositions` iterates over `[5,6,7,8,9,10,11,12,13]`

DAY_RAYS `[2,3,4,6,8,6,4,3,2]` stays — maps to day positions 5–13, peaking at pos 9 (noon).

### `displayPosition` Prop

New optional prop on TimeWheel: `displayPosition: { type: Number, default: null }`.

When set, overrides `store.timePosition` for:
- `isCur` highlight on dots
- Center text (phase label + position number)

Used in Step 3 to show the preview position after time advancement.

---

## 2. Step 3 (Attack + Phase)

Step 2 (Phase display) is removed from the turn flow. Phase context is shown directly in Step 3.

### Turn Flow

| Old | New |
|-----|-----|
| Step 1: Time | Step 1: Time |
| Step 2: Phase | _(removed)_ |
| Step 3: Attack | Step 2: Attack + Phase |
| Step 4: Result | Step 3: Result |

Step indicator shows `1/3`, `2/3`, `3/3`.

### Step3Attack Changes

New prop: `position: { type: Number, required: true }` — the preview position after time advancement.

New layout (top to bottom):
1. Phase badge — `🌙 Night Phase` or `☀️ Day Phase` with phase-appropriate color
2. TimeWheel — `displayPosition=position`, `showControls=false`
3. _(existing)_ Night attack chips + stepper
4. _(existing)_ Day attack chips + stepper
5. _(existing)_ Back / Continue buttons

### TurnModal Changes

- Remove `<Step2Phase>` usage
- After Step 1 `@next`: go to step 2 (was step 3)
- Pass `:position="previewPosition"` to Step3Attack
- Pass `:currentHp="store.hp"` to Step4Result
- Step indicator: `step / 3`

`Step2Phase.vue` stays in the codebase (tests remain) but is no longer used in TurnModal.

---

## 3. Step 4 HP Bars

### Step4Result Changes

New prop: `currentHp: { type: Object, required: true }` — shape `{ night: Number, day: Number }`.

### HP Bar Layout (per player)

```
🌙 Night   50 → 40  (-10)
[████████████████░░░░░░░░]
```

- Bar is a single element with two sections via CSS:
  - Left section (filled, phase color): proportional to new HP
  - Right section (damage chunk, red): proportional to damage taken
- If no damage: bar is fully filled, no red section
- Label format: `currentHp → newHp (-damage)` or `currentHp → currentHp` if no damage
- Bar width based on player's current HP as 100% (so the bar always starts full for the undamaged player)
- Implemented as two nested `<div>` elements with percentage widths

---

## Test Plan

- `gameLogic.test.js` — update `getPhase` tests for new distribution
- `timeWheel.test.js` — add test for `displayPosition` override
- `step3Attack.test.js` — add tests for phase badge and TimeWheel with `position` prop
- `step4Result.test.js` (new) — tests for HP bar rendering with `currentHp` prop
- `step1Time.test.js` — verify `previewPosition` still works with updated `getPhase`
