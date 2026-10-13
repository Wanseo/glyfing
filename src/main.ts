import './style.css'
import brandLogoUrl from './assets/glyf-logo.webp'
import * as THREE from 'three'
import { createCharacter } from './character'
import { clampPosition, getDirection } from './movement'
import { createGlitterBackground } from './glitter'
import { createGlossProps } from './gloss-props'
import { createBadgeCandies } from './badge-candies'
import { createSpeech } from './speech'
import { createMusic } from './music'
import { createExperiences } from './experiences'
import { createCharacterPlay } from './character-play'
import { createPlushProps } from './plush-props'
import { createClickSound } from './click-sound'

THREE.Cache.enabled = true
createClickSound()
document.documentElement.classList.add('is-loading')
const app = document.querySelector<HTMLDivElement>('#app')!
const scene = new THREE.Scene()
scene.background = new THREE.Color('#e83796')
const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 100)
camera.position.set(0, 0, 20)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = false
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.domElement.setAttribute('aria-label', '핑크 글리터 배경 위의 3D 캐릭터와 Glue Gloss 패키지, 크롬 튜브, 사원증과 알록달록한 젤리들. 방향키로 움직일 수 있습니다.')
renderer.domElement.setAttribute('role', 'img')
app.appendChild(renderer.domElement)
const brandLogo = document.createElement('img')
brandLogo.className = 'brand-logo'
brandLogo.src = brandLogoUrl
brandLogo.alt = 'GLYF'
brandLogo.draggable = false
const brandBar = document.createElement('div')
brandBar.className = 'brand-bar'
app.appendChild(brandBar)
const brandHome = document.createElement('a')
brandHome.className = 'brand-home'
brandHome.href = '#home'
brandHome.setAttribute('aria-label', 'GLYF 메인 화면으로 돌아가기')
brandHome.appendChild(brandLogo)
brandBar.appendChild(brandHome)
createMusic(brandBar)
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
const characterSize = .84
character.root.scale.setScalar(1.86875 * characterSize)
const position = new THREE.Vector2(0, 0)
scene.add(character.root)
const glossProps = createGlossProps(app)
scene.add(glossProps.root)
const badgeCandies = createBadgeCandies(app)
scene.add(badgeCandies.root)
const plushProps = createPlushProps()
scene.add(plushProps.root)
const speech = createSpeech(app)
const characterPlay = createCharacterPlay(app, scene, speech.say)

const shadowCanvas = document.createElement('canvas')
shadowCanvas.width = shadowCanvas.height = 128
const ctx = shadowCanvas.getContext('2d')!
const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64)
gradient.addColorStop(0, 'rgba(68, 54, 43, 0.19)')
gradient.addColorStop(1, 'rgba(68, 54, 43, 0)')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 128, 128)
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.924375 * characterSize, 0.7475 * characterSize), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }))

scene.add(shadow)

let viewHalfWidth = 5.95, viewHalfHeight = 3.15
let background: THREE.CanvasTexture | null = null
let backgroundSize = ''
function resize() {
  const aspect = window.innerWidth / window.innerHeight
  // Keep the character approximately 120 pixels tall on desktop screens.
  const pixelsPerUnit = Math.min(48, window.innerHeight / 8, window.innerWidth / 6)
  const halfHeight = window.innerHeight / pixelsPerUnit / 2
  const halfWidth = halfHeight * aspect
  viewHalfWidth = halfWidth
  viewHalfHeight = halfHeight
  glossProps.layout(halfWidth, halfHeight)
  badgeCandies.layout(halfWidth, halfHeight)
  plushProps.layout(halfWidth, halfHeight)
  const pixelRatio = Math.min(window.devicePixelRatio, 2,
    renderer.capabilities.maxTextureSize / Math.max(window.innerWidth, window.innerHeight))
  renderer.setPixelRatio(pixelRatio)
  const size = `${window.innerWidth}:${window.innerHeight}:${pixelRatio}`
  if (size !== backgroundSize) {
    const nextBackground = createGlitterBackground(window.innerWidth, window.innerHeight, pixelRatio)
    scene.background = nextBackground
    background?.dispose()
    background = nextBackground
    backgroundSize = size
  }
  camera.left = -halfWidth
  camera.right = halfWidth
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', resize)
resize()
let currentView = 'home'
const keys = new Set<string>()
function captureCharacter() {
  const stickerScene = new THREE.Scene()
  const model = character.root.clone(true)
  model.visible = true
  model.position.set(0, -3.37309375 * characterSize, 0)
  model.rotation.set(0, 0, 0)
  stickerScene.add(model, new THREE.HemisphereLight('#fff9ec', '#b19373', 1.8))
  const key = new THREE.DirectionalLight('#fff4df', 2.2)
  key.position.set(-3, 10, 6); stickerScene.add(key)
  const stickerFrameScale = characterSize / .9
  const stickerCamera = new THREE.OrthographicCamera(-2.7 * stickerFrameScale, 2.7 * stickerFrameScale,
    3.2 * stickerFrameScale, -3.2 * stickerFrameScale, .1, 100)
  stickerCamera.position.set(0, 0, 20)
  const stickerRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  stickerRenderer.setSize(432, 512); stickerRenderer.setClearColor(0, 0)
  stickerRenderer.render(stickerScene, stickerCamera)
  const url = stickerRenderer.domElement.toDataURL('image/png')
  stickerRenderer.dispose(); stickerRenderer.forceContextLoss()
  return url
}
createExperiences(app, captureCharacter, route => {
  currentView = route; keys.clear()
  characterPlay.update(0, position.x, position.y, camera, route === 'home')
  const home = route === 'home' || route === 'camera'
  character.root.visible = home; shadow.visible = home
  glossProps.root.visible = home; badgeCandies.root.visible = home
  plushProps.root.visible = home
  glossProps.syncLinks(camera)
  badgeCandies.syncInteraction(camera)
  const bubble = app.querySelector<HTMLElement>('.character-speech')!
  bubble.hidden = true
})
window.addEventListener('keydown', event => {
  if (currentView !== 'home' || document.querySelector('dialog[open]') || !event.key.startsWith('Arrow')) return
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
  badgeCandies.update(dt)
  glossProps.update(dt)
  plushProps.update(dt)
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
  if (document.querySelector('dialog[open]')) keys.clear()
  const direction = getDirection(keys)
  const previousX = position.x, previousY = position.y
  position.x = clampPosition(position.x + direction.x * dt * 2.4, viewHalfWidth, 2.429375 * characterSize)
  position.y = clampPosition(position.y + direction.y * dt * 2.4, viewHalfHeight, 2.803125 * characterSize)
  const distance = Math.hypot(position.x - previousX, position.y - previousY)
  walk = THREE.MathUtils.damp(walk, distance > 0 ? 1 : 0, 12, dt)
  // Tie steps to distance travelled so the feet stop stepping at walls.
  gait += distance * 5
  if (direction.moving) {
    const target = Math.atan2(direction.x, -direction.y)
    character.root.rotation.y = target
  }
  const hop = characterPlay.update(dt, position.x, position.y, camera, currentView === 'home')
  character.root.position.set(position.x, position.y + hop - 3.37309375 * characterSize + Math.abs(Math.sin(gait)) * 0.04671875 * characterSize * walk, 0)
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
  shadow.position.set(position.x, position.y - 2.23315625 * characterSize, -0.8)
  glossProps.syncLinks(camera)
  badgeCandies.syncInteraction(camera)
  if (currentView === 'home') speech.update(dt, position.x, position.y + hop, camera,
    2.429375 * characterSize, 2.803125 * characterSize,
    [...glossProps.hoveredBounds(), ...badgeCandies.hoveredBounds()])
  renderer.render(scene, camera)
})

Promise.all([glossProps.ready, badgeCandies.ready, plushProps.ready, brandLogo.decode()]).then(() => {
  renderer.compile(scene, camera)
  requestAnimationFrame(() => document.documentElement.classList.remove('is-loading'))
}).catch(() => {
  const message = document.createElement('div')
  message.className = 'startup-error'
  message.setAttribute('role', 'alert')
  message.innerHTML = '이미지를 불러오지 못했어요. <button type="button">다시 시도 ↻</button>'
  message.querySelector('button')!.addEventListener('click', () => location.reload())
  document.body.appendChild(message)
})
