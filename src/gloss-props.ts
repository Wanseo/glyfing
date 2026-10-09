import * as THREE from 'three'

function artwork(kind: 'front' | 'side' | 'briefs') {
  const canvas = document.createElement('canvas')
  canvas.width = 1536; canvas.height = 768
  const c = canvas.getContext('2d')!
  const gradient = c.createLinearGradient(0, 0, 0, 768)
  gradient.addColorStop(0, '#f892ca'); gradient.addColorStop(.5, '#ed5cab'); gradient.addColorStop(1, '#b62777')
  c.fillStyle = kind === 'briefs' ? '#fff9f5' : gradient
  c.fillRect(0, 0, 1536, 768)
  const label = (text: string, x: number, y: number, size: number, color: string, outline = false) => {
    c.font = `900 ${size}px Arial, sans-serif`; c.lineJoin = 'round'; c.fillStyle = color
    if (outline) { c.strokeStyle = '#39275d'; c.lineWidth = size * .085; c.strokeText(text, x, y) }
    c.fillText(text, x, y)
  }
  if (kind === 'briefs') {
    c.strokeStyle = '#3674ab'; c.lineWidth = 42
    c.strokeRect(30, 24, 1476, 720)
    c.beginPath(); c.moveTo(470, 35); c.lineTo(545, 440); c.lineTo(1000, 440); c.lineTo(1060, 35); c.stroke()
    for (const [x, y] of [[210, 210], [780, 230], [1290, 220], [780, 590]]) {
      c.beginPath()
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 48 : 110
        c.lineTo(x! + Math.cos(angle) * r, y! + Math.sin(angle) * r)
      }
      c.closePath(); c.fillStyle = '#ec5c9d'; c.fill()
    }
  } else if (kind === 'side') {
    label('Glue', 250, 530, 420, '#fffaff', true)
    label('FUGGLER EDITION', 280, 680, 65, '#292258')
  } else {
    c.globalAlpha = .13; c.fillStyle = '#fff'
    for (let i = 0; i < 17; i++) { c.beginPath(); c.arc((i * 359) % 1536, (i * 173) % 768, 35 + i % 3 * 20, 0, Math.PI * 2); c.fill() }
    c.globalAlpha = 1
    label('NEW!', 45, 115, 82, '#31275a')
    label('FUGGLER EDITION', 390, 120, 48, '#d7ef8b', true)
    label('Glue', 40, 460, 355, '#fffaff', true)
    label('Gloss', 295, 605, 175, '#1678b2', true)
    label('2 FLAVORS IN 1', 430, 707, 42, '#fff1fa', true)
    label('OoFruityFang', 48, 703, 37, '#fff1fa', true)
    c.fillStyle = '#dfdded'; c.fillRect(1020, 28, 470, 145)
    label('WARNING:', 1050, 82, 37, '#302767'); label('DO NOT BITE OR CHEW', 1050, 130, 25, '#302767')
    c.fillStyle = '#3975b6'; c.beginPath(); c.arc(1430, 98, 57, 0, Math.PI * 2); c.fill()
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(1400, 62); c.bezierCurveTo(1460, 45, 1470, 88, 1440, 133); c.lineTo(1425, 105); c.lineTo(1408, 139); c.bezierCurveTo(1380, 95, 1375, 74, 1400, 62); c.fill()
    // The little toothy mascot printed on the carton.
    c.fillStyle = '#fffdf4'; c.strokeStyle = '#43354c'; c.lineWidth = 7
    c.beginPath(); c.moveTo(1000, 650); c.lineTo(962, 548); c.bezierCurveTo(880, 550, 899, 491, 941, 466); c.bezierCurveTo(893, 235, 1140, 170, 1220, 359); c.bezierCurveTo(1280, 342, 1311, 411, 1250, 432); c.lineTo(1290, 650); c.closePath(); c.fill(); c.stroke()
    for (const [x, y, color] of [[1000, 376, '#c3c85d'], [1130, 300, '#65afd1']] as const) {
      c.fillStyle = color; c.beginPath(); c.arc(x, y, 31, 0, Math.PI * 2); c.fill(); c.stroke()
      c.beginPath(); c.arc(x, y, 17, 0, Math.PI * 2); c.stroke()
    }
    c.fillStyle = '#e53a91'; c.beginPath(); c.ellipse(1090, 453, 94, 72, -.3, 0, Math.PI * 2); c.fill(); c.stroke()
    c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) c.fillRect(1009 + i * 25, 402 - Math.sin(i / 5 * Math.PI) * 17, 20, 29)
    label('NET WT. 3.6 ML', 1260, 540, 29, '#fff7fc'); label('GLYF FUGGLER', 1260, 580, 29, '#fff7fc')
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8
  return texture
}

export function createGlossProps(renderer: THREE.WebGLRenderer) {
  const root = new THREE.Group()
  const carton = new THREE.Group()
  const pink = new THREE.MeshPhysicalMaterial({ color: '#c33686', roughness: .4, clearcoat: .3 })
  const front = new THREE.MeshPhysicalMaterial({ map: artwork('front'), roughness: .42, clearcoat: .3 })
  const side = new THREE.MeshPhysicalMaterial({ map: artwork('side'), roughness: .45 })
  const box = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.4, 1.05), [pink, pink, pink, side, front, side])
  carton.add(box)
  // Fold lines and a fine bright edge keep the packaging a physical carton.
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: '#f8abd4', transparent: true, opacity: .55 }))
  carton.add(edges)
  carton.rotation.set(.16, -.23, .24)
  root.add(carton)

  const studio = document.createElement('canvas'); studio.width = 1024; studio.height = 512
  const context = studio.getContext('2d')!
  context.fillStyle = '#171922'; context.fillRect(0, 0, 1024, 512)
  for (const [x, width, color] of [[40, 180, '#ffffff'], [265, 80, '#858996'], [470, 210, '#f5f5f8'], [740, 150, '#da89b3'], [930, 35, '#ffffff']] as const) {
    context.fillStyle = color; context.fillRect(x, 0, width, 512)
  }
  const panorama = new THREE.CanvasTexture(studio); panorama.mapping = THREE.EquirectangularReflectionMapping; panorama.colorSpace = THREE.SRGBColorSpace
  const pmrem = new THREE.PMREMGenerator(renderer)
  const reflections = pmrem.fromEquirectangular(panorama)
  panorama.dispose(); pmrem.dispose()
  const chrome = new THREE.MeshPhysicalMaterial({ color: '#f5f6fa', metalness: 1, roughness: .13, envMap: reflections.texture, envMapIntensity: 1.2, clearcoat: 1 })
  const tube = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.47, .47, 2.35, 12), chrome)
  tube.add(body)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, 1.04, 12), chrome); cap.position.y = 1.71; tube.add(cap)
  const seam = new THREE.Mesh(new THREE.CylinderGeometry(.484, .484, .027, 32), new THREE.MeshStandardMaterial({ color: '#33353d', metalness: .8, roughness: .2, envMap: reflections.texture })); seam.position.y = 1.18; tube.add(seam)
  for (const y of [-1.175, 2.23]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.435, .035, 8, 32), chrome); rim.rotation.x = Math.PI / 2; rim.position.y = y; tube.add(rim)
  }
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(.49, .49, .31, 12), chrome); belt.position.y = .43; tube.add(belt)
  const star = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + i * Math.PI / 5
    const radius = i % 2 ? .25 : .65
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius
    if (i === 0) star.moveTo(x, y); else star.lineTo(x, y)
  }
  star.closePath()
  const starBand = new THREE.Mesh(new THREE.ExtrudeGeometry(star, {
    depth: .07, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 3,
  }), chrome)
  starBand.position.set(0, .15, .43)
  tube.add(starBand)
  const blue = new THREE.MeshPhysicalMaterial({ color: '#438fbd', metalness: .5, roughness: .23, envMap: reflections.texture })
  const charms = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.12, .033, 8, 24), blue)
    ring.position.set(0, -.14 * i, .1); ring.rotation.y = i % 2 * .9; charms.add(ring)
  }
  const tooth = new THREE.Shape()
  tooth.moveTo(-.2, .25); tooth.bezierCurveTo(-.52, .28, -.4, -.3, -.23, -.55)
  tooth.bezierCurveTo(-.08, -.65, -.08, -.22, .02, -.25)
  tooth.bezierCurveTo(.17, -.23, .08, -.68, .27, -.55)
  tooth.bezierCurveTo(.51, -.28, .51, .3, .21, .26); tooth.quadraticCurveTo(0, .17, -.2, .25)
  const white = new THREE.MeshPhysicalMaterial({ color: '#fffaf4', roughness: .22, clearcoat: .8 })
  const toothMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(tooth, { depth: .07, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 3, steps: 1 }), white)
  toothMesh.position.set(-.33, -.62, .08); toothMesh.rotation.z = -.25; charms.add(toothMesh)
  const briefs = new THREE.Shape()
  briefs.moveTo(-.44, .45); briefs.lineTo(.44, .45); briefs.lineTo(.37, .05)
  briefs.quadraticCurveTo(.13, -.03, .15, -.47); briefs.lineTo(-.15, -.47)
  briefs.quadraticCurveTo(-.13, -.03, -.37, .05); briefs.closePath()
  const briefMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(briefs, { depth: .06, bevelEnabled: true, bevelThickness: .025, bevelSize: .045, bevelSegments: 3 }), white)
  briefMesh.position.set(.45, -1.05, .1); briefMesh.rotation.z = .14
  const printed = new THREE.Mesh(new THREE.ShapeGeometry(briefs), new THREE.MeshStandardMaterial({ map: artwork('briefs'), roughness: .5 }))
  // ShapeGeometry uses world coordinates as UVs: fit the printed motif to the charm.
  const uv = printed.geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + .44) / .88, (uv.getY(i) + .47) / .92)
  printed.position.z = .087; briefMesh.add(printed); charms.add(briefMesh)
  tube.rotation.z = -.85
  const hanger = new THREE.Vector3(.47, .4, .2).applyAxisAngle(new THREE.Vector3(0, 0, 1), -.85)
  // Charms hang vertically, independently of the tilted tube.
  const product = new THREE.Group(); product.add(tube, charms); charms.position.copy(hanger)
  product.rotation.y = -.15; root.add(product)
  return {
    root,
    layout(halfWidth: number, halfHeight: number) {
      const wide = halfWidth > 7
      const size = wide ? Math.min(1.15, (halfWidth - 2.8) / 5.2) : Math.min(.9, halfWidth / 3.4)
      carton.scale.setScalar(size); product.scale.setScalar(size)
      carton.position.set(wide ? -halfWidth * .61 : -.1, wide ? .9 : Math.max(3.6, halfHeight * .65), -2.3)
      product.position.set(wide ? halfWidth * .63 : .2, wide ? -.6 : -Math.max(3.8, halfHeight * .64), -2.3)
    },
  }
}
