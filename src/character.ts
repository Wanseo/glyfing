import * as THREE from 'three'

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
  ctx.fillStyle = '#95877c'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 13000; i++) {
    const value = 110 + random() * 90
    ctx.strokeStyle = `rgb(${value + 12},${value + 5},${value})`
    ctx.beginPath()
    ctx.arc(random() * 256, random() * 256, 1 + random() * 2, 0, Math.PI * 1.6)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(fabric)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 2)
  texture.colorSpace = THREE.SRGBColorSpace
  const fur = new THREE.MeshStandardMaterial({ color: '#c2b4a7', map: texture, bumpMap: texture, bumpScale: 0.035, roughness: 1 })
  const skin = new THREE.MeshStandardMaterial({ color: '#a99c90', roughness: 1 })
  const cream = new THREE.MeshStandardMaterial({ color: '#e0d6c8', roughness: 0.65 })
  const dark = new THREE.MeshStandardMaterial({ color: '#291c19', roughness: 0.65 })
  const iris = new THREE.MeshStandardMaterial({ color: '#684537', roughness: 0.4 })
  const sphere = new THREE.SphereGeometry(1, 32, 24)
  const tuftGeometry = new THREE.SphereGeometry(1, 5, 4)
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
    const tufts = new THREE.InstancedMesh(tuftGeometry, fur, count)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const y = random() * 2 - 1
      const angle = random() * Math.PI * 2
      const radius = Math.sqrt(1 - y * y)
      const v = new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle))
      if (squircle) v.set(power(v.x), power(v.y), power(v.z))
      dummy.position.set(position[0]! + v.x * scale[0]!, position[1]! + v.y * scale[1]!, position[2]! + v.z * scale[2]!)
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize())
      const size = 0.012 + random() * 0.014
      dummy.scale.set(size, size * 1.7, size)
      dummy.updateMatrix()
      tufts.setMatrixAt(i, dummy.matrix)
    }
    parent.add(tufts)
  }
  fuzzy(torso, [0, 1.25, 0], [0.7, 0.81, 0.43], 1500)
  fuzzy(torso, [0, 2.28, 0], [1.08, 0.72, 0.47], 3800, true)
  const legs = [-1, 1].map(side => {
    const leg = new THREE.Group()
    leg.position.set(side * 0.36, 0.51, 0)
    root.add(leg)
    fuzzy(leg, [0, -0.27, 0.03], [0.28, 0.32, 0.32], 550)
    return leg
  })
  const arms = [-1, 1].map(side => {
    const arm = new THREE.Group()
    arm.position.set(side * 0.7, 1.6, 0)
    arm.rotation.z = side * 0.32
    torso.add(arm)
    fuzzy(arm, [side * 0.18, -0.32, 0], [0.24, 0.46, 0.25], 700)
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
  paint.fillStyle = '#fff9ed'
  paint.fillRect(0, 0, 512, 512)
  paint.strokeStyle = '#cf1734'
  paint.lineWidth = 21
  paint.lineCap = 'round'
  for (let i = 0; i < 16; i++) {
    const x = random() * 512, y = random() * 512
    paint.beginPath()
    paint.moveTo(x, y)
    paint.bezierCurveTo(x + 65, y - 60, x - 50, y + 70, x + 80, y + 100)
    paint.stroke()
  }
  const pattern = new THREE.CanvasTexture(cloth)
  pattern.colorSpace = THREE.SRGBColorSpace
  const briefs = new THREE.MeshStandardMaterial({ map: pattern, roughness: 1 })
  oval(torso, briefs, [0, 0.69, 0.008], [0.655, 0.37, 0.445])
  const waistband = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.047, 10, 48), new THREE.MeshStandardMaterial({ color: '#c91935', roughness: 1 }))
  waistband.rotation.x = Math.PI / 2
  waistband.scale.y = 0.7
  waistband.position.y = 0.92
  torso.add(waistband)
  return { root, torso, legs, arms }
}
