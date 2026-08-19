const MAX_SIDE = 2048

export type RGB = [number, number, number]

export type BorderColors = {
  left: RGB
  right: RGB
  top: RGB
  bottom: RGB
}

export const STAGE_BORDER: BorderColors = {
  left: [0.071, 0.067, 0.059],
  right: [0.071, 0.067, 0.059],
  top: [0.071, 0.067, 0.059],
  bottom: [0.071, 0.067, 0.059],
}

export type LoadedImage = {
  canvas: HTMLCanvasElement
  width: number
  height: number
  name: string
  border: BorderColors
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/') && file.type !== '') {
    throw new Error('That file is not an image.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Could not read that image. Try a JPEG, PNG, or WebP.')
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const border = measureBorderFromBitmap(bitmap)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not prepare that image.')
  }

  const fill = averageRgb(border)
  ctx.fillStyle = `rgb(${Math.round(fill[0] * 255)}, ${Math.round(fill[1] * 255)}, ${Math.round(fill[2] * 255)})`
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return { canvas, width, height, name: file.name, border }
}

function measureBorderFromBitmap(bitmap: ImageBitmap): BorderColors {
  const maxW = 256
  const width = Math.max(1, Math.min(maxW, bitmap.width))
  const height = Math.max(1, Math.round(bitmap.height * (width / Math.max(bitmap.width, 1))))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
  if (!ctx) {
    return STAGE_BORDER
  }
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  let pixels: Uint8ClampedArray
  try {
    pixels = ctx.getImageData(0, 0, width, height).data
  } catch {
    return STAGE_BORDER
  }
  return measureBorder(pixels, width, height)
}

function measureBorder(pixels: Uint8ClampedArray, width: number, height: number): BorderColors {
  const band = Math.max(1, Math.min(6, Math.floor(Math.min(width, height) / 64)))
  const left = [0, 0, 0, 0]
  const right = [0, 0, 0, 0]
  const top = [0, 0, 0, 0]
  const bottom = [0, 0, 0, 0]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < band; x++) {
      addPixel(pixels, width, x, y, left)
      addPixel(pixels, width, width - 1 - x, y, right)
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < band; y++) {
      addPixel(pixels, width, x, y, top)
      addPixel(pixels, width, x, height - 1 - y, bottom)
    }
  }

  return {
    left: finish(left),
    right: finish(right),
    top: finish(top),
    bottom: finish(bottom),
  }
}

function addPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  slot: number[],
): void {
  const i = (y * width + x) * 4
  const alpha = data[i + 3]
  if (alpha < 10) {
    return
  }
  const w = alpha / 255
  slot[0] += data[i] * w
  slot[1] += data[i + 1] * w
  slot[2] += data[i + 2] * w
  slot[3] += w
}

function finish(slot: number[]): RGB {
  if (slot[3] < 1e-3) {
    return STAGE_BORDER.left
  }
  return [slot[0] / (slot[3] * 255), slot[1] / (slot[3] * 255), slot[2] / (slot[3] * 255)]
}

function averageRgb(border: BorderColors): RGB {
  return [
    (border.left[0] + border.right[0] + border.top[0] + border.bottom[0]) / 4,
    (border.left[1] + border.right[1] + border.top[1] + border.bottom[1]) / 4,
    (border.left[2] + border.right[2] + border.top[2] + border.bottom[2]) / 4,
  ]
}
