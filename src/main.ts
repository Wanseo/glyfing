import './style.css'
import * as THREE from 'three'
import { createCharacter } from './character'
import { clampPosition, getDirection } from './movement'

const app = document.querySelector<HTMLDivElement>('#app')!
const scene = new THREE.Scene()
scene.background = new THREE.Color('#ffffff')
const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 100)
camera.position.set(0, 0, 20)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#ffffff')
renderer.domElement.setAttribute('aria-label', '방향키로 움직이는 세 눈의 3D 캐릭터')
renderer.domElement.setAttribute('role', 'img')
app.appendChild(renderer.domElement)
scene.add(new THREE.HemisphereLight('#ffffff', '#b1a398', 2.4))
const light = new THREE.DirectionalLight('#fff6ed', 3)
light.position.set(-3, 5, 8)
scene.add(light)
const fill = new THREE.DirectionalLight('#ffffff', 0.8)
fill.position.set(4, 1, -3)
scene.add(fill)
const character = createCharacter()
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
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }))
shadow.position.z = -0.8
scene.add(shadow)

let halfWidth = 10, halfHeight = 7
function resize() {
  // A constant scale keeps the plush small, regardless of the screen size.
  const scale = Math.min(48, window.innerHeight / 8, window.innerWidth / 6)
  halfWidth = window.innerWidth / scale / 2
  halfHeight = window.innerHeight / scale / 2
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
renderer.setAnimationLoop((time: number) => {
  const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0
  previous = time
  const direction = getDirection(keys)
  position.x = clampPosition(position.x + direction.x * dt * 3.1, halfWidth, 1.6)
  position.y = clampPosition(position.y + direction.y * dt * 3.1, halfHeight, 1.75)
  walk = THREE.MathUtils.damp(walk, direction.moving ? 1 : 0, 12, dt)
  gait += dt * 11 * walk
  if (direction.moving) {
    const target = Math.atan2(direction.x, -direction.y)
    character.root.rotation.y = target
  }
  character.root.position.set(position.x, position.y - 1.805 + Math.abs(Math.sin(gait)) * 0.06 * walk, 0)
  character.torso.rotation.z = Math.sin(gait) * 0.035 * walk
  character.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(gait + i * Math.PI) * 0.48 * walk })
  character.arms.forEach((arm, i) => { arm.rotation.x = Math.sin(gait + i * Math.PI + Math.PI) * 0.4 * walk })
  shadow.position.set(position.x, position.y - 1.195, -0.8)
  renderer.render(scene, camera)
})
