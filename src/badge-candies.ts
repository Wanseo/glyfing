import * as THREE from 'three'
import { createBadgeViewer } from './badge-viewer'
import cutoutsUrl from './assets/badge-candies.webp'
import badgeUrl from './assets/badge-ready.webp'

type Crop = readonly [number, number, number, number]
type Outline = ReadonlyArray<readonly [number, number]>

// Regions are normalized so the source can retain its original resolution.
export function cutout(image: HTMLImageElement, region: Crop, singleObject = true, outline?: Outline) {
  const [x, y, width, height] = region
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.naturalWidth * width)
  canvas.height = Math.round(image.naturalHeight * height)
  const context = canvas.getContext('2d')!
  if (outline) {
    // Clip to the physical strip: faint alpha can connect a neighboring worm
    // fragment to the strip and defeat connected-component filtering.
    context.beginPath()
    outline.forEach(([px, py], index) => {
      const localX = (px - x) * image.naturalWidth
      const localY = (py - y) * image.naturalHeight
      if (index === 0) context.moveTo(localX, localY)
      else context.lineTo(localX, localY)
    })
    context.closePath()
    context.clip()
  }
  context.drawImage(image, image.naturalWidth * x, image.naturalHeight * y,
    canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  // A crop can include a tiny edge of a neighboring candy. Keep the main
  // connected object. The badge also keeps its separate attached details.
  const labels = new Int32Array(canvas.width * canvas.height)
  const queue = new Int32Array(labels.length)
  const sizes = [0]
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || pixels[start * 4 + 3]! < 8) continue
    const label = sizes.length
    let head = 0, tail = 1
    queue[0] = start; labels[start] = label
    while (head < tail) {
      const index = queue[head++]!
      const col = index % canvas.width
      const neighbors = [index - canvas.width, index + canvas.width,
        col > 0 ? index - 1 : -1, col < canvas.width - 1 ? index + 1 : -1]
      for (const neighbor of neighbors) {
        if (neighbor < 0 || neighbor >= labels.length || labels[neighbor]
          || pixels[neighbor * 4 + 3]! < 8) continue
        labels[neighbor] = label; queue[tail++] = neighbor
      }
    }
    sizes.push(tail)
  }
  const largest = sizes.reduce((max, size) => Math.max(max, size), 0)
  const mainLabel = sizes.indexOf(largest)
  for (let index = 0; index < labels.length; index++) {
    const label = labels[index]!
    if (!label || (singleObject ? label !== mainLabel : sizes[label]! < largest * .01)) {
      pixels[index * 4 + 3] = 0
    }
  }
  context.putImageData(imageData, 0, 0)
  let left = canvas.width, top = canvas.height, right = -1, bottom = -1
  for (let row = 0; row < canvas.height; row++) {
    for (let col = 0; col < canvas.width; col++) {
      if (pixels[(row * canvas.width + col) * 4 + 3]! < 8) continue
      left = Math.min(left, col); right = Math.max(right, col)
      top = Math.min(top, row); bottom = Math.max(bottom, row)
    }
  }
  if (right < left || bottom < top) return null
  const trimmed = document.createElement('canvas')
  trimmed.width = right - left + 1; trimmed.height = bottom - top + 1
  trimmed.getContext('2d')!.drawImage(canvas, left, top, trimmed.width,
    trimmed.height, 0, 0, trimmed.width, trimmed.height)
  const texture = new THREE.CanvasTexture(trimmed)
  texture.colorSpace = THREE.SRGBColorSpace
  return new THREE.Mesh(new THREE.PlaneGeometry(trimmed.width / trimmed.height, 1),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true,
      depthWrite: false, toneMapped: false }))
}

export function createBadgeCandies(app: HTMLElement) {
  const viewer = createBadgeViewer(app)
  let interactiveBadge: THREE.Mesh | null = null
  const root = new THREE.Group(), badge = new THREE.Group()
  const candies: THREE.Mesh[] = []
  const sparkles: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>[] = []
  const hanger = new THREE.Group()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let swingTime = 0
  let hover = 0
  const badgeRestPosition = new THREE.Vector3()
  badge.add(hanger)
  root.add(badge)
  let viewWidth = 0, viewHeight = 0
  function layout(halfWidth: number, halfHeight: number) {
    viewWidth = halfWidth; viewHeight = halfHeight
    const wide = halfWidth > 7
    badge.scale.setScalar(wide ? halfHeight * .52 : Math.min(halfHeight * .54, halfWidth * 1.2))
    badge.position.set(wide ? 0 : -halfWidth * .12, halfHeight * (wide ? .69 : .5), -2.2)
    const desktop = [[-.83, .72], [-.42, .78], [.43, .8], [.85, .69],
      [-.88, -.55], [-.5, -.76], [-.18, -.79], [.18, -.74],
      [.49, -.79], [.77, -.62], [-.88, .18], [.9, .22], [-.62, .49],
      [-.33, -.48], [.48, -.29], [-.05, -.64], [-.45, -.87], [.87, -.84],
      [.34, -.88], [-.91, -.37], [.65, .15], [-.2, .24], [.18, .34]]
    const mobile = [[-.78, .32], [.8, .32], [-.83, .02], [.85, -.02],
      [-.83, -.36], [-.64, -.63], [-.68, -.85], [.73, -.88],
      [0, -.89], [.72, .83], [-.8, .46], [0, .9], [-.84, -.5],
      [-.28, -.43], [.75, -.58], [-.07, -.66], [-.43, -.89], [.89, -.71],
      [.36, -.91], [-.89, -.67], [.83, .17], [-.22, .39], [.18, .59]]
    candies.forEach((candy, index) => {
      const [x, y] = (wide ? desktop : mobile)[index]!
      const aspect = (candy.geometry as THREE.PlaneGeometry).parameters.width
      const maxWidth = wide ? Math.min(1.6, halfWidth * .11) * 1.18 : halfWidth * .24 * 1.18
      const height = Math.min((wide ? 1.35 : .85) * 1.18, maxWidth / aspect)
      const extraSize = index < 13 ? 1 : [.74, .9, .68, .82, .63, .78, .7, .62, .65, .72][index - 13]!
      candy.scale.setScalar(height * extraSize * .9)
      // Keep jellies behind both product containers (z = -2.3).
      candy.position.set(x! * halfWidth, y! * halfHeight, -2.6)
      if (index >= 13) candy.rotation.z = [-.4, .32, -.17, .5, -.28, .2, -.52, .37, -.25, .46][index - 13]!
    })
  }
  const regions: Crop[] = [
    [.56, .03, .22, .195], [.78, .03, .22, .195],
    [.59, .2, .17, .22], [.77, .21, .2, .215],
    [.62, .425, .14, .14], [.77, .405, .13, .15],
    [.65, .545, .14, .165], [.8, .54, .14, .175],
    [.58, .72, .16, .12], [.74, .725, .08, .125],
    [.54, .84, .24, .16], [.78, .845, .22, .155],
  ]
  const badgeReady = new THREE.TextureLoader().loadAsync(badgeUrl).then(async source => {
    const badgeMesh = cutout(source.image, [0, 0, 1, 1], false)
    source.dispose()
    if (badgeMesh) {
      // Anchor the swing at the top of the lanyard loop, above the hanging card.
      const pivotX = badgeMesh.geometry.parameters.width * .32
      const pivotY = .48
      hanger.position.set(pivotX, pivotY, 0)
      badgeMesh.position.set(-pivotX, -pivotY, 0)
      badgeRestPosition.copy(badgeMesh.position)
      hanger.add(badgeMesh)
      interactiveBadge = badgeMesh
      await viewer.setImage(badgeMesh.material.map!.image as HTMLCanvasElement, badgeUrl)
    }
    layout(viewWidth, viewHeight)
  })
  const candiesReady = new THREE.TextureLoader().loadAsync(cutoutsUrl).then(source => {
    const stripOutlines: Record<number, Outline> = {
      2: [[.694, .191], [.762, .35], [.687, .43], [.598, .266]],
      3: [[.79, .208], [.959, .289], [.938, .427], [.766, .357]],
    }
    for (const [index, region] of regions.entries()) {
      const candy = cutout(source.image, region, true, stripOutlines[index])
      if (candy) { candies.push(candy); root.add(candy) }
    }
    const tooth = candies[9]
    if (tooth) {
      for (const angle of [-.25]) {
        const extra = tooth.clone()
        extra.rotation.z = angle
        candies.push(extra)
        root.add(extra)
      }
      const star = new THREE.Shape()
      for (let point = 0; point < 8; point++) {
        const angle = point * Math.PI / 4
        const radius = point % 2 ? .14 : 1
        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius
        if (point === 0) star.moveTo(x, y)
        else star.lineTo(x, y)
      }
      star.closePath()
      const geometry = new THREE.ShapeGeometry(star)
      for (const item of [tooth, candies[12]!]) {
        for (const [x, y] of [[.31, .3], [-.23, -.22]]) {
          const sparkle = new THREE.Mesh(geometry,
            new THREE.MeshBasicMaterial({ color: '#fffdf2', transparent: true,
              depthWrite: false, toneMapped: false }))
          sparkle.position.set(x!, y!, .05)
          item.add(sparkle)
          sparkles.push(sparkle)
        }
      }
    }
    // Reuse existing jelly textures to fill gaps without loading another image.
    for (const index of [0, 4, 6, 2, 7, 1, 5, 8, 3, 4]) {
      const original = candies[index]
      if (!original) continue
      const extra = original.clone()
      candies.push(extra)
      root.add(extra)
    }
    source.dispose()
    layout(viewWidth, viewHeight)
  })
  return {
    root,
    ready: Promise.all([badgeReady, candiesReady]),
    layout,
    syncInteraction(camera: THREE.OrthographicCamera) { viewer.sync(interactiveBadge, camera, root.visible) },
    hoveredBounds() { return root.visible ? viewer.hoveredBounds() : [] },
    eatNearby(x: number, y: number, radiusX: number, radiusY: number) {
      if (!root.visible) return
      for (const candy of candies) {
        if (!candy.visible) continue
        const geometry = candy.geometry as THREE.PlaneGeometry
        const halfWidth = geometry.parameters.width * candy.scale.x / 2
        const halfHeight = geometry.parameters.height * candy.scale.y / 2
        const cosine = Math.abs(Math.cos(candy.rotation.z)), sine = Math.abs(Math.sin(candy.rotation.z))
        const dx = Math.max(0, Math.abs(candy.position.x - x) - halfWidth * cosine - halfHeight * sine)
        const dy = Math.max(0, Math.abs(candy.position.y - y) - halfWidth * sine - halfHeight * cosine)
        if ((dx / radiusX) ** 2 + (dy / radiusY) ** 2 <= 1) candy.visible = false
      }
    },
    update(dt: number) {
      swingTime += dt
      const target = root.visible && viewer.isHovered() ? 1 : 0
      hover = reducedMotion.matches ? target : THREE.MathUtils.damp(hover, target, 12, dt)
      if (interactiveBadge) {
        interactiveBadge.scale.setScalar(1 + hover * .08)
        interactiveBadge.position.copy(badgeRestPosition)
        interactiveBadge.position.y += hover * .04
      }
      hanger.rotation.z = reducedMotion.matches ? 0 : Math.sin(swingTime * Math.PI * 2 / 3.8) * .09
      sparkles.forEach((sparkle, index) => {
        const glint = reducedMotion.matches ? .5
          : Math.pow((Math.sin(swingTime * Math.PI * 2 / 2.8 + index * 1.3) + 1) / 2, 6)
        sparkle.material.opacity = .15 + glint * .85
        sparkle.scale.setScalar((index % 2 ? .09 : .14) * (.5 + glint * .9))
      })
    },
  }
}
