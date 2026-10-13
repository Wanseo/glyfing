export function createHomeCamera(host: HTMLElement) {
  host.innerHTML = `<section class="home-camera" aria-label="카메라 촬영">
    <a class="camera-close" href="#home" aria-label="카메라 닫기">✕</a>
    <h1>PHOTO TIME!</h1><div class="home-camera-view"><video autoplay muted playsinline></video><img alt="촬영한 사진" hidden></div>
    <p role="status">카메라를 연결하고 있어요…</p><div class="camera-actions"><button class="play-button pink-button" data-shoot disabled>촬영 ✦</button><button class="play-button" data-save hidden>사진 저장 ↓</button></div>
    <button class="text-button" data-retry hidden>카메라 다시 연결 ↻</button></section>`
  const video = host.querySelector<HTMLVideoElement>('video')!
  const image = host.querySelector<HTMLImageElement>('img')!
  const status = host.querySelector<HTMLElement>('[role="status"]')!
  const shoot = host.querySelector<HTMLButtonElement>('[data-shoot]')!
  const save = host.querySelector<HTMLButtonElement>('[data-save]')!
  const retry = host.querySelector<HTMLButtonElement>('[data-retry]')!
  let stream: MediaStream | null = null, disposed = false, photo: HTMLCanvasElement | null = null, request = 0
  function stop() { stream?.getTracks().forEach(track => track.stop()); stream = null; video.srcObject = null }
  async function connect() {
    const current = ++request
    stop(); shoot.disabled = true; retry.hidden = true
    status.textContent = '카메라를 연결하고 있어요…'
    try {
      const incoming = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      if (disposed || current !== request) { incoming.getTracks().forEach(track => track.stop()); return }
      stream = incoming; video.srcObject = incoming; await video.play()
      if (disposed || current !== request) return
      image.hidden = true; video.hidden = false; save.hidden = true; photo = null
      shoot.disabled = false; shoot.textContent = '촬영 ✦'
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
    photo = document.createElement('canvas'); photo.width = video.videoWidth; photo.height = video.videoHeight
    const ctx = photo.getContext('2d')!
    ctx.translate(photo.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0)
    image.src = photo.toDataURL('image/png'); image.hidden = false; video.hidden = true
    stop(); save.hidden = false; shoot.textContent = '다시 촬영 ↻'; status.textContent = '찰칵! 사진을 저장할 수 있어요.'
  })
  save.addEventListener('click', () => photo?.toBlob(blob => {
    if (!blob || disposed) return
    const url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = url; link.download = 'GLYF-photo.png'; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png'))
  retry.addEventListener('click', () => { void connect() })
  void connect()
  return () => { disposed = true; request++; stop() }
}
