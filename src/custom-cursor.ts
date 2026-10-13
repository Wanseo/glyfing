import cursorUrl from './assets/cursor.png'

export function createCustomCursor() {
  const image = new Image()
  image.src = cursorUrl
  void image.decode().then(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 48
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const outline = document.createElement('canvas')
    outline.width = outline.height = 48
    const outlineCtx = outline.getContext('2d')!
    outlineCtx.imageSmoothingEnabled = false
    outlineCtx.drawImage(image, 0, 0, 48, 48)
    outlineCtx.globalCompositeOperation = 'source-in'
    outlineCtx.fillStyle = '#000'
    outlineCtx.fillRect(0, 0, 48, 48)
    for (let step = 0; step < 16; step++) {
      const angle = step * Math.PI * 2 / 16
      ctx.drawImage(outline, Math.cos(angle) * 1.5, Math.sin(angle) * 1.5)
    }
    ctx.drawImage(image, 0, 0, 48, 48)
    // Align the click hotspot with the arrow's upper-left tip.
    document.documentElement.style.setProperty('--site-cursor', `url("${canvas.toDataURL('image/png')}") 7 3, auto`)
  }).catch(() => { /* Keep the standard cursor if the image cannot load. */ })
}
