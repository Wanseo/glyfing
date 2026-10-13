import cursorUrl from './assets/cursor.png'
import magnifierUrl from './assets/magnifier-cursor.png'

export function createCustomCursor() {
  const magnifier = new Image()
  magnifier.src = magnifierUrl
  void magnifier.decode().then(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 36
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(magnifier, 0, 0, 36, 36)
    document.documentElement.style.setProperty('--badge-cursor', `url("${canvas.toDataURL('image/png')}") 13 13, zoom-in`)
  }).catch(() => { /* Keep the standard zoom cursor if loading fails. */ })
  const image = new Image()
  image.src = cursorUrl
  void image.decode().then(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 36
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const outline = document.createElement('canvas')
    outline.width = outline.height = 36
    const outlineCtx = outline.getContext('2d')!
    outlineCtx.imageSmoothingEnabled = false
    outlineCtx.drawImage(image, 0, 0, 36, 36)
    outlineCtx.globalCompositeOperation = 'source-in'
    outlineCtx.fillStyle = '#000'
    outlineCtx.fillRect(0, 0, 36, 36)
    for (let step = 0; step < 16; step++) {
      const angle = step * Math.PI * 2 / 16
      ctx.drawImage(outline, Math.cos(angle) * 1.1, Math.sin(angle) * 1.1)
    }
    ctx.drawImage(image, 0, 0, 36, 36)
    // Align the click hotspot with the arrow's upper-left tip.
    document.documentElement.style.setProperty('--site-cursor', `url("${canvas.toDataURL('image/png')}") 5 2, auto`)
  }).catch(() => { /* Keep the standard cursor if the image cannot load. */ })
}
