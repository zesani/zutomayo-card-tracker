# LocalStorage Persistence Design

**Date:** 2026-05-07  
**Project:** Zutomayo Card Tracker  
**Status:** Approved

## Goal

Persist full game state (including undo/redo history) to localStorage so that an accidental page reload does not lose progress. On load, the app auto-resumes the last game. The player can explicitly start a new game with a confirmation step.

## localStorage Structure

Single key: `zutomayo-card-save`

```json
{
  "timePosition": 3,
  "hp": { "night": 80, "day": 100 },
  "cardLimit": { "night": 1, "day": 2 },
  "turnNumber": 5,
  "started": true,
  "history": [ ...snapshots ],
  "future": [ ...snapshots ]
}
```

- All fields from `game.js` store state are saved, including `history` and `future` arrays.
- A save with `started === false` is treated as "no active game" and ignored on load.

## Store Changes (`src/stores/game.js`)

### New module-level helpers

```js
function persist(state) {
  localStorage.setItem('zutomayo-card-save', JSON.stringify({
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
    const raw = localStorage.getItem('zutomayo-card-save')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
```

### Modified actions

- **`startGame()`** — checks for a saved game with `started === true`. If found, loads it (auto-resume). If not, resets to `INITIAL_STATE` as before.
- **`resolveTurn()`** — calls `persist(this)` after mutating state.
- **`undo()`** — calls `persist(this)` after mutating state.
- **`redo()`** — calls `persist(this)` after mutating state.

### New action: `newGame()`

Clears localStorage key and resets store to `INITIAL_STATE` with `started = false`. Used by the explicit "New Game" flow.

## Auto-resume Flow

`App.vue` calls `store.startGame()` in `onMounted`. The action checks localStorage internally:

- **Save exists and `started === true`** → restore all fields → `GameBoard` renders immediately.
- **No save or `started === false`** → `GameSetup` renders as before.

No changes needed to `App.vue` template or routing logic.

## New Game Confirmation (`GameBoard.vue`)

- Add a "New Game" button (small, secondary style) near the turn info area.
- On click: `window.confirm("เริ่มเกมใหม่? ข้อมูลทั้งหมดจะหายไป")`.
- If confirmed: call `store.newGame()` → store resets → `GameSetup` renders.
- If cancelled: do nothing.

## Files to Change

| File | Change |
|------|--------|
| `src/stores/game.js` | Add `persist()`, `loadSave()`, `newGame()`, update `startGame/resolveTurn/undo/redo` |
| `src/App.vue` | Add `onMounted` call to `store.startGame()` |
| `src/components/GameBoard.vue` | Add "New Game" button with confirm dialog |

## Out of Scope

- Multiple save slots
- Export/import save data
- Save compression
