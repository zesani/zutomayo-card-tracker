# UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace text-based TimeTracker with an SVG time wheel, and replace number inputs in Step1Time/Step3Attack with tap-friendly chip selectors and steppers.

**Architecture:** Three independent UI changes — each component is a self-contained rewrite with no store/logic changes. CSS shared classes are added to main.css first since both Step components depend on them. TimeWheel reads the Pinia store directly (no new props). Step1Time gets one new prop (`currentPosition`) passed from TurnModal.

**Tech Stack:** Vue 3.4 (`<script setup>`, `defineModel`), Pinia, SVG, Vitest + `@vue/test-utils` 2.x, jsdom

---

## File Map

| File | Action |
|------|--------|
| `src/assets/main.css` | Modify — add chip/stepper/preview CSS classes |
| `src/components/TimeWheel.vue` | **Create** — SVG wheel component |
| `src/components/TimeTracker.vue` | **Delete** — replaced by TimeWheel |
| `src/components/GameBoard.vue` | Modify — swap import + template |
| `src/components/steps/Step1Time.vue` | Modify — full rewrite with chips + preview |
| `src/components/TurnModal.vue` | Modify — add `:currentPosition` prop to Step1Time |
| `src/components/steps/Step3Attack.vue` | Modify — full rewrite with preset chips + stepper |
| `tests/timeWheel.test.js` | **Create** — component render tests |
| `tests/step1Time.test.js` | **Create** — chip logic + preview tests |
| `tests/step3Attack.test.js` | **Create** — preset chip + stepper tests |

---

## Task 1: Shared CSS for chips and steppers

**Files:**
- Modify: `src/assets/main.css`

- [ ] **Step 1: Add CSS classes at the end of `src/assets/main.css`**

Open `src/assets/main.css` and append after the last line (`* { -webkit-tap-highlight-color: transparent; }`):

```css
/* Chip selector (Step1Time, Step3Attack) */
.chip-selector { display: flex; flex-direction: column; gap: 0.5rem; }
.chip-selector-label { font-size: 0.9rem; color: var(--text-muted); }
.chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  width: 40px; height: 40px;
  border-radius: 10px;
  border: 2px solid var(--border);
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 1rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  transition: border-color 0.15s, background 0.15s;
}
.chip-other { border-style: dashed; background: transparent; font-size: 0.85rem; }
.chip-active-night { border-color: var(--accent-light); background: var(--accent); color: white; }
.chip-active-day   { border-color: var(--day); background: #92400e; color: white; }
.chip-night:not(.chip-active-night):hover { border-color: var(--accent); }
.chip-day:not(.chip-active-day):hover     { border-color: var(--day); }
.chip-manual {
  border: 1px dashed var(--border);
  background: var(--surface);
  border-radius: 8px; color: var(--text);
  font-size: 0.9rem; padding: 6px 10px;
  width: 100%; text-align: center;
}

/* Attack stepper */
.stepper { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.stepper-btn {
  padding: 6px 14px; border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2); color: var(--text-muted);
  font-size: 0.85rem;
}
.stepper-btn:hover { background: var(--accent); border-color: var(--accent); color: white; }
.stepper-val { flex: 1; text-align: center; font-size: 1.1rem; font-weight: 700; color: var(--text); }

/* Time step preview row */
.time-preview {
  padding: 0.6rem 0.9rem;
  background: var(--surface-2);
  border-radius: var(--radius);
  font-size: 0.85rem; color: var(--text-muted);
}
.preview-night { color: var(--accent-light); font-weight: 600; }
.preview-day   { color: var(--day); font-weight: 600; }
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
cd /home/kiti/learn/zutomayo-card && npm test
```

Expected: 36 tests pass, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add src/assets/main.css
git commit -m "style: add chip selector, stepper, and preview CSS classes"
```

---

## Task 2: Create TimeWheel.vue

**Files:**
- Create: `src/components/TimeWheel.vue`
- Create: `tests/timeWheel.test.js`

The wheel uses a two-semicircle layout. Night positions (0–8) are in the top half, day (9–17) in the bottom half. Midnight (pos 0) is at the top (270°), noon (pos 13) at the bottom (90°).

**Angle formula:**
- pos 0 → 270° (midnight)
- pos 1–4 → 270 + pos×20 (upper right: 290°–350°)
- pos 5–8 → 270 − (pos−4)×20 (upper left: 250°–190°)
- pos 9–17 → 10 + (pos−9)×20 (bottom: 10°–170°)

- [ ] **Step 1: Write failing tests in `tests/timeWheel.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../src/stores/game'
import TimeWheel from '../src/components/TimeWheel.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('TimeWheel', () => {
  it('renders an SVG element', () => {
    const wrapper = mount(TimeWheel)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('shows Night text when timePosition is 0', () => {
    const wrapper = mount(TimeWheel)
    expect(wrapper.find('svg').text()).toContain('Night')
  })

  it('shows Day text when timePosition is 9', () => {
    const store = useGameStore()
    store.timePosition = 9
    const wrapper = mount(TimeWheel)
    expect(wrapper.find('svg').text()).toContain('Day')
  })

  it('shows current position number in center', () => {
    const store = useGameStore()
    store.timePosition = 5
    const wrapper = mount(TimeWheel)
    expect(wrapper.find('svg').text()).toContain('5')
  })

  it('undo button disabled when no history', () => {
    const wrapper = mount(TimeWheel)
    const undoBtn = wrapper.findAll('button').find(b => b.text().includes('Undo'))
    expect(undoBtn.attributes('disabled')).toBeDefined()
  })

  it('redo button disabled initially', () => {
    const wrapper = mount(TimeWheel)
    const redoBtn = wrapper.findAll('button').find(b => b.text().includes('Redo'))
    expect(redoBtn.attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- tests/timeWheel.test.js
```

Expected: FAIL — "Cannot find module '../src/components/TimeWheel.vue'"

- [ ] **Step 3: Create `src/components/TimeWheel.vue`**

```vue
<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const DAY_RAYS = [2, 3, 4, 6, 8, 6, 4, 3, 2]

function posToAngleDeg(pos) {
  if (pos === 0) return 270
  if (pos <= 4) return 270 + pos * 20
  if (pos <= 8) return 270 - (pos - 4) * 20
  return 10 + (pos - 9) * 20
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

const nightPositions = computed(() =>
  Array.from({ length: 9 }, (_, i) => {
    const [px, py] = posToXY(i)
    const isCur = i === store.timePosition
    const rO = isCur ? 8.5 : 6.5
    return {
      i, px, py, isCur, rO,
      rI: rO * 0.76, offX: rO * 0.38, offY: -rO * 0.08,
      color: isCur ? '#c4b5fd' : (i === 0 ? '#7c3aed' : '#4c1d95'),
    }
  })
)

const dayPositions = computed(() =>
  Array.from({ length: 9 }, (_, idx) => {
    const pos = idx + 9
    const [px, py] = posToXY(pos)
    const isCur = pos === store.timePosition
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

<template>
  <div class="time-wheel">
    <svg viewBox="0 0 200 200" class="wheel-svg">
      <defs>
        <filter id="tw-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="tw-clip-top"><rect x="0" y="0" width="200" height="100"/></clipPath>
        <clipPath id="tw-clip-bot"><rect x="0" y="100" width="200" height="100"/></clipPath>
        <mask v-for="m in nightPositions" :key="m.i"
          :id="`tw-moon-${m.i}`" maskUnits="userSpaceOnUse">
          <circle :cx="m.px" :cy="m.py" :r="m.rO" fill="white"/>
          <circle :cx="m.px + m.offX" :cy="m.py + m.offY" :r="m.rI" fill="black"/>
        </mask>
      </defs>

      <!-- Zone backgrounds -->
      <circle cx="100" cy="100" r="95" clip-path="url(#tw-clip-top)" fill="#180b3a" opacity="0.9"/>
      <circle cx="100" cy="100" r="95" clip-path="url(#tw-clip-bot)" fill="#1e0e00" opacity="0.9"/>
      <circle cx="100" cy="100" r="95" fill="none" stroke="#2a1a5a" stroke-width="1"/>
      <line x1="5" y1="100" x2="195" y2="100" stroke="#2d2d5a" stroke-width="0.8" stroke-dasharray="2 5"/>
      <circle cx="100" cy="100" r="78" fill="none" stroke="#1e1e50" stroke-width="1.5"/>
      <text x="100" y="13" text-anchor="middle" font-size="6.5" fill="#9f7aea"
        letter-spacing="1.5" font-weight="600">MIDNIGHT</text>
      <text x="100" y="196" text-anchor="middle" font-size="6.5" fill="#f59e0b"
        letter-spacing="1.5" font-weight="600">NOON</text>

      <!-- Night dots (crescent moon via SVG mask) -->
      <g v-for="m in nightPositions" :key="`n${m.i}`">
        <circle v-if="m.isCur" :cx="m.px" :cy="m.py" :r="m.rO + 2"
          fill="none" stroke="#9f7aea" stroke-width="1.2"/>
        <circle :cx="m.px" :cy="m.py" :r="m.rO" :fill="m.color"
          :mask="`url(#tw-moon-${m.i})`"
          :filter="m.isCur ? 'url(#tw-glow)' : undefined"/>
      </g>

      <!-- Day dots (sun with triangular rays) -->
      <g v-for="d in dayPositions" :key="`d${d.pos}`">
        <circle :cx="d.px" :cy="d.py" :r="d.rCircle" :fill="d.color"
          :filter="d.isCur ? 'url(#tw-glow)' : undefined"/>
        <path :d="d.raysPath" :fill="d.color"
          :filter="d.isCur ? 'url(#tw-glow)' : undefined"/>
      </g>

      <!-- Center display -->
      <text x="100" y="93" text-anchor="middle" font-size="9" font-weight="600"
        :fill="store.phase === 'night' ? '#9f7aea' : '#f59e0b'">
        {{ store.phase === 'night' ? 'Night' : 'Day' }}
      </text>
      <text x="100" y="108" text-anchor="middle" font-size="8" fill="#6b7280">
        pos {{ store.timePosition }} / 17
      </text>
    </svg>

    <div class="undo-redo-row">
      <button class="btn-undo-redo" :disabled="!store.canUndo" @click="store.undo()">↩ Undo</button>
      <button class="btn-undo-redo" :disabled="!store.canRedo" @click="store.redo()">↪ Redo</button>
    </div>
  </div>
</template>

<style scoped>
.time-wheel { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.wheel-svg { width: min(100%, 280px); height: auto; }
.undo-redo-row { display: flex; gap: 0.75rem; }
.btn-undo-redo {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 0.85rem;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius);
}
.btn-undo-redo:not(:disabled):hover { background: var(--accent); border-color: var(--accent); }
</style>
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/timeWheel.test.js
```

Expected: 6 tests pass.

- [ ] **Step 5: Run full suite to check nothing broke**

```bash
npm test
```

Expected: 42 tests pass (36 original + 6 new).

- [ ] **Step 6: Commit**

```bash
git add src/components/TimeWheel.vue tests/timeWheel.test.js
git commit -m "feat: add TimeWheel SVG component with night/day zone icons"
```

---

## Task 3: Update GameBoard.vue to use TimeWheel

**Files:**
- Modify: `src/components/GameBoard.vue`

- [ ] **Step 1: Replace import and template tag in `src/components/GameBoard.vue`**

Change line 5 from:
```js
import TimeTracker from './TimeTracker.vue'
```
To:
```js
import TimeWheel from './TimeWheel.vue'
```

Change line 20 from:
```vue
    <TimeTracker />
```
To:
```vue
    <TimeWheel />
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: 42 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameBoard.vue
git commit -m "feat: swap TimeTracker for TimeWheel in GameBoard"
```

---

## Task 4: Rewrite Step1Time.vue with chip selector + preview

**Files:**
- Create: `tests/step1Time.test.js`
- Modify: `src/components/steps/Step1Time.vue`
- Modify: `src/components/TurnModal.vue`

- [ ] **Step 1: Write failing tests in `tests/step1Time.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Step1Time from '../src/components/steps/Step1Time.vue'

function mountStep1(overrides = {}) {
  return mount(Step1Time, {
    props: { nightTime: 0, dayTime: 0, currentPosition: 0, ...overrides }
  })
}

describe('Step1Time chips', () => {
  it('renders 6 night chips and 6 day chips', () => {
    const wrapper = mountStep1()
    const chips = wrapper.findAll('.chip:not(.chip-other)')
    expect(chips).toHaveLength(12)
  })

  it('clicking night chip value 3 emits update:nightTime with 3', async () => {
    const wrapper = mountStep1()
    // .chip-night buttons (not .chip-other) are indices 0–5 = values 1–6
    await wrapper.findAll('.chip-night:not(.chip-other)')[2].trigger('click')
    expect(wrapper.emitted('update:nightTime')?.[0]).toEqual([3])
  })

  it('clicking day chip value 2 emits update:dayTime with 2', async () => {
    const wrapper = mountStep1()
    await wrapper.findAll('.chip-day:not(.chip-other)')[1].trigger('click')
    expect(wrapper.emitted('update:dayTime')?.[0]).toEqual([2])
  })

  it('Continue button disabled when both 0', () => {
    const wrapper = mountStep1()
    expect(wrapper.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('Continue button enabled when nightTime > 0', () => {
    const wrapper = mountStep1({ nightTime: 2 })
    expect(wrapper.find('.btn-primary').attributes('disabled')).toBeUndefined()
  })
})

describe('Step1Time preview', () => {
  it('preview hidden when both 0', () => {
    const wrapper = mountStep1()
    expect(wrapper.find('.time-preview').exists()).toBe(false)
  })

  it('preview shows total steps and destination position', () => {
    // pos 0 + night 3 + day 2 = total 5, pos 5
    const wrapper = mountStep1({ nightTime: 3, dayTime: 2, currentPosition: 0 })
    const text = wrapper.find('.time-preview').text()
    expect(text).toContain('5 ช่อง')
    expect(text).toContain('pos 5')
  })

  it('preview shows Night when destination is pos 5', () => {
    const wrapper = mountStep1({ nightTime: 3, dayTime: 2, currentPosition: 0 })
    expect(wrapper.find('.preview-night').exists()).toBe(true)
    expect(wrapper.find('.preview-night').text()).toContain('Night')
  })

  it('preview shows Day when destination is pos 9', () => {
    // pos 0 + 9 = pos 9 = day
    const wrapper = mountStep1({ nightTime: 9, dayTime: 0, currentPosition: 0 })
    expect(wrapper.find('.preview-day').exists()).toBe(true)
    expect(wrapper.find('.preview-day').text()).toContain('Day')
  })

  it('preview wraps correctly at position 17 (mod 18)', () => {
    // pos 15 + night 3 + day 0 = 18 % 18 = pos 0 = night (midnight)
    const wrapper = mountStep1({ nightTime: 3, dayTime: 0, currentPosition: 15 })
    const text = wrapper.find('.time-preview').text()
    expect(text).toContain('pos 0')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- tests/step1Time.test.js
```

Expected: FAIL — component exists but .chip-night/.chip-day/etc. not found.

- [ ] **Step 3: Rewrite `src/components/steps/Step1Time.vue`**

Replace the entire file contents with:

```vue
<script setup>
import { ref, computed } from 'vue'
import { advanceTime, getPhase } from '../../composables/gameLogic'

const nightTime = defineModel('nightTime', { default: 0 })
const dayTime = defineModel('dayTime', { default: 0 })
const props = defineProps({ currentPosition: { type: Number, default: 0 } })
const emit = defineEmits(['next'])

const nightOther = ref(false)
const dayOther = ref(false)

function selectNight(v) { nightTime.value = v; nightOther.value = false }
function selectDay(v) { dayTime.value = v; dayOther.value = false }
function openNightOther() { nightOther.value = true; nightTime.value = 0 }
function openDayOther() { dayOther.value = true; dayTime.value = 0 }

const previewPos = computed(() =>
  advanceTime(props.currentPosition, nightTime.value, dayTime.value)
)
const previewPhase = computed(() => getPhase(previewPos.value))
const showPreview = computed(() => nightTime.value > 0 || dayTime.value > 0)
</script>

<template>
  <div class="step">
    <h2 class="step-title">Step 1 — Time Points</h2>
    <p class="step-hint">กดเลือกแต้มเวลาที่เล่นในเทิร์นนี้</p>

    <div class="chip-selector">
      <div class="chip-selector-label">🌙 Night</div>
      <div class="chip-row">
        <button v-for="v in [1,2,3,4,5,6]" :key="v"
          class="chip chip-night"
          :class="{ 'chip-active-night': nightTime === v && !nightOther }"
          @click="selectNight(v)">{{ v }}</button>
        <button class="chip chip-other" @click="openNightOther">✏️</button>
      </div>
      <input v-if="nightOther" v-model.number="nightTime"
        type="number" min="0" class="chip-manual" placeholder="0" />
    </div>

    <div class="chip-selector">
      <div class="chip-selector-label">☀️ Day</div>
      <div class="chip-row">
        <button v-for="v in [1,2,3,4,5,6]" :key="v"
          class="chip chip-day"
          :class="{ 'chip-active-day': dayTime === v && !dayOther }"
          @click="selectDay(v)">{{ v }}</button>
        <button class="chip chip-other" @click="openDayOther">✏️</button>
      </div>
      <input v-if="dayOther" v-model.number="dayTime"
        type="number" min="0" class="chip-manual" placeholder="0" />
    </div>

    <div v-if="showPreview" class="time-preview">
      รวม {{ nightTime + dayTime }} ช่อง → pos {{ previewPos }}
      <span :class="previewPhase === 'night' ? 'preview-night' : 'preview-day'">
        · {{ previewPhase === 'night' ? '🌙 Night' : '☀️ Day' }}
      </span>
    </div>

    <button class="btn-primary btn-full" @click="emit('next')"
      :disabled="nightTime === 0 && dayTime === 0">Continue →</button>
  </div>
</template>
```

- [ ] **Step 4: Add `currentPosition` prop to Step1Time in `src/components/TurnModal.vue`**

Find the `<Step1Time` block (lines 47–52) and change it from:

```vue
      <Step1Time
        v-if="step === 1"
        v-model:nightTime="nightTime"
        v-model:dayTime="dayTime"
        @next="step++"
      />
```

To:

```vue
      <Step1Time
        v-if="step === 1"
        v-model:nightTime="nightTime"
        v-model:dayTime="dayTime"
        :currentPosition="store.timePosition"
        @next="step++"
      />
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- tests/step1Time.test.js
```

Expected: 10 tests pass.

- [ ] **Step 6: Run full suite**

```bash
npm test
```

Expected: 52 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/steps/Step1Time.vue src/components/TurnModal.vue tests/step1Time.test.js
git commit -m "feat: Step1Time chip selector with phase preview"
```

---

## Task 5: Rewrite Step3Attack.vue with preset chips and stepper

**Files:**
- Create: `tests/step3Attack.test.js`
- Modify: `src/components/steps/Step3Attack.vue`

- [ ] **Step 1: Write failing tests in `tests/step3Attack.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Step3Attack from '../src/components/steps/Step3Attack.vue'

function mountStep3(overrides = {}) {
  return mount(Step3Attack, {
    props: { nightAttack: 0, dayAttack: 0, phase: 'night', ...overrides }
  })
}

describe('Step3Attack preset chips', () => {
  it('renders 4 preset chips for night and 4 for day', () => {
    const wrapper = mountStep3()
    const chips = wrapper.findAll('.chip:not(.chip-other)')
    expect(chips).toHaveLength(8)
  })

  it('clicking night preset 50 emits update:nightAttack with 50', async () => {
    const wrapper = mountStep3()
    // night preset chips: 10, 50, 100, 150 → index 1 = 50
    await wrapper.findAll('.chip-night:not(.chip-other)')[1].trigger('click')
    expect(wrapper.emitted('update:nightAttack')?.[0]).toEqual([50])
  })

  it('clicking day preset 100 emits update:dayAttack with 100', async () => {
    const wrapper = mountStep3()
    // day preset chips: 10, 50, 100, 150 → index 2 = 100
    await wrapper.findAll('.chip-day:not(.chip-other)')[2].trigger('click')
    expect(wrapper.emitted('update:dayAttack')?.[0]).toEqual([100])
  })
})

describe('Step3Attack stepper', () => {
  it('+10 on night increases nightAttack by 10', async () => {
    const wrapper = mountStep3({ nightAttack: 50 })
    // stepper buttons order: [night –10, night +10, day –10, day +10]
    await wrapper.findAll('.stepper-btn')[1].trigger('click')
    expect(wrapper.emitted('update:nightAttack')?.[0]).toEqual([60])
  })

  it('–10 on night clamps at 0 when value is 5', async () => {
    const wrapper = mountStep3({ nightAttack: 5 })
    await wrapper.findAll('.stepper-btn')[0].trigger('click')
    expect(wrapper.emitted('update:nightAttack')?.[0]).toEqual([0])
  })

  it('+10 on day increases dayAttack by 10', async () => {
    const wrapper = mountStep3({ dayAttack: 80 })
    await wrapper.findAll('.stepper-btn')[3].trigger('click')
    expect(wrapper.emitted('update:dayAttack')?.[0]).toEqual([90])
  })

  it('–10 on day clamps at 0 when value is 0', async () => {
    const wrapper = mountStep3({ dayAttack: 0 })
    await wrapper.findAll('.stepper-btn')[2].trigger('click')
    expect(wrapper.emitted('update:dayAttack')?.[0]).toEqual([0])
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- tests/step3Attack.test.js
```

Expected: FAIL — `.chip-night` / `.chip-day` / `.stepper-btn` not found.

- [ ] **Step 3: Rewrite `src/components/steps/Step3Attack.vue`**

Replace the entire file contents with:

```vue
<script setup>
import { ref } from 'vue'

const nightAttack = defineModel('nightAttack', { default: 0 })
const dayAttack = defineModel('dayAttack', { default: 0 })
defineProps({ phase: String })
const emit = defineEmits(['next', 'back'])

const PRESETS = [10, 50, 100, 150]
const nightOther = ref(false)
const dayOther = ref(false)

function setNight(v) { nightAttack.value = v; nightOther.value = false }
function setDay(v) { dayAttack.value = v; dayOther.value = false }
function adjustNight(delta) { nightAttack.value = Math.max(0, nightAttack.value + delta) }
function adjustDay(delta) { dayAttack.value = Math.max(0, dayAttack.value + delta) }
</script>

<template>
  <div class="step">
    <h2 class="step-title">Step 3 — Attack Power</h2>
    <p class="step-hint phase-reminder">
      Current phase: {{ phase === 'night' ? '🌙 Night' : '☀️ Day' }}
    </p>

    <div class="chip-selector">
      <div class="chip-selector-label">🌙 Night Attack</div>
      <div class="chip-row">
        <button v-for="v in PRESETS" :key="v"
          class="chip chip-night"
          :class="{ 'chip-active-night': nightAttack === v && !nightOther }"
          @click="setNight(v)">{{ v }}</button>
        <button class="chip chip-other" @click="nightOther = true">✏️</button>
      </div>
      <input v-if="nightOther" v-model.number="nightAttack"
        type="number" min="0" class="chip-manual" />
      <div class="stepper">
        <button class="stepper-btn" @click="adjustNight(-10)">–10</button>
        <span class="stepper-val">{{ nightAttack }}</span>
        <button class="stepper-btn" @click="adjustNight(10)">+10</button>
      </div>
    </div>

    <div class="chip-selector">
      <div class="chip-selector-label">☀️ Day Attack</div>
      <div class="chip-row">
        <button v-for="v in PRESETS" :key="v"
          class="chip chip-day"
          :class="{ 'chip-active-day': dayAttack === v && !dayOther }"
          @click="setDay(v)">{{ v }}</button>
        <button class="chip chip-other" @click="dayOther = true">✏️</button>
      </div>
      <input v-if="dayOther" v-model.number="dayAttack"
        type="number" min="0" class="chip-manual" />
      <div class="stepper">
        <button class="stepper-btn" @click="adjustDay(-10)">–10</button>
        <span class="stepper-val">{{ dayAttack }}</span>
        <button class="stepper-btn" @click="adjustDay(10)">+10</button>
      </div>
    </div>

    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary" @click="emit('next')">Continue →</button>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/step3Attack.test.js
```

Expected: 7 tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected: 59 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/steps/Step3Attack.vue tests/step3Attack.test.js
git commit -m "feat: Step3Attack preset chips and stepper"
```

---

## Task 6: Delete TimeTracker.vue and final verification

**Files:**
- Delete: `src/components/TimeTracker.vue`

- [ ] **Step 1: Delete TimeTracker.vue**

```bash
rm src/components/TimeTracker.vue
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: 59 tests pass. (TimeTracker is not imported anywhere now — GameBoard uses TimeWheel.)

- [ ] **Step 3: Start dev server and verify visually**

```bash
npm run dev
```

Open the app and check:
1. The time wheel SVG renders in the center of the game board — top half purple (moons), bottom half warm (suns)
2. Midnight label at top, Noon label at bottom; current position glows
3. Click START TURN → Step 1 shows chip buttons 1–6 for Night and Day; selecting chips shows preview row with position and phase
4. ✏️ opens a number input for custom values
5. Step 3 shows 10/50/100/150 preset chips + stepper ±10; values display correctly
6. Complete a full turn — wheel updates to new position

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: remove TimeTracker.vue (replaced by TimeWheel)"
```
