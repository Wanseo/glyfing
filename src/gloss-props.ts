import * as THREE from 'three'
import cutoutsUrl from './assets/gloss-cutouts.png'

// Both products share an alpha image. The diagonal gap separates the carton
// from the tube without clipping its attached tooth and underwear charms.
export function productTexture(image: HTMLImageElement, carton: boolean) {
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

export function createGlossProps(app: HTMLElement) {
  const links: { group: THREE.Group; element: HTMLAnchorElement; aspect: number }[] = []
  const projected = new THREE.Vector3()
  const root = new THREE.Group()
  const carton = new THREE.Group(), product = new THREE.Group()
  root.add(carton, product)
  carton.rotation.z = -Math.PI / 3
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let floatTime = 0, floatAmount = .18
  let cartonBaseY = 0, productBaseY = 0
  let viewWidth = 0, viewHeight = 0
  function layout(halfWidth: number, halfHeight: number) {
    viewWidth = halfWidth; viewHeight = halfHeight
    const wide = halfWidth > 7
    const width = wide ? Math.min(6, halfWidth * .65, halfHeight * 1.2)
      : Math.min(halfWidth * .8, halfHeight * .38)
    carton.scale.setScalar(width * .8)
    product.scale.setScalar(width * (wide ? .8 : .62))
    carton.position.set(wide ? -halfWidth * .62 : halfWidth * .47,
      wide ? .9 : halfHeight * .68, -2.3)
    product.position.set(wide ? halfWidth * .62 : halfWidth * .66,
      wide ? -.6 : -halfHeight * .42, -2.3)
    cartonBaseY = carton.position.y
    productBaseY = product.position.y
    floatAmount = Math.min(.18, width * .045)
  }
  new THREE.TextureLoader().load(cutoutsUrl, source => {
    for (const [group, isCarton] of [[carton, true], [product, false]] as const) {
      const { texture, aspect } = productTexture(source.image, isCarton)
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1 / aspect),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true,
          depthWrite: false, toneMapped: false }))
      group.add(mesh)
      const element = document.createElement('a')
      element.className = 'product-link'
      element.href = isCarton ? '#game' : '#photo'
      element.setAttribute('aria-label', isCarton ? 'GUMMY RUSH 게임으로 이동' : 'PHOTOBOOTH 포토부스로 이동')
      element.title = isCarton ? 'GUMMY RUSH ↗' : 'PHOTOBOOTH ↗'
      const image = document.createElement('img')
      const canvas = texture.image as HTMLCanvasElement
      image.src = canvas.toDataURL('image/png')
      image.alt = ''; image.draggable = false
      element.appendChild(image); app.appendChild(element)
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
      function overProduct(event: MouseEvent) {
        const bounds = element.getBoundingClientRect()
        const matrix = new DOMMatrix(getComputedStyle(element).transform)
        matrix.e = 0; matrix.f = 0
        const point = new DOMPoint(event.clientX - bounds.left - bounds.width / 2,
          event.clientY - bounds.top - bounds.height / 2)
          .matrixTransform(matrix.inverse())
        const x = Math.floor((point.x / element.offsetWidth + .5) * canvas.width)
        const y = Math.floor((point.y / element.offsetHeight + .5) * canvas.height)
        return x >= 0 && y >= 0 && x < canvas.width && y < canvas.height
          && pixels[(y * canvas.width + x) * 4 + 3]! > 8
      }
      element.addEventListener('pointerdown', event => element.classList.toggle('is-hovered', overProduct(event)))
      element.addEventListener('pointercancel', () => element.classList.remove('is-hovered'))
      element.addEventListener('mousemove', event => element.classList.toggle('is-hovered', overProduct(event)))
      element.addEventListener('mouseleave', () => element.classList.remove('is-hovered'))
      element.addEventListener('click', event => {
        if (event.detail && !overProduct(event)) event.preventDefault()
      })
      links.push({ group, element, aspect })
    }
    source.dispose()
    layout(viewWidth, viewHeight)
  }, undefined, error => console.error('제품 이미지를 불러오지 못했습니다.', error))
  return {
    root,
    layout,
    syncLinks(camera: THREE.OrthographicCamera) {
      root.updateMatrixWorld(true)
      const pixelsPerUnit = window.innerWidth / (camera.right - camera.left)
      for (const { group, element, aspect } of links) {
        element.hidden = !root.visible
        if (!root.visible) { element.classList.remove('is-hovered'); continue }
        projected.copy(group.position).project(camera)
        element.style.left = `${(projected.x + 1) * window.innerWidth / 2}px`
        element.style.top = `${(1 - projected.y) * window.innerHeight / 2}px`
        element.style.width = `${group.scale.x * pixelsPerUnit}px`
        element.style.height = `${group.scale.y * pixelsPerUnit / aspect}px`
        element.style.transform = `translate(-50%, -50%) rotate(${-group.rotation.z}rad)`
      }
    },
    update(dt: number) {
      floatTime += dt
      const amount = reducedMotion.matches ? 0 : 1
      const cartonPhase = floatTime * Math.PI * 2 / 4.8
      const productPhase = floatTime * Math.PI * 2 / 5.6 + 1.2
      carton.position.y = cartonBaseY + Math.sin(cartonPhase) * floatAmount * amount
      product.position.y = productBaseY + Math.sin(productPhase) * floatAmount * amount
      carton.rotation.z = -Math.PI / 3 + Math.sin(cartonPhase + .6) * .025 * amount
      product.rotation.z = Math.sin(productPhase + .5) * .03 * amount
    },
  }
}
