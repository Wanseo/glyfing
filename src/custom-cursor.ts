import cursorUrl from './assets/cursor.png'

export function createCustomCursor() {
  const image = new Image()
  image.src = cursorUrl
  void image.decode().then(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 48
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, 0, 0, 48, 48)
    // Align the click hotspot with the arrow's upper-left tip.
    document.documentElement.style.setProperty('--site-cursor', `url("${canvas.toDataURL('image/png')}") 7 3, auto`)
  }).catch(() => { /* Keep the standard cursor if the image cannot load. */ })
}
