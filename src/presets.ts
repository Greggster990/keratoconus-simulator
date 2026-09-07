export type ShapeMode = 'linear' | 'scattershot' | 'ring'

export type GhostParams = {
  mix: number
  ghostCount: number
  separation: number
  angle: number
  fade: number
  softness: number
  contrast: number
  curve: number
  scatter: number
  shapeMode: ShapeMode
  overallBlur: number
  edgeBlur: number
  streakLength: number
  streakAmount: number
  streakReflect: boolean
}

export type PresetId = 'mild' | 'stacked' | 'everyday' | 'scattered' | 'smear' | 'severe' | 'ring' | 'night-streaks'

const GHOST_KEYS = [
  'mix',
  'ghostCount',
  'separation',
  'fade',
  'softness',
  'contrast',
  'curve',
  'scatter',
] as const

export const MILD: GhostParams = {
  mix: 0.5,
  ghostCount: 1,
  separation: 1.3,
  angle: 255,
  fade: 0.44,
  softness: 0.9,
  contrast: 0.8,
  curve: 0.18,
  scatter: 0.12,
  shapeMode: 'linear',
  overallBlur: 0.3,
  edgeBlur: 0.6,
  streakLength: 0,
  streakAmount: 0.8,
  streakReflect: false,
}

/** Classic discrete polyopia. */
export const STACKED: GhostParams = {
  mix: 0.85,
  ghostCount: 3,
  separation: 2.2,
  angle: 255,
  fade: 0.55,
  softness: 1.5,
  contrast: 0.8,
  curve: 0.5,
  scatter: 0.35,
  shapeMode: 'linear',
  overallBlur: 0.6,
  edgeBlur: 1.5,
  streakLength: 0,
  streakAmount: 0.8,
  streakReflect: false,
}

/** Lived-in look from the author's settings. */
export const EVERYDAY: GhostParams = {
  mix: 0.99,
  ghostCount: 5,
  separation: 2.1,
  angle: 265,
  fade: 0.62,
  softness: 5.0,
  contrast: 0.19,
  curve: 0.5,
  scatter: 0.65,
  shapeMode: 'linear',
  overallBlur: 1.8,
  edgeBlur: 1.7,
  streakLength: 0,
  streakAmount: 0.8,
  streakReflect: false,
}

export const SCATTERED: GhostParams = {
  mix: 0.9,
  ghostCount: 6,
  separation: 2.5,
  angle: 248,
  fade: 0.58,
  softness: 2.4,
  contrast: 0.45,
  curve: 1.05,
  scatter: 1.25,
  shapeMode: 'scattershot',
  overallBlur: 0.7,
  edgeBlur: 1.3,
  streakLength: 0,
  streakAmount: 0.8,
  streakReflect: false,
}

export const SMEAR: GhostParams = {
  mix: 0.92,
  ghostCount: 3,
  separation: 1.5,
  angle: 260,
  fade: 0.7,
  softness: 6.8,
  contrast: 0.32,
  curve: 0.3,
  scatter: 0.4,
  shapeMode: 'linear',
  overallBlur: 1.1,
  edgeBlur: 0.9,
  streakLength: 0,
  streakAmount: 0.8,
  streakReflect: false,
}

export const SEVERE: GhostParams = {
  mix: 0.98,
  ghostCount: 8,
  separation: 3.7,
  angle: 255,
  fade: 0.68,
  softness: 3.2,
  contrast: 0.4,
  curve: 0.9,
  scatter: 0.8,
  shapeMode: 'linear',
  overallBlur: 1.4,
  edgeBlur: 2.5,
  streakLength: 0,
  streakAmount: 0.8,
  streakReflect: false,
}

/** Paired ghosts around a clear oval, especially visible on the small Moon. */
export const RING: GhostParams = {
  ...EVERYDAY,
  mix: 1,
  ghostCount: 7,
  separation: 4.5,
  angle: 270,
  fade: 0.78,
  softness: 0.6,
  contrast: 0.5,
  curve: 0,
  scatter: 1,
  shapeMode: 'ring',
  overallBlur: 0,
  edgeBlur: 0,
}

/** Long light tails for the nighttime intersection and city samples. */
export const NIGHT_STREAKS: GhostParams = {
  ...MILD,
  mix: 0.35,
  ghostCount: 2,
  separation: 1,
  angle: 250,
  fade: 0.5,
  softness: 0.8,
  curve: 0,
  scatter: 0.1,
  overallBlur: 0.2,
  edgeBlur: 0.3,
  streakLength: 18,
  streakAmount: 0.9,
  streakReflect: true,
}

export const PRESETS: { id: PresetId; label: string; params: GhostParams }[] = [
  { id: 'mild', label: 'Mild', params: MILD },
  { id: 'stacked', label: 'Stacked', params: STACKED },
  { id: 'everyday', label: 'Everyday', params: EVERYDAY },
  { id: 'scattered', label: 'Scattered', params: SCATTERED },
  { id: 'smear', label: 'Soft smear', params: SMEAR },
  { id: 'severe', label: 'Severe', params: SEVERE },
  { id: 'ring', label: 'Ring', params: RING },
  { id: 'night-streaks', label: 'Night streaks', params: NIGHT_STREAKS },
]

type GhostPhase = {
  t: number
  ghost: Pick<GhostParams, (typeof GHOST_KEYS)[number]>
}

const PHASES: GhostPhase[] = [
  {
    t: 0,
    ghost: {
      mix: 0.2,
      ghostCount: 1,
      separation: 0.7,
      fade: 0.35,
      softness: 0.5,
      contrast: 0.88,
      curve: 0.05,
      scatter: 0.05,
    },
  },
  {
    t: 0.22,
    ghost: {
      mix: 0.5,
      ghostCount: 1,
      separation: 1.3,
      fade: 0.44,
      softness: 0.9,
      contrast: 0.8,
      curve: 0.18,
      scatter: 0.12,
    },
  },
  {
    t: 0.42,
    ghost: {
      mix: 0.82,
      ghostCount: 3,
      separation: 2.0,
      fade: 0.54,
      softness: 1.6,
      contrast: 0.7,
      curve: 0.4,
      scatter: 0.32,
    },
  },
  {
    t: 0.62,
    ghost: {
      mix: 0.95,
      ghostCount: 5,
      separation: 2.1,
      fade: 0.6,
      softness: 4.2,
      contrast: 0.28,
      curve: 0.5,
      scatter: 0.58,
    },
  },
  {
    t: 0.82,
    ghost: {
      mix: 0.98,
      ghostCount: 7,
      separation: 2.9,
      fade: 0.64,
      softness: 5.4,
      contrast: 0.22,
      curve: 0.7,
      scatter: 0.9,
    },
  },
  {
    t: 1,
    ghost: {
      mix: 0.99,
      ghostCount: 9,
      separation: 3.8,
      fade: 0.68,
      softness: 6.2,
      contrast: 0.18,
      curve: 0.9,
      scatter: 1.2,
    },
  },
]

export function cloneParams(params: GhostParams): GhostParams {
  return { ...params }
}

export function applyGhostPhase(phase: number, current: GhostParams): GhostParams {
  const t = clamp(phase, 0, 1)
  let lo = PHASES[0]
  let hi = PHASES[PHASES.length - 1]
  for (let i = 0; i < PHASES.length - 1; i++) {
    if (t >= PHASES[i].t && t <= PHASES[i + 1].t) {
      lo = PHASES[i]
      hi = PHASES[i + 1]
      break
    }
  }
  const span = hi.t - lo.t
  const u = span <= 1e-6 ? 0 : (t - lo.t) / span
  return {
    ...current,
    mix: lerp(lo.ghost.mix, hi.ghost.mix, u),
    ghostCount: Math.round(lerp(lo.ghost.ghostCount, hi.ghost.ghostCount, u)),
    separation: lerp(lo.ghost.separation, hi.ghost.separation, u),
    fade: lerp(lo.ghost.fade, hi.ghost.fade, u),
    softness: lerp(lo.ghost.softness, hi.ghost.softness, u),
    contrast: lerp(lo.ghost.contrast, hi.ghost.contrast, u),
    curve: lerp(lo.ghost.curve, hi.ghost.curve, u),
    scatter: lerp(lo.ghost.scatter, hi.ghost.scatter, u),
  }
}

export function ghostPhaseLabel(phase: number): string {
  return `${Math.round(clamp(phase, 0, 1) * 100)} / 100`
}

export function nearestGhostPhase(params: GhostParams): number {
  let bestT = PHASES[0].t
  let bestDist = Number.POSITIVE_INFINITY
  for (const step of PHASES) {
    const dist = ghostDistance(params, step.ghost)
    if (dist < bestDist) {
      bestDist = dist
      bestT = step.t
    }
  }
  return bestT
}

function ghostDistance(params: GhostParams, ghost: GhostPhase['ghost']): number {
  let sum = 0
  sum += ((params.mix - ghost.mix) / 1) ** 2
  sum += ((params.ghostCount - ghost.ghostCount) / 9) ** 2
  sum += ((params.separation - ghost.separation) / 8) ** 2
  sum += ((params.fade - ghost.fade) / 0.6) ** 2
  sum += ((params.softness - ghost.softness) / 8) ** 2
  sum += ((params.contrast - ghost.contrast) / 1) ** 2
  sum += ((params.curve - ghost.curve) / 4) ** 2
  sum += ((params.scatter - ghost.scatter) / 2) ** 2
  return sum
}

export function paramsEqual(a: GhostParams, b: GhostParams): boolean {
  return (
    near(a.mix, b.mix) &&
    a.ghostCount === b.ghostCount &&
    near(a.separation, b.separation) &&
    near(a.angle, b.angle) &&
    near(a.fade, b.fade) &&
    near(a.softness, b.softness) &&
    near(a.contrast, b.contrast) &&
    near(a.curve, b.curve) &&
    near(a.scatter, b.scatter) &&
    a.shapeMode === b.shapeMode &&
    near(a.overallBlur, b.overallBlur) &&
    near(a.edgeBlur, b.edgeBlur) &&
    near(a.streakLength, b.streakLength) &&
    near(a.streakAmount, b.streakAmount) &&
    a.streakReflect === b.streakReflect
  )
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.051
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function paramsToQuery(params: GhostParams): string {
  const q = new URLSearchParams()
  q.set('m', params.mix.toFixed(2))
  q.set('c', String(params.ghostCount))
  q.set('s', params.separation.toFixed(1))
  q.set('a', String(Math.round(params.angle)))
  q.set('f', params.fade.toFixed(2))
  q.set('o', params.softness.toFixed(1))
  q.set('k', params.contrast.toFixed(2))
  q.set('r', params.curve.toFixed(2))
  q.set('j', params.scatter.toFixed(2))
  q.set('sh', params.shapeMode === 'ring' ? '2' : params.shapeMode === 'scattershot' ? '1' : '0')
  q.set('ob', params.overallBlur.toFixed(1))
  q.set('eb', params.edgeBlur.toFixed(1))
  q.set('sk', params.streakLength.toFixed(1))
  q.set('sa', params.streakAmount.toFixed(2))
  q.set('sr', params.streakReflect ? '1' : '0')
  return q.toString()
}

export function paramsFromQuery(search: string): GhostParams | null {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (!q.has('m') && !q.has('c') && !q.has('s')) {
    return null
  }
  const base = cloneParams(EVERYDAY)
  return {
    mix: q.has('m') ? clamp(Number(q.get('m')), 0, 1) : base.mix,
    ghostCount: q.has('c') ? Math.round(clamp(Number(q.get('c')), 1, 10)) : base.ghostCount,
    separation: q.has('s') ? clamp(Number(q.get('s')), 0, 8) : base.separation,
    angle: q.has('a') ? clamp(Number(q.get('a')), 0, 360) : base.angle,
    fade: q.has('f') ? clamp(Number(q.get('f')), 0.25, 0.85) : base.fade,
    softness: q.has('o') ? clamp(Number(q.get('o')), 0, 8) : base.softness,
    contrast: q.has('k') ? clamp(Number(q.get('k')), 0, 1) : base.contrast,
    curve: q.has('r') ? clamp(Number(q.get('r')), -2, 2) : base.curve,
    scatter: q.has('j') ? clamp(Number(q.get('j')), 0, 2) : base.scatter,
    shapeMode: q.get('sh') === '2' ? 'ring' : q.get('sh') === '1' ? 'scattershot' : 'linear',
    overallBlur: q.has('ob') ? clamp(Number(q.get('ob')), 0, 12) : base.overallBlur,
    edgeBlur: q.has('eb') ? clamp(Number(q.get('eb')), 0, 12) : base.edgeBlur,
    streakLength: q.has('sk') ? clamp(Number(q.get('sk')), 0, 100) : base.streakLength,
    streakAmount: q.has('sa') ? clamp(Number(q.get('sa')), 0, 1) : base.streakAmount,
    streakReflect: q.has('sr') ? q.get('sr') === '1' : base.streakReflect,
  }
}

export function matchingPreset(params: GhostParams): PresetId | null {
  for (const preset of PRESETS) {
    if (paramsEqual(params, preset.params)) {
      return preset.id
    }
  }
  return null
}
