import type { GhostParams, PresetId, ShapeMode } from './presets'
import { ghostPhaseLabel, matchingPreset, nearestGhostPhase } from './presets'

export type SliderEls = {
  mix: HTMLInputElement
  count: HTMLInputElement
  sep: HTMLInputElement
  angle: HTMLInputElement
  fade: HTMLInputElement
  soft: HTMLInputElement
  contrast: HTMLInputElement
  curve: HTMLInputElement
  scatter: HTMLInputElement
  overallBlur: HTMLInputElement
  edgeBlur: HTMLInputElement
}

export function readParams(els: SliderEls, current: GhostParams): GhostParams {
  return {
    mix: Number(els.mix.value),
    ghostCount: Number(els.count.value),
    separation: Number(els.sep.value),
    angle: Number(els.angle.value),
    fade: Number(els.fade.value),
    softness: Number(els.soft.value),
    contrast: Number(els.contrast.value),
    curve: Number(els.curve.value),
    scatter: Number(els.scatter.value),
    shapeMode: current.shapeMode,
    overallBlur: Number(els.overallBlur.value),
    edgeBlur: Number(els.edgeBlur.value),
  }
}

export function writeParams(els: SliderEls, params: GhostParams): void {
  els.mix.value = String(params.mix)
  els.count.value = String(params.ghostCount)
  els.sep.value = String(params.separation)
  els.angle.value = String(params.angle)
  els.fade.value = String(params.fade)
  els.soft.value = String(params.softness)
  els.contrast.value = String(params.contrast)
  els.curve.value = String(params.curve)
  els.scatter.value = String(params.scatter)
  els.overallBlur.value = String(params.overallBlur)
  els.edgeBlur.value = String(params.edgeBlur)
}

export function renderReadouts(params: GhostParams): void {
  setText('out-mix', params.mix.toFixed(2))
  setText('out-count', String(params.ghostCount))
  setText('out-sep', `${params.separation.toFixed(1)}%`)
  setText('out-angle', `${Math.round(params.angle)}°`)
  setText('out-fade', params.fade.toFixed(2))
  setText('out-soft', params.softness.toFixed(1))
  setText('out-contrast', params.contrast.toFixed(2))
  setText('out-curve', params.curve.toFixed(2))
  setText('out-scatter', params.scatter.toFixed(2))
  setText('out-overall-blur', params.overallBlur.toFixed(1))
  setText('out-edge-blur', params.edgeBlur.toFixed(1))
}

export function syncPhaseSlider(input: HTMLInputElement, params: GhostParams): void {
  const phase = nearestGhostPhase(params)
  input.value = String(phase)
  setText('out-phase', ghostPhaseLabel(phase))
}

export function markPreset(active: PresetId | null): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
    const id = button.dataset.preset
    button.setAttribute('aria-pressed', id === active ? 'true' : 'false')
  }
}

export function syncPresetButtons(params: GhostParams): void {
  markPreset(matchingPreset(params))
}

export function syncShapeSwitch(mode: ShapeMode): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-shape]')) {
    const shape = button.getAttribute('data-shape')
    button.setAttribute('aria-pressed', shape === mode ? 'true' : 'false')
  }
}

export function setStatus(message: string, kind: 'info' | 'error' = 'info'): void {
  const el = document.getElementById('status')
  if (!el) {
    return
  }
  el.textContent = message
  el.dataset.kind = message ? kind : ''
}

function setText(id: string, value: string): void {
  const el = document.getElementById(id)
  if (el) {
    el.textContent = value
  }
}
