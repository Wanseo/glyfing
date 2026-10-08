import './style.css'
import * as THREE from 'three'
import { createCharacter } from './character'
import { clampPosition, getDirection } from './movement'
import { createGlitterBackground } from './glitter'

const app = document.querySelector<HTMLDivElement>('#app')!
const scene = new THREE.Scene()
const background = createGlitterBackground()
scene.background = background
const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 100)
camera.position.set(0, 0, 20)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = false
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.domElement.setAttribute('aria-label', '핑크 글리터 배경 위의 작은 3D 캐릭터. 방향키로 움직일 수 있습니다.')
renderer.domElement.setAttribute('role', 'img')
app.appendChild(renderer.domElement)
scene.add(new THREE.HemisphereLight('#fff9ec', '#b19373', 1.8))
const light = new THREE.DirectionalLight('#fff4df', 2.2)
light.position.set(-3, 10, 6)
light.castShadow = true
light.shadow.mapSize.set(2048, 2048)
Object.assign(light.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.1, far: 30 })
light.shadow.normalBias = 0.04
light.shadow.bias = -0.0002
scene.add(light)
const fill = new THREE.DirectionalLight('#ffffff', 0.8)
fill.position.set(4, 1, -3)
scene.add(fill)
const character = createCharacter()
character.root.scale.setScalar(1.25)
const position = new THREE.Vector2(0, 0)
scene.add(character.root)

const shadowCanvas = document.createElement('canvas')
shadowCanvas.width = shadowCanvas.height = 128
const ctx = shadowCanvas.getContext('2d')!
const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64)
gradient.addColorStop(0, 'rgba(68, 54, 43, 0.19)')
gradient.addColorStop(1, 'rgba(68, 54, 43, 0)')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 128, 128)
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.625, 0.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }))

scene.add(shadow)

let viewHalfWidth = 5.95, viewHalfHeight = 3.15
function resize() {
  const aspect = window.innerWidth / window.innerHeight
  // Keep the character approximately 120 pixels tall on desktop screens.
  const pixelsPerUnit = Math.min(48, window.innerHeight / 8, window.innerWidth / 6)
  const halfHeight = window.innerHeight / pixelsPerUnit / 2
  const halfWidth = halfHeight * aspect
  viewHalfWidth = halfWidth
  viewHalfHeight = halfHeight
  background.repeat.set(window.innerWidth / 1024, window.innerHeight / 1024)
  camera.left = -halfWidth
  camera.right = halfWidth
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', resize)
resize()
const keys = new Set<string>()
window.addEventListener('keydown', event => {
  if (!event.key.startsWith('Arrow')) return
  event.preventDefault()
  keys.add(event.key)
})
window.addEventListener('keyup', event => keys.delete(event.key))
window.addEventListener('blur', () => keys.clear())
document.addEventListener('visibilitychange', () => { if (document.hidden) keys.clear() })
let previous = 0, gait = 0, walk = 0
let nextBlink = Number.POSITIVE_INFINITY
let blinkStarted: number | null = null
renderer.setAnimationLoop((time: number) => {
  if (!previous) nextBlink = time + 1200 + Math.random() * 1000
  const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0
  previous = time
  if (blinkStarted === null && time >= nextBlink) blinkStarted = time
  if (blinkStarted !== null) {
    const elapsed = time - blinkStarted
    const duration = 420
    const amount = elapsed < 100 ? elapsed / 100 : elapsed < 230 ? 1 : 1 - (elapsed - 230) / 190
    const progress = elapsed / duration
    if (progress >= 1) {
      character.blink(0)
      blinkStarted = null
      nextBlink = time + 2200 + Math.random() * 2200
    } else {
      character.blink(THREE.MathUtils.smoothstep(amount, 0, 1))
    }
  }
  const direction = getDirection(keys)
  const previousX = position.x, previousY = position.y
  position.x = clampPosition(position.x + direction.x * dt * 2.4, viewHalfWidth, 1.625)
  position.y = clampPosition(position.y + direction.y * dt * 2.4, viewHalfHeight, 1.875)
  const distance = Math.hypot(position.x - previousX, position.y - previousY)
  walk = THREE.MathUtils.damp(walk, distance > 0 ? 1 : 0, 12, dt)
  // Tie steps to distance travelled so the feet stop stepping at walls.
  gait += distance * 5
  if (direction.moving) {
    const target = Math.atan2(direction.x, -direction.y)
    character.root.rotation.y = target
  }
  character.root.position.set(position.x, position.y - 2.25625 + Math.abs(Math.sin(gait)) * 0.03125 * walk, 0)
  character.torso.rotation.z = Math.cos(gait) * 0.05 * walk
  character.torso.position.x = Math.cos(gait) * 0.035 * walk
  character.legs.forEach((leg, i) => {
    const phase = gait + i * Math.PI
    const stride = Math.sin(phase)
    const lift = Math.max(0, Math.cos(phase))
    // Lift on the forward swing, then plant and push back on the ground.
    leg.position.y = 0.9 + lift * 0.11 * walk
    leg.position.z = stride * 0.2 * walk
    leg.rotation.x = -stride * 0.65 * walk
    leg.rotation.z = (i === 0 ? -1 : 1) * 0.12 + Math.cos(gait) * 0.045 * walk
  })
  character.arms.forEach((arm, i) => { arm.rotation.x = Math.sin(gait + i * Math.PI) * 0.45 * walk })
  shadow.position.set(position.x, position.y - 1.49375, -0.8)
  renderer.render(scene, camera)
})
