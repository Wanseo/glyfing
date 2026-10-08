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
  function pillow(material: THREE.Material, x: number, y: number, z: number, width: number, depth: number, tilt: number) {
    const geometry = new THREE.SphereGeometry(1, 48, 32)
    const vertices = geometry.attributes.position!
    const uv = geometry.attributes.uv!
    const normals = geometry.attributes.normal!
    const normal = new THREE.Vector3()
    for (let i = 0; i < vertices.count; i++) {
      const round = (n: number) => Math.abs(n) < 1e-7 ? 0 : Math.sign(n) * Math.abs(n) ** 0.6
      const x = round(vertices.getX(i)), y = round(vertices.getY(i)), z = round(vertices.getZ(i))
      vertices.setXYZ(i, x, y, z)
      uv.setXY(i, (x + 1) / 2, (1 - z) / 2)
      const exponent = 2 / 0.6 - 1
      normal.set(Math.sign(x) * Math.abs(x) ** exponent,
        Math.sign(y) * Math.abs(y) ** exponent,
        Math.sign(z) * Math.abs(z) ** exponent).normalize()
      normals.setXYZ(i, normal.x, normal.y, normal.z)
    }
    const mesh = new THREE.Mesh(geometry, material)
    mesh.scale.set(width, 0.17, depth)
    mesh.position.set(x, y, z)
    mesh.rotation.x = tilt
    mesh.rotation.y = x * 0.15
    mesh.castShadow = mesh.receiveShadow = true
    bedding.add(mesh)
  }
  const red = new THREE.MeshStandardMaterial({ color: '#bf1930', roughness: 1, side: THREE.DoubleSide })
  pillow(red, 0.15, 1.46, 0.94, 0.85, 0.48, 0.3)
  pillow(cloth('patchwork'), -0.57, 1.55, 1.05, 0.59, 0.47, 0.35)
  pillow(cloth('stars'), 0.58, 1.59, 1.14, 0.56, 0.44, 0.32)
  pillow(new THREE.MeshStandardMaterial({ color: '#b7d5e1', roughness: 1 }), -0.36, 1.39, 1.52, 0.66, 0.39, 0.12)

  // A continuous cloth surface with soft irregular wrinkles and hanging edges.
  const quilt = new THREE.PlaneGeometry(1, 1, 64, 64)
  const points = quilt.attributes.position!
  const wrinkle = (x: number, z: number) =>
    0.023 * Math.sin(x * 7 + z * 4) + 0.014 * Math.sin(x * 13 - z * 6)
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i) * 2.65
    const z = 2.9 + points.getY(i) * 2.55
    const sideDrape = Math.max(0, (Math.abs(x) - 1.03) / 0.3) ** 1.5 * 0.5
    const footDrape = Math.max(0, (z - 3.8) / 0.38) ** 1.3 * 0.43
    const fold = Math.exp(-(((z - 2.03) / 0.22) ** 2)) * (0.15 + 0.025 * Math.sin(x * 3))
    points.setXYZ(i, x, 1.3 + wrinkle(x, z) + fold - sideDrape - footDrape, z)
  }
  quilt.computeVertexNormals()
  const blanket = new THREE.Mesh(quilt, red)
  blanket.castShadow = blanket.receiveShadow = true
  bedding.add(blanket)
  const foldCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.27, 1.25, 2.0), new THREE.Vector3(-0.8, 1.48, 1.93),
    new THREE.Vector3(0, 1.49, 2.07), new THREE.Vector3(0.75, 1.44, 2.01),
    new THREE.Vector3(1.26, 1.22, 2.06),
  ])
  const foldedEdge = new THREE.Mesh(new THREE.TubeGeometry(foldCurve, 48, 0.13, 12, false), red)
  foldedEdge.castShadow = foldedEdge.receiveShadow = true
  bedding.add(foldedEdge)
  return bedding
}
