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
  let countdown = .35, greeting = 0
  let remaining: string[] = []
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
    update(dt: number, x: number, y: number, camera: THREE.Camera) {
      countdown -= dt
      if (countdown <= 0) {
        if (bubble.hidden) {
          text.textContent = nextPhrase()
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
      const desiredLeft = screenX + 48
      bubble.style.maxWidth = `${Math.min(260, Math.max(140, window.innerWidth - desiredLeft - 12))}px`
      const width = bubble.offsetWidth, height = bubble.offsetHeight
      const left = THREE.MathUtils.clamp(desiredLeft, 12,
        Math.max(12, window.innerWidth - width - 12))
      const top = THREE.MathUtils.clamp(screenY - height - 64, 12,
        Math.max(12, window.innerHeight - height - 44))
      bubble.style.left = `${left}px`
      bubble.style.top = `${top}px`
      bubble.style.setProperty('--tail-left', `${THREE.MathUtils.clamp(screenX - left - 20, 8, width - 40)}px`)
    },
  }
}
