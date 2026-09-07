export type SamplePhoto = {
  id: string
  label: string
  hint: string
  title: string
  author: string
  source: string
  license: string
  licenseUrl: string
  frameScale?: number
  changes?: string
}

const commons = 'https://commons.wikimedia.org/wiki/File:'
const cc0 = { license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }
const ccby = { license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' }

export const SAMPLES: SamplePhoto[] = [
  { id: 'moon', label: 'Moon', hint: 'Small Moon, dark sky', frameScale: 0.1, changes: 'Scaled down onto a black background; resized and JPEG-compressed', title: 'Apollo 11 image of a nearly full Moon', author: 'NASA / Apollo 11 crew', source: commons + 'Apollo_11_image_of_a_nearly_full_Moon.jpg', license: 'Public domain (NASA)', licenseUrl: 'https://commons.wikimedia.org/wiki/Template:PD-USGov-NASA' },
  { id: 'city', label: 'City lights', hint: 'Night lights and windows', title: 'City at Night (32760281221)', author: "It’s No Game", source: commons + 'City_at_Night_(32760281221).jpg', ...ccby },
  { id: 'traffic', label: 'Traffic lights', hint: 'Nighttime crosswalk', title: 'Traffic at a Chicago intersection at night', author: 'Topher', source: 'https://wordpress.org/photos/photo/15768f23bc/', ...cc0 },
  { id: 'sign', label: 'Street sign', hint: 'White lettering', title: 'Luverne, MN Main Street sign', author: 'Michel Curi', source: commons + 'Luverne,_MN_Main_Street_sign.jpg', ...ccby },
  { id: 'clock', label: 'Clock face', hint: 'Glowing face, dark hands', title: 'Illuminated clock', author: 'Angelo DeSantis', source: commons + 'Illuminated_clock_(8275496004).jpg', ...ccby },
  { id: 'chess', label: 'Chessboard', hint: 'Contrasting pieces', title: 'Image Chess', author: 'Devcore', source: commons + 'Image_Chess.jpg', ...cc0 },
]

export function sampleUrl(sample: SamplePhoto, thumbnail = false): string {
  return `${import.meta.env.BASE_URL}samples/${sample.id}${thumbnail ? '-thumb' : ''}.jpg`
}

export async function sampleFile(sample: SamplePhoto): Promise<File> {
  const response = await fetch(sampleUrl(sample))
  if (!response.ok) throw new Error('Could not load this sample. Please try again.')
  const blob = await response.blob()
  if (!sample.frameScale) {
    return new File([blob], `${sample.label}.jpg`, { type: 'image/jpeg' })
  }
  // Keep the whole photograph, with ample room around it for displaced ghosts.
  // At 0.1, even the source frame is at most 10% of either display dimension.
  const image = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1600
    canvas.height = 1000
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare this sample.')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const scale = Math.min(canvas.width, canvas.height) * sample.frameScale / Math.max(image.width, image.height)
    const width = image.width * scale
    const height = image.height * scale
    ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
    const framed = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error('Could not prepare this sample.')), 'image/png',
    ))
    return new File([framed], `${sample.label}.png`, { type: 'image/png' })
  } finally {
    image.close()
  }
}

export function bindSamplePicker(select: (sample: SamplePhoto) => void): void {
  const grid = document.getElementById('sample-grid')!
  for (const sample of SAMPLES) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'btn sample-photo'
    button.dataset.sample = sample.id
    button.setAttribute('aria-pressed', 'false')
    const img = document.createElement('img')
    img.src = sampleUrl(sample, true)
    img.alt = ''
    img.width = 160
    img.height = 100
    img.loading = 'lazy'
    const label = document.createElement('span')
    label.textContent = sample.label
    const hint = document.createElement('small')
    hint.textContent = sample.hint
    button.append(img, label, hint)
    button.addEventListener('click', () => select(sample))
    grid.append(button)
  }
}

export function showSampleCredit(sample: SamplePhoto | null): void {
  const credit = document.getElementById('sample-credit')!
  credit.replaceChildren()
  credit.hidden = !sample
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-sample]')) {
    button.setAttribute('aria-pressed', String(button.dataset.sample === sample?.id))
  }
  if (!sample) return
  const source = document.createElement('a')
  source.href = sample.source
  source.textContent = sample.title
  const license = document.createElement('a')
  license.href = sample.licenseUrl
  license.textContent = sample.license
  for (const link of [source, license]) {
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
  }
  credit.append('Sample photo: ', source, ` — ${sample.author}. `, license,
    `. ${sample.changes ?? 'Resized and JPEG-compressed'}; simulation effects may be applied. Photo license is separate from the site license. Credit is included in sample downloads.`)
}

// Keep attribution attached when a visitor exports a modified sample photo.
export async function creditSampleExport(blob: Blob, sample: SamplePhoto): Promise<Blob> {
  const image = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    const ctx = canvas.getContext('2d')!
    const size = Math.max(12, Math.round(image.width / 100))
    const font = `${size}px sans-serif`
    ctx.font = font
    const lines: string[] = []
    for (const paragraph of [
      `${sample.title} — ${sample.author}`,
      `${sample.license} — ${sample.licenseUrl}`,
      sample.source,
      `${sample.changes ?? 'Resized and JPEG-compressed'}; simulator effects may be applied.`,
    ]) {
      let line = ''
      for (const char of paragraph) {
        if (ctx.measureText(line + char).width > image.width - 32) {
          lines.push(line)
          line = ''
        }
        line += char
      }
      lines.push(line)
    }
    const leading = Math.ceil(size * 1.5)
    canvas.height = image.height + lines.length * leading + 24
    ctx.drawImage(image, 0, 0)
    ctx.fillStyle = '#12110f'
    ctx.fillRect(0, image.height, canvas.width, canvas.height - image.height)
    ctx.font = font
    ctx.fillStyle = '#f2efe8'
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => ctx.fillText(line, 16, image.height + 12 + i * leading))
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error('Could not add sample credit.')), 'image/png',
    ))
  } finally {
    image.close()
  }
}
