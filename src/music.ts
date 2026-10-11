export function createMusic(app: HTMLElement) {
  const audio = document.createElement('audio')
  audio.src = `${import.meta.env.BASE_URL}audio/bgm.mp3`
  audio.loop = true
  audio.preload = 'none'
  audio.volume = .35
  audio.hidden = true
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'music-toggle'
  app.append(audio, button)
  let pending = false
  function render() {
    const playing = !audio.paused
    button.textContent = playing ? '♫ MUSIC ON' : '♫ MUSIC OFF'
    button.setAttribute('aria-label', playing ? '배경음악 끄기' : '배경음악 켜기')
    button.setAttribute('aria-pressed', String(playing))
  }
  function stopAutoStart() {
    window.removeEventListener('pointerdown', firstInteraction)
    window.removeEventListener('keydown', firstInteraction)
  }
  async function play() {
    if (pending) return
    pending = true
    try {
      await audio.play()
    } catch {
      button.textContent = '♫ PLAY MUSIC'
      button.setAttribute('aria-label', '배경음악 재생 다시 시도')
    } finally {
      pending = false
    }
  }
  function firstInteraction(event: Event) {
    if (event.target instanceof Node && button.contains(event.target)) return
    stopAutoStart()
    void play()
  }
  button.addEventListener('click', () => {
    stopAutoStart()
    if (audio.paused) void play()
    else audio.pause()
  })
  audio.addEventListener('playing', render)
  audio.addEventListener('pause', render)
  render()
  window.addEventListener('pointerdown', firstInteraction)
  window.addEventListener('keydown', firstInteraction)
}
