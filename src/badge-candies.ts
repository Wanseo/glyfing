import * as THREE from 'three'
import cutoutsUrl from './assets/badge-candies.png'

type Crop = readonly [number, number, number, number]
type Outline = ReadonlyArray<readonly [number, number]>

// Regions are normalized so the source can retain its original resolution.
function cutout(image: HTMLImageElement, region: Crop, singleObject = true, outline?: Outline) {
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

export function createBadgeCandies() {
  const root = new THREE.Group(), badge = new THREE.Group()
  const candies: THREE.Mesh[] = []
  root.add(badge)
  let viewWidth = 0, viewHeight = 0
  function layout(halfWidth: number, halfHeight: number) {
    viewWidth = halfWidth; viewHeight = halfHeight
    const wide = halfWidth > 7
    badge.scale.setScalar(halfHeight * (wide ? .52 : .4))
    badge.position.set(wide ? 0 : -halfWidth * .5, halfHeight * .69, -2.2)
    const desktop = [[-.83, .72], [-.42, .78], [.43, .8], [.85, .69],
      [-.88, -.55], [-.5, -.76], [-.18, -.79], [.18, -.74],
      [.49, -.79], [.87, -.67], [-.88, .18], [.9, .22]]
    const mobile = [[-.78, .32], [.8, .32], [-.83, .02], [.85, -.02],
      [-.83, -.36], [-.64, -.63], [-.68, -.85], [.73, -.88],
      [0, -.89], [.82, .89], [-.8, .46], [0, .9]]
    candies.forEach((candy, index) => {
      const [x, y] = (wide ? desktop : mobile)[index % desktop.length]!
      const aspect = (candy.geometry as THREE.PlaneGeometry).parameters.width
      const maxWidth = wide ? Math.min(1.6, halfWidth * .11) * 1.18 : halfWidth * .24 * 1.18
      const height = Math.min((wide ? 1.35 : .85) * 1.18, maxWidth / aspect)
      candy.scale.setScalar(height)
      candy.position.set(x! * halfWidth, y! * halfHeight, -2.1)
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
  new THREE.TextureLoader().load(cutoutsUrl, source => {
    const badgeMesh = cutout(source.image, [0, 0, .56, 1], false)
    if (badgeMesh) badge.add(badgeMesh)
    const stripOutlines: Record<number, Outline> = {
      2: [[.694, .191], [.762, .35], [.687, .43], [.598, .266]],
      3: [[.79, .208], [.959, .289], [.938, .427], [.766, .357]],
    }
    for (const [index, region] of regions.entries()) {
      const candy = cutout(source.image, region, true, stripOutlines[index])
      if (candy) { candies.push(candy); root.add(candy) }
    }
    source.dispose()
    layout(viewWidth, viewHeight)
  }, undefined, error => console.error('사원증과 젤리 이미지를 불러오지 못했습니다.', error))
  return { root, layout }
}
