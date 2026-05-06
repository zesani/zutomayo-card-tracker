# Zutomayo Card Game Tracker — Design Spec

**Date:** 2026-05-05
**Tech Stack:** Vue 3 + Vite + Pinia
**Target:** Mobile-first web app

---

## Overview

A mobile-first web application to replace the physical Zutomayo Card game board for players who do not own one. The app tracks HP and the time wheel for both players, and assists with turn resolution (time advancement, phase detection, combat calculation, and card limit reminders).

---

## Players

| Identifier | Display Name |
|---|---|
| Player 1 | Player Night 🌙 |
| Player 2 | Player Day ☀️ |

---

## Game State

| Field | Type | Initial Value | Description |
|---|---|---|---|
| `timePosition` | number (0–17) | 0 | Current position on the time wheel. 0 = Midnight. |
| `phase` | "night" \| "day" | "night" | Derived from timePosition: 0–8 = night, 9–17 = day. |
| `hp.night` | number (0–100) | 100 | Player Night's HP. |
| `hp.day` | number (0–100) | 100 | Player Day's HP. |
| `cardLimit.night` | number (1–2) | 2 | Cards Player Night may play next turn. |
| `cardLimit.day` | number (1–2) | 2 | Cards Player Day may play next turn. |
| `turnNumber` | number | 1 | Current turn counter. |
| `history` | GameState[] | [] | Undo stack — snapshot saved before every action. |
| `future` | GameState[] | [] | Redo stack — cleared on any new action. |

---

## Time Wheel

- 18 positions total: 0 (Midnight) → 17, then wraps back to 0.
- Advances **clockwise** each turn by the **sum of time points** from all cards played by both players.
- Positions 0–8: **Night phase** 🌙
- Positions 9–17: **Day phase** ☀️
- Advancement formula: `newPosition = (timePosition + totalTimePoints) % 18`

---

## Turn Flow

Each turn proceeds through 4 sequential steps inside a bottom-sheet modal:

### Step 1 — Time Input
- Player Night enters total time points from their cards (1–2 cards, each 1–6+ points).
- Player Day enters total time points from their cards.
- App sums both values and advances `timePosition`.

### Step 2 — Phase Reveal
- App displays the new `timePosition` and the resulting phase (Night 🌙 or Day ☀️).
- Phase affects character attack power — displayed as a reminder for players to apply modifiers before proceeding.
- Players press **Continue** to proceed.

### Step 3 — Attack Input
- Player Night enters their total attack power (after applying phase modifiers from cards).
- Player Day enters their total attack power.

### Step 4 — Result
- App calculates `damage = |attackNight - attackDay|`.
- The player with the lower attack value loses `damage` HP.
- If attack values are equal: no HP change (draw).
- HP floor is 0 — cannot go below 0.
- If either player's HP reaches 0: game ends immediately (see Game Over).
- **Card limit for next turn** is displayed prominently:

| Combat outcome | Winner cards | Loser cards |
|---|---|---|
| One player wins | 1 card | 2 cards |
| Draw | 1 card each | 1 card each |

- Player presses **End Turn** to confirm and return to the main board.

---

## Undo / Redo

- Before every state-changing action (time advance, combat resolve, new game reset), a full snapshot of `GameState` is pushed to `history`.
- **Undo**: pops from `history`, pushes current state to `future`, restores popped state.
- **Redo**: pops from `future`, pushes current state to `history`, restores popped state.
- Any new action clears `future`.
- No limit on undo depth — players may undo back to the start of the game.
- Undo/Redo buttons are always visible on the main board screen.

---

## Game Over

- Triggered when either player's HP reaches 0 after combat resolution.
- A `GameOver.vue` screen replaces the board, displaying the winner.
- A **New Game** button resets all state to initial values and clears history/future stacks.

---

## UI Layout (Mobile-First)

```
┌─────────────────────────┐
│  Player Night 🌙   HP   │
│  ░░░░░░░░░░░░░░░░  85   │  ← HP bar + number
│  Cards next turn: 2     │
├─────────────────────────┤
│       🌙 NIGHT          │  ← Current phase
│   Time Position: 3/18   │  ← Wheel position
│   [Undo]       [Redo]   │
├─────────────────────────┤
│  Player Day ☀️     HP   │
│  ░░░░░░░░░░░░░░░░  70   │  ← HP bar + number
│  Cards next turn: 1     │
└─────────────────────────┘
        [START TURN]
```

Turn steps are shown inside a **bottom-sheet modal** that guides players through steps 1–4 sequentially. A **Back** button on each step allows navigation to the previous step within the same turn.

---

## Component Tree

```
App.vue
├── GameSetup.vue          ← New game / reset screen
├── GameBoard.vue          ← Main board (always visible during play)
│   ├── PlayerPanel.vue    ← HP bar + name + card limit (reused for both players)
│   ├── TimeTracker.vue    ← Phase icon + position display
│   └── TurnModal.vue      ← Bottom-sheet turn wizard
│       ├── Step1Time.vue  ← Time point inputs
│       ├── Step2Phase.vue ← Phase reveal
│       ├── Step3Attack.vue← Attack power inputs
│       └── Step4Result.vue← Damage result + card limit reminder
└── GameOver.vue           ← Winner screen + new game button
```

---

## State Management (Pinia)

**Store:** `useGameStore`

**State:** as defined in Game State table above.

**Actions:**
| Action | Description |
|---|---|
| `startGame()` | Reset all state, clear history/future. |
| `advanceTime(nightPoints, dayPoints)` | Snapshot → compute new position and phase. |
| `resolveCombat(nightAttack, dayAttack)` | Snapshot → apply damage, update card limits, check win. |
| `undo()` | Restore previous snapshot. |
| `redo()` | Restore next snapshot (if available). |

**Getters:**
| Getter | Returns |
|---|---|
| `phase` | `"night"` if timePosition 0–8, else `"day"` |
| `isGameOver` | `true` if `hp.night === 0 \|\| hp.day === 0` |
| `canUndo` | `history.length > 0` |
| `canRedo` | `future.length > 0` |

---

## Out of Scope

- Network multiplayer (each player uses the same device)
- Card database or card lookup
- Game history log / export
- Animations (can be added later)
