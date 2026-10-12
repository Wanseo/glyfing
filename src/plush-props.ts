import * as THREE from 'three'
import plushUrl from './assets/plush-cutouts.png'
import { cutout } from './badge-candies'

// Eight reference plush toys, excluding the central retail package.
export function createPlushProps() {
  const root = new THREE.Group()
  const toys: { mesh: THREE.Mesh; y: number; angle: number; size: number }[] = []
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const desktop = [[-.35, .4], [.35, .42], [-.36, -.35], [.36, -.38],
    [-.82, -.25], [.82, .44], [-.28, -.66], [.28, -.65]]
  const mobile = [[-.65, .29], [.61, .43], [-.66, -.25], [.6, -.19],
    [-.3, -.57], [.28, -.66], [-.62, .67], [.76, .02]]
  const angles = [-.16, .13, .12, -.12, -.2, .18, .15, -.16]
  const sizes = [1, .85, .92, 1, .82, .88, .95, .84]
  let halfWidth = 0, halfHeight = 0, elapsed = 0
  function layout(width: number, height: number) {
    halfWidth = width; halfHeight = height
    const wide = width > 7
    const positions = wide ? desktop : mobile
    const baseSize = wide ? Math.min(3.1, width * .18, height * .34)
      : Math.min(width * .43, height * .2)
    toys.forEach((toy, index) => {
      const [x, y] = positions[index]!
      toy.size = baseSize * sizes[index]!
      toy.y = y! * height
      toy.mesh.scale.setScalar(toy.size)
      toy.mesh.position.set(x! * width, toy.y, -3)
      toy.mesh.rotation.z = toy.angle
    })
  }
  const ready = new THREE.TextureLoader().loadAsync(plushUrl).then(source => {
    for (let index = 0; index < 8; index++) {
      // Trim each cell to its largest connected silhouette, discarding stray pixels.
      const mesh = cutout(source.image, [index % 4 / 4, index < 4 ? 0 : .52,
        .25, index < 4 ? .52 : .48])
      if (!mesh) throw new Error('Missing plush cutout')
      root.add(mesh)
      toys.push({ mesh, y: 0, angle: angles[index]!, size: 0 })
    }
    source.dispose()
    layout(halfWidth, halfHeight)
  })
  return {
    root, ready, layout,
    update(dt: number) {
      if (!root.visible) return
      elapsed += dt
      toys.forEach((toy, index) => {
        const phase = elapsed * Math.PI * 2 / (6 + index * .3) + index * 1.7
        const motion = reducedMotion.matches ? 0 : 1
        toy.mesh.position.y = toy.y + Math.sin(phase) * toy.size * .035 * motion
        toy.mesh.rotation.z = toy.angle + Math.sin(phase + .5) * .025 * motion
      })
    },
  }
}
