import './styles.css'
import { bindHelp } from './help'
import { loadImageFile } from './imageLoader'
import {
  EVERYDAY,
  PRESETS,
  applyGhostPhase,
  cloneParams,
  ghostPhaseLabel,
  paramsFromQuery,
  paramsToQuery,
} from './presets'
import type { GhostParams, PresetId } from './presets'
import { Renderer } from './renderer'
import {
  readParams,
  renderReadouts,
  setStatus,
  syncPhaseSlider,
  syncPresetButtons,
  syncShapeSwitch,
  writeParams,
} from './ui'
import type { SliderEls } from './ui'

const canvas = mustEl('#view', HTMLCanvasElement)
const stage = mustEl('#stage', HTMLElement)
const empty = mustEl('#empty', HTMLElement)
const fileInput = mustEl('#file', HTMLInputElement)
const exportBtn = mustEl('#export', HTMLButtonElement)
const holdBtn = mustEl('#hold-original', HTMLButtonElement)
const toggleOriginal = mustEl('#toggle-original', HTMLInputElement)

const sliders: SliderEls = {
  mix: mustEl('#mix', HTMLInputElement),
  count: mustEl('#count', HTMLInputElement),
  sep: mustEl('#sep', HTMLInputElement),
  angle: mustEl('#angle', HTMLInputElement),
  fade: mustEl('#fade', HTMLInputElement),
  soft: mustEl('#soft', HTMLInputElement),
  contrast: mustEl('#contrast', HTMLInputElement),
  curve: mustEl('#curve', HTMLInputElement),
  scatter: mustEl('#scatter', HTMLInputElement),
  overallBlur: mustEl('#overall-blur', HTMLInputElement),
  edgeBlur: mustEl('#edge-blur', HTMLInputElement),
}

const renderer = new Renderer(canvas)
if (!renderer.ok) {
  const banner = mustEl('#gl-error', HTMLElement)
  banner.hidden = false
  empty.hidden = true
  if (renderer.error) {
    const extra = document.createElement('p')
    extra.textContent = renderer.error
    banner.append(extra)
  }
}

const fromQuery = paramsFromQuery(window.location.search)
const startAdvanced = new URLSearchParams(window.location.search).get('tab') === 'advanced'
let params: GhostParams = cloneParams(fromQuery ?? EVERYDAY)
let holdOriginal = false
let statusTimer = 0

const tabBasic = mustEl('#tab-basic', HTMLButtonElement)
const tabAdvanced = mustEl('#tab-advanced', HTMLButtonElement)
const panelBasic = mustEl('#panel-basic', HTMLElement)
const panelAdvanced = mustEl('#panel-advanced', HTMLElement)

const phaseSlider = mustEl('#phase', HTMLInputElement)

writeParams(sliders, params)
renderReadouts(params)
syncPresetButtons(params)
syncShapeSwitch(params.shapeMode)
syncPhaseSlider(phaseSlider, params)
renderer.setParams(params)
renderer.setBypass(false)

function setTab(mode: 'basic' | 'advanced'): void {
  const advanced = mode === 'advanced'
  tabBasic.setAttribute('aria-selected', advanced ? 'false' : 'true')
  tabAdvanced.setAttribute('aria-selected', advanced ? 'true' : 'false')
  tabBasic.tabIndex = advanced ? -1 : 0
  tabAdvanced.tabIndex = advanced ? 0 : -1
  panelBasic.hidden = advanced
  panelAdvanced.hidden = !advanced
  syncQuery(params)
}

tabBasic.addEventListener('click', () => setTab('basic'))
tabAdvanced.addEventListener('click', () => setTab('advanced'))
setTab(startAdvanced ? 'advanced' : 'basic')
bindHelp()

for (const input of Object.values(sliders)) {
  input.addEventListener('input', onSliderInput)
}

phaseSlider.addEventListener('input', () => {
  const phase = Number(phaseSlider.value)
  params = applyGhostPhase(phase, params)
  writeParams(sliders, params)
  applyParams(true)
  const el = document.getElementById('out-phase')
  if (el) {
    el.textContent = ghostPhaseLabel(phase)
  }
})

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-shape]')) {
  button.addEventListener('click', () => {
    const mode = button.dataset.shape
    if (mode !== 'linear' && mode !== 'scattershot') {
      return
    }
    params = { ...params, shapeMode: mode }
    syncShapeSwitch(mode)
    applyParams()
  })
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
  button.addEventListener('click', () => {
    const id = button.dataset.preset as PresetId | undefined
    const preset = PRESETS.find((item) => item.id === id)
    if (!preset) {
      return
    }
    params = cloneParams(preset.params)
    writeParams(sliders, params)
    applyParams()
  })
}

mustEl('#choose', HTMLButtonElement).addEventListener('click', () => fileInput.click())
mustEl('#replace', HTMLButtonElement).addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]
  if (file) {
    void openFile(file)
  }
  fileInput.value = ''
})

let dragDepth = 0

stage.addEventListener('dragenter', (event) => {
  if (!isFileDrag(event)) {
    return
  }
  event.preventDefault()
  dragDepth += 1
  stage.classList.add('is-drop')
})
stage.addEventListener('dragover', (event) => {
  if (!isFileDrag(event)) {
    return
  }
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
})
stage.addEventListener('dragleave', () => {
  dragDepth -= 1
  queueMicrotask(() => {
    if (dragDepth <= 0) {
      dragDepth = 0
      stage.classList.remove('is-drop')
    }
  })
})
stage.addEventListener('drop', (event) => {
  event.preventDefault()
  event.stopPropagation()
  dragDepth = 0
  stage.classList.remove('is-drop')
  const file = fileFromDrop(event)
  if (file) {
    void openFile(file)
  } else {
    flashStatus('Could not read that drop. Try Choose photo.', 'error')
  }
})

window.addEventListener('dragover', (event) => {
  if (isFileDrag(event)) {
    event.preventDefault()
  }
})
window.addEventListener('drop', (event) => {
  if (!isFileDrag(event)) {
    return
  }
  event.preventDefault()
  const file = fileFromDrop(event)
  if (file) {
    void openFile(file)
  }
})

holdBtn.addEventListener('pointerdown', (event) => {
  event.preventDefault()
  holdBtn.setPointerCapture(event.pointerId)
  setHold(true)
})
holdBtn.addEventListener('pointerup', () => setHold(false))
holdBtn.addEventListener('pointercancel', () => setHold(false))

toggleOriginal.addEventListener('change', () => {
  updateBypass()
})

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat || isTextInput(event.target)) {
    return
  }
  event.preventDefault()
  setHold(true)
})
window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    setHold(false)
  }
})

mustEl('#copy-link', HTMLButtonElement).addEventListener('click', () => {
  const url = `${window.location.origin}${window.location.pathname}?${paramsToQuery(params)}`
  void navigator.clipboard.writeText(url).then(
    () => flashStatus('Slider link copied. The photo is not in the link.'),
    () => flashStatus('Could not copy the link.', 'error'),
  )
})

exportBtn.addEventListener('click', () => {
  void (async () => {
    try {
      const blob = await renderer.exportPngBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'kc-sim.png'
      a.click()
      URL.revokeObjectURL(url)
      flashStatus('Saved kc-sim.png')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not export.'
      flashStatus(message, 'error')
    }
  })()
})

const resizeObserver = new ResizeObserver(() => renderer.resize())
resizeObserver.observe(stage)
renderer.resize()

async function openFile(file: File): Promise<void> {
  try {
    const image = await loadImageFile(file)
    renderer.setImage(image.canvas, image.width, image.height, image.border)
    if (!renderer.ok || !renderer.hasImage()) {
      flashStatus('The photo loaded, but WebGL is not available to display it.', 'error')
      return
    }
    empty.hidden = true
    exportBtn.disabled = false
    flashStatus(`Showing ${image.name}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not open that file.'
    flashStatus(message, 'error')
  }
}

function onSliderInput(): void {
  params = readParams(sliders, params)
  applyParams()
}

function applyParams(fromPhase = false): void {
  renderReadouts(params)
  syncPresetButtons(params)
  syncShapeSwitch(params.shapeMode)
  if (!fromPhase) {
    syncPhaseSlider(phaseSlider, params)
  }
  renderer.setParams(params)
  syncQuery(params)
}

function setHold(next: boolean): void {
  holdOriginal = next
  holdBtn.classList.toggle('is-active', next)
  updateBypass()
}

function updateBypass(): void {
  renderer.setBypass(holdOriginal || toggleOriginal.checked)
}

function syncQuery(next: GhostParams): void {
  const query = new URLSearchParams(paramsToQuery(next))
  if (tabAdvanced.getAttribute('aria-selected') === 'true') {
    query.set('tab', 'advanced')
  }
  window.history.replaceState(null, '', `${window.location.pathname}?${query.toString()}`)
}

function isFileDrag(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  if (!types) {
    return false
  }
  return Array.from(types).includes('Files')
}

function fileFromDrop(event: DragEvent): File | null {
  const transfer = event.dataTransfer
  if (!transfer) {
    return null
  }
  if (transfer.files.length > 0) {
    return transfer.files[0]
  }
  for (const item of Array.from(transfer.items)) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        return file
      }
    }
  }
  return null
}

function flashStatus(message: string, kind: 'info' | 'error' = 'info'): void {
  setStatus(message, kind)
  window.clearTimeout(statusTimer)
  statusTimer = window.setTimeout(() => setStatus(''), 4000)
}

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

function mustEl<T extends Element>(selector: string, type: { new (): T }): T
function mustEl<T extends Element>(selector: string, type: { new (...args: never[]): T }): T {
  const el = document.querySelector(selector)
  if (!(el instanceof type)) {
    throw new Error(`Missing ${selector}`)
  }
  return el
}
