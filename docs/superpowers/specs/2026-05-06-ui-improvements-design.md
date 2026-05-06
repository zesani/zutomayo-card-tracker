# UI Improvements — Time Wheel, Input Chips, Attack Stepper

## Overview

Three targeted UI improvements to the existing Zutomayo Card Tracker app. All changes are visual/interactive only — no game logic changes. The store, composables, and test suite remain untouched.

---

## 1. Time Wheel Component

### What changes
Replace the current `TimeTracker.vue` (text-based phase display) with a new `TimeWheel.vue` SVG circular wheel. `GameBoard.vue` swaps `<TimeTracker>` for `<TimeWheel>`.

### Visual layout
- **SVG viewBox 200×200**, rendered at `min(100%, 280px)` wide, centered in `GameBoard`
- **Top half** (y < 100): dark purple background zone (`#180b3a`) — Night
- **Bottom half** (y > 100): dark warm background zone (`#1e0e00`) — Day
- Horizontal dashed divider at y=100
- **MIDNIGHT** label at very top, **NOON** label at very bottom
- Track ring (circle, r=78, cx/cy=100)

### Position geometry (two-semicircle layout)
All 9 night positions in the top half, all 9 day positions in the bottom half. Positions are NOT equally spaced on a single 360° arc; each half is independently spaced:

```
Night (pos 0–8) angles (degrees, SVG convention, step = 20°):
  pos 0  → 270° (midnight, top center)
  pos 1  → 290°  pos 2 → 310°  pos 3 → 330°  pos 4 → 350°  (upper right)
  pos 5  → 250°  pos 6 → 230°  pos 7 → 210°  pos 8 → 190°  (upper left)

Day (pos 9–17) angles (step = 20°, gap = 10° from equator):
  pos 9  →  10°  pos 10 →  30°  pos 11 →  50°  pos 12 →  70°
  pos 13 →  90°  (noon, bottom center)
  pos 14 → 110°  pos 15 → 130°  pos 16 → 150°  pos 17 → 170°

angleToXY: x = 100 + 78·cos(θ),  y = 100 + 78·sin(θ)

posToAngle(pos):
  pos === 0        → 270
  pos 1–4          → 270 + pos × 20         (upper right)
  pos 5–8          → 270 − (pos − 4) × 20   (upper left)
  pos 9–17         → 10 + (pos − 9) × 20    (bottom half)
```

All night positions have y < 100 (top half); all day positions have y > 100 (bottom half).

### Icons

**Night (pos 0–8): crescent moon**
- Drawn with SVG mask: outer circle (r=6.5) minus inner offset circle (r=4.9, offset +2.5x –0.5y) = crescent shape
- Fill: `#4c1d95` (dimmed), `#7c3aed` for pos 0 (midnight)
- Current position: r=8.5, fill `#c4b5fd`, outer glow ring stroke `#9f7aea`, `filter="glow"`

**Day (pos 9–17): sun with triangular rays**
- Central circle r=2.4, surrounded by N equilateral-ish triangle rays pointing outward
- Ray counts by position:

| pos | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 |
|-----|---|----|----|----|----|----|----|----|-----|
| rays| 2 |  3 |  4 |  6 |  8 |  6 |  4 |  3 |  2  |

- Ray geometry: tip at r=6.5 from center, base at r=3.5, half-angle 13°
- Fill: `#d97706` (dimmed), `#f59e0b` for pos 13 (noon)
- Current position: central r=3.2, tip r=9, fill `#fcd34d`, `filter="glow"`

### Center display
Phase label ("Night" / "Day") and position counter ("pos X / 17") centered in the SVG.

### Undo/Redo
Keep existing undo/redo buttons below the wheel (already in `TimeTracker.vue`, move to `TimeWheel.vue`).

### Component interface
```vue
<!-- TimeWheel.vue — no props, reads store directly -->
<script setup>
import { useGameStore } from '../stores/game'
const store = useGameStore()
// reads: store.timePosition, store.phase, store.canUndo, store.canRedo
// calls: store.undo(), store.redo()
</script>
```

---

## 2. Step1Time.vue — Chip Selector + Phase Preview

### What changes
Replace the two `<input type="number">` fields with chip selectors. Add a live preview row showing total advance and resulting phase.

### Layout
```
🌙 Night
[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ ✏️ other ]

☀️ Day
[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ ✏️ other ]

──────────────────────────────────
รวม 5 ช่อง → pos 8 · 🌙 Night
──────────────────────────────────
```

### Behavior
- Chips 1–6: tap to select (replaces current value). Selected chip highlighted (purple for night, orange for day).
- **✏️ other**: shows an `<input type="number" min="0">` inline. Typing there deselects all chips.
- Both values default to 0 (no chip selected, no "other" input).
- Continue button: disabled when `nightTime === 0 && dayTime === 0` (unchanged).
- Preview row: always visible once either value > 0. Shows:
  - Total steps = `nightTime + dayTime`
  - Preview position = `advanceTime(store.timePosition, nightTime, dayTime)` (imported from `gameLogic.js`)
  - Preview phase = `getPhase(previewPosition)` (imported from `gameLogic.js`)

### Component interface
```vue
<!-- same defineModel interface as before, no breaking changes -->
const nightTime = defineModel('nightTime', { default: 0 })
const dayTime   = defineModel('dayTime',   { default: 0 })
defineEmits(['next'])
defineProps({ currentPosition: Number })  // NEW — for preview calc
```

`TurnModal.vue` passes `:currentPosition="store.timePosition"` to Step1Time.

---

## 3. Step3Attack.vue — Preset Chips + Fine-Tune Stepper

### What changes
Replace the two `<input type="number">` fields with preset chip rows and a ±10 fine-tune stepper.

### Layout
```
🌙 Night Attack
[ 10 ][ 50 ][ 100 ][ 150 ][ ✏️ ]
[  –10  ]  [ 80 ]  [  +10  ]

☀️ Day Attack
[ 10 ][ 50 ][ 100 ][ 150 ][ ✏️ ]
[  –10  ]  [ 60 ]  [  +10  ]
```

### Behavior
- **Preset chips** (10, 50, 100, 150): tap sets value directly. Selected chip highlighted.
- **✏️ manual**: shows an `<input type="number" min="0">` inline. Typing deselects chips.
- **±10 stepper**: always visible. +10 / –10 clamp at 0 (no negative attack).
- Value display in stepper is read-only label (not an input).
- Both values default to 0.
- Continue button: always enabled (0 attack = tie = valid, existing logic unchanged).

### Component interface
```vue
<!-- same defineModel + props as before -->
const nightAttack = defineModel('nightAttack', { default: 0 })
const dayAttack   = defineModel('dayAttack',   { default: 0 })
defineProps({ phase: String })
defineEmits(['next', 'back'])
```

---

## Files Changed

| File | Action |
|------|--------|
| `src/components/TimeWheel.vue` | **Create** — SVG wheel component |
| `src/components/TimeTracker.vue` | **Delete** — replaced by TimeWheel |
| `src/components/GameBoard.vue` | **Modify** — swap `<TimeTracker>` → `<TimeWheel>` |
| `src/components/steps/Step1Time.vue` | **Modify** — chips + preview |
| `src/components/steps/Step3Attack.vue` | **Modify** — chips + stepper |
| `src/components/TurnModal.vue` | **Modify** — pass `currentPosition` prop to Step1Time |
| `src/assets/main.css` | **Modify** — add chip and stepper styles |

No changes to: `gameLogic.js`, `game.js` store, test files, `App.vue`, `PlayerPanel.vue`, `GameSetup.vue`, `GameOver.vue`.

---

## Out of Scope
- Animation of token moving between positions
- Hover tooltips on wheel positions  
- Sound effects
- Landscape layout changes
