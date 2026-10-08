import * as THREE from 'three'

// Visually matched to the supplied photo; the original image file is not
// available in the workspace for exact pixel sampling.
const referenceColors = {
  fur: '#b6a69c',
  eyelids: '#adaeac',
  briefs: '#eee5de',
  hearts: '#db5c88',
  waistband: '#bd1733',
}

// A little sewn plush: three sleepy eyes, a broad head, and patterned briefs.
export function createCharacter() {
  const root = new THREE.Group()
  const torso = new THREE.Group()
  root.add(torso)
  let seed = 37
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const fabric = document.createElement('canvas')
  fabric.width = fabric.height = 256
  const ctx = fabric.getContext('2d')!
  ctx.fillStyle = referenceColors.fur
  ctx.fillRect(0, 0, 256, 256)
  ctx.lineWidth = 0.6
  for (let i = 0; i < 24000; i++) {
    const variation = random() * 16 - 8
    ctx.strokeStyle = `rgb(${182 + variation},${166 + variation},${156 + variation})`
    const x = random() * 256, y = random() * 256
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + 3, y - 3, x - 2, y - 5, x + 1, y - 8)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(fabric)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 2)
  texture.colorSpace = THREE.SRGBColorSpace
  const fur = new THREE.MeshStandardMaterial({ color: '#ffffff', map: texture, bumpMap: texture, bumpScale: 0.008, roughness: 1 })
  const fibers = new THREE.MeshStandardMaterial({ color: referenceColors.fur, roughness: 1 })
  const skin = new THREE.MeshStandardMaterial({ color: referenceColors.eyelids, roughness: 1 })
  const cream = new THREE.MeshStandardMaterial({ color: '#e0d6c8', roughness: 0.65 })
  const dark = new THREE.MeshStandardMaterial({ color: '#291c19', roughness: 0.65 })
  const iris = new THREE.MeshStandardMaterial({ color: '#684537', roughness: 0.4 })
  const sphere = new THREE.SphereGeometry(1, 32, 24)
  // Actual curved strands give the silhouette the loose, overlapping pile
  // of the new fur reference, including when the character turns around.
  const strandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.008, 0),
    new THREE.Vector3(0.01, 0.028, 0.006),
    new THREE.Vector3(-0.006, 0.059, 0.012),
    new THREE.Vector3(0.019, 0.083, 0.006),
    new THREE.Vector3(0.041, 0.097, -0.004),
  ])
  const tuftGeometry = new THREE.TubeGeometry(strandCurve, 8, 0.0032, 4, false)
  const strandVertices = tuftGeometry.attributes.position!
  for (let i = 0; i < strandVertices.count; i++) {
    const t = Math.floor(i / 5) / 8
    const center = strandCurve.getPointAt(t)
    const taper = 1 - t * 0.75
    strandVertices.setXYZ(i,
      center.x + (strandVertices.getX(i) - center.x) * taper,
      center.y + (strandVertices.getY(i) - center.y) * taper,
      center.z + (strandVertices.getZ(i) - center.z) * taper)
  }
  tuftGeometry.computeVertexNormals()
  function oval(parent: THREE.Group, material: THREE.Material, position: number[], scale: number[]) {
    const mesh = new THREE.Mesh(sphere, material)
    mesh.position.set(position[0]!, position[1]!, position[2]!)
    mesh.scale.set(scale[0]!, scale[1]!, scale[2]!)
    parent.add(mesh)
    return mesh
  }
  function fuzzy(parent: THREE.Group, position: number[], scale: number[], count: number, squircle = false) {
    const geometry = sphere.clone()
    const power = (v: number) => Math.sign(v) * Math.abs(v) ** 0.72
    if (squircle) {
      const vertices = geometry.attributes.position!
      for (let i = 0; i < vertices.count; i++) vertices.setXYZ(i, power(vertices.getX(i)), power(vertices.getY(i)), power(vertices.getZ(i)))
      geometry.computeVertexNormals()
    }
    const mesh = new THREE.Mesh(geometry, fur)
    mesh.position.set(position[0]!, position[1]!, position[2]!)
    mesh.scale.set(scale[0]!, scale[1]!, scale[2]!)
    parent.add(mesh)
    const fiberCount = count * 5
    const tufts = new THREE.InstancedMesh(tuftGeometry, fibers, fiberCount)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < fiberCount; i++) {
      const y = 1 - 2 * (i + 0.5) / fiberCount
      const angle = i * Math.PI * (3 - Math.sqrt(5))
      const radius = Math.sqrt(1 - y * y)
      const v = new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle))
      if (squircle) v.set(power(v.x), power(v.y), power(v.z))
      dummy.position.set(position[0]! + v.x * scale[0]!, position[1]! + v.y * scale[1]!, position[2]! + v.z * scale[2]!)
      const exponent = squircle ? 2 / 0.72 - 1 : 1
      const normal = new THREE.Vector3(
        Math.sign(v.x) * Math.abs(v.x) ** exponent / scale[0]!,
        Math.sign(v.y) * Math.abs(v.y) ** exponent / scale[1]!,
        Math.sign(v.z) * Math.abs(v.z) ** exponent / scale[2]!,
      ).normalize()
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      dummy.rotateY(random() * Math.PI * 2)
      dummy.scale.set(0.7 + random() * 0.6, 0.55 + random() * 0.65, 0.7 + random() * 0.6)
      dummy.updateMatrix()
      tufts.setMatrixAt(i, dummy.matrix)
    }
    parent.add(tufts)
  }
  fuzzy(torso, [0, 1.38, 0], [0.53, 0.5, 0.35], 1500)
  fuzzy(torso, [0, 2.28, 0], [1.08, 0.72, 0.47], 3800, true)
  const legs = [-1, 1].map(side => {
    const leg = new THREE.Group()
    leg.position.set(side * 0.27, 0.84, 0)
    root.add(leg)
    fuzzy(leg, [0, -0.17, 0.03], [0.21, 0.19, 0.25], 550)
    return leg
  })
  const arms = [-1, 1].map(side => {
    const arm = new THREE.Group()
    arm.position.set(side * 0.51, 1.5, 0)
    arm.rotation.z = side * 0.32
    torso.add(arm)
    fuzzy(arm, [side * 0.12, -0.305, 0], [0.18, 0.405, 0.19], 700)
    return arm
  })
  for (const [x, y] of [[-0.62, 2.25], [0, 2.43], [0.62, 2.25]]) {
    const eye = new THREE.Group()
    eye.position.set(x!, y!, 0.45)
    torso.add(eye)
    oval(eye, skin, [0, 0, 0], [0.29, 0.32, 0.09])
    oval(eye, cream, [0, 0, 0.065], [0.235, 0.245, 0.105])
    oval(eye, iris, [0.025, -0.035, 0.155], [0.115, 0.12, 0.036])
    oval(eye, dark, [0.025, -0.035, 0.186], [0.057, 0.073, 0.014])
    oval(eye, cream, [-0.006, 0.008, 0.199], [0.022, 0.023, 0.008])
    const lid = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), skin)
    lid.position.set(0, 0.01, 0.072)
    lid.scale.set(0.245, 0.257, 0.128)
    lid.rotation.z = x! * -0.12
    eye.add(lid)
    const lowerLid = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), skin)
    lowerLid.position.set(0, 0, 0.072)
    lowerLid.scale.set(0.247, 0.259, 0.13)
    lowerLid.rotation.z = x! * -0.12
    eye.add(lowerLid)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.024, 8, 48), skin)
    rim.scale.y = 1.1
    rim.position.z = 0.045
    eye.add(rim)
  }
  oval(torso, dark, [0, 1.83, 0.454], [0.4, 0.075, 0.045])
  for (let i = 0; i < 6; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.092 + (i % 2) * 0.018, 0.055), cream)
    tooth.position.set((i - 2.5) * 0.112, 1.824, 0.49)
    tooth.rotation.z = (random() - 0.5) * 0.25
    torso.add(tooth)
  }
  const cloth = document.createElement('canvas')
  cloth.width = cloth.height = 512
  const paint = cloth.getContext('2d')!
  paint.fillStyle = referenceColors.briefs
  paint.fillRect(0, 0, 512, 512)
  paint.fillStyle = referenceColors.hearts
  for (let row = -1; row < 6; row++) {
    for (let column = -1; column < 6; column++) {
      const x = column * 112 + (row % 2 === 0 ? 0 : 56)
      const y = row * 104 + 36
      paint.save()
      paint.translate(x, y)
      paint.rotate(((row + column) % 3 - 1) * 0.16)
      paint.beginPath()
      paint.moveTo(0, 26)
      paint.bezierCurveTo(-7, 17, -33, 0, -28, -15)
      paint.bezierCurveTo(-23, -32, -7, -32, 0, -17)
      paint.bezierCurveTo(7, -32, 23, -32, 28, -15)
      paint.bezierCurveTo(33, 0, 7, 17, 0, 26)
      paint.closePath()
      paint.fill()
      paint.restore()
    }
  }
  const pattern = new THREE.CanvasTexture(cloth)
  pattern.colorSpace = THREE.SRGBColorSpace
  const briefs = new THREE.MeshStandardMaterial({ map: pattern, roughness: 1 })
  oval(torso, briefs, [0, 1.06, 0.008], [0.52, 0.28, 0.36])
  const waistband = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.038, 10, 48), new THREE.MeshStandardMaterial({ color: referenceColors.waistband, roughness: 1 }))
  waistband.rotation.x = Math.PI / 2
  waistband.scale.y = 0.7
  waistband.position.y = 1.24
  torso.add(waistband)
  return { root, torso, legs, arms }
}
