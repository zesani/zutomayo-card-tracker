# Zutomayo Card Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Vue 3 web app that tracks HP, time wheel position, and assists with turn resolution for the Zutomayo Card game.

**Architecture:** Pure game logic lives in a composable (`gameLogic.js`) with no Vue dependencies, making it independently testable. A Pinia store consumes those pure functions and owns all reactive game state including undo/redo history stacks. Vue components are thin — they read from the store and emit user inputs back to it.

**Tech Stack:** Vue 3.4+, Vite, Pinia, Vitest, jsdom

---

## File Map

```
src/
  main.js                        ← bootstrap Vue + Pinia
  App.vue                        ← route between Setup / Board / GameOver
  assets/
    main.css                     ← dark theme, global resets, layout
  composables/
    gameLogic.js                 ← pure functions: advanceTime, getPhase, resolveCombat, getCardLimits
  stores/
    game.js                      ← Pinia store: state, actions, getters, undo/redo
  components/
    GameSetup.vue                ← new game screen
    GameBoard.vue                ← main board (composes panels + modal)
    PlayerPanel.vue              ← HP bar + name + card limit (reused for both players)
    TimeTracker.vue              ← phase icon + position + undo/redo buttons
    GameOver.vue                 ← winner screen + new game
    TurnModal.vue                ← bottom-sheet wizard (manages local turn state)
    steps/
      Step1Time.vue              ← time point inputs for both players
      Step2Phase.vue             ← phase reveal after time advance
      Step3Attack.vue            ← attack power inputs for both players
      Step4Result.vue            ← damage result + card limit for next turn
tests/
  gameLogic.test.js              ← unit tests for pure functions
  game.store.test.js             ← unit tests for Pinia store
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.vue` (stub)

- [ ] **Step 1: Scaffold Vite + Vue project**

```bash
cd /home/kiti/learn/zutomayo-card
npm create vite@latest . -- --template vue
```

When prompted "Current directory is not empty. Remove existing files and continue?" — choose **Yes**.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install pinia
npm install -D vitest @vue/test-utils jsdom
```

- [ ] **Step 3: Configure Vite for testing**

Replace the content of `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, find the `"scripts"` section and add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

So scripts looks like:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Delete default boilerplate files**

```bash
rm -rf src/components/HelloWorld.vue src/assets/vue.svg public/vite.svg
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts on `http://localhost:5173`. Stop it with `Ctrl+C`.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: scaffold Vue 3 + Vite + Pinia project"
```

---

## Task 2: Pure Game Logic

**Files:**
- Create: `src/composables/gameLogic.js`
- Create: `tests/gameLogic.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/gameLogic.test.js`:

```js
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
  it('returns night for position 0 (Midnight)', () => {
    expect(getPhase(0)).toBe('night')
  })
  it('returns night for position 8 (last night slot)', () => {
    expect(getPhase(8)).toBe('night')
  })
  it('returns day for position 9 (first day slot)', () => {
    expect(getPhase(9)).toBe('day')
  })
  it('returns day for position 17 (last slot)', () => {
    expect(getPhase(17)).toBe('day')
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
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
npm test
```

Expected: all tests FAIL with "Cannot find module '../src/composables/gameLogic'"

- [ ] **Step 3: Implement pure functions**

Create `src/composables/gameLogic.js`:

```js
export function advanceTime(currentPosition, nightPoints, dayPoints) {
  return (currentPosition + nightPoints + dayPoints) % 18
}

export function getPhase(position) {
  return position <= 8 ? 'night' : 'day'
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
```

- [ ] **Step 4: Run tests — verify they all pass**

```bash
npm test
```

Expected: all 12 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/composables/gameLogic.js tests/gameLogic.test.js
git commit -m "feat: add pure game logic functions with tests"
```

---

## Task 3: Pinia Game Store

**Files:**
- Create: `src/stores/game.js`
- Create: `tests/game.store.test.js`

- [ ] **Step 1: Write failing store tests**

Create `tests/game.store.test.js`:

```js
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
    expect(store.cardLimit).toEqual({ night: 2, day: 2 })
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
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
npm test
```

Expected: store tests FAIL with "Cannot find module '../src/stores/game'"

- [ ] **Step 3: Implement the store**

Create `src/stores/game.js`:

```js
import { defineStore } from 'pinia'
import { advanceTime, getPhase, resolveCombat, getCardLimits } from '../composables/gameLogic'

const INITIAL_STATE = {
  timePosition: 0,
  hp: { night: 100, day: 100 },
  cardLimit: { night: 2, day: 2 },
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
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: all tests PASS (gameLogic + store)

- [ ] **Step 5: Commit**

```bash
git add src/stores/game.js tests/game.store.test.js
git commit -m "feat: add Pinia game store with undo/redo"
```

---

## Task 4: App Shell

**Files:**
- Modify: `src/main.js`
- Modify: `src/App.vue`
- Create: `src/assets/main.css`

- [ ] **Step 1: Wire up Pinia in main.js**

Replace `src/main.js` with:

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css'

createApp(App).use(createPinia()).mount('#app')
```

- [ ] **Step 2: Create App.vue with screen routing**

Replace `src/App.vue` with:

```vue
<script setup>
import { useGameStore } from './stores/game'
import GameSetup from './components/GameSetup.vue'
import GameBoard from './components/GameBoard.vue'
import GameOver from './components/GameOver.vue'

const store = useGameStore()
</script>

<template>
  <div class="app">
    <GameOver v-if="store.isGameOver" />
    <GameBoard v-else-if="store.started" />
    <GameSetup v-else />
  </div>
</template>
```

- [ ] **Step 3: Create stub components so the app compiles**

Create `src/components/GameSetup.vue`:
```vue
<template><div>Setup</div></template>
```

Create `src/components/GameBoard.vue`:
```vue
<template><div>Board</div></template>
```

Create `src/components/GameOver.vue`:
```vue
<template><div>Game Over</div></template>
```

- [ ] **Step 4: Create base CSS**

Create `src/assets/main.css`:

```css
:root {
  --bg: #0a0a1a;
  --surface: #12123a;
  --surface-2: #1a1a4a;
  --accent: #6b46c1;
  --accent-light: #9f7aea;
  --night: #7b68ee;
  --day: #f6ad55;
  --text: #e2e8f0;
  --text-muted: #94a3b8;
  --border: #2d2d6b;
  --hp-high: #48bb78;
  --hp-mid: #ed8936;
  --hp-low: #fc8181;
  --radius: 12px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-family: inherit;
  padding: 0.6rem 1.2rem;
  transition: opacity 0.15s;
}

button:disabled { opacity: 0.35; cursor: not-allowed; }

input[type="number"] {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 1.4rem;
  padding: 0.5rem 0.75rem;
  width: 100%;
  text-align: center;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
```

- [ ] **Step 5: Verify app loads in browser**

```bash
npm run dev
```

Open `http://localhost:5173` — should show "Setup" text. Stop server.

- [ ] **Step 6: Commit**

```bash
git add src/main.js src/App.vue src/assets/main.css src/components/
git commit -m "feat: wire up app shell and screen routing"
```

---

## Task 5: GameSetup.vue

**Files:**
- Modify: `src/components/GameSetup.vue`

- [ ] **Step 1: Implement GameSetup**

Replace `src/components/GameSetup.vue` with:

```vue
<script setup>
import { useGameStore } from '../stores/game'
const store = useGameStore()
</script>

<template>
  <div class="setup">
    <div class="setup-content">
      <h1 class="setup-title">Zutomayo Card</h1>
      <p class="setup-subtitle">Game Tracker</p>
      <div class="players-preview">
        <div class="player-badge night">🌙 Player Night</div>
        <span class="vs">VS</span>
        <div class="player-badge day">☀️ Player Day</div>
      </div>
      <button class="btn-primary btn-large" @click="store.startGame()">New Game</button>
    </div>
  </div>
</template>

<style scoped>
.setup {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 2rem;
}
.setup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}
.setup-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--night), var(--day));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.setup-subtitle { color: var(--text-muted); font-size: 1rem; }
.players-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.player-badge {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-weight: 600;
}
.player-badge.night { background: var(--surface-2); color: var(--night); }
.player-badge.day { background: var(--surface-2); color: var(--day); }
.vs { color: var(--text-muted); font-weight: 700; }
.btn-primary {
  background: var(--accent);
  color: white;
  font-weight: 700;
}
.btn-primary:hover { opacity: 0.85; }
.btn-large { padding: 0.9rem 2.5rem; font-size: 1.1rem; }
</style>
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173` — should show title, player badges, and New Game button. Click it — should show "Board" text. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameSetup.vue
git commit -m "feat: implement GameSetup screen"
```

---

## Task 6: PlayerPanel.vue

**Files:**
- Create: `src/components/PlayerPanel.vue`

- [ ] **Step 1: Implement PlayerPanel**

Create `src/components/PlayerPanel.vue`:

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  hp: { type: Number, required: true },
  cardLimit: { type: Number, required: true },
  flipped: { type: Boolean, default: false },
})

const hpClass = computed(() => {
  if (props.hp > 60) return 'high'
  if (props.hp > 30) return 'mid'
  return 'low'
})
</script>

<template>
  <div class="player-panel" :class="{ flipped }">
    <div class="panel-header">
      <span class="player-name">{{ icon }} {{ name }}</span>
      <span class="hp-value">{{ hp }} HP</span>
    </div>
    <div class="hp-bar-track">
      <div class="hp-bar-fill" :class="hpClass" :style="{ width: hp + '%' }"></div>
    </div>
    <div class="card-limit-label">Cards next turn: <strong>{{ cardLimit }}</strong></div>
  </div>
</template>

<style scoped>
.player-panel {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.player-name { font-weight: 700; font-size: 1rem; }
.hp-value { font-size: 1.2rem; font-weight: 700; }
.hp-bar-track {
  height: 12px;
  background: var(--surface-2);
  border-radius: 6px;
  overflow: hidden;
}
.hp-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s ease;
}
.hp-bar-fill.high { background: var(--hp-high); }
.hp-bar-fill.mid { background: var(--hp-mid); }
.hp-bar-fill.low { background: var(--hp-low); }
.card-limit-label { font-size: 0.8rem; color: var(--text-muted); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PlayerPanel.vue
git commit -m "feat: implement PlayerPanel with HP bar"
```

---

## Task 7: TimeTracker.vue

**Files:**
- Create: `src/components/TimeTracker.vue`

- [ ] **Step 1: Implement TimeTracker**

Create `src/components/TimeTracker.vue`:

```vue
<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const positionLabel = computed(() => {
  if (store.timePosition === 0) return 'Midnight'
  return `Position ${store.timePosition + 1} / 18`
})
</script>

<template>
  <div class="time-tracker">
    <div class="phase-display">
      <span class="phase-icon">{{ store.phase === 'night' ? '🌙' : '☀️' }}</span>
      <span class="phase-text">{{ store.phase === 'night' ? 'Night' : 'Day' }}</span>
    </div>
    <div class="position-label">{{ positionLabel }}</div>
    <div class="undo-redo-row">
      <button class="btn-undo-redo" :disabled="!store.canUndo" @click="store.undo()">↩ Undo</button>
      <button class="btn-undo-redo" :disabled="!store.canRedo" @click="store.redo()">↪ Redo</button>
    </div>
  </div>
</template>

<style scoped>
.time-tracker {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.phase-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.phase-icon { font-size: 2rem; }
.phase-text { font-size: 1.4rem; font-weight: 700; }
.position-label { color: var(--text-muted); font-size: 0.9rem; }
.undo-redo-row { display: flex; gap: 0.75rem; margin-top: 0.25rem; }
.btn-undo-redo {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 0.85rem;
  padding: 0.4rem 0.9rem;
}
.btn-undo-redo:not(:disabled):hover { background: var(--accent); border-color: var(--accent); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TimeTracker.vue
git commit -m "feat: implement TimeTracker with phase display and undo/redo"
```

---

## Task 8: Turn Modal (4 Steps)

**Files:**
- Create: `src/components/steps/Step1Time.vue`
- Create: `src/components/steps/Step2Phase.vue`
- Create: `src/components/steps/Step3Attack.vue`
- Create: `src/components/steps/Step4Result.vue`
- Create: `src/components/TurnModal.vue`

- [ ] **Step 1: Create Step1Time.vue**

Create `src/components/steps/Step1Time.vue`:

```vue
<script setup>
const nightTime = defineModel('nightTime', { default: 0 })
const dayTime = defineModel('dayTime', { default: 0 })
const emit = defineEmits(['next'])
</script>

<template>
  <div class="step">
    <h2 class="step-title">Step 1 — Time Points</h2>
    <p class="step-hint">Enter total time points from all cards played this turn.</p>
    <div class="input-group">
      <label>🌙 Player Night</label>
      <input type="number" v-model.number="nightTime" min="0" />
    </div>
    <div class="input-group">
      <label>☀️ Player Day</label>
      <input type="number" v-model.number="dayTime" min="0" />
    </div>
    <button class="btn-primary btn-full" @click="emit('next')">Continue →</button>
  </div>
</template>
```

- [ ] **Step 2: Create Step2Phase.vue**

Create `src/components/steps/Step2Phase.vue`:

```vue
<script setup>
defineProps({ position: Number, phase: String })
const emit = defineEmits(['next', 'back'])
</script>

<template>
  <div class="step">
    <h2 class="step-title">Step 2 — Phase</h2>
    <div class="phase-result">
      <span class="result-icon">{{ phase === 'night' ? '🌙' : '☀️' }}</span>
      <span class="result-label">{{ phase === 'night' ? 'Night Phase' : 'Day Phase' }}</span>
      <span class="result-position">
        {{ position === 0 ? 'Midnight' : `Position ${position + 1} / 18` }}
      </span>
    </div>
    <p class="step-hint">Apply phase modifiers to your character's attack before the next step.</p>
    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary" @click="emit('next')">Continue →</button>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Create Step3Attack.vue**

Create `src/components/steps/Step3Attack.vue`:

```vue
<script setup>
const nightAttack = defineModel('nightAttack', { default: 0 })
const dayAttack = defineModel('dayAttack', { default: 0 })
defineProps({ phase: String })
const emit = defineEmits(['next', 'back'])
</script>

<template>
  <div class="step">
    <h2 class="step-title">Step 3 — Attack Power</h2>
    <p class="step-hint phase-reminder">
      Current phase: {{ phase === 'night' ? '🌙 Night' : '☀️ Day' }}
    </p>
    <div class="input-group">
      <label>🌙 Player Night — Attack</label>
      <input type="number" v-model.number="nightAttack" min="0" />
    </div>
    <div class="input-group">
      <label>☀️ Player Day — Attack</label>
      <input type="number" v-model.number="dayAttack" min="0" />
    </div>
    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary" @click="emit('next')">Continue →</button>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Create Step4Result.vue**

Create `src/components/steps/Step4Result.vue`:

```vue
<script setup>
defineProps({
  combat: { type: Object, required: true },
  cardLimit: { type: Object, required: true },
})
const emit = defineEmits(['endTurn', 'back'])
</script>

<template>
  <div class="step">
    <h2 class="step-title">Step 4 — Result</h2>
    <div class="combat-result" :class="combat.winner ?? 'draw'">
      <template v-if="combat.winner">
        <span class="result-winner">{{ combat.winner === 'night' ? '🌙 Night' : '☀️ Day' }} wins!</span>
        <span class="result-damage">Damage: {{ combat.damage }}</span>
      </template>
      <template v-else>
        <span class="result-winner">Draw</span>
        <span class="result-damage">No damage</span>
      </template>
    </div>
    <div class="card-limit-box">
      <h3>Cards next turn</h3>
      <div class="limit-row">
        <span>🌙 Player Night</span>
        <strong>{{ cardLimit.night }} card{{ cardLimit.night > 1 ? 's' : '' }}</strong>
      </div>
      <div class="limit-row">
        <span>☀️ Player Day</span>
        <strong>{{ cardLimit.day }} card{{ cardLimit.day > 1 ? 's' : '' }}</strong>
      </div>
    </div>
    <div class="step-nav">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <button class="btn-primary btn-end" @click="emit('endTurn')">End Turn ✓</button>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Create TurnModal.vue**

Create `src/components/TurnModal.vue`:

```vue
<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { advanceTime, getPhase, resolveCombat, getCardLimits } from '../composables/gameLogic'
import Step1Time from './steps/Step1Time.vue'
import Step2Phase from './steps/Step2Phase.vue'
import Step3Attack from './steps/Step3Attack.vue'
import Step4Result from './steps/Step4Result.vue'

const emit = defineEmits(['close'])
const store = useGameStore()

const step = ref(1)
const nightTime = ref(0)
const dayTime = ref(0)
const nightAttack = ref(0)
const dayAttack = ref(0)

const previewPosition = computed(() =>
  advanceTime(store.timePosition, nightTime.value, dayTime.value)
)
const previewPhase = computed(() => getPhase(previewPosition.value))
const previewCombat = computed(() =>
  resolveCombat(nightAttack.value, dayAttack.value, store.hp.night, store.hp.day)
)
const previewCardLimit = computed(() => getCardLimits(previewCombat.value.winner))

function endTurn() {
  store.resolveTurn(nightTime.value, dayTime.value, nightAttack.value, dayAttack.value)
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-sheet">
      <button class="modal-close" @click="emit('close')">✕</button>
      <div class="step-indicator">{{ step }} / 4</div>

      <Step1Time
        v-if="step === 1"
        v-model:nightTime="nightTime"
        v-model:dayTime="dayTime"
        @next="step++"
      />
      <Step2Phase
        v-else-if="step === 2"
        :position="previewPosition"
        :phase="previewPhase"
        @next="step++"
        @back="step--"
      />
      <Step3Attack
        v-else-if="step === 3"
        v-model:nightAttack="nightAttack"
        v-model:dayAttack="dayAttack"
        :phase="previewPhase"
        @next="step++"
        @back="step--"
      />
      <Step4Result
        v-else-if="step === 4"
        :combat="previewCombat"
        :card-limit="previewCardLimit"
        @end-turn="endTurn"
        @back="step--"
      />
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}
.modal-sheet {
  background: var(--surface);
  border-radius: var(--radius) var(--radius) 0 0;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  padding-top: 3rem;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--surface-2);
  color: var(--text-muted);
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: 50%;
  font-size: 0.9rem;
}
.step-indicator {
  position: absolute;
  top: 1.1rem;
  left: 1.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
```

- [ ] **Step 6: Add shared step styles to main.css**

Append to `src/assets/main.css`:

```css
/* Shared step styles */
.step { display: flex; flex-direction: column; gap: 1rem; }
.step-title { font-size: 1.1rem; font-weight: 700; }
.step-hint { font-size: 0.85rem; color: var(--text-muted); }
.phase-reminder { color: var(--accent-light); font-weight: 600; }

.input-group { display: flex; flex-direction: column; gap: 0.4rem; }
.input-group label { font-size: 0.9rem; color: var(--text-muted); }

.step-nav { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
.step-nav button { flex: 1; }

.btn-primary { background: var(--accent); color: white; font-weight: 700; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }
.btn-secondary { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--border); }
.btn-full { width: 100%; }

.phase-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.5rem;
  background: var(--surface-2);
  border-radius: var(--radius);
}
.result-icon { font-size: 3rem; }
.result-label { font-size: 1.4rem; font-weight: 700; }
.result-position { font-size: 0.85rem; color: var(--text-muted); }

.combat-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem;
  border-radius: var(--radius);
  background: var(--surface-2);
}
.combat-result.night { border-left: 4px solid var(--night); }
.combat-result.day { border-left: 4px solid var(--day); }
.combat-result.draw { border-left: 4px solid var(--text-muted); }
.result-winner { font-size: 1.3rem; font-weight: 700; }
.result-damage { color: var(--text-muted); }

.card-limit-box {
  background: var(--surface-2);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.card-limit-box h3 { font-size: 0.9rem; color: var(--text-muted); }
.limit-row { display: flex; justify-content: space-between; align-items: center; }
.btn-end { background: #276749; }
.btn-end:hover { opacity: 0.85; }
```

- [ ] **Step 7: Commit**

```bash
git add src/components/TurnModal.vue src/components/steps/ src/assets/main.css
git commit -m "feat: implement TurnModal with 4-step turn wizard"
```

---

## Task 9: GameBoard.vue

**Files:**
- Modify: `src/components/GameBoard.vue`

- [ ] **Step 1: Implement GameBoard**

Replace `src/components/GameBoard.vue` with:

```vue
<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import PlayerPanel from './PlayerPanel.vue'
import TimeTracker from './TimeTracker.vue'
import TurnModal from './TurnModal.vue'

const store = useGameStore()
const showModal = ref(false)
</script>

<template>
  <div class="board">
    <PlayerPanel
      name="Player Night"
      icon="🌙"
      :hp="store.hp.night"
      :card-limit="store.cardLimit.night"
    />
    <TimeTracker />
    <PlayerPanel
      name="Player Day"
      icon="☀️"
      :hp="store.hp.day"
      :card-limit="store.cardLimit.day"
    />
    <div class="turn-area">
      <div class="turn-info">Turn {{ store.turnNumber }}</div>
      <button class="btn-start-turn" @click="showModal = true">START TURN</button>
    </div>
    <TurnModal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  min-height: 100dvh;
}
.turn-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-bottom: 1.5rem;
}
.turn-info { font-size: 0.85rem; color: var(--text-muted); }
.btn-start-turn {
  background: var(--accent);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  padding: 1rem 3rem;
  letter-spacing: 0.05em;
  width: 100%;
  max-width: 320px;
}
.btn-start-turn:hover { opacity: 0.85; }
</style>
```

- [ ] **Step 2: Verify full turn flow in browser**

```bash
npm run dev
```

1. Click **New Game** — board appears with both players at 100 HP, Night phase, Midnight.
2. Click **START TURN** — modal opens at Step 1.
3. Enter time points (e.g. Night: 2, Day: 3) → Continue.
4. Step 2 shows phase for position 5 (Night). → Continue.
5. Enter attack values (e.g. Night: 10, Day: 5) → Continue.
6. Step 4 shows Night wins, damage 5, Day gets 2 cards next turn.
7. **End Turn** — modal closes, Day HP bar drops to 95.
8. Press **Undo** — HP returns to 100, time back to Midnight.
9. Press **Redo** — state returns.

Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameBoard.vue
git commit -m "feat: implement GameBoard composing all panels and turn modal"
```

---

## Task 10: GameOver.vue

**Files:**
- Modify: `src/components/GameOver.vue`

- [ ] **Step 1: Implement GameOver**

Replace `src/components/GameOver.vue` with:

```vue
<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const winner = computed(() => {
  if (store.hp.night <= 0) return { icon: '☀️', name: 'Player Day' }
  return { icon: '🌙', name: 'Player Night' }
})
</script>

<template>
  <div class="game-over">
    <div class="game-over-content">
      <span class="winner-icon">{{ winner.icon }}</span>
      <h1 class="game-over-title">Game Over</h1>
      <p class="winner-name">{{ winner.name }} wins!</p>
      <button class="btn-primary btn-large" @click="store.startGame()">New Game</button>
    </div>
  </div>
</template>

<style scoped>
.game-over {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 2rem;
}
.game-over-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}
.winner-icon { font-size: 4rem; }
.game-over-title { font-size: 2rem; font-weight: 700; }
.winner-name { font-size: 1.3rem; color: var(--accent-light); }
.btn-primary { background: var(--accent); color: white; font-weight: 700; }
.btn-large { padding: 0.9rem 2.5rem; font-size: 1.1rem; margin-top: 0.5rem; }
</style>
```

- [ ] **Step 2: Verify game over in browser**

```bash
npm run dev
```

Start a new game. Open browser console and run:
```js
document.querySelector('button').__vue_app__.config.globalProperties.$pinia.state.value.game.hp.day = 0
```

Then trigger a re-render by opening/closing the turn modal. The GameOver screen should appear with "Player Night wins!" and a New Game button.

Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameOver.vue
git commit -m "feat: implement GameOver screen"
```

---

## Task 11: Final Polish

**Files:**
- Modify: `src/assets/main.css`
- Modify: `index.html`

- [ ] **Step 1: Set page title in index.html**

In `index.html`, change `<title>Vite App</title>` to:

```html
<title>Zutomayo Card Tracker</title>
```

Also add inside `<head>`:

```html
<meta name="theme-color" content="#0a0a1a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

- [ ] **Step 2: Add turn number to board and final mobile tweaks**

Append to `src/assets/main.css`:

```css
/* Mobile safe area */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .board { padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
}

/* Prevent zoom on input focus (iOS) */
input[type="number"] { font-size: 16px; }

/* Touch tap highlight off */
* { -webkit-tap-highlight-color: transparent; }
```

- [ ] **Step 3: Full end-to-end test**

```bash
npm run dev
```

Play through a complete sequence:
1. New Game → board shows Night phase, Midnight, both 100 HP, 2 cards each.
2. Start Turn → enter Night: 5, Day: 4 → Continue.
3. Phase shows position 10 = Day ☀️ → Continue.
4. Enter Night: 8, Day: 12 → Continue.
5. Day wins, damage 4. Night gets 2 cards, Day gets 1 → End Turn.
6. Board: Night HP = 96, Day HP = 100, turn 2, position 10, Day phase.
7. Undo → back to turn 1, Night 100 HP, Midnight.
8. Redo → back to turn 2 state.
9. Play more turns until HP reaches 0 → Game Over screen.
10. New Game → full reset.

Stop server.

- [ ] **Step 4: Run all tests one final time**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Final commit**

```bash
git add index.html src/assets/main.css
git commit -m "feat: final mobile polish and page meta"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Vue 3 + Vite + Pinia | Task 1 |
| 18-position time wheel, clockwise, wraps | Task 2 (advanceTime), Task 3 (resolveTurn) |
| Night phase 0–8, Day phase 9–17 | Task 2 (getPhase) |
| HP 0–100, floor at 0 | Task 2 (resolveCombat) |
| Damage = attack difference | Task 2 (resolveCombat) |
| Card limits: winner 1, loser 2, draw 1 each | Task 2 (getCardLimits) |
| 4-step turn modal | Task 8 |
| Phase shown before attack input | Task 8, Step 2 |
| Card limit shown after each turn | Task 8, Step 4 |
| Undo/redo unlimited, per-turn | Task 3 (undo/redo actions) |
| Player Night 🌙 / Player Day ☀️ | Tasks 6, 9 |
| HP bar visual with color | Task 6 |
| Game Over when HP = 0 | Task 10, App.vue routing |
| New Game resets all state | Task 3 (startGame) |
| Mobile-first layout | Tasks 4, 11 |

All spec requirements covered. No gaps.
