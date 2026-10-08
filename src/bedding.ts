import * as THREE from 'three'

export function createBedding() {
  const bedding = new THREE.Group()
  function cloth(pattern: 'patchwork' | 'stars' | 'sheet') {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const c = canvas.getContext('2d')!
    c.fillStyle = '#fff8e8'; c.fillRect(0, 0, 512, 512)
    if (pattern === 'patchwork') {
      const colors = ['#82adc5', '#f2efdc', '#a92b36', '#263b51', '#f7f3e4', '#b6d1dd']
      for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
        c.fillStyle = colors[(row * 3 + col * 5) % colors.length]!
        c.fillRect(col * 64, row * 64, 64, 64)
        c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 2
        for (let line = 8; line < 64; line += 10) {
          c.beginPath(); c.moveTo(col * 64 + line, row * 64); c.lineTo(col * 64 + line, row * 64 + 64); c.stroke()
          c.beginPath(); c.moveTo(col * 64, row * 64 + line); c.lineTo(col * 64 + 64, row * 64 + line); c.stroke()
        }
      }
    } else if (pattern === 'stars') {
      c.fillStyle = '#c93042'
      for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
        const x = col * 80 + (row % 2) * 35, y = row * 78 + 20
        const radius = (row + col) % 3 === 0 ? 15 : 8
        c.beginPath()
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5
          const r = i % 2 === 0 ? radius : radius * 0.42
          const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r
          if (i === 0) c.moveTo(px, py); else c.lineTo(px, py)
        }
        c.closePath(); c.fill()
      }
    } else {
      for (let x = 12; x < 512; x += 25) for (let y = 0; y < 512; y += 16) {
        c.fillStyle = x % 3 === 0 ? '#a14943' : '#727c82'
        c.fillRect(x, y, 3, 5)
      }
    }
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshStandardMaterial({ map, roughness: 1 })
  }
  const fittedSheet = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.44, 3.26), cloth('sheet'))
  fittedSheet.position.set(0, 0.96, 2.25)
  fittedSheet.receiveShadow = fittedSheet.castShadow = true
  bedding.add(fittedSheet)
  // A pillowcase has a rectangular stitched perimeter and softly filled
  // faces, rather than the outline and highlights of a squashed sphere.
  function pillow(material: THREE.Material, x: number, y: number, z: number, tilt: number) {
    const group = new THREE.Group()
    for (const side of [-1, 1]) {
      const geometry = new THREE.PlaneGeometry(2, 2, 40, 40)
      const vertices = geometry.attributes.position!
      for (let i = 0; i < vertices.count; i++) {
        const u = vertices.getX(i), v = vertices.getY(i)
        const fill = Math.max(0, (1 - u * u) * (1 - v * v)) ** 0.45
        const px = u * 0.59 * (1 - 0.025 * Math.abs(v) ** 12)
        const pz = v * 0.43 * (1 - 0.025 * Math.abs(u) ** 12)
        const gathers = (1 - fill) * 0.005 * Math.sin(u * 21 + v * 17)
        vertices.setXYZ(i, px, side * (0.008 + fill * 0.15 + gathers), pz)
      }
      geometry.computeVertexNormals()
      const face = new THREE.Mesh(geometry, material)
      face.castShadow = face.receiveShadow = true
      group.add(face)
    }
    group.position.set(x, y, z)
    group.rotation.x = tilt
    group.rotation.y = x * 0.06
    bedding.add(group)
  }
  const weaveCanvas = document.createElement('canvas')
  weaveCanvas.width = weaveCanvas.height = 128
  const weave = weaveCanvas.getContext('2d')!
  weave.fillStyle = '#888888'; weave.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 2) for (let x = 0; x < 128; x += 2) {
    weave.fillStyle = (x + y) % 4 ? '#909090' : '#808080'
    weave.fillRect(x, y, 1, 2)
  }
  const bump = new THREE.CanvasTexture(weaveCanvas)
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping
  bump.repeat.set(8, 8)
  const red = new THREE.MeshPhysicalMaterial({ color: '#d51a35', roughness: 1,
    sheen: 0.65, sheenColor: new THREE.Color('#e94858'), sheenRoughness: 1,
    bumpMap: bump, bumpScale: 0.0015, side: THREE.DoubleSide })
  const patchwork = cloth('patchwork'); patchwork.side = THREE.DoubleSide
  const stars = cloth('stars'); stars.side = THREE.DoubleSide
  const blue = new THREE.MeshStandardMaterial({ color: '#a7d7ec', roughness: 1, side: THREE.DoubleSide })
  pillow(red, -0.6, 1.58, 0.94, 0.95)
  pillow(blue, 0.6, 1.58, 0.96, 0.93)
  pillow(stars, -0.6, 1.39, 1.49, 0.65)
  pillow(patchwork, 0.6, 1.38, 1.49, 0.65)

  function duvet(start: number, end: number, height: number, thickness: number, flap: boolean) {
    const geometry = new THREE.PlaneGeometry(1, 1, 64, 64)
    const points = geometry.attributes.position!
    for (let i = 0; i < points.count; i++) {
      const u = points.getX(i) + 0.5, v = points.getY(i) + 0.5
      const x = (u - 0.5) * 2.65
      const z = start + v * (end - start)
      const sideDrape = THREE.MathUtils.smoothstep(Math.abs(x), 1.02, 1.34) * 0.4
      const footDrape = flap ? 0 : THREE.MathUtils.smoothstep(z, 3.72, 4.2) * 0.35
      const broadFill = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * (flap ? 0.07 : 0.11)
      const crease = -0.028 * Math.exp(-(((x - 0.6 + (z - 2.8) * 0.12) / 0.16) ** 2))
      const relaxed = 0.012 * Math.sin(x * 2.3 + z * 1.8)
      const edgeRound = THREE.MathUtils.smoothstep(v, 0.85, 1) * (flap ? 0.055 : 0.015)
      points.setXYZ(i, x, height + broadFill + crease + relaxed - sideDrape - footDrape - edgeRound, z)
    }
    geometry.computeVertexNormals()
    const top = new THREE.Mesh(geometry, red)
    top.castShadow = top.receiveShadow = true
    bedding.add(top)
    const underside = new THREE.Mesh(geometry.clone(), red)
    underside.position.y = -thickness
    underside.receiveShadow = true
    bedding.add(underside)
    // Close the padded edge with a fabric strip rather than a cylindrical roll.
    const perimeter: number[] = []
    for (let i = 0; i < 64; i++) perimeter.push(i)
    for (let i = 0; i < 64; i++) perimeter.push(i * 65 + 64)
    for (let i = 64; i > 0; i--) perimeter.push(64 * 65 + i)
    for (let i = 64; i > 0; i--) perimeter.push(i * 65)
    const edgePositions: number[] = []
    for (let i = 0; i < perimeter.length; i++) {
      const a = perimeter[i]!, b = perimeter[(i + 1) % perimeter.length]!
      const p = new THREE.Vector3().fromBufferAttribute(points, a)
      const q = new THREE.Vector3().fromBufferAttribute(points, b)
      edgePositions.push(p.x, p.y, p.z, q.x, q.y, q.z, p.x, p.y - thickness, p.z,
        q.x, q.y, q.z, q.x, q.y - thickness, q.z, p.x, p.y - thickness, p.z)
    }
    const edge = new THREE.BufferGeometry()
    edge.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3))
    edge.computeVertexNormals()
    const hem = new THREE.Mesh(edge, red)
    hem.castShadow = hem.receiveShadow = true
    bedding.add(hem)
  }
  duvet(1.86, 4.16, 1.31, 0.055, false)
  duvet(1.76, 2.7, 1.48, 0.09, true)
  return bedding
}
