import { drawFit } from './play-assets'
import type { PlayAssets } from './play-assets'
import levelUpUrl from './assets/level-up.png'
import gameOverUrl from './assets/game-over.png'
import lifeHeartUrl from './assets/life-heart.png'
import levelLabelsUrl from './assets/level-labels.png'

type Drop = { x: number; y: number; speed: number; kind: number; angle: number }
type CatchEffect = { x: number; y: number; age: number; correct: boolean; label: string }
const levels = [
  { target: 0, count: 7, seconds: 35 },
  { target: 4, count: 9, seconds: 33 },
  { target: 1, count: 11, seconds: 31 },
  { target: 11, count: 13, seconds: 29 },
  { target: 6, count: 15, seconds: 27 },
]
export function createGummyGame(host: HTMLElement, assets: PlayAssets) {
  const itemSound = new Audio(`${import.meta.env.BASE_URL}audio/item-get.mp3`)
  itemSound.preload = 'auto'
  itemSound.volume = .65
  const levelSound = new Audio(`${import.meta.env.BASE_URL}audio/level-up.mp3`)
  levelSound.preload = 'auto'
  levelSound.volume = .65
  const wrongSound = new Audio(`${import.meta.env.BASE_URL}audio/item-wrong.mp3`)
  wrongSound.preload = 'auto'
  wrongSound.volume = .65
  const gameOverSound = new Audio(`${import.meta.env.BASE_URL}audio/freesound_community-videogame-death-sound-43894.mp3`)
  gameOverSound.preload = 'auto'
  gameOverSound.volume = .65
  const winSound = new Audio(`${import.meta.env.BASE_URL}audio/game-win.mp3`)
  winSound.preload = 'auto'
  winSound.volume = .65
  host.innerHTML = `
    <section class="rain-game" aria-label="젤리와 인형 수집 게임">
      <div class="rain-lives" role="status" aria-label="남은 목숨 3개">${Array.from({ length: 3 }, () => `<img src="${lifeHeartUrl}" alt="" aria-hidden="true">`).join('')}</div>
      <a class="play-button rain-home" href="#home">메인으로 ↗</a>
      <canvas class="game-canvas" aria-label="방향키 또는 A와 D 키로 목표 아이템을 받으세요"></canvas>
      <div class="rain-level"><b data-level></b>
        <div class="rain-goal-images"><canvas data-target width="100" height="100" role="img" aria-label="이번 단계에서 받을 아이템"></canvas></div>
      </div>
      <div class="rain-timer" role="timer" aria-label="남은 시간"><div class="pixel-battery"><div class="pixel-battery-interior"><div class="pixel-battery-fill" data-time-fill></div></div><span data-time></span></div></div>
      <button class="text-button rain-restart" data-restart>다시 시작 ↻</button>
      <div class="game-message rain-message" hidden></div>
    </section>`
  const canvas = host.querySelector<HTMLCanvasElement>('.game-canvas')!
  const ctx = canvas.getContext('2d')!
  const stage = host.querySelector<HTMLElement>('.rain-game')!
  const message = host.querySelector<HTMLElement>('.game-message')!
  const targetCanvas = host.querySelector<HTMLCanvasElement>('[data-target]')!
  const targetCtx = targetCanvas.getContext('2d')!
  const levelEl = host.querySelector<HTMLElement>('[data-level]')!
  const timeEl = host.querySelector<HTMLElement>('[data-time]')!
  const timeFill = host.querySelector<HTMLElement>('[data-time-fill]')!
  const livesEl = host.querySelector<HTMLElement>('.rain-lives')!
  const hearts = livesEl.querySelectorAll<HTMLImageElement>('img')
  let lives = 3
  function updateLives() {
    hearts.forEach((heart, index) => { heart.hidden = index >= lives })
    livesEl.setAttribute('aria-label', `남은 목숨 ${lives}개`)
  }
  let targetGlowTimer = 0
  const items = [...assets.candies, ...assets.toys]
  const heartKind = items.length
  const fallingHeart = new Image()
  fallingHeart.src = lifeHeartUrl
  let heartSpawn = 3
  const levelUpImage = new Image()
  levelUpImage.src = levelUpUrl
  const gameOverImage = new Image()
  gameOverImage.src = gameOverUrl
  let width = 900, height = 600, player = .5, score = 0, level = 0, caught = 0, remaining = 45
  let running = false, spawn = 0, previous = 0, frame = 0, transition = 0, disposed = false
  const keys = new Set<string>(), drops: Drop[] = []
  const effects: CatchEffect[] = []
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let shakeRemaining = 0
  function catchEffect(correct: boolean, y: number) {
    if (!correct) shakeRemaining = .65
    effects.push({ x: player, y, age: 0, correct, label: correct ? `${caught}/${levels[level]!.count}` : '♥ -1' })
    if (effects.length > 12) effects.shift()
  }
  function resize() {
    width = stage.clientWidth; height = stage.clientHeight
    const ratio = Math.min(devicePixelRatio, 2)
    canvas.width = width * ratio; canvas.height = height * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  const observer = new ResizeObserver(resize); observer.observe(stage)
  function updateHud() {
    const label = `LEVEL ${level + 1}/${levels.length}`
    if (levelEl.dataset.label !== label) {
      levelEl.dataset.label = label
      levelEl.innerHTML = `<span class="level-pixel-text" role="img" aria-label="${label}" style="background-image:url('${levelLabelsUrl}');background-position:center ${(100 + level * 230) / (1280 - 190) * 100}%"></span>`
    }
    timeEl.textContent = `${Math.ceil(remaining)}sec`
    timeFill.style.width = `${24 + (1 - remaining / levels[level]!.seconds) * 69.5}%`
  }
  function beginLevel() {
    caught = 0; remaining = levels[level]!.seconds; spawn = 0; heartSpawn = 3; drops.length = 0
    targetCtx.clearRect(0, 0, 100, 100)
    const outline = document.createElement('canvas')
    outline.width = outline.height = 100
    const outlineCtx = outline.getContext('2d')!
    drawFit(outlineCtx, items[levels[level]!.target]!, 5, 5, 90, 90)
    outlineCtx.globalCompositeOperation = 'source-in'
    outlineCtx.fillStyle = '#f5ff00'
    outlineCtx.fillRect(0, 0, 100, 100)
    for (let step = 0; step < 24; step++) {
      const angle = step * Math.PI * 2 / 24
      targetCtx.drawImage(outline, Math.cos(angle) * 3, Math.sin(angle) * 3)
    }
    targetCtx.drawImage(outline, 0, 0)
    drawFit(targetCtx, items[levels[level]!.target]!, 5, 5, 90, 90)
    updateHud(); message.hidden = true; message.classList.remove('is-level-up'); running = true; keys.clear(); previous = 0
  }
  function start() {
    winSound.pause(); winSound.currentTime = 0
    gameOverSound.pause(); gameOverSound.currentTime = 0
    wrongSound.pause(); wrongSound.currentTime = 0
    levelSound.pause(); levelSound.currentTime = 0
    clearTimeout(transition); effects.length = 0; shakeRemaining = 0; lives = 3; updateLives(); level = 0; score = 0; player = .5; beginLevel()
  }
  function finish(won: boolean) {
    const resultSound = won ? winSound : gameOverSound
    resultSound.currentTime = 0
    void resultSound.play().catch(() => { /* Audio playback is optional. */ })
    running = false; keys.clear()
    message.classList.remove('is-level-up')
    try {
      const best = Number(localStorage.getItem('glyf-gummy-best')) || 0
      if (score > best) localStorage.setItem('glyf-gummy-best', String(score))
    } catch { /* optional */ }
    message.innerHTML = `${won ? '<h2>ALL LEVELS CLEAR! ✦</h2>' : `<img class="game-over-art" src="${gameOverUrl}" alt="GAME OVER">`}
      <div class="result-actions"><button class="play-button" data-again>RETRY ↻</button><a class="play-button pink-button" href="#home">HOME ↗</a></div>`
    message.hidden = false
    message.querySelector('[data-again]')!.addEventListener('click', start)
  }
  function clearLevel() {
    running = false; drops.length = 0; keys.clear()
    if (level === levels.length - 1) { finish(true); return }
    message.classList.add('is-level-up')
    levelSound.currentTime = 0
    void levelSound.play().catch(() => { /* Audio playback is optional. */ })
    message.innerHTML = `<div class="level-up-announcement" role="status"><img class="level-up-art" src="${levelUpUrl}" alt="LEVEL UP"></div>`
    message.hidden = false
    transition = window.setTimeout(() => { if (!disposed) { level++; beginLevel() } }, 1400)
  }
  host.querySelector('[data-restart]')!.addEventListener('click', start)
  function keydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    if (!['arrowleft', 'arrowright', 'a', 'd'].includes(key)) return
    event.preventDefault(); keys.add(key)
  }
  function keyup(event: KeyboardEvent) { keys.delete(event.key.toLowerCase()) }
  function clearKeys() { keys.clear(); previous = 0 }
  function visibility() { if (document.hidden) clearKeys() }
  window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup)
  window.addEventListener('blur', clearKeys); document.addEventListener('visibilitychange', visibility)
  function loop(time: number) {
    if (disposed) return
    const dt = previous && !document.hidden ? Math.min((time - previous) / 1000, .05) : 0
    previous = time
    ctx.clearRect(0, 0, width, height)
    const playerSize = Math.min(190, width * .39)
    const playerY = height - playerSize - 20
    if (running) {
      remaining = Math.max(0, remaining - dt)
      const direction = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'))
      player = Math.max(.07, Math.min(.93, player + direction * dt * .8))
      spawn -= dt
      if (level === levels.length - 1) {
        heartSpawn -= dt
        if (heartSpawn <= 0) {
          heartSpawn = 5
          drops.push({ x: 30 + Math.random() * (width - 60), y: -50,
            speed: height * .38, kind: heartKind, angle: 0 })
        }
      }
      if (spawn <= 0) {
        spawn = .48 - level * .065
        const target = levels[level]!.target
        const others = items.map((_, index) => index).filter(index => index !== target)
        const kind = Math.random() < .5 - level * .045 ? target : others[Math.floor(Math.random() * others.length)]!
        drops.push({ x: 30 + Math.random() * (width - 60), y: -50,
          speed: height * (.26 + level * .065 + Math.random() * .13), kind, angle: (Math.random() - .5) * .6 })
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i]!
        const lastY = drop.y
        drop.y += drop.speed * dt
        if (Math.abs(drop.x - player * width) < playerSize * .45 + 15 && drop.y >= playerY + 20 && lastY < height - 30) {
          drops.splice(i, 1)
          if (drop.kind === heartKind) {
            const recovered = lives < 3
            lives = Math.min(3, lives + 1); updateLives()
            catchEffect(true, playerY + 20)
            effects[effects.length - 1]!.label = recovered ? '♥ +1' : '♥ MAX'
            itemSound.currentTime = 0
            void itemSound.play().catch(() => { /* Audio playback is optional. */ })
          } else if (drop.kind === levels[level]!.target) {
            caught++; score += 10 * (level + 1)
            catchEffect(true, playerY + 20)
            clearTimeout(targetGlowTimer)
            targetCanvas.classList.add('is-caught')
            targetGlowTimer = window.setTimeout(() => targetCanvas.classList.remove('is-caught'), 450)
            itemSound.currentTime = 0
            void itemSound.play().catch(() => { /* Browser audio permission may be unavailable. */ })
            if (caught >= levels[level]!.count) { updateHud(); clearLevel(); break }
          } else {
            catchEffect(false, playerY + 20)
            wrongSound.currentTime = 0
            void wrongSound.play().catch(() => { /* Audio playback is optional. */ })
            lives--; updateLives()
            if (lives === 0) { finish(false); break }
          }
        } else if (drop.y > height + 50) drops.splice(i, 1)
      }
      updateHud()
      if (running && remaining <= 0) finish(false)
    }
    for (const drop of drops) {
      const size = drop.kind < 4 ? 52 : 66
      ctx.save(); ctx.translate(drop.x, drop.y); ctx.rotate(drop.angle)
      drawFit(ctx, drop.kind === heartKind ? fallingHeart : items[drop.kind]!, -size / 2, -size / 2, size, size); ctx.restore()
    }
    const bob = running ? Math.sin(time / 150) * 3 : 0
    shakeRemaining = Math.max(0, shakeRemaining - dt)
    const shake = reducedMotion.matches ? 0 : Math.sin(shakeRemaining * 65) * (shakeRemaining / .65)
    ctx.save()
    ctx.translate(player * width + shake * 20, playerY + bob + playerSize / 2)
    ctx.rotate(shake * .23)
    drawFit(ctx, assets.character, -playerSize / 2, -playerSize / 2, playerSize, playerSize)
    ctx.restore()
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i]!
      effect.age += dt
      if (effect.age >= .9) { effects.splice(i, 1); continue }
      const progress = effect.age / .9
      const x = effect.x * width, y = effect.y
      ctx.save()
      ctx.globalAlpha = Math.min(1, (1 - progress) * 2)
      if (effect.correct) {
        ctx.fillStyle = '#fff9a0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
        for (let star = 0; star < 32; star++) {
          const angle = star * Math.PI * (3 - Math.sqrt(5))
          const spread = .45 + (star % 7) / 10
          const radius = reducedMotion.matches ? 42 : (12 + progress * 115) * spread
          const bodyY = playerSize * (.05 + (star % 5) * .13)
          const sx = x + Math.cos(angle) * radius
          const sy = y + bodyY + Math.sin(angle) * radius
          const size = (star % 3 === 0 ? 12 : 5 + star % 4) * (1 - progress * .5)
          ctx.beginPath()
          for (let point = 0; point < 8; point++) {
            const a = point * Math.PI / 4, r = point % 2 ? size * .25 : size
            const px = sx + Math.cos(a) * r, py = sy + Math.sin(a) * r
            if (point === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath(); ctx.fill(); ctx.stroke()
        }
      }
      ctx.textAlign = 'center'; ctx.font = '900 21px Arial'
      ctx.lineWidth = 5; ctx.strokeStyle = effect.correct ? '#875000' : '#fff'
      ctx.fillStyle = effect.correct ? '#fff9a0' : '#d90035'
      const label = effect.label
      const labelY = y - 28 - (reducedMotion.matches ? 0 : progress * 35)
      ctx.strokeText(label, x, labelY); ctx.fillText(label, x, labelY)
      if (effect.correct && effect.age < .5) {
        const rise = effect.age / .5
        ctx.globalAlpha = 1 - rise * rise
        ctx.font = '900 30px Arial'
        const bonusY = y - 58 - (reducedMotion.matches ? 0 : rise * 105)
        ctx.strokeText('+1', x, bonusY); ctx.fillText('+1', x, bonusY)
      }
      ctx.restore()
    }
    frame = requestAnimationFrame(loop)
  }
  resize(); start(); frame = requestAnimationFrame(loop)
  return () => {
    disposed = true; cancelAnimationFrame(frame); clearTimeout(transition); observer.disconnect()
    itemSound.pause()
    levelSound.pause()
    wrongSound.pause()
    gameOverSound.pause()
    winSound.pause()
    clearTimeout(targetGlowTimer)
    window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', clearKeys); document.removeEventListener('visibilitychange', visibility)
  }
}
