import * as THREE from 'three'

// Original procedural glitter inspired by the bright pink reference.
export function createGlitterBackground(width: number, height: number, pixelRatio: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * pixelRatio))
  canvas.height = Math.max(1, Math.round(height * pixelRatio))
  const ctx = canvas.getContext('2d')!
  ctx.scale(pixelRatio, pixelRatio)
  const area = width * height / (1024 * 1024)
  let seed = 249
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  ctx.fillStyle = '#e83796'
  ctx.fillRect(0, 0, width, height)
  const palette = ['#b91c70', '#d92b89', '#ed3c9c', '#f35bac', '#f67fbe', '#fba6d4', '#ffe0f0']
  for (let i = 0; i < Math.round(240000 * area); i++) {
    ctx.fillStyle = palette[Math.floor(random() * palette.length)]!
    const size = 0.35 + random() * 1.65
    ctx.fillRect(random() * width, random() * height, size, size * (0.6 + random() * 0.8))
  }
  // Fine reflected light, with a little less white glare than the reference.
  for (let i = 0; i < Math.round(950 * area); i++) {
    const x = random() * width, y = random() * height
    const radius = 0.65 + random() * 1.5
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.4)
    glow.addColorStop(0, '#fff4fcc4')
    glow.addColorStop(0.3, '#ffe7f5a0')
    glow.addColorStop(1, '#ffe7f500')
    ctx.fillStyle = glow
    ctx.fillRect(x - radius * 2.4, y - radius * 2.4, radius * 4.8, radius * 4.8)
    ctx.fillStyle = '#fff3fccc'
    ctx.beginPath()
    ctx.ellipse(x, y, radius * 0.7, radius, random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  // Occasional soft highlights rather than oversized star-shaped flashes.
  for (let i = 0; i < Math.round(70 * area); i++) {
    const x = random() * width, y = random() * height, radius = 2 + random() * 1.3
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2)
    glow.addColorStop(0, '#fff6fddd')
    glow.addColorStop(0.3, '#fff0fac0')
    glow.addColorStop(1, '#fff0fa00')
    ctx.fillStyle = glow
    ctx.fillRect(x - radius * 2, y - radius * 2, radius * 4, radius * 4)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  // Match the framebuffer resolution, with no enlarged tiles or mip blur.
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}
