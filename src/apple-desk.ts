import * as THREE from 'three'

export function createAppleDesk() {
  const setup = new THREE.Group()
  const aluminum = new THREE.MeshStandardMaterial({ color: '#d9dcdf', metalness: 0.25, roughness: 0.38 })
  const glass = new THREE.MeshStandardMaterial({ color: '#101214', roughness: 0.24, metalness: 0.12 })
  const white = new THREE.MeshStandardMaterial({ color: '#fafafa', roughness: 0.45 })
  function rounded(width: number, height: number, depth: number, radius: number, material: THREE.Material, x: number, y: number, z: number) {
    const w = width / 2, h = height / 2, r = radius
    const shape = new THREE.Shape()
    shape.moveTo(-w + r, -h)
    shape.lineTo(w - r, -h); shape.quadraticCurveTo(w, -h, w, -h + r)
    shape.lineTo(w, h - r); shape.quadraticCurveTo(w, h, w - r, h)
    shape.lineTo(-w + r, h); shape.quadraticCurveTo(-w, h, -w, h - r)
    shape.lineTo(-w, -h + r); shape.quadraticCurveTo(-w, -h, -w + r, -h)
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 })
    geometry.translate(0, 0, -depth / 2)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    setup.add(mesh)
    return mesh
  }
  // Thin aluminum unibody, black glass surround, white screen and silver chin.
  rounded(1.92, 1.39, 0.09, 0.075, aluminum, 0, 1.02, -0.13)
  rounded(1.92, 1.16, 0.012, 0.075, glass, 0, 1.135, -0.077)
  rounded(1.72, 0.96, 0.009, 0.004,
    new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    0, 1.135, -0.065)
  const camera = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 8), new THREE.MeshStandardMaterial({ color: '#4b5355', roughness: 0.2 }))
  camera.position.set(0, 1.665, -0.065)
  setup.add(camera)

  // A bent aluminum support, extruded sideways into a gently flared foot.
  const profile = new THREE.Shape()
  profile.moveTo(-0.19, 0.035)
  profile.bezierCurveTo(-0.16, 0.1, -0.1, 0.15, -0.08, 0.28)
  profile.lineTo(-0.045, 0.49); profile.lineTo(0.035, 0.49)
  profile.bezierCurveTo(0.01, 0.2, 0.04, 0.09, 0.22, 0.045)
  profile.lineTo(0.22, 0.02); profile.lineTo(-0.19, 0.02)
  const standGeometry = new THREE.ExtrudeGeometry(profile, { depth: 0.38, bevelEnabled: false, curveSegments: 20 })
  standGeometry.rotateY(-Math.PI / 2)
  standGeometry.translate(0.19, 0, -0.15)
  const stand = new THREE.Mesh(standGeometry, aluminum)
  stand.castShadow = true
  setup.add(stand)
  const foot = rounded(0.7, 0.5, 0.027, 0.06, aluminum, 0, 0.025, -0.12)
  foot.rotation.x = -Math.PI / 2

  // Small black apple emblem on the chin.
  const logoCanvas = document.createElement('canvas')
  logoCanvas.width = logoCanvas.height = 128
  const c = logoCanvas.getContext('2d')!
  c.fillStyle = '#111111'
  c.beginPath()
  c.moveTo(64, 40)
  c.bezierCurveTo(35, 22, 17, 47, 27, 79)
  c.bezierCurveTo(39, 111, 49, 109, 63, 103)
  c.bezierCurveTo(78, 112, 91, 107, 103, 80)
  c.bezierCurveTo(113, 49, 93, 23, 64, 40)
  c.fill()
  c.beginPath(); c.ellipse(73, 22, 8, 17, 0.7, 0, Math.PI * 2); c.fill()
  c.globalCompositeOperation = 'destination-out'
  c.beginPath(); c.arc(104, 60, 15, 0, Math.PI * 2); c.fill()
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.115, 0.115), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(logoCanvas), transparent: true, depthWrite: false }))
  logo.position.set(0, 0.437, -0.078)
  setup.add(logo)

  // Low aluminum keyboard with individual white keys and a long space bar.
  const keyboard = rounded(1.49, 0.43, 0.035, 0.027, aluminum, -0.03, 0.035, 0.64)
  keyboard.rotation.x = -Math.PI / 2
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 14; col++) {
      if (row === 4 && col >= 3 && col <= 9) continue
      const key = rounded(0.086, row === 0 ? 0.041 : 0.059, 0.009, 0.006, white,
        -0.69 + col * 0.102, 0.057, 0.475 + row * 0.074)
      key.rotation.x = -Math.PI / 2
    }
  }
  const space = rounded(0.68, 0.058, 0.009, 0.006, white, -0.03, 0.057, 0.771)
  space.rotation.x = -Math.PI / 2

  // Smooth white Magic Mouse with a thin dark/silver underside.
  const mouseBase = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), aluminum)
  mouseBase.scale.set(0.145, 0.027, 0.235)
  mouseBase.position.set(1.05, 0.034, 0.64)
  mouseBase.castShadow = true
  setup.add(mouseBase)
  const mouseTop = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), white)
  mouseTop.scale.set(0.14, 0.055, 0.229)
  mouseTop.position.set(1.05, 0.053, 0.64)
  mouseTop.castShadow = true
  setup.add(mouseTop)
  return setup
}
