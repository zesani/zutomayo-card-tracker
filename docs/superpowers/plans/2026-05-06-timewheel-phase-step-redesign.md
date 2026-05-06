# TimeWheel Phase Fix + Step Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the time wheel visual layout (clockwise from midnight, correct phase distribution), merge Step 2 into Step 3, and add HP preview bars to Step 4.

**Architecture:** Five sequential tasks, each following TDD. `gameLogic.getPhase` change flows outward to TimeWheel, then to Step components, then TurnModal wires it all together.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Pinia, Vitest + @vue/test-utils

---

## File Map

| File | Change |
|------|--------|
| `src/composables/gameLogic.js` | Fix `getPhase` distribution |
| `tests/gameLogic.test.js` | Update getPhase tests |
| `src/components/TimeWheel.vue` | Fix `posToAngleDeg`, position arrays, add `displayPosition` prop |
| `tests/timeWheel.test.js` | Add `displayPosition` test |
| `src/components/steps/Step3Attack.vue` | Add `position` prop, phase badge, embed TimeWheel |
| `tests/step3Attack.test.js` | Add phase badge + TimeWheel tests |
| `src/components/TurnModal.vue` | Remove Step 2, reflow to 3 steps, pass new props |
| `src/components/steps/Step4Result.vue` | Add `currentHp` prop, HP bar section |
| `tests/step4Result.test.js` | New file — HP bar tests |

---

## Task 1: Fix getPhase

**Files:**
- Modify: `src/composables/gameLogic.js`
- Modify: `tests/gameLogic.test.js`

### Phase distribution
| Positions | Phase |
|-----------|-------|
| 0–4       | night |
| 5–13      | day   |
| 14–17     | night |

- [ ] **Step 1: Update getPhase tests to reflect correct distribution**

Replace the four existing `getPhase` tests in `tests/gameLogic.test.js` with:

```js
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
```

- [ ] **Step 2: Run tests and confirm failures**

```bash
npx vitest run tests/gameLogic.test.js --reporter=verbose
```

Expected failures: `getPhase(8)` was night (now should be day), `getPhase(17)` was day (now should be night).

- [ ] **Step 3: Update getPhase in gameLogic.js**

```js
export function getPhase(position) {
  return position <= 4 || position >= 14 ? 'night' : 'day'
}
```

- [ ] **Step 4: Run all tests and confirm green**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests pass. The store `phase` getter and TimeWheel center text both use `getPhase` indirectly — they will automatically benefit.

- [ ] **Step 5: Commit**

```bash
git add src/composables/gameLogic.js tests/gameLogic.test.js
git commit -m "fix: getPhase distribution — night 0-4 & 14-17, day 5-13"
```

---

## Task 2: Fix TimeWheel Visual Layout + displayPosition Prop

**Files:**
- Modify: `src/components/TimeWheel.vue`
- Modify: `tests/timeWheel.test.js`

### What changes
- `posToAngleDeg(pos)` → `(270 + pos * 20) % 360` (uniform clockwise, pos 0 = midnight = top)
- Night position array: `[0,1,2,3,4,14,15,16,17]` (all land in top half y < 100)
- Day position array: `[5,6,7,8,9,10,11,12,13]` (all land in bottom half y > 100)
- Background clip paths (top=night, bottom=day) are **unchanged** — the new layout preserves this
- New `displayPosition` prop overrides `store.timePosition` for dot highlight and center text

- [ ] **Step 1: Write failing test for displayPosition**

Add to `tests/timeWheel.test.js`:

```js
it('displayPosition overrides store position for center text', () => {
  // store defaults to timePosition=0 (Night), but displayPosition=9 is Day
  const wrapper = mount(TimeWheel, { props: { displayPosition: 9 } })
  expect(wrapper.find('svg').text()).toContain('Day')
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run tests/timeWheel.test.js --reporter=verbose
```

Expected failure: center text shows 'Night' (from store), not 'Day'.

- [ ] **Step 3: Replace TimeWheel script setup entirely**

Replace everything from `<script setup>` to `</script>` (before `<template>`):

```js
<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { getPhase } from '../composables/gameLogic'

const props = defineProps({
  previewPosition: { type: Number, default: null },
  showControls: { type: Boolean, default: true },
  displayPosition: { type: Number, default: null },
})

const uid = _uid++
const store = useGameStore()

const NIGHT_POSITIONS = [0, 1, 2, 3, 4, 14, 15, 16, 17]
const DAY_POSITIONS   = [5, 6, 7, 8, 9, 10, 11, 12, 13]
const DAY_RAYS        = [2, 3, 4, 6, 8, 6, 4, 3, 2]

function posToAngleDeg(pos) {
  return (270 + pos * 20) % 360
}

function posToXY(pos) {
  const rad = posToAngleDeg(pos) * Math.PI / 180
  return [100 + 78 * Math.cos(rad), 100 + 78 * Math.sin(rad)]
}

function sunRaysPath(cx, cy, nRays, rInner, rOuter) {
  const half = 13 * Math.PI / 180
  let d = ''
  for (let i = 0; i < nRays; i++) {
    const a = (i * 2 * Math.PI / nRays) - Math.PI / 2
    const tx = cx + rOuter * Math.cos(a), ty = cy + rOuter * Math.sin(a)
    const ax = cx + rInner * Math.cos(a - half), ay = cy + rInner * Math.sin(a - half)
    const bx = cx + rInner * Math.cos(a + half), by = cy + rInner * Math.sin(a + half)
    d += `M${ax.toFixed(2)},${ay.toFixed(2)} L${tx.toFixed(2)},${ty.toFixed(2)} L${bx.toFixed(2)},${by.toFixed(2)} Z `
  }
  return d
}

const displayPos = computed(() => props.displayPosition ?? store.timePosition)

const previewMarker = computed(() => {
  if (props.previewPosition === null || props.previewPosition === store.timePosition) return null
  const [px, py] = posToXY(props.previewPosition)
  const isNight = getPhase(props.previewPosition) === 'night'
  return { px, py, color: isNight ? '#c4b5fd' : '#fcd34d' }
})

const nightPositions = computed(() =>
  NIGHT_POSITIONS.map((pos) => {
    const [px, py] = posToXY(pos)
    const isCur = pos === displayPos.value
    const rO = isCur ? 8.5 : 6.5
    return {
      pos, px, py, isCur, rO,
      rI: rO * 0.76, offX: rO * 0.38, offY: -rO * 0.08,
      color: isCur ? '#c4b5fd' : (pos === 0 ? '#7c3aed' : '#4c1d95'),
    }
  })
)

const dayPositions = computed(() =>
  DAY_POSITIONS.map((pos, idx) => {
    const [px, py] = posToXY(pos)
    const isCur = pos === displayPos.value
    const nRays = DAY_RAYS[idx]
    const rInner = isCur ? 4.6 : 3.5
    const rOuter = isCur ? 9 : (nRays === 8 ? 8 : 6.5)
    return {
      pos, px, py, isCur, nRays,
      rCircle: isCur ? 3.2 : 2.4,
      raysPath: sunRaysPath(px, py, nRays, rInner, rOuter),
      color: isCur ? '#fcd34d' : (nRays === 8 ? '#f59e0b' : '#d97706'),
    }
  })
)
</script>
```

- [ ] **Step 4: Update TimeWheel template — masks, night dots, center text**

In the `<defs>` block, update the mask loop to use `m.pos` (not `m.i`):

```html
<mask v-for="m in nightPositions" :key="m.pos"
  :id="`tw-moon-${uid}-${m.pos}`" maskUnits="userSpaceOnUse">
  <circle :cx="m.px" :cy="m.py" :r="m.rO" fill="white"/>
  <circle :cx="m.px + m.offX" :cy="m.py + m.offY" :r="m.rI" fill="black"/>
</mask>
```

Update the night dots loop key and mask reference:

```html
<g v-for="m in nightPositions" :key="`n${m.pos}`">
  <circle v-if="m.isCur" :cx="m.px" :cy="m.py" :r="m.rO + 2"
    fill="none" stroke="#9f7aea" stroke-width="1.2"/>
  <circle :cx="m.px" :cy="m.py" :r="m.rO" :fill="m.color"
    :mask="`url(#tw-moon-${uid}-${m.pos})`"
    :filter="m.isCur ? `url(#tw-glow-${uid})` : undefined"/>
</g>
```

Update center text to use `displayPos`:

```html
<text x="100" y="93" text-anchor="middle" font-size="9" font-weight="600"
  :fill="getPhase(displayPos) === 'night' ? '#9f7aea' : '#f59e0b'">
  {{ getPhase(displayPos) === 'night' ? 'Night' : 'Day' }}
</text>
<text x="100" y="108" text-anchor="middle" font-size="8" fill="#6b7280">
  pos {{ displayPos }} / 17
</text>
```

- [ ] **Step 5: Run all tests and confirm green**

```bash
npx vitest run --reporter=verbose
```

Expected: all 67 tests pass (existing + new displayPosition test).

- [ ] **Step 6: Commit**

```bash
git add src/components/TimeWheel.vue tests/timeWheel.test.js
git commit -m "fix: TimeWheel clockwise layout from midnight, add displayPosition prop"
```

---

## Task 3: Step3Attack — Phase Badge + Embedded TimeWheel

**Files:**
- Modify: `src/components/steps/Step3Attack.vue`
- Modify: `tests/step3Attack.test.js`

- [ ] **Step 1: Write failing tests**

Add to `tests/step3Attack.test.js` (after existing imports, add `TimeWheel` import and new tests):

```js
import TimeWheel from '../src/components/TimeWheel.vue'
```

```js
it('shows night phase badge when phase is night', () => {
  const wrapper = mount(Step3Attack, { props: { phase: 'night', position: 3 } })
  expect(wrapper.find('.phase-badge').exists()).toBe(true)
  expect(wrapper.find('.phase-badge').text()).toContain('Night')
})

it('shows day phase badge when phase is day', () => {
  const wrapper = mount(Step3Attack, { props: { phase: 'day', position: 7 } })
  expect(wrapper.find('.phase-badge').text()).toContain('Day')
})

it('embeds TimeWheel with displayPosition and no controls', () => {
  const wrapper = mount(Step3Attack, { props: { phase: 'night', position: 3 } })
  const wheel = wrapper.findComponent(TimeWheel)
  expect(wheel.exists()).toBe(true)
  expect(wheel.props('displayPosition')).toBe(3)
  expect(wheel.props('showControls')).toBe(false)
})
```

- [ ] **Step 2: Run tests to confirm failures**

```bash
npx vitest run tests/step3Attack.test.js --reporter=verbose
```

Expected: 3 new tests fail (no `.phase-badge`, no TimeWheel).

- [ ] **Step 3: Update Step3Attack script — add position prop and TimeWheel import**

Add to `<script setup>` in `src/components/steps/Step3Attack.vue`:

```js
import TimeWheel from '../TimeWheel.vue'
```

Add `position` to `defineProps`:

```js
const props = defineProps({
  phase: { type: String, required: true },
  position: { type: Number, default: 0 },
  nightAttack: { type: Number, default: 0 },
  dayAttack:   { type: Number, default: 0 },
})
```

- [ ] **Step 4: Add phase badge and TimeWheel to Step3Attack template**

Add at the top of `<div class="step">`, before the existing chip selectors:

```html
<div class="phase-badge" :class="phase === 'night' ? 'phase-badge-night' : 'phase-badge-day'">
  {{ phase === 'night' ? '🌙 Night Phase' : '☀️ Day Phase' }}
</div>
<TimeWheel :displayPosition="position" :showControls="false" />
```

- [ ] **Step 5: Run all tests and confirm green**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests pass. Existing step3Attack tests still pass because `position` defaults to 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/steps/Step3Attack.vue tests/step3Attack.test.js
git commit -m "feat: Step3Attack shows phase badge and TimeWheel at preview position"
```

---

## Task 4: TurnModal — Reflow to 3 Steps

**Files:**
- Modify: `src/components/TurnModal.vue`

No new tests — TurnModal is a container; behavior is covered by the step component tests.

- [ ] **Step 1: Update TurnModal — targeted edits**

In `src/components/TurnModal.vue`, make the following four targeted edits:

**1. Remove Step2Phase import** (delete this line from the import block):
```js
import Step2Phase from './steps/Step2Phase.vue'
```

**2. Change step indicator** from `step / 4` to:
```html
<div class="step-indicator">{{ step }} / 3</div>
```

**3. Remove the entire `<Step2Phase>` block** (the `v-else-if="step === 2"` block).

**4. Update the remaining step blocks** — change `v-else-if="step === 3"` → `step === 2` and add `:position`, and change `v-else-if="step === 4"` → `step === 3` and add `:current-hp`:

```html
<Step3Attack
  v-else-if="step === 2"
  v-model:nightAttack="nightAttack"
  v-model:dayAttack="dayAttack"
  :phase="previewPhase"
  :position="previewPosition"
  @next="step++"
  @back="step--"
/>
<Step4Result
  v-else-if="step === 3"
  :combat="previewCombat"
  :card-limit="previewCardLimit"
  :current-hp="store.hp"
  @end-turn="endTurn"
  @back="step--"
/>
```

The `previewPhase` computed (`getPhase(previewPosition)`) and `previewPosition` computed (`advanceTime(...)`) are unchanged.

- [ ] **Step 2: Run all tests to confirm nothing broke**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/TurnModal.vue
git commit -m "feat: TurnModal flows 3 steps — remove Phase step, merge into Attack"
```

---

## Task 5: Step4Result — HP Preview Bars

**Files:**
- Modify: `src/components/steps/Step4Result.vue`
- Create: `tests/step4Result.test.js`

HP bar layout per player:
- A single track div contains two child divs side-by-side: filled portion (phase color) + damage chunk (red)
- Widths are percentages of `currentHp[side]` (the player's HP before this turn)

- [ ] **Step 1: Write failing tests**

Create `tests/step4Result.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Step4Result from '../src/components/steps/Step4Result.vue'

const cardLimit = { night: 1, day: 1 }

describe('Step4Result', () => {
  it('shows combat winner', () => {
    const combat = { winner: 'night', damage: 10, nightHp: 50, dayHp: 40 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    expect(wrapper.find('.result-winner').text()).toContain('Night')
  })

  it('renders HP bars for both players', () => {
    const combat = { winner: 'night', damage: 10, nightHp: 50, dayHp: 40 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    expect(wrapper.findAll('.hp-bar-track').length).toBe(2)
  })

  it('day damage chunk width = 20% when day loses 10 of 50 HP', () => {
    const combat = { winner: 'night', damage: 10, nightHp: 50, dayHp: 40 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    // order: night bar first, day bar second
    const dayDamage = wrapper.findAll('.hp-damage')[1]
    expect(dayDamage.attributes('style')).toContain('20%')
  })

  it('night damage chunk width = 0% when night takes no damage', () => {
    const combat = { winner: 'night', damage: 10, nightHp: 50, dayHp: 40 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    const nightDamage = wrapper.findAll('.hp-damage')[0]
    expect(nightDamage.attributes('style')).toContain('0%')
  })

  it('back button emits back', async () => {
    const combat = { winner: null, damage: 0, nightHp: 50, dayHp: 50 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    await wrapper.find('button.btn-secondary').trigger('click')
    expect(wrapper.emitted('back')).toBeTruthy()
  })

  it('end turn button emits endTurn', async () => {
    const combat = { winner: null, damage: 0, nightHp: 50, dayHp: 50 }
    const wrapper = mount(Step4Result, {
      props: { combat, cardLimit, currentHp: { night: 50, day: 50 } },
    })
    await wrapper.find('button.btn-primary').trigger('click')
    expect(wrapper.emitted('endTurn')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to confirm failures**

```bash
npx vitest run tests/step4Result.test.js --reporter=verbose
```

Expected: `.hp-bar-track` not found, `currentHp` prop not accepted.

- [ ] **Step 3: Update Step4Result script**

Replace `<script setup>` in `src/components/steps/Step4Result.vue`:

```js
<script setup>
const props = defineProps({
  combat:    { type: Object, required: true },
  cardLimit: { type: Object, required: true },
  currentHp: { type: Object, default: () => ({ night: 0, day: 0 }) },
})
const emit = defineEmits(['endTurn', 'back'])

function fillPct(side) {
  const cur = props.currentHp[side]
  if (!cur) return 100
  return (props.combat[side + 'Hp'] / cur) * 100
}

function damagePct(side) {
  const cur = props.currentHp[side]
  if (!cur) return 0
  return ((cur - props.combat[side + 'Hp']) / cur) * 100
}
</script>
```

- [ ] **Step 4: Update Step4Result template — add HP bars section**

Add a `<div class="hp-preview">` block after the existing `<div class="combat-result">` and before `<div class="card-limit-box">`:

```html
<div class="hp-preview">
  <div v-for="side in ['night', 'day']" :key="side" class="hp-row">
    <div class="hp-label">
      {{ side === 'night' ? '🌙 Night' : '☀️ Day' }}
      <span class="hp-numbers">
        {{ currentHp[side] }} → {{ combat[side + 'Hp'] }}
        <span v-if="currentHp[side] > combat[side + 'Hp']" class="hp-dmg-num">
          (-{{ currentHp[side] - combat[side + 'Hp'] }})
        </span>
      </span>
    </div>
    <div class="hp-bar-track">
      <div class="hp-fill"
        :class="side === 'night' ? 'hp-fill-night' : 'hp-fill-day'"
        :style="{ width: fillPct(side) + '%' }">
      </div>
      <div class="hp-damage" :style="{ width: damagePct(side) + '%' }"></div>
    </div>
  </div>
</div>
```

Add styles to the bottom of the file (inside `<style scoped>` if one exists, otherwise add `<style scoped>`):

```css
.hp-preview { display: flex; flex-direction: column; gap: 0.6rem; margin: 0.75rem 0; }
.hp-row { display: flex; flex-direction: column; gap: 0.25rem; }
.hp-label { display: flex; justify-content: space-between; font-size: 0.85rem; }
.hp-numbers { color: var(--text-muted, #9ca3af); }
.hp-dmg-num { color: #ef4444; }
.hp-bar-track { display: flex; height: 10px; border-radius: 5px; overflow: hidden; background: var(--surface-2, #1f2937); }
.hp-fill-night { background: #7c3aed; }
.hp-fill-day   { background: #d97706; }
.hp-damage     { background: #ef4444; opacity: 0.75; }
```

- [ ] **Step 5: Run all tests and confirm green**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests pass (the new 6 + all 66 existing = 72 total).

- [ ] **Step 6: Commit**

```bash
git add src/components/steps/Step4Result.vue tests/step4Result.test.js
git commit -m "feat: Step4Result HP preview bars showing damage per player"
```
