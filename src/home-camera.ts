import retryIconUrl from './assets/retry-icon.png'
import closeButtonUrl from './assets/close-button.png'
import stickersUrl from './assets/camera-stickers.png'
import whiteStickerUrl from './assets/camera-sticker-white.png'
import glossWandUrl from './assets/gloss-wand.png'
import glossProductsUrl from './assets/gloss-cutouts.webp'
import { productTexture } from './gloss-props'
import { loadImage, drawFit } from './play-assets'
import { cutout } from './badge-candies'

export function createHomeCamera(host: HTMLElement, captureHome: () => HTMLCanvasElement) {
  host.innerHTML = `<section class="home-camera" aria-label="카메라 촬영">
    <a class="camera-close" href="#home" aria-label="카메라 닫기"><img src="${closeButtonUrl}" alt=""></a>
    <header class="camera-titlebar"><span aria-hidden="true">● ● ●</span><h1>Photo Booth</h1></header><div class="home-camera-view"><video autoplay muted playsinline></video><img alt="촬영한 사진" hidden><canvas class="camera-sticker-layer" aria-hidden="true"></canvas></div>
    <p role="status"></p><div class="camera-actions"><div class="camera-mode-options" role="group" aria-label="촬영 모드"><button data-mode="photo" aria-pressed="true">PHOTO</button><button data-mode="video" aria-pressed="false">VIDEO</button></div><button class="camera-shutter" data-shoot disabled aria-label="촬영"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 4h8l2 3h3v13H3V7h3zm4 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg></button><button class="camera-share" data-save hidden aria-label="인스타그램에 공유"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></svg></button></div>
    <button class="text-button retry-icon-button" data-retry hidden aria-label="카메라 다시 연결"><img src="${retryIconUrl}" alt=""></button></section>`
  const video = host.querySelector<HTMLVideoElement>('video')!
  const image = host.querySelector<HTMLImageElement>('.home-camera-view > img')!
  const status = host.querySelector<HTMLElement>('[role="status"]')!
  const shoot = host.querySelector<HTMLButtonElement>('[data-shoot]')!
  const modeButtons = host.querySelectorAll<HTMLButtonElement>('[data-mode]')!
  function disableModes(disabled: boolean) { modeButtons.forEach(button => { button.disabled = disabled }) }
  let videoMode = false, recording = false, recordedBlob: Blob | null = null, recordedUrl = ''
  let recorder: MediaRecorder | null = null, recordStream: MediaStream | null = null, animationFrame = 0
  let recordStarted = 0, recordCanvas: HTMLCanvasElement | null = null, recordBackground: HTMLCanvasElement | null = null
  let lastPaint = 0
  const shutterMarkup = shoot.innerHTML
  const save = host.querySelector<HTMLButtonElement>('[data-save]')!
  const view = host.querySelector<HTMLElement>('.home-camera-view')!
  const overlay = host.querySelector<HTMLCanvasElement>('.camera-sticker-layer')!
  const stickerImages: HTMLCanvasElement[] = []
  let glossWand: HTMLCanvasElement | undefined
  let chromeTube: HTMLCanvasElement | undefined
  const placements = [[0, .01, .29, 2], [.04, .04, .29, 0], [.73, .2, .27, 1], [.69, .49, .29, 0]]
  function decorate(ctx: CanvasRenderingContext2D, w: number, h: number, motion = false) {
    const phase = Math.floor(performance.now() / 150)
    const animated = Array.from({ length: 10 }, (_, index) => {
      const base = placements[index % placements.length]!
      return [Math.max(0, Math.min(.8, base[0]! + (index % 3 - 1) * .065)),
        Math.max(0, Math.min(.75, base[1]! + Math.floor(index / 4) * .045)), base[2]!, index === 0 ? 2 : index % 2]
    })
    for (const [index, [x, y, size, kind]] of (motion ? animated : placements).entries()) {
      if (motion && (index + phase) % 7 > 3) continue
      const sticker = stickerImages[kind!]
      if (sticker) drawFit(ctx, sticker, x! * w, y! * h, size! * w, size! * w)
    }
    ctx.save()
    ctx.fillStyle = '#ff38cf'
    const stars = [[.07, .07], [.13, .12], [.55, .035], [.87, .08], [.95, .32],
      [.08, .47], [.92, .53], [.035, .67], [.17, .9], [.54, .95], [.89, .88], [.97, .72],
      [.035, .11], [.1, .16], [.16, .08], [.83, .05], [.9, .13],
      [.94, .37], [.89, .4], [.06, .52], [.11, .56], [.035, .74],
      [.13, .86], [.21, .94], [.47, .93], [.61, .97], [.84, .92], [.94, .84]]
    stars.forEach(([sx, sy], index) => {
      const radius = w * (index % 3 === 0 ? .025 : .018)
      ctx.beginPath()
      for (let point = 0; point < 10; point++) {
        const angle = -Math.PI / 2 + point * Math.PI / 5
        const r = point % 2 ? radius * .43 : radius
        const x = sx! * w + Math.cos(angle) * r, y = sy! * h + Math.sin(angle) * r
        if (point === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath(); ctx.fill()
    })
    ctx.fillStyle = '#fff'
    ctx.font = `500 ${w * .043}px 'Arial Narrow', Arial, sans-serif`
    for (const [x, y] of [[.015, .56], [.045, .62], [.015, .68], [.68, .91]]) {
      ctx.save(); ctx.translate(x! * w, y! * h); ctx.scale(.55, 1)
      ctx.fillText('FLUFFY FANG', 0, 0); ctx.restore()
    }
    ctx.restore()
    if (glossWand) {
      const wandHeight = h * .34
      const wandWidth = wandHeight * glossWand.width / glossWand.height
      ctx.drawImage(glossWand, w * .14 - wandWidth / 2, h - wandHeight * .88, wandWidth, wandHeight)
    }
    if (chromeTube) drawFit(ctx, chromeTube, w * .18, h * .7, w * .18, h * .33)
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
  function composeStory(shot: HTMLCanvasElement, background?: HTMLCanvasElement, target?: HTMLCanvasElement) {
    const result = target ?? captureHome()
    if (background) result.getContext('2d')!.drawImage(background, 0, 0)
    const ctx = result.getContext('2d')!
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
  void Promise.all([loadImage(stickersUrl), loadImage(whiteStickerUrl), loadImage(glossWandUrl), loadImage(glossProductsUrl)]).then(([source, white, wand, products]) => {
    if (disposed) return
    for (let i = 0; i < 2; i++) {
      const mesh = cutout(source, [i / 2, 0, .5, 1])!
      stickerImages.push(mesh.material.map!.image as HTMLCanvasElement)
      mesh.geometry.dispose(); mesh.material.map!.dispose(); mesh.material.dispose()
    }
    const whiteMesh = cutout(white, [0, 0, 1, 1])!
    stickerImages.push(whiteMesh.material.map!.image as HTMLCanvasElement)
    whiteMesh.geometry.dispose(); whiteMesh.material.map!.dispose(); whiteMesh.material.dispose()
    const wandMesh = cutout(wand, [0, 0, 1, 1], false)!
    glossWand = wandMesh.material.map!.image as HTMLCanvasElement
    wandMesh.geometry.dispose(); wandMesh.material.map!.dispose(); wandMesh.material.dispose()
    const tube = productTexture(products, false)
    chromeTube = tube.texture.image as HTMLCanvasElement
    tube.texture.dispose()
    resizeOverlay()
  }).catch(() => { /* Camera still works if decorations cannot load. */ })
  function shootFrame(motion = false) {
    const shot = document.createElement('canvas')
    shot.width = 1080; shot.height = Math.round(1080 * view.clientHeight / view.clientWidth)
    const ctx = shot.getContext('2d')!
    const scale = Math.max(shot.width / video.videoWidth, shot.height / video.videoHeight)
    ctx.save(); ctx.translate(shot.width, 0); ctx.scale(-1, 1)
    ctx.drawImage(video, (shot.width - video.videoWidth * scale) / 2, (shot.height - video.videoHeight * scale) / 2, video.videoWidth * scale, video.videoHeight * scale)
    ctx.restore(); decorate(ctx, shot.width, shot.height, motion)
    return shot
  }
  function finishRecording() {
    if (!recording) return
    recording = false; disableModes(false); shoot.disabled = true
    if (recorder?.state !== 'inactive') recorder?.stop()
  }
  function frame(time: number) {
    if (disposed) return
    if (stream && videoMode && time - lastPaint > 80) {
      lastPaint = time
      const ctx = overlay.getContext('2d')!
      ctx.clearRect(0, 0, overlay.width, overlay.height); decorate(ctx, overlay.width, overlay.height, true)
      if (recording && recordCanvas && recordBackground && video.videoWidth) {
        composeStory(shootFrame(true), recordBackground, recordCanvas)
        status.textContent = `${Math.min(10, Math.floor((time - recordStarted) / 1000))} / 10 sec`
        if (time - recordStarted >= 10000) finishRecording()
      }
    }
    animationFrame = requestAnimationFrame(frame)
  }
  function startRecording() {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      status.textContent = '이 브라우저는 영상 촬영을 지원하지 않아요.'; return
    }
    try {
      const mimeType = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type))
      if (!mimeType) throw new Error('No recording format')
      recordBackground = captureHome(); recordCanvas = document.createElement('canvas')
      recordCanvas.width = 1080; recordCanvas.height = 1920
      composeStory(shootFrame(true), recordBackground, recordCanvas)
      recordStream = recordCanvas.captureStream(24)
      recorder = new MediaRecorder(recordStream, { mimeType, videoBitsPerSecond: 5000000 })
      const chunks: Blob[] = []
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onstop = () => {
        recordStream?.getTracks().forEach(track => track.stop()); recordStream = null
        if (disposed) return
        recordedBlob = new Blob(chunks, { type: mimeType })
        stop(); recordedUrl = URL.createObjectURL(recordedBlob)
        video.src = recordedUrl; video.classList.add('recorded-video'); video.controls = true; video.loop = true
        if (recordBackground) view.style.backgroundImage = `url("${recordBackground.toDataURL('image/png')}")`
        image.hidden = true; video.hidden = false; overlay.hidden = true
        void video.play().catch(() => {})
        save.hidden = false; shoot.disabled = false; shoot.innerHTML = `<img class="retry-icon" src="${retryIconUrl}" alt="">`
        shoot.setAttribute('aria-label', '다시 촬영'); status.textContent = ''; downloadBlob(recordedBlob)
      }
      recorder.start(); recording = true; recordStarted = performance.now(); disableModes(true)
      shoot.innerHTML = '<span class="record-stop"></span>'; shoot.setAttribute('aria-label', '영상 촬영 중지')
    } catch {
      recordStream?.getTracks().forEach(track => track.stop()); recordStream = null
      status.textContent = '영상 촬영을 시작하지 못했어요. 다시 시도해 주세요.'
    }
  }
  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = url; link.download = `GLYF-story.${blob.type.startsWith('video/mp4') ? 'mp4' : blob.type.startsWith('video/') ? 'webm' : 'png'}`
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  }
  async function share() {
    const blob = recordedBlob ?? await new Promise<Blob | null>(resolve => story ? story.toBlob(resolve, 'image/png') : resolve(null))
    if (!blob || disposed) return
    const file = new File([blob], `GLYF-story.${blob.type.startsWith('video/mp4') ? 'mp4' : blob.type.startsWith('video/') ? 'webm' : 'png'}`, { type: blob.type })
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }) }
      catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) { downloadBlob(blob); status.textContent = '저장한 파일을 인스타 스토리에 올려주세요.' } }
    } else { downloadBlob(blob); status.textContent = '저장한 파일을 인스타 스토리에 올려주세요.' }
  }
  modeButtons.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.mode === 'video'
    if (next === videoMode || recording) return
    videoMode = next
    modeButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)))
    if (photo || recordedBlob) void connect()
    else resizeOverlay()
  }))
  animationFrame = requestAnimationFrame(frame)
  function stop() { stream?.getTracks().forEach(track => track.stop()); stream = null; video.srcObject = null }
  async function connect() {
    const current = ++request
    stop(); shoot.disabled = true; retry.hidden = true
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); recordedUrl = '' }
    recordedBlob = null; video.removeAttribute('src'); video.load(); video.controls = false; video.loop = false; video.classList.remove('recorded-video')
    view.style.backgroundImage = ''
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
  shoot.addEventListener('click', async () => {
    if (recording) { finishRecording(); return }
    if (photo || recordedBlob) { void connect(); return }
    if (videoMode) { startRecording(); return }
    if (!video.videoWidth || !video.videoHeight) return
    shoot.disabled = true
    const current = request
    photo = document.createElement('canvas'); photo.width = 1080; photo.height = Math.round(1080 * view.clientHeight / view.clientWidth)
    const ctx = photo.getContext('2d')!
    const scale = Math.max(photo.width / video.videoWidth, photo.height / video.videoHeight)
    ctx.save(); ctx.translate(photo.width, 0); ctx.scale(-1, 1)
    ctx.drawImage(video, (photo.width - video.videoWidth * scale) / 2, (photo.height - video.videoHeight * scale) / 2, video.videoWidth * scale, video.videoHeight * scale)
    ctx.restore(); decorate(ctx, photo.width, photo.height)
    image.src = photo.toDataURL('image/png')
    try { await image.decode() }
    catch {
      if (!disposed && current === request) { photo = null; shoot.disabled = false }
      return
    }
    if (disposed || current !== request) return
    image.hidden = false; video.hidden = true; overlay.hidden = true; shoot.disabled = false
    stop(); save.hidden = false; shoot.innerHTML = `<img class="retry-icon" src="${retryIconUrl}" alt="">`; shoot.setAttribute('aria-label', '다시 촬영'); status.textContent = ''
    try { story = composeStory(photo); download() }
    catch { status.textContent = '스토리 이미지를 만들지 못했어요. 다시 촬영해 주세요.' }
  })
  save.addEventListener('click', () => { void share() })
  retry.addEventListener('click', () => { void connect() })
  void connect()
  return () => { disposed = true; request++; cancelAnimationFrame(animationFrame); if (recorder?.state === 'recording') recorder.stop(); recordStream?.getTracks().forEach(track => track.stop()); if (recordedUrl) URL.revokeObjectURL(recordedUrl); stop(); observer.disconnect() }
}
