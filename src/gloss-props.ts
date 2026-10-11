import * as THREE from 'three'
import cutoutsUrl from './assets/gloss-cutouts.png'

// Both products share an alpha image. The diagonal gap separates the carton
// from the tube without clipping its attached tooth and underwear charms.
function productTexture(image: HTMLImageElement, carton: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')!
  const w = canvas.width, h = canvas.height
  ctx.beginPath()
  ctx.moveTo(0, carton ? 0 : h)
  ctx.lineTo(w, carton ? 0 : h)
  ctx.lineTo(w, h * .327)
  ctx.lineTo(0, h * .68)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, 0, 0)
  const pixels = ctx.getImageData(0, 0, w, h).data
  let left = w, top = h, right = 0, bottom = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[(y * w + x) * 4 + 3]! < 8) continue
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
  }
  const cropped = document.createElement('canvas')
  cropped.width = right - left + 1
  cropped.height = bottom - top + 1
  cropped.getContext('2d')!.drawImage(canvas, left, top, cropped.width, cropped.height,
    0, 0, cropped.width, cropped.height)
  const texture = new THREE.CanvasTexture(cropped)
  texture.colorSpace = THREE.SRGBColorSpace
  return { texture, aspect: cropped.width / cropped.height }
}

export function createGlossProps() {
  const root = new THREE.Group()
  const carton = new THREE.Group(), product = new THREE.Group()
  root.add(carton, product)
  let viewWidth = 0, viewHeight = 0
  function layout(halfWidth: number, halfHeight: number) {
    viewWidth = halfWidth; viewHeight = halfHeight
    const wide = halfWidth > 7
    const width = wide ? Math.min(6, halfWidth * .65, halfHeight * 1.2)
      : Math.min(halfWidth * 1.45, halfHeight * .5)
    carton.scale.setScalar(width)
    product.scale.setScalar(width * .8)
    carton.position.set(wide ? -halfWidth * .62 : 0,
      wide ? .9 : halfHeight * .68, -2.3)
    product.position.set(wide ? halfWidth * .62 : 0,
      wide ? -.6 : -halfHeight * .65, -2.3)
  }
  new THREE.TextureLoader().load(cutoutsUrl, source => {
    for (const [group, isCarton] of [[carton, true], [product, false]] as const) {
      const { texture, aspect } = productTexture(source.image, isCarton)
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1 / aspect),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true,
          depthWrite: false, toneMapped: false }))
      group.add(mesh)
    }
    source.dispose()
    layout(viewWidth, viewHeight)
  }, undefined, error => console.error('제품 이미지를 불러오지 못했습니다.', error))
  return { root, layout }
}
