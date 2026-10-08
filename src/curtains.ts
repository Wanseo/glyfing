import * as THREE from 'three'

export function createCurtains() {
  const curtains = new THREE.Group()
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#dfd0bd'
  ctx.fillRect(0, 0, 512, 1024)
  let seed = 81
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  ctx.fillStyle = '#202625'
  for (let row = -1; row < 7; row++) for (let col = 0; col < 3; col++) {
    const x = col * 205 + (row % 2 === 0 ? -20 : 65)
    const y = row * 180 + 70
    const rx = 40 + random() * 24, ry = 40 + random() * 30
    const outline: THREE.Vector3[] = []
    for (let i = 0; i < 9; i++) {
      const a = i * Math.PI * 2 / 9
      const irregular = 0.75 + random() * 0.4
      outline.push(new THREE.Vector3(x + Math.cos(a) * rx * irregular, y + Math.sin(a) * ry * irregular, 0))
    }
    const curve = new THREE.CatmullRomCurve3(outline, true)
    ctx.beginPath()
    for (let i = 0; i <= 60; i++) {
      const p = curve.getPoint(i / 60)
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
    }
    ctx.closePath(); ctx.fill()
  }
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  const fabric = new THREE.MeshStandardMaterial({ map, roughness: 1, side: THREE.DoubleSide })
  const wood = new THREE.MeshStandardMaterial({ color: '#a77a51', roughness: 0.85 })
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 3.45, 16), wood)
  rail.rotation.z = Math.PI / 2
  rail.position.set(-0.5, 4.65, -3.96)
  rail.castShadow = true
  curtains.add(rail)
  for (const x of [-2.24, 1.24]) {
    const end = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), wood)
    end.position.set(x, 4.65, -3.96)
    curtains.add(end)
  }
  for (const [index, center] of [-1.57, 0.57].entries()) {
    const geometry = new THREE.PlaneGeometry(1, 1, 40, 64)
    const vertices = geometry.attributes.position!
    for (let i = 0; i < vertices.count; i++) {
      const u = vertices.getX(i) + 0.5, v = 0.5 - vertices.getY(i)
      const width = 0.63 + v * 0.14
      const fold = Math.sin(u * Math.PI * 8 + v * 0.35 + index * 0.7)
      const x = center + (u - 0.5) * width + Math.sin(v * Math.PI) * (index ? 0.025 : -0.025)
      const y = 4.56 - v * 2.7 + v ** 8 * Math.sin(u * Math.PI * 8) * 0.035
      const z = -3.89 + fold * (0.065 + v * 0.015) + Math.sin(v * Math.PI) * 0.04
      vertices.setXYZ(i, x, y, z)
    }
    geometry.computeVertexNormals()
    const panel = new THREE.Mesh(geometry, fabric)
    panel.castShadow = panel.receiveShadow = true
    curtains.add(panel)
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.012, 8, 16), wood)
      ring.rotation.y = Math.PI / 2
      ring.position.set(center - 0.28 + i * 0.14, 4.61, -3.96)
      curtains.add(ring)
    }
  }
  return curtains
}
