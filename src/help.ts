export type HelpTopic = {
  how: string
  fact: string
  cites: number[]
}

export const HELP: Record<string, HelpTopic> = {
  mix: {
    how: 'How strongly ghosting affects the photo. Zero removes ghosting; the separate Blur and Streak controls can still affect the image.',
    fact: 'Keratoconus can cause myopia, irregular astigmatism, and higher-order aberrations. Ordinary glasses may improve focus while leaving some distortion.',
    cites: [2, 6],
  },
  count: {
    how: 'How many extra copies appear. In Ring mode, this sets the number of matching pairs along the two sides, plus one shared faint ghost at the far end.',
    fact: 'Irregular focusing can distort an object’s image. The number of copies here is a visual setting, not a measurement of corneal shape or disease severity.',
    cites: [2],
  },
  sep: {
    how: 'Sets the spacing scale as a percentage of the image’s shorter side. Larger values spread copies farther apart. In Ring mode, this sets the base size; Curve adjusts its length and Scatter adjusts its width.',
    fact: 'Uneven corneal shape contributes to optical aberrations. This spacing control is not calibrated to cone steepness or a clinical measurement.',
    cites: [6],
  },
  angle: {
    how: 'Sets the direction of the Linear path and the streak. In Ring, it points from the main object to the shared faint ghost at the opposite end; Curve and Scatter keep this direction fixed. In Scattershot mode, it rearranges the cloud rather than rotating it as a fixed pattern.',
    fact: 'Vertical coma is often prominent in keratoconus. This slider does not locate the cone or determine its orientation.',
    cites: [6],
  },
  fade: {
    how: 'Controls how quickly copies dim along the path. Lower values fade faster; higher values keep later ghosts stronger. Ring fades symmetrically toward its far end.',
    fact: 'Aberrations change how a point of light is distributed in the retinal image. The fade pattern here is a simulator choice.',
    cites: [7],
  },
  soft: {
    how: 'Softens the ghost copies. Higher values spread each copy more; later copies receive more softening.',
    fact: 'Coma can give a point of light an asymmetric, comet-like image. Real eyes combine several aberrations, so their blur can be more complex.',
    cites: [7],
  },
  contrast: {
    how: 'Higher values suppress ghosts in areas with little contrast. Lower values allow more of the scene to ghost. Ring also gives brighter source areas more weight.',
    fact: 'Keratoconus can reduce visual quality and increase glare sensitivity. This contrast filter is a display approximation, not a model of how the cornea selects objects.',
    cites: [2],
  },
  shape: {
    how: 'Linear places copies along a path. Scattershot spreads them in a cloud. Ring follows both sides of an adjustable oval, fading toward a shared ghost opposite the main object; bright areas contribute more.',
    fact: 'Coma is often the largest higher-order aberration in keratoconus. These three patterns are illustrative options, not clinically validated categories.',
    cites: [6],
  },
  curve: {
    how: 'Bends the Linear path to either side. At zero, the path is straight unless Scatter adds wobble. Has no effect in Scattershot. In Ring, lower values shorten the distance to the opposite point and higher values lengthen it, along Direction.',
    fact: 'Corneal irregularity changes the eye’s optics, but this curved chain of copies is an artistic approximation rather than a measured consequence of corneal curvature.',
    cites: [7],
  },
  scatter: {
    how: 'Adds positional wobble in Linear and widens the cloud in Scattershot. In Ring, lower values narrow the oval and higher values widen it, without moving its opposite point. Curve 0 and Scatter 1 give a circle.',
    fact: 'Keratoconus can involve several optical aberrations. Randomly placed copies here are a visual approximation, not a simulation of physical light scattering.',
    cites: [7],
  },
  overall: {
    how: 'Blurs detail across the whole photo. Uniform areas may look unchanged because there is no detail there to soften.',
    fact: 'Ordinary glasses can help, particularly in early keratoconus, but may not fully correct distortion from an irregular cornea.',
    cites: [2],
  },
  edge: {
    how: 'Adds extra blur where the image has strong changes in brightness, such as text edges and window frames.',
    fact: 'Optical aberrations affect the retinal image, not just edges. Restricting this extra blur to edges is a simulator choice.',
    cites: [7],
  },
  streakLength: {
    how: 'Sets the tail length as a percentage of the image’s shorter side. Zero turns streaks off. The tail follows Direction and is strongest from bright areas against darker surroundings.',
    fact: 'Coma is often prominent among higher-order aberrations in keratoconus. This straight tail is a simplified illustration, not a measurement of coma.',
    cites: [6],
  },
  streakAmount: {
    how: 'Controls the strength of streaks independently of their length. Zero removes streaks; bright areas against darker surroundings contribute most.',
    fact: 'Glare and halos at night can occur with keratoconus. Their appearance varies, and this slider does not measure symptom severity.',
    cites: [2],
  },
  streakReflect: {
    how: 'Adds a weaker tail in the opposite direction, about half as long as the main tail. Its visible brightness depends on the image and other settings.',
    fact: 'The extra tail is a visual option. The cited optical descriptions do not establish this fixed opposite tail as a keratoconus mechanism or a literal reflection.',
    cites: [6, 7],
  },
}

export function bindHelp(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.help-btn')) {
    const key = button.dataset.help
    const topic = key ? HELP[key] : undefined
    if (!topic) {
      continue
    }
    const tip = document.createElement('div')
    tip.className = 'help-tip'
    tip.hidden = true
    const how = document.createElement('p')
    how.className = 'help-how'
    how.textContent = topic.how
    const fact = document.createElement('p')
    fact.className = 'help-fact'
    fact.textContent = `Context: ${topic.fact}`
    const src = document.createElement('p')
    src.className = 'help-src'
    const labels = topic.cites.join(', ')
    const link = document.createElement('a')
    link.href = './CITATIONS.md'
    link.textContent = `Sources ${labels}`
    src.append(link)
    tip.append(how, fact, src)

    const slider = button.closest('.slider')
    const block = button.closest('.block')
    const switchRow = block?.querySelector('.switch')
    if (slider) {
      slider.append(tip)
    } else if (switchRow) {
      switchRow.after(tip)
    } else {
      button.after(tip)
    }

    button.setAttribute('aria-expanded', 'false')
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      const willOpen = tip.hidden
      closeAllHelp()
      if (willOpen) {
        tip.hidden = false
        button.setAttribute('aria-expanded', 'true')
      }
    })
  }

  document.addEventListener('click', () => {
    closeAllHelp()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllHelp()
    }
  })
}

function closeAllHelp(): void {
  for (const tip of document.querySelectorAll<HTMLElement>('.help-tip')) {
    tip.hidden = true
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('.help-btn')) {
    button.setAttribute('aria-expanded', 'false')
  }
}
