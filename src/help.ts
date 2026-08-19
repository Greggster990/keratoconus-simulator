export type HelpTopic = {
  how: string
  fact: string
  cites: number[]
}

export const HELP: Record<string, HelpTopic> = {
  mix: {
    how: 'How strongly the ghost stack covers the real photo. Zero is the untouched image; higher values make the copies more obvious.',
    fact: 'Glasses can put the “best focus” on the retina and still leave ghosts. Keratoconus is dominated by higher-order aberration, which spectacles cannot cancel.',
    cites: [2, 6],
  },
  count: {
    how: 'How many extra copies appear. One is a single shadow; several is stacked or sprayed polyopia.',
    fact: 'An irregular cornea can prevent light from meeting at one retinal point, so one object is imaged as overlapping copies.',
    cites: [2, 6, 7],
  },
  sep: {
    how: 'How far each copy sits from the real image. Small values hug the original; large values throw the ghosts farther out.',
    fact: 'Thinning and steepening are often inferotemporal, so rays through that zone focus off-axis and the ghost is displaced.',
    cites: [2, 6],
  },
  angle: {
    how: 'Which way the stack or spray is biased. Drag it until the ghosts sit where yours do.',
    fact: 'The cone commonly peaks below or down-and-out from center. Ghost direction often follows that apex, but not always.',
    cites: [2],
  },
  fade: {
    how: 'How quickly later copies dim. Low fade makes the last ghosts faint; high fade keeps them closer in brightness to the first.',
    fact: 'Higher-order aberration spreads energy across the point-spread function, so extra copies usually carry less light than the main image.',
    cites: [6, 7],
  },
  soft: {
    how: 'How mushy each copy is. Low is a crisp double; high turns copies into smeared shadows.',
    fact: 'Coma, the dominant higher-order aberration in keratoconus, produces a comet-shaped blur rather than a sharp second letter.',
    cites: [6, 7],
  },
  contrast: {
    how: 'How picky ghosts are about contrast. High: the moon and text ghost hard, wood barely does. Low: more of the scene doubles.',
    fact: 'The same spread of light is obvious when a bright point sits on a dark field, and easy to miss on a low-contrast surface.',
    cites: [6, 7],
  },
  shape: {
    how: 'Linear parks copies on a path. Scattershot sprays them in a cloud. Use Linear for a neat stack; Scattershot if your ghosts do not line up.',
    fact: 'Vertical coma from an off-center cone often looks like a comet. Extra local irregularity can throw light in more than one direction.',
    cites: [6, 7],
  },
  curve: {
    how: 'Bends a Linear stack left or right. Zero is a straight line. Does little in Scattershot mode.',
    fact: 'The cornea is not a tidy geometric cone. Changing curvature across the pupil can arc the path of the ghosts.',
    cites: [2, 6],
  },
  scatter: {
    how: 'Adds wobble. On Linear it nicks the line; on Scattershot it widens the spray.',
    fact: 'Local irregularity rides on top of the main cone, so copies rarely land on even, ruler-straight steps.',
    cites: [2, 6],
  },
  overall: {
    how: 'Softens the whole photo, including flat areas. Keep it modest if you want the ghosts to stay readable.',
    fact: 'No single spectacle power can focus every part of an irregular pupil at once, so some light is always a little out of focus.',
    cites: [2, 7],
  },
  edge: {
    how: 'Adds extra smear only on high-contrast edges — letter rims, a moon’s limb, a window frame.',
    fact: 'Coma shows up first at edges, which is why a letter rim or a moon’s limb can look tailed while a wall still looks fairly even.',
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
    fact.textContent = `Fun fact: ${topic.fact}`
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
