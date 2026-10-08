import * as THREE from 'three'

// Procedural stand-in for the attached reference until its original file is available.
export function createGlitterBackground() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024; canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  let seed = 91
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  ctx.fillStyle = '#b52361'
  ctx.fillRect(0, 0, 1024, 1024)
  const palette = ['#80113f', '#a81e57', '#d14882', '#d96997', '#e994b7', '#efb5cc']
  for (let i = 0; i < 190000; i++) {
    ctx.fillStyle = palette[Math.floor(random() * palette.length)]!
    const size = 0.4 + random() * 2
    ctx.fillRect(random() * 1024, random() * 1024, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}
