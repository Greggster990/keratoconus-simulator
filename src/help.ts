export type HelpTopic = {
  how: string
  fact: string
}

export const HELP: Record<string, HelpTopic> = {
  mix: {
    how: 'How strongly the ghost stack covers the real photo. Zero is the untouched image; higher values make the copies more obvious.',
    fact: 'Glasses can put the “best focus” on the retina and still leave ghosts. Keratoconus is mostly higher-order aberration, which spectacles cannot cancel.',
  },
  count: {
    how: 'How many extra copies appear. One is a single shadow; several is stacked or sprayed polyopia.',
    fact: 'An irregular cone can split incoming light into more than one focal spot, so one object is imaged two, three, or more times at once.',
  },
  sep: {
    how: 'How far each copy sits from the real image. Small values hug the original; large values throw the ghosts farther out.',
    fact: 'The cone is often steeper toward the bottom of the cornea, so rays through that zone focus in a different place — the ghost shifts, usually downward after the retina flips the picture.',
  },
  angle: {
    how: 'Which way the stack or spray is biased. Drag it until the ghosts sit where yours do.',
    fact: 'Most keratoconus cones peak a little below or down-and-out from center. The ghost direction often follows that apex, so down or down-left is common — but not a rule.',
  },
  fade: {
    how: 'How quickly later copies dim. Low fade makes the last ghosts faint; high fade keeps them closer in brightness to the first.',
    fact: 'Each extra focal spot usually steals less light than the main image, so later copies look like shadows rather than equal twins.',
  },
  soft: {
    how: 'How mushy each copy is. Low is a crisp double; high turns copies into smeared shadows.',
    fact: 'The classic keratoconus point-spread function is comet-shaped (coma). Each ghost is a little smear, not a sharp carbon copy.',
  },
  contrast: {
    how: 'How picky ghosts are about contrast. High: the moon and text ghost hard, wood barely does. Low: more of the scene doubles.',
    fact: 'Spreading light from a bright moon onto dark sky is obvious. Spreading brown onto nearby brown barely registers — same optics, different punch.',
  },
  shape: {
    how: 'Linear parks copies on a path. Scattershot sprays them in a cloud. Use Linear for a neat stack; Scattershot if your ghosts do not line up.',
    fact: 'A single off-center cone often makes a comet (a line). Several local warps, or a very decentered cone, can throw light in more than one direction.',
  },
  curve: {
    how: 'Bends a Linear stack left or right. Zero is a straight line. Does little in Scattershot mode.',
    fact: 'The cornea is not a tidy geometric cone. Changing curvature across the pupil can arc the “line” of ghosts instead of keeping it ruler-straight.',
  },
  scatter: {
    how: 'Adds wobble. On Linear it nicks the line; on Scattershot it widens the spray.',
    fact: 'Tiny local irregularities ride on top of the main cone, so copies rarely land on perfect mathematically even steps.',
  },
  overall: {
    how: 'Softens the whole photo, including flat areas. Keep it modest if you want the ghosts to stay readable.',
    fact: 'No single glasses prescription can focus every part of an irregular pupil at once, so some light is always a little out of focus.',
  },
  edge: {
    how: 'Adds extra smear only on high-contrast edges — letter rims, a moon’s limb, a window frame.',
    fact: 'Coma shows up first at edges. That is why a letter can look outlined or tailed while the middle of a wall still looks fairly even.',
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
    tip.append(how, fact)

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
