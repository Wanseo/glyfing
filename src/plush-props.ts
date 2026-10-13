import * as THREE from 'three'
import plushUrl from './assets/plush-cutouts.png'
import { cutout } from './badge-candies'

// Eight reference plush toys, excluding the central retail package.
export function createPlushProps() {
  const root = new THREE.Group()
  const toys: { mesh: THREE.Mesh; y: number; angle: number; size: number }[] = []
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  // Stagger the toys across the scene instead of pairing them around the mascot.
  const desktop = [[-.35, .4], [.43, .51], [-.56, -.35], [.2, -.57],
    [-.83, -.14], [.83, .32], [-.72, -.78], [.61, -.82]]
  const mobile = [[-.65, .29], [.61, .43], [-.7, -.23], [.27, -.55],
    [-.35, -.73], [.77, .02], [-.62, .67], [.67, -.82]]
  const angles = [-.16, .13, .28, -.23, -.2, .18, -.32, .21]
  const sizes = [1, .85, .74, .86, .68, .88, .64, .72]
  let halfWidth = 0, halfHeight = 0, elapsed = 0
  function layout(width: number, height: number) {
    halfWidth = width; halfHeight = height
    const wide = width > 7
    const positions = wide ? desktop : mobile
    const baseSize = wide ? Math.min(3.1, width * .18, height * .34)
      : Math.min(width * .43, height * .2)
    toys.forEach((toy, index) => {
      const [x, y] = positions[index]!
      toy.size = baseSize * sizes[index]! * .9
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
