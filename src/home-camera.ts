import retryIconUrl from './assets/retry-icon.png'
import closeButtonUrl from './assets/close-button.png'
import stickersUrl from './assets/camera-stickers.png'
import { loadImage, drawFit } from './play-assets'
import { cutout } from './badge-candies'

export function createHomeCamera(host: HTMLElement, captureHome: () => HTMLCanvasElement) {
  host.innerHTML = `<section class="home-camera" aria-label="카메라 촬영">
    <a class="camera-close" href="#home" aria-label="카메라 닫기"><img src="${closeButtonUrl}" alt=""></a>
    <header class="camera-titlebar"><span aria-hidden="true">● ● ●</span><h1>Photo Booth</h1></header><div class="home-camera-view"><video autoplay muted playsinline></video><img alt="촬영한 사진" hidden><canvas class="camera-sticker-layer" aria-hidden="true"></canvas></div>
    <p role="status"></p><div class="camera-actions"><button class="camera-shutter" data-shoot disabled aria-label="촬영"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 4h8l2 3h3v13H3V7h3zm4 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg></button><button class="play-button" data-save hidden>SAVE</button></div>
    <button class="text-button retry-icon-button" data-retry hidden aria-label="카메라 다시 연결"><img src="${retryIconUrl}" alt=""></button></section>`
  const video = host.querySelector<HTMLVideoElement>('video')!
  const image = host.querySelector<HTMLImageElement>('img')!
  const status = host.querySelector<HTMLElement>('[role="status"]')!
  const shoot = host.querySelector<HTMLButtonElement>('[data-shoot]')!
  const shutterMarkup = shoot.innerHTML
  const save = host.querySelector<HTMLButtonElement>('[data-save]')!
  const view = host.querySelector<HTMLElement>('.home-camera-view')!
  const overlay = host.querySelector<HTMLCanvasElement>('.camera-sticker-layer')!
  const stickerImages: HTMLCanvasElement[] = []
  const placements = [[0, .01, .29, 0], [.04, .04, .29, 0], [.73, .2, .27, 1], [.69, .49, .29, 0]]
  function decorate(ctx: CanvasRenderingContext2D, w: number, h: number) {
    for (const [x, y, size, kind] of placements) {
      const sticker = stickerImages[kind!]
      if (sticker) drawFit(ctx, sticker, x! * w, y! * h, size! * w, size! * w)
    }
  }
  function resizeOverlay() {
    overlay.width = Math.max(1, view.clientWidth * 2); overlay.height = Math.max(1, view.clientHeight * 2)
    decorate(overlay.getContext('2d')!, overlay.width, overlay.height)
  }
  const observer = new ResizeObserver(resizeOverlay); observer.observe(view)
  const retry = host.querySelector<HTMLButtonElement>('[data-retry]')!
  let stream: MediaStream | null = null, disposed = false, photo: HTMLCanvasElement | null = null, request = 0
  let story: HTMLCanvasElement | null = null
  function download() {
    story?.toBlob(blob => {
      if (!blob || disposed) return
      const url = URL.createObjectURL(blob), link = document.createElement('a')
      link.href = url; link.download = 'GLYF-story-1080x1920.png'; link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }
  function composeStory(shot: HTMLCanvasElement) {
    const result = captureHome(), ctx = result.getContext('2d')!
    const x = 54, width = 972, padding = 12, title = 40, footer = 70
    const imageWidth = width - padding * 2, imageHeight = imageWidth * shot.height / shot.width
    const height = padding * 2 + title + imageHeight + footer, y = (1920 - height) / 2
    ctx.fillStyle = '#e83796'; ctx.fillRect(x, y, width, height)
    ctx.fillStyle = '#ededed'; ctx.fillRect(x + padding, y + padding, imageWidth, title)
    ctx.fillStyle = '#888'; ctx.font = '20px Arial'; ctx.fillText('● ● ●', x + 24, y + 39)
    ctx.fillStyle = '#333'; ctx.font = '700 20px Arial'; ctx.fillText('Photo Booth', x + 112, y + 39)
    ctx.drawImage(shot, x + padding, y + padding + title, imageWidth, imageHeight)
    const footerY = y + padding + title + imageHeight
    ctx.fillStyle = '#e1e1e1'; ctx.fillRect(x + padding, footerY, imageWidth, footer)
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(540, footerY + 35, 28, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#f21c2c'; ctx.beginPath(); ctx.arc(540, footerY + 35, 24, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.fillRect(527, footerY + 28, 26, 18); ctx.fillRect(533, footerY + 24, 14, 5)
    ctx.fillStyle = '#f21c2c'; ctx.beginPath(); ctx.arc(540, footerY + 37, 6, 0, Math.PI * 2); ctx.fill()
    return result
  }
  void loadImage(stickersUrl).then(source => {
    if (disposed) return
    for (let i = 0; i < 2; i++) {
      const mesh = cutout(source, [i / 2, 0, .5, 1])!
      stickerImages.push(mesh.material.map!.image as HTMLCanvasElement)
      mesh.geometry.dispose(); mesh.material.map!.dispose(); mesh.material.dispose()
    }
    resizeOverlay()
  }).catch(() => { /* Camera still works if decorations cannot load. */ })
  function stop() { stream?.getTracks().forEach(track => track.stop()); stream = null; video.srcObject = null }
  async function connect() {
    const current = ++request
    stop(); shoot.disabled = true; retry.hidden = true
    status.textContent = ''
    try {
      const incoming = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      if (disposed || current !== request) { incoming.getTracks().forEach(track => track.stop()); return }
      stream = incoming; video.srcObject = incoming; await video.play()
      if (disposed || current !== request) return
      image.hidden = true; video.hidden = false; save.hidden = true; photo = null; story = null
      shoot.disabled = false; shoot.innerHTML = shutterMarkup; shoot.setAttribute('aria-label', '촬영'); overlay.hidden = false
      status.textContent = ''
    } catch {
      if (disposed || current !== request) return
      stop(); retry.hidden = false
      status.textContent = '카메라 권한을 허용한 뒤 다시 연결해 주세요.'
    }
  }
  shoot.addEventListener('click', () => {
    if (photo) { void connect(); return }
    if (!video.videoWidth || !video.videoHeight) return
    photo = document.createElement('canvas'); photo.width = 1080; photo.height = Math.round(1080 * view.clientHeight / view.clientWidth)
    const ctx = photo.getContext('2d')!
    const scale = Math.max(photo.width / video.videoWidth, photo.height / video.videoHeight)
    ctx.save(); ctx.translate(photo.width, 0); ctx.scale(-1, 1)
    ctx.drawImage(video, (photo.width - video.videoWidth * scale) / 2, (photo.height - video.videoHeight * scale) / 2, video.videoWidth * scale, video.videoHeight * scale)
    ctx.restore(); decorate(ctx, photo.width, photo.height); overlay.hidden = true
    image.src = photo.toDataURL('image/png'); image.hidden = false; video.hidden = true
    stop(); save.hidden = false; shoot.innerHTML = `<img class="retry-icon" src="${retryIconUrl}" alt="">`; shoot.setAttribute('aria-label', '다시 촬영'); status.textContent = ''
    try { story = composeStory(photo); download() }
    catch { status.textContent = '스토리 이미지를 만들지 못했어요. 다시 촬영해 주세요.' }
  })
  save.addEventListener('click', download)
  retry.addEventListener('click', () => { void connect() })
  void connect()
  return () => { disposed = true; request++; stop(); observer.disconnect() }
}
