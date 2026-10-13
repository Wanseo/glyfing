import { loadPlayAssets } from './play-assets'
import { createGummyGame } from './gummy-game'
import { createPhotoBooth } from './photo-booth'
import { createHomeCamera } from './home-camera'

type Route = 'home' | 'game' | 'photo' | 'camera'
export function createExperiences(app: HTMLElement, captureCharacter: () => string, onRoute: (route: Route) => void) {
  const nav = document.createElement('nav')
  nav.className = 'world-nav'; nav.setAttribute('aria-label', 'GLYF 화면 이동')
  nav.innerHTML = '<a href="#home" data-route="home">THE WORLD</a><a href="#game" data-route="game">PLAY ↗</a><a href="#photo" data-route="photo">SNAP ↗</a>'
  const screen = document.createElement('main')
  screen.className = 'play-screen'; screen.hidden = true
  app.append(nav, screen)
  let dispose: (() => void) | undefined, request = 0
  let assets: ReturnType<typeof loadPlayAssets> | undefined
  const links = nav.querySelectorAll<HTMLAnchorElement>('a')
  async function show(route: Route, score?: number) {
    const current = ++request
    dispose?.(); dispose = undefined
    onRoute(route)
    document.documentElement.dataset.view = route
    screen.hidden = route === 'home'; nav.hidden = route === 'home' || route === 'camera'
    links.forEach(link => {
      if (link.dataset.route === route) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
    if (route === 'home') return
    screen.scrollTop = 0
    if (route === 'camera') {
      dispose = createHomeCamera(screen)
      screen.querySelector<HTMLAnchorElement>('.camera-close')!.focus({ preventScroll: true })
      return
    }
    screen.replaceChildren()
    try {
      const images = await (assets ??= loadPlayAssets(captureCharacter()))
      if (request !== current) return
      if (route === 'game') dispose = createGummyGame(screen, images)
      else dispose = createPhotoBooth(screen, images, score)
      const title = screen.querySelector<HTMLElement>('h1') ?? screen.querySelector<HTMLElement>('.rain-game')!
      title.tabIndex = -1; title.focus({ preventScroll: true })
    } catch {
      if (request !== current) return
      screen.innerHTML = '<div class="loading-card" role="alert">이미지를 불러오지 못했어요. <button class="play-button" data-retry>다시 시도 ↻</button></div>'
      screen.querySelector('[data-retry]')!.addEventListener('click', () => location.reload())
    }
  }
  function readRoute(): Route { return location.hash === '#camera' ? 'camera' : location.hash === '#game' ? 'game' : location.hash === '#photo' ? 'photo' : 'home' }
  window.addEventListener('hashchange', () => { void show(readRoute()) })
  void show(readRoute())
}
