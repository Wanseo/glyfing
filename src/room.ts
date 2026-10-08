import * as THREE from 'three'
import { createBedding } from './bedding'
import { createCurtains } from './curtains'

export const roomObstacles = [
  { minX: -5.7, maxX: -2.5, minZ: 0.1, maxZ: 4.2 },
  { minX: 1.7, maxX: 5.7, minZ: -4.1, maxZ: -2.0 },
  { minX: 2.9, maxX: 4.3, minZ: -1.8, maxZ: -0.5 },
]

export function createRoom() {
  const room = new THREE.Group()
  const materials = new Map<string, THREE.MeshStandardMaterial>()
  function material(color: string) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }))
    return materials.get(color)!
  }
  function box(color: string, size: number[], position: number[], parent: THREE.Group = room) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material(color))
    mesh.position.set(position[0]!, position[1]!, position[2]!)
    mesh.castShadow = mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  function cylinder(color: string, radius: number, height: number, position: number[]) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), material(color))
    mesh.position.set(position[0]!, position[1]!, position[2]!)
    mesh.castShadow = true
    room.add(mesh)
    return mesh
  }
  // Open-front miniature room, with the warm cream and peach reference palette.
  box('#efbb8d', [12, 0.22, 9.6], [0, -0.11, 0])
  box('#f6e7c6', [12.2, 5.6, 0.2], [0, 2.8, -4.7])
  box('#efe0be', [0.2, 5.6, 9.6], [-6, 2.8, 0])
  box('#aa7049', [12, 0.4, 0.16], [0, 0.32, -4.54])
  box('#aa7049', [0.16, 0.4, 9.4], [-5.86, 0.32, 0])

  // Bed: timber frame with reference-inspired red bedding and patterned pillows.
  for (const x of [-5.3, -2.9]) for (const z of [0.7, 3.8]) box('#ab7549', [0.17, 0.6, 0.17], [x, 0.3, z])
  box('#b77e4f', [2.7, 0.22, 3.6], [-4.1, 0.64, 2.25])
  box('#f4eddb', [2.4, 0.42, 3.25], [-4.1, 0.96, 2.25])
  box('#bd8759', [0.14, 0.53, 3.6], [-5.42, 0.91, 2.25])
  box('#bd8759', [0.14, 0.53, 3.6], [-2.78, 0.91, 2.25])
  box('#bd8759', [2.7, 1.35, 0.16], [-4.1, 0.99, 0.5])
  box('#bd8759', [2.7, 0.75, 0.16], [-4.1, 0.74, 4])
  const bedding = createBedding()
  bedding.position.x = -4.1
  room.add(bedding)

  // Bedside water bottle and small stereo.
  box('#bb8553', [1.0, 0.14, 0.85], [-5.15, 1.05, -0.15])
  box('#ac7648', [0.85, 0.9, 0.72], [-5.15, 0.48, -0.15])
  cylinder('#77aedb', 0.12, 0.4, [-5.37, 1.32, -0.1])
  cylinder('#c2e1f2', 0.07, 0.1, [-5.37, 1.57, -0.1])
  box('#293a42', [0.48, 0.3, 0.34], [-4.91, 1.27, -0.13])
  for (let i = 0; i < 3; i++) box('#72ad67', [0.035, 0.05, 0.015], [-5.06 + i * 0.1, 1.25, 0.05])

  // Desk and drawer cabinet, with a chunky retro computer and keyboard.
  box('#bd8856', [3.7, 0.19, 1.65], [3.7, 1.45, -3.05])
  for (const x of [2.0, 5.35]) for (const z of [-3.65, -2.4]) box('#a16c42', [0.17, 1.35, 0.17], [x, 0.67, z])
  box('#bb8150', [0.95, 1.18, 1.42], [5.0, 0.64, -3.0])
  for (let i = 0; i < 3; i++) {
    box('#d59c68', [0.84, 0.31, 0.045], [5, 0.29 + i * 0.36, -2.27])
    box('#6e4d34', [0.29, 0.045, 0.03], [5, 0.29 + i * 0.36, -2.235])
  }
  box('#dfded5', [1.28, 0.94, 0.55], [3.48, 2.11, -3.3])
  box('#454b50', [1.08, 0.71, 0.025], [3.48, 2.15, -3.01])
  box('#657b82', [0.99, 0.62, 0.012], [3.48, 2.15, -2.99])
  box('#cadad6', [0.85, 0.024, 0.008], [3.48, 2.38, -2.978])
  box('#dfded5', [0.34, 0.2, 0.3], [3.48, 1.65, -3.2])
  box('#eae6da', [1.19, 0.09, 0.43], [3.46, 1.6, -2.5])
  for (let row = 0; row < 4; row++) for (let col = 0; col < 11; col++) box('#7b8586', [0.063, 0.016, 0.055], [2.98 + col * 0.095, 1.65, -2.65 + row * 0.085])
  box('#e8e5db', [0.53, 1.18, 0.76], [2.29, 2.13, -3.2])
  box('#616d70', [0.35, 0.045, 0.018], [2.29, 2.4, -2.81])
  box('#d85b7b', [0.07, 0.07, 0.019], [2.4, 1.79, -2.81])
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material('#e6e7df'))
  mouse.scale.set(0.13, 0.065, 0.2)
  mouse.position.set(4.38, 1.61, -2.48)
  room.add(mouse)

  // Blue swivel chair, including a seat, backrest, post and five wheeled feet.
  cylinder('#65717a', 0.07, 0.62, [3.55, 0.43, -1.12])
  box('#639bc7', [0.86, 0.16, 0.73], [3.55, 0.83, -1.12])
  box('#548bb8', [0.86, 0.82, 0.13], [3.55, 1.25, -0.79])
  for (const x of [3.03, 4.07]) {
    box('#364a59', [0.06, 0.31, 0.06], [x, 0.98, -1.12])
    box('#7caacd', [0.14, 0.07, 0.54], [x, 1.13, -1.12])
  }
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5
    const foot = box('#485b67', [0.06, 0.055, 0.62], [3.55 + Math.sin(a) * 0.28, 0.14, -1.12 + Math.cos(a) * 0.28])
    foot.rotation.y = a
    const wheel = cylinder('#35434c', 0.085, 0.075, [3.55 + Math.sin(a) * 0.57, 0.1, -1.12 + Math.cos(a) * 0.57])
    wheel.rotation.z = Math.PI / 2
  }

  // Books on the desk and an overhead shelf.
  const bookColors = ['#cdab57', '#e3d28c', '#83a65c', '#3894b2', '#a3c85b', '#dc5289', '#ece6d8', '#538cbd']
  function book(x: number, y: number, z: number, index: number, height: number) {
    box(bookColors[index % bookColors.length]!, [0.19, height, 0.38], [x, y + height / 2, z])
    box('#fff0c8', [0.15, 0.025, 0.012], [x, y + height * 0.75, z + 0.197])
    box('#fff0c8', [0.15, 0.025, 0.012], [x, y + 0.1, z + 0.197])
  }
  box('#af794f', [3.15, 0.13, 0.61], [4.1, 4.15, -4.22])
  for (let i = 0; i < 12; i++) book(2.72 + i * 0.25, 4.22, -4.2, i, 0.61 + (i % 3) * 0.08)
  for (let i = 0; i < 4; i++) book(4.52 + i * 0.24, 1.55, -3.42, i + 3, 0.66 + i % 2 * 0.18)

  // Framed window: deep blue evening sky, a landscape and little lit houses.
  box('#71513b', [2.76, 2.54, 0.16], [-0.5, 3.25, -4.5])
  box('#efc587', [2.59, 2.37, 0.13], [-0.5, 3.25, -4.38])
  box('#213685', [2.42, 2.2, 0.04], [-0.5, 3.25, -4.28])
  box('#429347', [2.39, 0.56, 0.04], [-0.5, 2.45, -4.245])
  for (const x of [-1.25, -0.75, 0.16]) {
    box('#b26a37', [0.38, 0.45, 0.04], [x, 3.19, -4.22])
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.27, 4), material('#de9638'))
    roof.rotation.y = Math.PI / 4
    roof.scale.z = 0.2
    roof.position.set(x, 3.53, -4.19)
    room.add(roof)
    box('#ffe692', [0.1, 0.14, 0.02], [x, 3.2, -4.19])
  }
  for (let i = 0; i < 8; i++) box('#efdd76', [0.045, 0.045, 0.015], [-1.55 + i * 0.28, 3.77 + (i % 3) * 0.15, -4.2])
  for (const x of [-1.76, -0.5, 0.76]) box('#c49c63', [0.085, 2.31, 0.12], [x, 3.25, -4.17])
  box('#c49c63', [2.6, 0.085, 0.12], [-0.5, 2.91, -4.17])
  room.add(createCurtains())

  // The reference's dark MCR poster, plus a small colorful framed picture.
  const posterCanvas = document.createElement('canvas')
  posterCanvas.width = 256; posterCanvas.height = 384
  const p = posterCanvas.getContext('2d')!
  p.fillStyle = '#253847'; p.fillRect(0, 0, 256, 384)
  p.fillStyle = '#cf4085'; p.font = 'bold 76px monospace'; p.textAlign = 'center'; p.fillText('MCR', 128, 340)
  p.fillStyle = '#d8ba91'
  p.beginPath(); p.moveTo(56, 180); p.lineTo(95, 155); p.lineTo(90, 181); p.fill()
  p.beginPath(); p.moveTo(142, 172); p.lineTo(176, 150); p.lineTo(175, 178); p.fill()
  const posterTexture = new THREE.CanvasTexture(posterCanvas)
  posterTexture.colorSpace = THREE.SRGBColorSpace
  box('#684e38', [1.35, 2.3, 0.13], [-4.6, 3.2, -4.5])
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 2.17), new THREE.MeshStandardMaterial({ map: posterTexture, roughness: 1 }))
  poster.position.set(-4.6, 3.2, -4.42)
  room.add(poster)
  box('#72553c', [1.16, 1.16, 0.14], [-2.9, 3.78, -4.5])
  box('#fff0d4', [0.99, 0.99, 0.06], [-2.9, 3.78, -4.39])
  for (let i = 0; i < 6; i++) box(['#74a5c7', '#edb86d', '#d995ad'][i % 3]!, [0.21, 0.28, 0.018], [-3.19 + (i % 3) * 0.29, 3.58 + Math.floor(i / 3) * 0.37, -4.35])
  return room
}
