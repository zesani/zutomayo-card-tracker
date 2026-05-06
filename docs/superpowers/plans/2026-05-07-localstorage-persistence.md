# LocalStorage Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist full game state (HP, time, turn, undo/redo history) to localStorage so an accidental reload auto-resumes the game, with a confirmed "New Game" reset from the board.

**Architecture:** A module-level `persist()` helper writes to localStorage after every mutating action. A new `loadGame()` store action (called on mount) restores state from a valid save. `startGame()` keeps its existing reset behaviour and gains a `persist()` call so a fresh game is also saved immediately.

**Tech Stack:** Vue 3, Pinia, Vite/Vitest, jsdom (test environment already has localStorage)

---

## File Map

| File | Change |
|------|--------|
| `src/stores/game.js` | Add `persist()`, `loadSave()` helpers; add `loadGame()` action; add `persist(this)` to `startGame`, `resolveTurn`, `undo`, `redo` |
| `src/App.vue` | Import `onMounted`; call `store.loadGame()` on mount |
| `src/components/GameBoard.vue` | Add "New Game" button (secondary style) that confirms then calls `store.startGame()` |
| `tests/game.store.test.js` | Add new `describe` blocks for persistence (existing tests untouched) |

---

### Task 1: persist/loadSave helpers + loadGame action (TDD)

**Files:**
- Modify: `src/stores/game.js`
- Modify: `tests/game.store.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/game.store.test.js`:

```js
describe('localStorage persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/kiti/learn/ztmycard && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: 5 new failures mentioning `store.loadGame is not a function`

- [ ] **Step 3: Add persist/loadSave helpers and loadGame action to game.js**

In `src/stores/game.js`, add the two helpers directly after the `snapshot` function (before `export const useGameStore`):

```js
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
```

Then add `loadGame` inside the `actions` object (after `redo`):

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/kiti/learn/ztmycard && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: all tests pass, including the 5 new ones

- [ ] **Step 5: Commit**

```bash
cd /home/kiti/learn/ztmycard && git add src/stores/game.js tests/game.store.test.js && git commit -m "feat: add persist/loadSave helpers and loadGame action"
```

---

### Task 2: Add persist() calls to mutating actions (TDD)

**Files:**
- Modify: `src/stores/game.js`
- Modify: `tests/game.store.test.js`

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe('localStorage persistence', ...)` block in `tests/game.store.test.js`:

```js
  it('startGame writes a fresh save to localStorage', () => {
    const store = useGameStore()
    store.startGame()
    const raw = localStorage.getItem('zutomayo-card-save')
    expect(raw).not.toBeNull()
    const save = JSON.parse(raw)
    expect(save.started).toBe(true)
    expect(save.turnNumber).toBe(1)
    expect(save.hp).toEqual({ night: 100, day: 100 })
  })

  it('resolveTurn updates the save in localStorage', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(2, 3, 10, 5)
    const save = JSON.parse(localStorage.getItem('zutomayo-card-save'))
    expect(save.timePosition).toBe(5)
    expect(save.hp.day).toBe(95)
    expect(save.history).toHaveLength(1)
  })

  it('undo updates the save in localStorage', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(2, 3, 10, 5)
    store.undo()
    const save = JSON.parse(localStorage.getItem('zutomayo-card-save'))
    expect(save.timePosition).toBe(0)
    expect(save.history).toHaveLength(0)
    expect(save.future).toHaveLength(1)
  })

  it('redo updates the save in localStorage', () => {
    const store = useGameStore()
    store.startGame()
    store.resolveTurn(2, 3, 10, 5)
    store.undo()
    store.redo()
    const save = JSON.parse(localStorage.getItem('zutomayo-card-save'))
    expect(save.timePosition).toBe(5)
    expect(save.future).toHaveLength(0)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/kiti/learn/ztmycard && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: 4 new failures about localStorage containing null or wrong values

- [ ] **Step 3: Add persist(this) to startGame, resolveTurn, undo, redo**

In `src/stores/game.js`, update the four actions:

`startGame()` — add `persist(this)` as the last line:
```js
startGame() {
  Object.assign(this, structuredClone(INITIAL_STATE))
  this.started = true
  this.history = []
  this.future = []
  persist(this)
},
```

`resolveTurn()` — add `persist(this)` before `return result`:
```js
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
  persist(this)
  return result
},
```

`undo()` — add `persist(this)` at the end:
```js
undo() {
  if (!this.canUndo) return
  this.future.push(snapshot(this))
  Object.assign(this, this.history.pop())
  persist(this)
},
```

`redo()` — add `persist(this)` at the end:
```js
redo() {
  if (!this.canRedo) return
  this.history.push(snapshot(this))
  Object.assign(this, this.future.pop())
  persist(this)
},
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/kiti/learn/ztmycard && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
cd /home/kiti/learn/ztmycard && git add src/stores/game.js tests/game.store.test.js && git commit -m "feat: persist state after every mutating action"
```

---

### Task 3: Auto-resume on app mount (App.vue)

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Add onMounted to App.vue**

Replace the `<script setup>` block in `src/App.vue` with:

```vue
<script setup>
import { onMounted } from 'vue'
import { useGameStore } from './stores/game'
import GameSetup from './components/GameSetup.vue'
import GameBoard from './components/GameBoard.vue'
import GameOver from './components/GameOver.vue'

const store = useGameStore()
onMounted(() => store.loadGame())
</script>
```

- [ ] **Step 2: Verify manually in browser**

```bash
cd /home/kiti/learn/ztmycard && npm run dev
```

Open `http://localhost:5173` and verify:

1. First visit (no save): GameSetup screen shows. Click "New Game" → GameBoard shows. Check DevTools → Application → Local Storage → key `zutomayo-card-save` exists.
2. Resolve a turn. Reload the page → GameBoard resumes at the same turn/HP/time.
3. Undo a turn. Reload → board resumes with undo still available.

- [ ] **Step 3: Commit**

```bash
cd /home/kiti/learn/ztmycard && git add src/App.vue && git commit -m "feat: auto-resume game from localStorage on mount"
```

---

### Task 4: New Game button on GameBoard with confirmation

**Files:**
- Modify: `src/components/GameBoard.vue`

- [ ] **Step 1: Add the button and handler**

In `src/components/GameBoard.vue`, add a `newGame` function and a button inside `.turn-area`.

Replace the `<script setup>` block:

```vue
<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import PlayerPanel from './PlayerPanel.vue'
import TimeWheel from './TimeWheel.vue'
import TurnModal from './TurnModal.vue'

const store = useGameStore()
const showModal = ref(false)

function newGame() {
  if (window.confirm('เริ่มเกมใหม่? ข้อมูลทั้งหมดจะหายไป')) {
    store.startGame()
  }
}
</script>
```

In the template, inside `.turn-area` add the button above the existing `START TURN` button:

```html
<div class="turn-area">
  <div class="turn-info">Turn {{ store.turnNumber }}</div>
  <button class="btn-start-turn" @click="showModal = true">START TURN</button>
  <button class="btn-new-game" @click="newGame">New Game</button>
</div>
```

Add the style at the bottom of the `<style scoped>` block:

```css
.btn-new-game {
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-family: var(--font-display);
  letter-spacing: 0.05em;
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}
.btn-new-game:hover { color: var(--text); border-color: var(--text-muted); }
```

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
cd /home/kiti/learn/ztmycard && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: all tests pass

- [ ] **Step 3: Verify manually in browser**

1. Start a game, resolve a few turns.
2. Click "New Game" → browser confirm dialog appears.
3. Cancel → game continues as-is.
4. Click "New Game" again → confirm → GameBoard resets to turn 1, HP 100/100.
5. Reload → the fresh game auto-resumes (not the old one).

- [ ] **Step 4: Commit**

```bash
cd /home/kiti/learn/ztmycard && git add src/components/GameBoard.vue && git commit -m "feat: add confirmed New Game button to game board"
```
