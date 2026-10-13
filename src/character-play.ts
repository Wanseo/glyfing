import * as THREE from 'three'
import candyUrl from './assets/badge-candies.webp'
import { cutout } from './badge-candies'

export function createCharacterPlay(app: HTMLElement, scene: THREE.Scene, say: (message: string) => void) {
  const button = document.createElement('button')
  button.className = 'character-play'
  button.type = 'button'
  button.setAttribute('aria-label', '캐릭터를 눌러 장난치기. 연속으로 누르면 숨겨둔 젤리가 나와요.')
  button.title = 'Hey! Personal space!'
  app.appendChild(button)
  const moveHint = document.createElement('div')
  moveHint.className = 'movement-hint home-movement-hint'
  moveHint.setAttribute('aria-label', '방향키로 캐릭터 이동')
  moveHint.innerHTML = '<span class="pixel-move-arrow up" aria-hidden="true"></span><span class="pixel-move-arrow left" aria-hidden="true"></span><span class="pixel-move-arrow right" aria-hidden="true"></span><span class="pixel-move-arrow down" aria-hidden="true"></span>'
  app.appendChild(moveHint)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const projected = new THREE.Vector3(), corner = new THREE.Vector3()
  const drops: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; vx: number; vy: number; age: number }[] = []
  let candy: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null
  let elapsed = 1, lastClick = -Infinity, clicks = 0, x = 0, y = 0
  let idleTime = 0, hintTime = 0, hasTapped = false
  new THREE.TextureLoader().load(candyUrl, source => {
    candy = cutout(source.image, [.62, .425, .14, .14])
    source.dispose()
  })
  button.addEventListener('click', () => {
    hasTapped = true
    const now = performance.now()
    clicks = now - lastClick < 650 ? clicks + 1 : 1
    lastClick = now; elapsed = 0
    if (clicks >= 3) {
      clicks = 0
      say('Oops. That was my secret snack.')
      if (candy) {
        for (let i = 0; i < 7 && drops.length < 28; i++) {
          const mesh = new THREE.Mesh(candy.geometry, candy.material.clone())
          mesh.scale.setScalar(.32 + Math.random() * .17)
          mesh.position.set(x + (Math.random() - .5) * .5, y - .45, 2)
          scene.add(mesh)
          drops.push({ mesh, vx: (Math.random() - .5) * 4.8, vy: 2 + Math.random() * 2, age: 0 })
        }
      }
    } else say('Tap me a few more times!')
  })
  return {
    update(dt: number, px: number, py: number, camera: THREE.OrthographicCamera, visible: boolean, moving = false) {
      x = px; y = py; elapsed += dt
      const available = visible && !document.documentElement.classList.contains('is-loading') && !document.querySelector('dialog[open]')
      if (available) hintTime += dt
      idleTime = available && !moving ? idleTime + dt : 0
      const inviting = available && !moving && !hasTapped && !reducedMotion.matches
      const phase = idleTime % 8
      const idleHop = inviting && phase > 1 && phase < 1.6 ? Math.sin((phase - 1) / .6 * Math.PI) * .16 : 0
      const hop = (reducedMotion.matches || elapsed >= .8 ? 0
        : Math.abs(Math.sin(elapsed * Math.PI / .32)) * .4 * (1 - elapsed / .8)
      ) + idleHop
      button.hidden = !visible
      if (!visible) { clicks = 0; lastClick = -Infinity; elapsed = 1 }
      projected.set(x, y + hop, 0).project(camera)
      corner.set(x + 2.2, y + hop + 2.45, 0).project(camera)
      button.style.left = `${(projected.x + 1) * window.innerWidth / 2}px`
      button.style.top = `${(1 - projected.y) * window.innerHeight / 2}px`
      button.style.width = `${Math.abs(corner.x - projected.x) * window.innerWidth}px`
      button.style.height = `${Math.abs(corner.y - projected.y) * window.innerHeight}px`
      moveHint.hidden = !available || hintTime < .5 || hintTime > 5.5
      document.documentElement.classList.toggle('show-object-hints', !moveHint.hidden)
      moveHint.style.left = button.style.left
      moveHint.style.top = `${(1 - projected.y) * window.innerHeight / 2 + 110}px`
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i]!
        drop.age += dt; drop.vy -= dt * 7
        drop.mesh.position.x += drop.vx * dt; drop.mesh.position.y += drop.vy * dt
        drop.mesh.rotation.z += drop.vx * dt
        drop.mesh.material.opacity = Math.min(1, (1.5 - drop.age) * 3)
        if (!visible || drop.age >= 1.5) {
          scene.remove(drop.mesh); drop.mesh.material.dispose(); drops.splice(i, 1)
        }
      }
      return hop
    },
  }
}
