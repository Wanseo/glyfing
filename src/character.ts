import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

// Visually matched to the supplied photo; the original image file is not
// available in the workspace for exact pixel sampling.
const referenceColors = {
  fur: '#c4bdb1',
  eyelids: '#c3bfb4',
  briefs: '#eee5de',
  hearts: '#d83f7d',
  waistband: '#bd1733',
}

// A little sewn plush: three sleepy eyes, a broad head, and patterned briefs.
export function createCharacter() {
  const root = new THREE.Group()
  const torso = new THREE.Group()
  const eyelids: { upper: THREE.Mesh; lower: THREE.Mesh; eyeball: THREE.Group; closed: THREE.Mesh; crease: THREE.Mesh }[] = []
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
    ctx.strokeStyle = `rgb(${196 + variation},${189 + variation},${177 + variation})`
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
  const fibers = new THREE.MeshPhysicalMaterial({ color: referenceColors.fur, roughness: 1,
    sheen: 0.65, sheenColor: new THREE.Color('#e0d3c9'), sheenRoughness: 1 })
  const weaveCanvas = document.createElement('canvas')
  weaveCanvas.width = weaveCanvas.height = 128
  const weaveContext = weaveCanvas.getContext('2d')!
  weaveContext.fillStyle = '#888888'
  weaveContext.fillRect(0, 0, 128, 128)
  for (let row = 0; row < 128; row += 2) for (let col = 0; col < 128; col += 2) {
    weaveContext.fillStyle = (row + col) % 4 ? '#949494' : '#808080'
    weaveContext.fillRect(col, row, 1, 2)
  }
  const weave = new THREE.CanvasTexture(weaveCanvas)
  const skin = new THREE.MeshStandardMaterial({ color: referenceColors.eyelids, bumpMap: weave, bumpScale: 0.0015, roughness: 1 })
  const thread = new THREE.MeshStandardMaterial({ color: '#e2d9c9', roughness: 1 })
  const cream = new THREE.MeshStandardMaterial({ color: '#e0d6c8', roughness: 0.65 })
  const toothMaterial = new THREE.MeshPhysicalMaterial({ color: '#fffdf6', roughness: 0.24, clearcoat: 0.35, clearcoatRoughness: 0.25 })
  const dark = new THREE.MeshStandardMaterial({ color: '#291c19', roughness: 0.65 })
  const iris = new THREE.MeshStandardMaterial({ color: '#684537', roughness: 0.4 })
  const sphere = new THREE.SphereGeometry(1, 32, 24)
  // Soft, overlapping fleece locks give the plush a fluffy, tufted silhouette.
  const strandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.008, 0),
    new THREE.Vector3(-0.012, 0.043, 0.01),
    new THREE.Vector3(0.007, 0.092, 0.02),
    new THREE.Vector3(0.032, 0.135, 0.015),
    new THREE.Vector3(0.053, 0.143, 0.003),
    new THREE.Vector3(0.065, 0.121, -0.009),
  ])
  const tuftGeometry = new THREE.TubeGeometry(strandCurve, 10, 0.012, 5, false)
  const strandVertices = tuftGeometry.attributes.position!
  for (let i = 0; i < strandVertices.count; i++) {
    const t = Math.floor(i / 6) / 10
    const center = strandCurve.getPointAt(t)
    const taper = 1 - t * 0.72
    strandVertices.setXYZ(i,
      center.x + (strandVertices.getX(i) - center.x) * taper,
      center.y + (strandVertices.getY(i) - center.y) * taper,
      center.z + (strandVertices.getZ(i) - center.z) * taper)
  }
  tuftGeometry.computeVertexNormals()
  tuftGeometry.computeBoundingBox()
  const mouthClearance = new THREE.Box3(
    new THREE.Vector3(-0.325, 1.755, 0.445),
    new THREE.Vector3(0.325, 1.893, 1),
  )
  const tuftBounds = new THREE.Box3()
  function oval(parent: THREE.Group, material: THREE.Material, position: number[], scale: number[]) {
    const mesh = new THREE.Mesh(sphere, material)
    mesh.castShadow = true
    mesh.position.set(position[0]!, position[1]!, position[2]!)
    mesh.scale.set(scale[0]!, scale[1]!, scale[2]!)
    parent.add(mesh)
    return mesh
  }
  function fuzzy(parent: THREE.Group, position: number[], scale: number[], count: number, squircle = false) {
    const geometry = squircle ? new THREE.SphereGeometry(1, 64, 48) : sphere.clone()
    const power = (v: number) => Math.abs(v) < 1e-7 ? 0 : Math.sign(v) * Math.abs(v) ** 0.72
    if (squircle) {
      const vertices = geometry.attributes.position!
      const normals = geometry.attributes.normal!
      const normal = new THREE.Vector3()
      const exponent = 2 / 0.72 - 1
      for (let i = 0; i < vertices.count; i++) {
        const x = power(vertices.getX(i)), y = power(vertices.getY(i)), z = power(vertices.getZ(i))
        vertices.setXYZ(i, x, y, z)
        // Analytic normals agree across duplicate UV edges and at the crown.
        normal.set(Math.sign(x) * Math.abs(x) ** exponent,
          Math.sign(y) * Math.abs(y) ** exponent,
          Math.sign(z) * Math.abs(z) ** exponent).normalize()
        normals.setXYZ(i, normal.x, normal.y, normal.z)
      }
    }
    const isBody = !squircle && position[1] === 1.38
    const neckWidth = (y: number) => {
      const t = THREE.MathUtils.clamp((y + 0.15) / 1.15, 0, 1)
      return 1 - 0.56 * t * t * (3 - 2 * t)
    }
    if (isBody) {
      const vertices = geometry.attributes.position!
      for (let i = 0; i < vertices.count; i++) {
        vertices.setX(i, vertices.getX(i) * neckWidth(vertices.getY(i)))
      }
      geometry.computeVertexNormals()
    }
    // The head's continuous base avoids a texture join on the back and top.
    const mesh = new THREE.Mesh(geometry, squircle ? fibers : fur)
    mesh.castShadow = true
    mesh.position.set(position[0]!, position[1]!, position[2]!)
    mesh.scale.set(scale[0]!, scale[1]!, scale[2]!)
    parent.add(mesh)
    const fiberCount = count * 4
    const tufts = new THREE.InstancedMesh(tuftGeometry, fibers, fiberCount)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < fiberCount; i++) {
      const y = 1 - 2 * (i + 0.5) / fiberCount
      const angle = i * Math.PI * (3 - Math.sqrt(5)) + (random() - 0.5) * 0.035
      const radius = Math.sqrt(1 - y * y)
      const v = new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle))
      if (squircle) v.set(power(v.x), power(v.y), power(v.z))
      const bodyWidth = isBody ? neckWidth(v.y) : 1
      dummy.position.set(position[0]! + v.x * bodyWidth * scale[0]!, position[1]! + v.y * scale[1]!, position[2]! + v.z * scale[2]!)
      const px = dummy.position.x, py = dummy.position.y, pz = dummy.position.z
      const aroundEyes = squircle && pz > 0.2 && [[-0.62, 2.25], [0, 2.43], [0.62, 2.25]].some(([ex, ey]) =>
        ((px - ex!) / 0.33) ** 2 + ((py - ey!) / 0.35) ** 2 < 1)
      // Hide fibers only inside the actual garment, leaving fleece along the flanks.
      const overBriefs = isBody && py < 1.3 &&
        (px / 0.68) ** 2 + ((py - 1.06) / 0.28) ** 2 + ((pz - 0.03) / 0.6) ** 2 < 1.03
      if (aroundEyes || overBriefs) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        tufts.setMatrixAt(i, dummy.matrix)
        continue
      }
      const exponent = squircle ? 2 / 0.72 - 1 : 1
      const normal = new THREE.Vector3(
        Math.sign(v.x) * Math.abs(v.x) ** exponent / scale[0]!,
        Math.sign(v.y) * Math.abs(v.y) ** exponent / scale[1]!,
        Math.sign(v.z) * Math.abs(v.z) ** exponent / scale[2]!,
      ).normalize()
      if (isBody) {
        const t = THREE.MathUtils.clamp((v.y + 0.15) / 1.15, 0, 1)
        const widthDerivative = -0.56 * 6 * t * (1 - t) / 1.15
        normal.set(v.x / (bodyWidth * scale[0]!),
          (v.y - v.x * v.x * widthDerivative / bodyWidth) / scale[1]!,
          v.z / scale[2]!).normalize()
      }
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      dummy.rotateY(random() * Math.PI * 2)
      dummy.scale.set(0.9 + random() * 0.4, 0.7 + random() * 0.6, 0.9 + random() * 0.4)
      // Gentle variation separates soft clumps without harsh dark strands.
      tufts.setColorAt(i, new THREE.Color().setScalar(0.93 + random() * 0.1))
      // Shorter fleece near the teeth fills the mouth border without long overhangs.
      if ((squircle || isBody) && pz > 0.2 &&
        Math.abs(px) < 0.52 && Math.abs(py - 1.83) < 0.24) {
        dummy.scale.multiplyScalar(0.45)
      }
      dummy.updateMatrix()
      // Check the whole transformed curl, including tips that reach in from outside.
      tuftBounds.copy(tuftGeometry.boundingBox!).applyMatrix4(dummy.matrix)
      if ((squircle || isBody) && tuftBounds.intersectsBox(mouthClearance)) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
      }
      tufts.setMatrixAt(i, dummy.matrix)
    }
    parent.add(tufts)
  }
  fuzzy(torso, [0, 1.38, 0.09], [0.7, 0.5, 0.56], 1500)
  fuzzy(torso, [0, 2.28, 0], [1.08, 0.72, 0.47], 3800, true)
  const legs = [-1, 1].map(side => {
    const leg = new THREE.Group()
    leg.position.set(side * 0.47, 0.9, 0)
    leg.rotation.z = side * 0.12
    root.add(leg)
    fuzzy(leg, [0, -0.14, 0.03], [0.21, 0.15, 0.25], 550)
    return leg
  })
  const arms = [-1, 1].map(side => {
    const arm = new THREE.Group()
    arm.position.set(side * 0.67, 1.5, 0)
    arm.rotation.z = side * 0.32
    torso.add(arm)
    fuzzy(arm, [side * 0.12, -0.26, 0], [0.18, 0.36, 0.19], 700)
    return arm
  })
  for (const [x, y] of [[-0.62, 2.25], [0, 2.43], [0.62, 2.25]]) {
    const eye = new THREE.Group()
    eye.position.set(x!, y!, 0.45)
    torso.add(eye)
    oval(eye, skin, [0, 0, 0], [0.29, 0.32, 0.09])
    const eyeball = new THREE.Group()
    eye.add(eyeball)
    oval(eyeball, cream, [0, 0, 0.065], [0.235, 0.245, 0.075])
    // Keep the iris and pupil behind the cloth lids so their edges occlude them.
    oval(eyeball, iris, [0, 0.008, 0.146], [0.115, 0.12, 0.014])
    oval(eyeball, dark, [0, 0.008, 0.158], [0.057, 0.073, 0.008])
    oval(eyeball, cream, [-0.031, 0.051, 0.166], [0.022, 0.023, 0.004])
    const upperGeometry = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2)
    const upperVertices = upperGeometry.attributes.position!
    for (let i = 0; i < upperVertices.count; i++) {
      const x = upperVertices.getX(i), y = upperVertices.getY(i)
      upperVertices.setY(i, y + 0.12 * (1 - x * x) * Math.exp(-y * y * 12))
    }
    upperGeometry.computeVertexNormals()
    const lid = new THREE.Mesh(upperGeometry, skin)
    lid.position.set(0, 0.045, 0.072)
    lid.scale.set(0.245, 0.257, 0.128)
    lid.rotation.z = x! * -0.12
    eye.add(lid)
    const lowerGeometry = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38)
    const lowerVertices = lowerGeometry.attributes.position!
    for (let i = 0; i < lowerVertices.count; i++) {
      const x = lowerVertices.getX(i), y = lowerVertices.getY(i)
      lowerVertices.setY(i, y + 0.32 * x * x * Math.exp(-(((y + 0.368) / 0.22) ** 2)))
    }
    lowerGeometry.computeVertexNormals()
    const lowerLid = new THREE.Mesh(lowerGeometry, skin)
    lowerLid.position.set(0, 0, 0.072)
    lowerLid.scale.set(0.247, 0.259, 0.13)
    lowerLid.rotation.z = x! * -0.12
    eye.add(lowerLid)
    const closed = oval(eye, skin, [0, 0, 0.09], [0.244, 0.25, 0.15])
    const crease = oval(eye, skin.clone(), [0, -0.018, 0.24], [0.17, 0.006, 0.007])
    ;(crease.material as THREE.MeshStandardMaterial).color.set('#858684')
    closed.visible = crease.visible = false
    eyelids.push({ upper: lid, lower: lowerLid, eyeball, closed, crease })
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.272, 0.016, 12, 64), skin)
    rim.scale.y = 1.1
    rim.position.z = 0.045
    rim.scale.z = 0.5
    eye.add(rim)
    for (let stitch = 0; stitch < 36; stitch++) {
      const angle = stitch * Math.PI * 2 / 36
      const points = [0, 0.5, 1].map(t => {
        const a = angle + t * 0.085
        const radius = 0.262 + Math.sin(t * Math.PI) * 0.003
        return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius * 1.1, 0.061)
      })
      const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 4, 0.0025, 4, false), thread)
      eye.add(seam)
    }
  }
  oval(torso, dark, [0, 1.83, 0.454], [0.4, 0.075, 0.045])
  for (let i = 0; i < 6; i++) {
    const tooth = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.106 + (i % 2) * 0.014, 0.07, 4, 0.016), toothMaterial)
    tooth.position.set((i - 2.5) * 0.112, 1.824, 0.49)
    tooth.rotation.z = (random() - 0.5) * 0.12
    torso.add(tooth)
  }
  const cloth = document.createElement('canvas')
  cloth.width = cloth.height = 512
  const paint = cloth.getContext('2d')!
  paint.fillStyle = referenceColors.briefs
  paint.fillRect(0, 0, 512, 512)
  paint.fillStyle = referenceColors.hearts
  for (let row = 0; row < 3; row++) {
    for (let column = -1; column < 9; column++) {
      const x = column * 64 + 40
      const y = row * 105 + 165
      paint.save()
      paint.translate(x, y)
      paint.scale(0.85, 0.85)
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
  paint.fillStyle = referenceColors.waistband
  paint.fillRect(0, 132, 512, 28)
  // Printed hearts share the same fine cotton grain as the white cloth.
  for (let y = 0; y < 512; y += 2) for (let x = 0; x < 512; x += 2) {
    paint.fillStyle = (x + y) % 4 ? 'rgba(255,255,255,0.08)' : 'rgba(74,58,49,0.06)'
    paint.fillRect(x, y, 1, 2)
  }
  const cottonCanvas = document.createElement('canvas')
  cottonCanvas.width = cottonCanvas.height = 512
  const cottonContext = cottonCanvas.getContext('2d')!
  const cottonPixels = cottonContext.createImageData(512, 512)
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const weaveHeight = ((x % 4 < 2) !== (y % 4 < 2)) ? 12 : -12
    const folds = 7 * Math.sin(x * 0.065 + 1.2 * Math.sin(y * 0.025))
    const value = 128 + weaveHeight + folds + random() * 8 - 4
    const index = (y * 512 + x) * 4
    cottonPixels.data[index] = cottonPixels.data[index + 1] = cottonPixels.data[index + 2] = value
    cottonPixels.data[index + 3] = 255
  }
  cottonContext.putImageData(cottonPixels, 0, 0)
  const cottonBump = new THREE.CanvasTexture(cottonCanvas)
  cottonBump.wrapS = cottonBump.wrapT = THREE.RepeatWrapping
  cottonBump.repeat.set(3, 2)
  const pattern = new THREE.CanvasTexture(cloth)
  pattern.colorSpace = THREE.SRGBColorSpace
  const briefs = new THREE.MeshPhysicalMaterial({
    map: pattern, bumpMap: cottonBump, bumpScale: 0.004,
    roughness: 1, sheen: 0.35, sheenColor: new THREE.Color('#efe5dc'), sheenRoughness: 1,
  })
  oval(torso, briefs, [0, 1.06, 0.03], [0.68, 0.28, 0.6])
  function blink(amount: number) {
    for (const { upper, lower, eyeball, closed, crease } of eyelids) {
      upper.rotation.x = amount * 1.2
      lower.rotation.x = -amount * 0.9
      eyeball.scale.y = 1 - amount * 0.95
      eyeball.visible = amount < 0.9
      closed.visible = crease.visible = amount >= 0.9
    }
  }
  return { root, torso, legs, arms, blink }
}
