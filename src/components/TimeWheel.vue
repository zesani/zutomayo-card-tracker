<script>
let _uid = 0
</script>

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

function posToXY(pos, r) {
  const rad = posToAngleDeg(pos) * Math.PI / 180
  const dist = r ?? 78
  return [100 + dist * Math.cos(rad), 100 + dist * Math.sin(rad)]
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
  if (props.previewPosition === null || props.previewPosition === displayPos.value) return null
  const [px, py] = posToXY(props.previewPosition, 77)
  const isNight = getPhase(props.previewPosition) === 'night'
  return { px, py, color: isNight ? '#b4a7f0' : '#f0a040' }
})

// Tick marks every 20 degrees around the outer ring
const tickMarks = computed(() => {
  const marks = []
  for (let i = 0; i < 18; i++) {
    const rad = (270 + i * 20) * Math.PI / 180
    const inner = 89
    const outer = i % 3 === 0 ? 96 : (i % 3 === 1 ? 93 : 91)
    marks.push({
      x1: 100 + inner * Math.cos(rad), y1: 100 + inner * Math.sin(rad),
      x2: 100 + outer * Math.cos(rad), y2: 100 + outer * Math.sin(rad),
      major: i % 3 === 0,
    })
  }
  return marks
})

// Constellation lines connecting night positions in order
const constellationLines = computed(() => {
  const order = [4, 3, 2, 1, 0, 17, 16, 15, 14]
  const pts = order.map(p => posToXY(p, 77))
  return pts
})

const nightPositions = computed(() =>
  NIGHT_POSITIONS.map((pos) => {
    const [px, py] = posToXY(pos, 78)
    const isCur = pos === displayPos.value
    const rO = isCur ? 8.5 : 6
    return {
      pos, px, py, isCur, rO,
      rI: rO * 0.76, offX: rO * 0.38, offY: -rO * 0.08,
      color: isCur ? '#c4b5fd' : (pos === 0 ? '#8b7cf0' : '#5b3cc4'),
    }
  })
)

const dayPositions = computed(() =>
  DAY_POSITIONS.map((pos, idx) => {
    const [px, py] = posToXY(pos, 78)
    const isCur = pos === displayPos.value
    const nRays = DAY_RAYS[idx]
    const rInner = isCur ? 4.6 : 3.5
    const rOuter = isCur ? 9 : (nRays === 8 ? 8 : 6.5)
    return {
      pos, px, py, isCur, nRays, rOuter,
      rCircle: isCur ? 3.2 : 2.4,
      raysPath: sunRaysPath(px, py, nRays, rInner, rOuter),
      color: isCur ? '#fcd34d' : (nRays === 8 ? '#f0a040' : '#d97706'),
    }
  })
)
</script>

<template>
  <div class="time-wheel">
    <svg viewBox="0 0 200 200" class="wheel-svg">
      <defs>
        <radialGradient :id="`tw-bg-${uid}`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#12123a" stop-opacity="0.5"/>
          <stop offset="85%" stop-color="#0a0a1e" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#06060f"/>
        </radialGradient>
        <radialGradient :id="`tw-night-zone-${uid}`" cx="50%" cy="30%" r="55%">
          <stop offset="0%" stop-color="#180b3a" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#0a0a24" stop-opacity="0.85"/>
        </radialGradient>
        <radialGradient :id="`tw-day-zone-${uid}`" cx="50%" cy="70%" r="55%">
          <stop offset="0%" stop-color="#1e0e00" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#0a0a1e" stop-opacity="0.95"/>
        </radialGradient>
        <filter :id="`tw-glow-${uid}`" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter :id="`tw-glow-strong-${uid}`" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath :id="`tw-clip-top-${uid}`"><rect x="0" y="0" width="200" height="100"/></clipPath>
        <clipPath :id="`tw-clip-bot-${uid}`"><rect x="0" y="100" width="200" height="100"/></clipPath>
        <mask v-for="m in nightPositions" :key="m.pos"
          :id="`tw-moon-${uid}-${m.pos}`" maskUnits="userSpaceOnUse">
          <circle :cx="m.px" :cy="m.py" :r="m.rO" fill="white"/>
          <circle :cx="m.px + m.offX" :cy="m.py + m.offY" :r="m.rI" fill="black"/>
        </mask>
      </defs>

      <!-- Background disc -->
      <circle cx="100" cy="100" r="98" :fill="`url(#tw-bg-${uid})`" stroke="#16163a" stroke-width="0.5"/>

      <!-- Zone backgrounds -->
      <circle cx="100" cy="100" r="95" :clip-path="`url(#tw-clip-top-${uid})`" :fill="`url(#tw-night-zone-${uid})`"/>
      <circle cx="100" cy="100" r="95" :clip-path="`url(#tw-clip-bot-${uid})`" :fill="`url(#tw-day-zone-${uid})`"/>

      <!-- Orbit rings -->
      <circle cx="100" cy="100" r="86" fill="none" stroke="#1a1a4a" stroke-width="0.5" stroke-dasharray="1 4"/>
      <circle cx="100" cy="100" r="77" fill="none" stroke="#1e1e50" stroke-width="1"/>
      <circle cx="100" cy="100" r="68" fill="none" stroke="#16163a" stroke-width="0.4" stroke-dasharray="2 6"/>

      <!-- Outer ring with tick marks -->
      <circle cx="100" cy="100" r="97" fill="none" stroke="#1e1e55" stroke-width="1.5"/>
      <line v-for="(t, i) in tickMarks" :key="`t${i}`"
        :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2"
        :stroke="t.major ? '#3d3d78' : '#25255a'"
        :stroke-width="t.major ? 1.2 : 0.6"/>

      <!-- Horizon line -->
      <line x1="3" y1="100" x2="197" y2="100" stroke="#2d2d6a" stroke-width="0.8" stroke-dasharray="3 6"/>

      <!-- Constellation lines in night zone -->
      <polyline
        :points="constellationLines.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')"
        fill="none" stroke="#3d2d7a" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.5"/>

      <!-- Night dots (crescent moon via SVG mask) -->
      <g v-for="m in nightPositions" :key="`n${m.pos}`">
        <circle v-if="m.isCur" :cx="m.px" :cy="m.py" :r="m.rO + 3"
          fill="none" stroke="#b4a7f0" stroke-width="1.5" opacity="0.6"/>
        <circle v-if="m.isCur" :cx="m.px" :cy="m.py" :r="m.rO + 1.5"
          fill="none" stroke="#c4b5fd" stroke-width="1" opacity="0.35">
          <animate attributeName="r" :values="`${m.rO + 1};${m.rO + 2.5};${m.rO + 1}`" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.35;0.15;0.35" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle :cx="m.px" :cy="m.py" :r="m.rO" :fill="m.color"
          :mask="`url(#tw-moon-${uid}-${m.pos})`"
          :filter="m.isCur ? `url(#tw-glow-strong-${uid})` : undefined"/>
      </g>

      <!-- Day dots (sun with rays) -->
      <g v-for="d in dayPositions" :key="`d${d.pos}`">
        <circle v-if="d.isCur" :cx="d.px" :cy="d.py" :r="d.rOuter + 3"
          fill="none" stroke="#f0a040" stroke-width="1.5" opacity="0.6"/>
        <circle v-if="d.isCur" :cx="d.px" :cy="d.py" :r="d.rOuter + 1.5"
          fill="none" stroke="#fcd34d" stroke-width="1" opacity="0.35">
          <animate attributeName="r" :values="`${d.rOuter + 1};${d.rOuter + 2.5};${d.rOuter + 1}`" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.35;0.15;0.35" dur="3s" repeatCount="indefinite"/>
        </circle>
        <path :d="d.raysPath" :fill="d.color"/>
        <circle :cx="d.px" :cy="d.py" :r="d.rCircle" :fill="d.color"/>
      </g>

      <!-- Preview ring -->
      <circle v-if="previewMarker" class="preview-ring"
        :cx="previewMarker.px" :cy="previewMarker.py" r="11"
        fill="none" :stroke="previewMarker.color" stroke-width="2"
        stroke-dasharray="4 3">
        <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.5s" repeatCount="indefinite"/>
      </circle>

      <!-- Center hub -->
      <circle cx="100" cy="100" r="18" fill="#0d0d24" stroke="#1e1e50" stroke-width="1"/>
      <circle cx="100" cy="100" r="15" fill="none" stroke="#25255a" stroke-width="0.5"/>

    </svg>

    <div v-if="showControls" class="undo-redo-row">
      <button class="btn-home" @click="store.goHome()">Home</button>
      <button class="btn-undo-redo btn-undo" :disabled="!store.canUndo" @click="store.undo()">↺</button>
      <span class="turn-label">Turn {{ store.turnNumber }}</span>
      <button class="btn-undo-redo btn-redo" :disabled="!store.canRedo" @click="store.redo()">↻</button>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.time-wheel { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; height: 100%; }
.wheel-svg { flex: 1; min-height: 0; width: auto; max-width: 100%; overflow: visible; }
.undo-redo-row { display: flex; align-items: center; justify-content: center; gap: 0.75rem; flex-shrink: 0; padding: 0.4rem 0; position: relative; width: 100%; }
.turn-label { min-width: 4.5rem; text-align: center; font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-display); letter-spacing: 0.06em; text-transform: uppercase; }
.btn-home {
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 0 0.75rem;
  height: 2.4rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  position: absolute;
  left: 0;
  transition: all 0.2s ease;
}
.btn-home:hover { color: var(--text); border-color: var(--text-muted); }
.btn-undo-redo {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 0.85rem;
  padding: 0.4rem 0.9rem;
  height: 2.4rem;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  transition: all 0.2s ease;
}
.btn-undo-redo:not(:disabled):hover { background: var(--accent); border-color: var(--accent); color: white; }

@media (max-height: 319px) {
  .time-wheel { flex-direction: row; align-items: center; }
  .undo-redo-row { display: contents; }
  .wheel-svg { order: 2; flex: 1; height: 100%; }
  .btn-undo { order: 1; flex-shrink: 0; }
  .btn-redo { order: 3; flex-shrink: 0; }
}
.preview-ring { will-change: stroke-dashoffset; }
</style>
