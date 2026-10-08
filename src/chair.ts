import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export function createChair() {
  const chair = new THREE.Group()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#b4b4b4'; ctx.fillRect(0, 0, 128, 128)
  for (let row = 0; row < 128; row += 2) for (let col = 0; col < 128; col += 2) {
    ctx.fillStyle = (row + col) % 4 ? '#aaaaaa' : '#bfbfbf'
    ctx.fillRect(col, row, 1, 2)
  }
  const weave = new THREE.CanvasTexture(canvas)
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping
  weave.repeat.set(5, 5)
  const fabric = new THREE.MeshStandardMaterial({ color: '#d6b34d', bumpMap: weave, bumpScale: 0.0015, roughness: 1 })
  const yellow = new THREE.MeshStandardMaterial({ color: '#e4b337', roughness: 0.58 })
  const black = new THREE.MeshStandardMaterial({ color: '#24272a', roughness: 0.65 })
  const metal = new THREE.MeshStandardMaterial({ color: '#51565a', metalness: 0.45, roughness: 0.35 })
  function cushion(width: number, height: number, depth: number, radius: number, material: THREE.Material, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 4, radius), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    chair.add(mesh)
    return mesh
  }
  function cylinder(material: THREE.Material, radius: number, height: number, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    chair.add(mesh)
    return mesh
  }
  // Upholstered seat, two softly rounded back cushions and a yellow rear shell.
  cushion(1.07, 0.25, 0.91, 0.115, fabric, 0, 0.92, 0.06)
  cushion(0.91, 0.12, 0.73, 0.055, yellow, 0, 0.755, 0.04)
  const shell = cushion(0.95, 1.12, 0.13, 0.06, yellow, 0, 1.42, -0.36)
  shell.rotation.x = -0.1
  const lower = cushion(0.97, 0.57, 0.22, 0.1, fabric, 0, 1.19, -0.26)
  lower.rotation.x = -0.07
  const upper = cushion(0.91, 0.64, 0.23, 0.105, fabric, 0, 1.76, -0.32)
  upper.rotation.x = -0.1

  // Broad yellow armrests, supported by matching curved uprights.
  for (const side of [-1, 1]) {
    cylinder(yellow, 0.045, 0.37, side * 0.58, 1.06, 0.03)
    cushion(0.33, 0.085, 0.55, 0.04, yellow, side * 0.58, 1.28, 0.04)
    const armSupport = cushion(0.23, 0.065, 0.08, 0.03, yellow, side * 0.48, 0.82, 0.02)
    armSupport.rotation.z = side * 0.25
  }
  cushion(0.4, 0.1, 0.37, 0.04, black, 0, 0.68, 0.035)
  cylinder(metal, 0.045, 0.24, 0, 0.57, 0)
  cylinder(black, 0.068, 0.32, 0, 0.33, 0)
  cylinder(yellow, 0.095, 0.15, 0, 0.17, 0)

  // Five yellow spokes and paired black castor wheels.
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5
    const spoke = cushion(0.09, 0.07, 0.65, 0.03, yellow,
      Math.sin(angle) * 0.29, 0.15, Math.cos(angle) * 0.29)
    spoke.rotation.y = angle
    const x = Math.sin(angle) * 0.6, z = Math.cos(angle) * 0.6
    for (const side of [-1, 1]) {
      const wheel = cylinder(black, 0.087, 0.038,
        x + Math.cos(angle) * side * 0.025, 0.09, z - Math.sin(angle) * side * 0.025)
      wheel.rotation.z = Math.PI / 2
      wheel.rotation.y = angle
    }
  }
  chair.rotation.y = -0.15
  return chair
}
