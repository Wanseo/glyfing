import * as THREE from 'three'

const greetings = ['Hello?', 'How are you?']
const quips = [
  'Got any gummies?', 'Three eyes. All on you.', 'You look snack-tastic!',
  'Oops. Was that your candy?', 'Do I have something in my teeth?',
  'Stay weird with me!', 'Tiny legs. Big plans.', 'Hey, nice face!',
  'Can we be weird together?', 'I came. I saw. I snacked.',
  'Feeling cute. Might bite.', 'You bring the snacks?', 'Is it gummy o’clock?',
  'Blink twice if you like me.', 'I can see you. Times three.',
]

export function createSpeech(app: HTMLElement) {
  const bubble = document.createElement('div')
  bubble.className = 'character-speech'
  bubble.lang = 'en'
  bubble.hidden = true
  const text = document.createElement('span')
  text.className = 'character-speech__text'
  bubble.appendChild(text)
  app.appendChild(bubble)
  const anchor = new THREE.Vector3()
  const corner = new THREE.Vector3()
  let countdown = .35, greeting = 0
  let remaining: string[] = []
  const placements = ['middle', 'upper-left', 'upper-right'] as const
  let placementIndex = -1
  function nextPhrase() {
    if (greeting < greetings.length) return greetings[greeting++]!
    if (!remaining.length) {
      remaining = [...quips]
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[remaining[i], remaining[j]] = [remaining[j]!, remaining[i]!]
      }
      if (remaining[remaining.length - 1] === text.textContent) remaining.reverse()
    }
    return remaining.pop()!
  }
  return {
    update(dt: number, x: number, y: number, camera: THREE.Camera, halfWidth: number, halfHeight: number) {
      countdown -= dt
      if (countdown <= 0) {
        if (bubble.hidden) {
          text.textContent = nextPhrase()
          placementIndex = (placementIndex + 1) % placements.length
          bubble.hidden = false
          countdown = 3
        } else {
          bubble.hidden = true
          countdown = .45
        }
      }
      if (bubble.hidden) return
      anchor.set(x, y, 0).project(camera)
      const screenX = (anchor.x + 1) * window.innerWidth / 2
      const screenY = (1 - anchor.y) * window.innerHeight / 2
      corner.set(x + halfWidth, y + halfHeight, 0).project(camera)
      const radiusX = Math.abs(corner.x - anchor.x) * window.innerWidth / 2
      const radiusY = Math.abs(corner.y - anchor.y) * window.innerHeight / 2
      const character = { left: screenX - radiusX, right: screenX + radiusX,
        top: screenY - radiusY, bottom: screenY + radiusY }
      const gap = 20, tail = 48, margin = 12
      const leftRoom = character.left - gap - tail - margin
      const rightRoom = window.innerWidth - character.right - gap - tail - margin
      const placement = placements[placementIndex]!
      let onLeft = placement === 'upper-left'
      if ((onLeft ? leftRoom : rightRoom) < 156 && (onLeft ? rightRoom : leftRoom) >= 156) onLeft = !onLeft
      const sideRoom = onLeft ? leftRoom : rightRoom
      const canUseSide = sideRoom >= 156
      const upperRoom = onLeft ? screenX - 60 : window.innerWidth - screenX - 60
      bubble.style.maxWidth = `${Math.min(300, window.innerWidth - margin * 2, Math.max(156, upperRoom))}px`
      let width = bubble.offsetWidth, height = bubble.offsetHeight
      const fitsAbove = character.top - gap - tail - height >= margin
      const fitsBelow = character.bottom + gap + tail + height <= window.innerHeight - margin
      const beside = canUseSide && (placement === 'middle' || !fitsAbove)
      let left: number, top: number, direction: string
      if (beside) {
        bubble.style.maxWidth = `${Math.min(300, sideRoom)}px`
        width = bubble.offsetWidth; height = bubble.offsetHeight
        left = onLeft ? character.left - gap - tail - width : character.right + gap + tail
        top = THREE.MathUtils.clamp(screenY - height / 2, margin, window.innerHeight - height - margin)
        direction = onLeft ? 'right' : 'left'
      } else if (fitsAbove || fitsBelow) {
        // Keep the complete lightning tail outside the character's bounds.
        left = THREE.MathUtils.clamp(onLeft ? screenX - width - 48 : screenX + 48,
          margin, Math.max(margin, window.innerWidth - width - margin))
        top = fitsAbove ? character.top - gap - tail - height : character.bottom + gap + tail
        direction = fitsAbove ? (onLeft ? 'down-right' : 'down-left') : 'up'
      } else {
        // On very small screens wait for room rather than overlap the character.
        bubble.style.visibility = 'hidden'
        return
      }
      bubble.style.visibility = 'visible'
      bubble.dataset.placement = placement
      bubble.dataset.tail = direction
      bubble.style.left = `${left}px`
      bubble.style.top = `${top}px`
      bubble.style.setProperty('--tail-left', `${THREE.MathUtils.clamp(screenX - left - 21, 8, width - 50)}px`)

    },
  }
}
