import musicNoteUrl from './assets/music-note.png'

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
  const icon = document.createElement('img')
  icon.src = musicNoteUrl; icon.alt = ''; icon.draggable = false
  const slash = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  slash.setAttribute('viewBox', '0 0 64 64'); slash.setAttribute('aria-hidden', 'true')
  slash.classList.add('music-off-slash')
  slash.innerHTML = '<path transform="translate(64 0) scale(-1 1)" d="M10 8H18V16H26V24H34V32H42V40H50V48H58V56H50V48H42V40H34V32H26V24H18V16H10Z" fill="#f5ff00" stroke="#171717" stroke-width="3" stroke-linejoin="miter"/>'
  button.append(icon, slash)
  app.append(audio, button)
  let pending = false
  function render() {
    const playing = !audio.paused
    document.documentElement.dataset.soundMuted = String(!playing)
    window.dispatchEvent(new Event('glyf-sound-change'))
    button.classList.toggle('is-off', !playing)
    button.title = playing ? 'MUSIC ON' : 'MUSIC OFF'
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
      button.classList.add('is-off')
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
