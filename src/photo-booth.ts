import { drawFit, loadImage } from './play-assets'
import type { PlayAssets } from './play-assets'
import { createGlitterBackground } from './glitter'

type Frame = 'pink' | 'blue' | 'cream'
export function createPhotoBooth(host: HTMLElement, assets: PlayAssets, gameScore?: number) {
  host.innerHTML = `
    <div class="experience-heading"><div><span class="eyebrow">02 / THE WEIRD LITTLE PHOTO CLUB</span>
    <h1>GLYF <em>PHOTOBOOTH</em></h1><p>오늘의 얼굴에, 조금 이상한 귀여움을 더해봐.</p></div><div class="stamp">LOOK<br>WEIRD ✦</div></div>
    <div class="photo-layout"><section class="photo-preview"><span class="preview-tag">YOUR NEXT STORY ↗</span>
      <canvas class="photo-canvas" width="1080" height="1920" role="img" aria-label="GLYF 세로 포토카드 미리보기"></canvas></section>
    <section class="photo-controls" aria-label="포토카드 꾸미기"><span class="eyebrow">MAKE IT YOURS</span><h2>Your face.<br>Our kind of weird.</h2>
      <div class="control-section"><span class="control-label">01 / 사진 고르기</span>
        <div class="button-pair"><button class="play-button" data-camera>카메라 켜기 ↗</button><label class="play-button upload-button">사진 업로드 +<input type="file" accept="image/*" data-upload></label></div>
        <button class="play-button pink-button capture-button" data-capture hidden>찰칵! 3초 후 촬영</button>
        <button class="text-button" data-reset>사진 없이 캐릭터로 만들기 ↻</button>
        <p class="control-note">사진은 업로드 전송 없이 이 기기에서만 꾸며져요.</p>
      </div>
      <div class="control-section"><span class="control-label">02 / 프레임 고르기</span>
        <div class="frame-options"><button data-frame="pink" class="frame-option frame-pink" aria-pressed="true">PINK<br>GLITTER</button><button data-frame="blue" class="frame-option frame-blue" aria-pressed="false">BLUE<br>MOOD</button><button data-frame="cream" class="frame-option frame-cream" aria-pressed="false">VANILLA<br>WEIRD</button></div>
      </div>
      <div class="control-section"><label class="control-label" for="photo-caption">03 / 오늘의 한마디</label>
        <select id="photo-caption"><option>Stay weird with me!</option><option>Feeling cute. Might bite.</option><option>Gloss first. Everything later.</option><option>My kind of weird.</option><option>Three eyes. All on you.</option></select>
        <label class="control-label name-label" for="photo-name">YOUR NAME / @HANDLE</label><input id="photo-name" maxlength="22" placeholder="@yourname" autocomplete="off">
        <label class="sticker-option"><input type="checkbox" data-stickers checked> 젤리와 글로스 스티커 붙이기 ✦</label>
      </div>
      <button class="text-button preview-button" data-preview>포토카드 미리보기 ↑</button>
      <button class="play-button download-button" data-save>포토카드 저장 ↓ <small>1080 × 1920 PNG</small></button>
      <p class="photo-status" role="status">셀카를 넣거나, 지금 이 캐릭터로 바로 저장해도 좋아요.</p>
      <a class="instagram-link" href="https://www.instagram.com/glyfing/" target="_blank" rel="noopener noreferrer">@glyfing · 인스타에서 만나 ↗</a>
    </section></div>`
  const canvas = host.querySelector<HTMLCanvasElement>('.photo-canvas')!
  const ctx = canvas.getContext('2d')!
  const preview = host.querySelector<HTMLElement>('.photo-preview')!
  const status = host.querySelector<HTMLElement>('.photo-status')!
  const caption = host.querySelector<HTMLSelectElement>('#photo-caption')!
  const name = host.querySelector<HTMLInputElement>('#photo-name')!
  const stickers = host.querySelector<HTMLInputElement>('[data-stickers]')!
  const cameraButton = host.querySelector<HTMLButtonElement>('[data-camera]')!
  const captureButton = host.querySelector<HTMLButtonElement>('[data-capture]')!
  const upload = host.querySelector<HTMLInputElement>('[data-upload]')!
  const video = document.createElement('video')
  video.autoplay = true; video.muted = true; video.playsInline = true
  let frame: Frame = 'pink', photo: CanvasImageSource | null = null
  let stream: MediaStream | null = null, live = false, disposed = false
  let animation = 0, countdownTimer = 0, cameraRequest = 0
  const glitter = createGlitterBackground(1080, 1920, 1)
  const glitterCanvas = glitter.image as HTMLCanvasElement
  if (gameScore !== undefined) {
    const option = document.createElement('option')
    option.textContent = `SNACK SCORE: ${gameScore}. Still hungry.`
    caption.appendChild(option); caption.value = option.textContent
  }
  function stopCamera() {
    cameraRequest++; live = false
    stream?.getTracks().forEach(track => track.stop()); stream = null
    video.srcObject = null
    cancelAnimationFrame(animation); clearTimeout(countdownTimer)
    captureButton.hidden = true; captureButton.disabled = false
    captureButton.textContent = '찰칵! 3초 후 촬영'
    cameraButton.disabled = false
  }
  function cover(image: CanvasImageSource, x: number, y: number, w: number, h: number, mirror = false) {
    const source = image as HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
    const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.width
    const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.height
    if (!sw || !sh) return
    const scale = Math.max(w / sw, h / sh), cropW = w / scale, cropH = h / scale
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
    if (mirror) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1) }
    ctx.drawImage(image, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, x, y, w, h)
    ctx.restore()
  }
  function textFit(text: string, x: number, y: number, width: number, size: number) {
    ctx.font = `900 ${size}px Arial, sans-serif`
    while (ctx.measureText(text).width > width && size > 20) { size -= 2; ctx.font = `900 ${size}px Arial, sans-serif` }
    ctx.fillText(text, x, y)
  }
  function render() {
    if (disposed) return
    ctx.fillStyle = frame === 'blue' ? '#96d9f3' : frame === 'cream' ? '#fff6dd' : '#ef459d'
    ctx.fillRect(0, 0, 1080, 1920)
    if (frame === 'pink') ctx.drawImage(glitterCanvas, 0, 0)
    else {
      ctx.fillStyle = frame === 'blue' ? '#ffffff60' : '#f491b755'
      for (let x = 16; x < 1080; x += 40) for (let y = 16; y < 1920; y += 40) ctx.fillRect(x, y, 3, 3)
    }
    drawFit(ctx, assets.logo, 78, 58, 145, 145)
    ctx.fillStyle = '#fff'; ctx.font = '800 28px Arial'; ctx.textAlign = 'right'
    ctx.fillText('THE WEIRD LITTLE PHOTO CLUB', 1000, 112)
    ctx.fillText('GLYF / MEMBER NO. 003', 1000, 152); ctx.textAlign = 'left'
    ctx.fillStyle = '#171717'
    textFit('WEIRD LOOKS', 74, 284, 940, 116)
    textFit('GOOD ON YOU.', 74, 393, 940, 116)
    ctx.fillStyle = '#fff'; ctx.fillRect(68, 449, 944, 1154)
    ctx.strokeStyle = '#171717'; ctx.lineWidth = 5; ctx.strokeRect(68, 449, 944, 1154)
    if (live) cover(video, 88, 469, 904, 1114, true)
    else if (photo) cover(photo, 88, 469, 904, 1114)
    else {
      ctx.fillStyle = frame === 'blue' ? '#d7f3ff' : frame === 'cream' ? '#ffe3eb' : '#f9add4'
      ctx.fillRect(88, 469, 904, 1114)
      ctx.fillStyle = '#ffffff75'; ctx.font = '900 85px Arial'
      for (let i = 0; i < 5; i++) ctx.fillText('GLYF GLYF GLYF', 115, 650 + i * 175)
      drawFit(ctx, assets.character, 175, 650, 730, 800)
    }
    if (photo || live) drawFit(ctx, assets.character, 645, 1130, 310, 410)
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#171717'; ctx.lineWidth = 5
    ctx.beginPath(); ctx.moveTo(150, 1458); ctx.lineTo(908, 1458); ctx.lineTo(908, 1550)
    ctx.lineTo(310, 1550); ctx.lineTo(242, 1622); ctx.lineTo(258, 1550)
    ctx.lineTo(150, 1550); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#171717'; textFit(caption.value, 178, 1516, 702, 45)
    if (stickers.checked) {
      ctx.save(); ctx.translate(144, 520); ctx.rotate(-.22)
      drawFit(ctx, assets.box, -115, -65, 270, 185); ctx.restore()
      drawFit(ctx, assets.chrome, 795, 1252, 248, 302)
      drawFit(ctx, assets.candies[0]!, 15, 1230, 236, 174)
      drawFit(ctx, assets.candies[2]!, 824, 522, 188, 188)
      drawFit(ctx, assets.candies[3]!, 868, 1610, 116, 140)
    }
    ctx.fillStyle = '#171717'; textFit(name.value.trim() || '@GLYFING', 78, 1744, 900, 65)
    ctx.font = '800 27px Arial'; ctx.fillText('A LITTLE GLOSS. A LOT OF PERSONALITY.', 78, 1810)
    ctx.fillStyle = '#fff'; ctx.fillRect(78, 1843, 924, 5)
    ctx.font = '800 23px Arial'; ctx.fillText('MADE IN THE GLYF UNIVERSE  /  STAY WEIRD ✦', 78, 1890)
  }
  function liveLoop() { render(); if (live && !disposed) animation = requestAnimationFrame(liveLoop) }
  cameraButton.addEventListener('click', async () => {
    stopCamera()
    const request = cameraRequest
    cameraButton.disabled = true
    status.textContent = '카메라를 연결하고 있어요…'
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable')
      const incoming = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      if (disposed || request !== cameraRequest) { incoming.getTracks().forEach(track => track.stop()); return }
      stream = incoming; video.srcObject = incoming
      await video.play()
      if (disposed || request !== cameraRequest) return
      live = true; captureButton.hidden = false
      preview.appendChild(captureButton)
      preview.scrollIntoView({ block: 'center' })
      status.textContent = '마음에 드는 표정을 지어봐. 촬영 버튼을 누르면 3초 후 찰칵!'
      liveLoop()
    } catch {
      if (disposed || request !== cameraRequest) return
      stopCamera(); render()
      status.textContent = '카메라를 사용할 수 없어요. 사진 업로드로도 똑같이 만들 수 있어요.'
    } finally { if (!disposed) cameraButton.disabled = false }
  })
  captureButton.addEventListener('click', () => {
    if (!live) return
    captureButton.disabled = true
    let count = 3
    const tick = () => {
      if (disposed || !live) return
      if (count > 0) {
        captureButton.textContent = `${count}… SMILE!`; count--
        countdownTimer = window.setTimeout(tick, 1000)
      } else {
        const shot = document.createElement('canvas')
        shot.width = video.videoWidth; shot.height = video.videoHeight
        if (!shot.width || !shot.height) { stopCamera(); status.textContent = '촬영을 다시 시도하거나 사진을 업로드해 주세요.'; return }
        const shotCtx = shot.getContext('2d')!
        shotCtx.translate(shot.width, 0); shotCtx.scale(-1, 1); shotCtx.drawImage(video, 0, 0)
        photo = shot; stopCamera(); render()
        status.textContent = '찰칵! 프레임과 한마디를 골라 나만의 포토카드를 완성해봐.'
      }
    }
    tick()
  })
  upload.addEventListener('change', async () => {
    const file = upload.files?.[0]
    if (!file) return
    stopCamera()
    const url = URL.createObjectURL(file)
    try {
      const image = await loadImage(url)
      if (disposed) return
      photo = image; render(); status.textContent = '사진 준비 완료! 프레임과 스티커를 골라봐.'
    } catch { if (!disposed) status.textContent = '이 사진을 열 수 없어요. JPG, PNG 또는 WebP 사진을 선택해 주세요.' }
    finally { URL.revokeObjectURL(url); upload.value = '' }
  })
  host.querySelector('[data-reset]')!.addEventListener('click', () => {
    stopCamera(); photo = null; render(); status.textContent = '우리의 작은 친구로 바꿨어요. 바로 저장할 수 있어요!'
  })
  host.querySelectorAll<HTMLButtonElement>('[data-frame]').forEach(button => button.addEventListener('click', () => {
    frame = button.dataset.frame as Frame
    host.querySelectorAll<HTMLButtonElement>('[data-frame]').forEach(item => item.setAttribute('aria-pressed', String(item === button)))
    render()
  }))
  host.querySelector('[data-preview]')!.addEventListener('click', () => preview.scrollIntoView({ block: 'center' }))
  caption.addEventListener('change', render); name.addEventListener('input', render); stickers.addEventListener('change', render)
  host.querySelector<HTMLButtonElement>('[data-save]')!.addEventListener('click', () => {
    if (live) { status.textContent = '먼저 촬영 버튼으로 사진을 찍어 주세요.'; return }
    render()
    canvas.toBlob(blob => {
      if (!blob || disposed) return
      const url = URL.createObjectURL(blob), link = document.createElement('a')
      link.href = url; link.download = 'GLYF-my-kind-of-weird.png'
      link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      status.textContent = '저장했어요! 인스타 스토리에 올리고 @glyfing을 태그해봐.'
    }, 'image/png')
  })
  render()
  return () => { disposed = true; stopCamera(); glitter.dispose() }
}
