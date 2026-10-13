import retryIconUrl from './assets/retry-icon.png'
import { drawFit, loadImage } from './play-assets'
import countdownUrl from './assets/game-countdown.png'
import countdownDigitsUrl from './assets/countdown-digits.png'
import type { PlayAssets } from './play-assets'
import levelUpUrl from './assets/level-up.png'
import gameOverUrl from './assets/game-over.png'
import lifeHeartUrl from './assets/life-heart.png'
import levelLabelsUrl from './assets/level-labels.png'
import victoryUrl from './assets/all-levels-clear.png'
import homeIconUrl from './assets/home-icon.png'

let preparedImages: Promise<HTMLImageElement[]> | undefined
export function prepareGameImages() {
  return preparedImages ??= Promise.all([retryIconUrl, levelUpUrl, gameOverUrl, lifeHeartUrl,
    levelLabelsUrl, victoryUrl, homeIconUrl, countdownUrl, countdownDigitsUrl].map(loadImage))
}

type Drop = { x: number; y: number; speed: number; kind: number; angle: number; double?: boolean }
type CatchEffect = { x: number; y: number; age: number; correct: boolean; label: string; bonus: number }
const levels = [
  { target: 0, count: 7, seconds: 35 },
  { target: 4, count: 9, seconds: 33 },
  { target: 1, count: 11, seconds: 31 },
  { target: 11, count: 13, seconds: 29 },
  { target: 6, count: 15, seconds: 30 },
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
  const countdownSound = new Audio(`${import.meta.env.BASE_URL}audio/countdown.mp3`)
  countdownSound.preload = 'auto'
  countdownSound.volume = .65
  countdownSound.playbackRate = 2.2
  function syncSound() {
    const muted = document.documentElement.dataset.soundMuted === 'true'
    for (const sound of [itemSound, levelSound, wrongSound, gameOverSound, winSound, countdownSound]) sound.muted = muted
  }
  syncSound()
  window.addEventListener('glyf-sound-change', syncSound)
  host.innerHTML = `
    <section class="rain-game" aria-label="젤리와 인형 수집 게임">
      <div class="rain-lives" role="status" aria-label="남은 목숨 3개"><span class="life-label">LIFE</span>${Array.from({ length: 3 }, () => `<img src="${lifeHeartUrl}" alt="" aria-hidden="true">`).join('')}</div>
      <a class="play-button pink-button rain-home home-icon-link" href="#home" aria-label="HOME"><img src="${homeIconUrl}" alt=""></a>
      <canvas class="game-canvas" aria-label="방향키 또는 A와 D 키로 목표 아이템을 받으세요"></canvas>
      <div class="movement-hint game-movement-hint" aria-label="좌우 방향키로 이동"><span class="pixel-move-arrow left" aria-hidden="true"></span><span class="pixel-move-arrow" aria-hidden="true"></span></div>
      <div class="rain-level"><b data-level></b>
        <div class="rain-goal-images"><canvas data-target width="100" height="100" role="img" aria-label="이번 단계에서 받을 아이템"></canvas></div>
      </div>
      <div class="rain-timer" role="timer" aria-label="남은 시간"><div class="pixel-battery"><div class="pixel-battery-interior"><div class="pixel-battery-fill" data-time-fill></div></div><span data-time></span></div></div>
      <div class="game-message rain-message" hidden></div>
    </section>`
  const canvas = host.querySelector<HTMLCanvasElement>('.game-canvas')!
  const ctx = canvas.getContext('2d')!
  const moveHint = host.querySelector<HTMLElement>('.game-movement-hint')!
  let hintTime = 0, hasMoved = false
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
  let introActive = false, introTime = 0, introStep = -1
  const countdownLabels = ['ARE YOU READY?', '3', '2', '1', 'GO!']
  const countdownImages: string[] = []
  let countdownLoaded = false
  function trimCountdown(source: HTMLCanvasElement) {
    const ctx = source.getContext('2d')!
    const pixels = ctx.getImageData(0, 0, source.width, source.height).data
    let left = source.width, right = -1, top = source.height, bottom = -1
    for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
      if (pixels[(y * source.width + x) * 4 + 3]! < 8) continue
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
    if (right < left) return source.toDataURL('image/png')
    const trimmed = document.createElement('canvas')
    trimmed.width = right - left + 1; trimmed.height = bottom - top + 1
    trimmed.getContext('2d')!.drawImage(source, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height)
    return trimmed.toDataURL('image/png')
  }
  void Promise.all([loadImage(countdownUrl), loadImage(countdownDigitsUrl)]).then(([source, digits]) => {
    if (disposed) return
    const regions = [[.03, .1, .94, .14], [.42, .285, .17, .145], [.42, .46, .17, .15], [.43, .64, .15, .15], [.33, .81, .34, .15]]
    for (const [x, y, w, h] of regions) {
      const crop = document.createElement('canvas')
      crop.width = Math.round(source.width * w!); crop.height = Math.round(source.height * h!)
      crop.getContext('2d')!.drawImage(source, source.width * x!, source.height * y!, crop.width, crop.height, 0, 0, crop.width, crop.height)
      countdownImages.push(trimCountdown(crop))
    }
    for (let i = 0; i < 3; i++) {
      const crop = document.createElement('canvas')
      crop.width = Math.round(digits.width / 3); crop.height = digits.height
      crop.getContext('2d')!.drawImage(digits, i * digits.width / 3, 0, digits.width / 3, digits.height,
        0, 0, crop.width, crop.height)
      countdownImages[i + 1] = trimCountdown(crop)
    }
    countdownLoaded = true; introStep = -1
  }).catch(() => { countdownLoaded = true })
  function showIntro(step: number) {
    if (introStep === step) return
    introStep = step
    if (step === 1) {
      countdownSound.currentTime = 0
      void countdownSound.play().catch(() => { /* Audio playback is optional. */ })
    }
    message.classList.add('is-countdown')
    message.innerHTML = countdownImages[step]
      ? `<img class="countdown-art ${step === 0 ? 'is-ready' : step === 4 ? 'is-go' : ''}" src="${countdownImages[step]}" alt="${countdownLabels[step]}">`
      : ''
    message.hidden = false
  }
  const keys = new Set<string>(), drops: Drop[] = []
  const effects: CatchEffect[] = []
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const heartFlights = new Set<HTMLElement>()
  function clearHeartFlights() {
    heartFlights.forEach(image => { image.getAnimations().forEach(animation => animation.cancel()); image.remove() })
    heartFlights.clear()
  }
  function flyHeart(x: number, y: number, slot: number) {
    if (reducedMotion.matches) { updateLives(); return }
    const origin = canvas.getBoundingClientRect(), destination = livesEl.getBoundingClientRect()
    const size = parseFloat(getComputedStyle(hearts[0]!).width)
    const gap = parseFloat(getComputedStyle(livesEl).gap) || 0
    const labelWidth = livesEl.querySelector<HTMLElement>('.life-label')!.getBoundingClientRect().width
    const targetX = destination.left + labelWidth + gap + slot * (size + gap) + size / 2
    const targetY = destination.top + destination.height / 2
    const image = document.createElement('img')
    image.src = lifeHeartUrl; image.alt = ''; image.className = 'flying-life-heart'
    document.body.appendChild(image); heartFlights.add(image)
    const fromX = origin.left + x, fromY = origin.top + y
    const animation = image.animate([
      { transform: `translate(${fromX - 32}px, ${fromY - 32}px) scale(1)` },
      { transform: `translate(${targetX - 32}px, ${targetY - 32}px) scale(${size / 64})` },
    ], { duration: 550, easing: 'cubic-bezier(.3,0,.15,1)', fill: 'forwards' })
    animation.onfinish = () => {
      image.remove(); heartFlights.delete(image)
      if (disposed) return
      updateLives()
      hearts[slot]?.animate([{ transform: 'scale(1.5)', filter: 'drop-shadow(0 0 10px #f5ff00)' },
        { transform: 'scale(1)', filter: 'none' }], { duration: 350 })
    }
  }
  let shakeRemaining = 0
  function catchEffect(correct: boolean, y: number) {
    if (!correct) shakeRemaining = .65
    effects.push({ x: player, y, age: 0, correct, label: correct ? `${caught}/${levels[level]!.count}` : '♥ -1', bonus: 1 })
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
    countdownSound.pause(); countdownSound.currentTime = 0
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
    introActive = false
    updateHud(); message.hidden = true; message.classList.remove('is-level-up', 'is-victory', 'is-countdown'); running = true; keys.clear(); previous = 0
  }
  function start() {
    hintTime = 0; hasMoved = false
    clearHeartFlights()
    winSound.pause(); winSound.currentTime = 0
    gameOverSound.pause(); gameOverSound.currentTime = 0
    wrongSound.pause(); wrongSound.currentTime = 0
    levelSound.pause(); levelSound.currentTime = 0
    clearTimeout(transition); effects.length = 0; shakeRemaining = 0; lives = 3; updateLives(); level = 0; score = 0; player = .5; beginLevel()
    introActive = true; introTime = 0; introStep = -1; running = false; showIntro(0)
  }
  function finish(won: boolean) {
    const resultSound = won ? winSound : gameOverSound
    resultSound.currentTime = 0
    void resultSound.play().catch(() => { /* Audio playback is optional. */ })
    running = false; keys.clear()
    message.classList.remove('is-level-up')
    message.classList.toggle('is-victory', won)
    try {
      const best = Number(localStorage.getItem('glyf-gummy-best')) || 0
      if (score > best) localStorage.setItem('glyf-gummy-best', String(score))
    } catch { /* optional */ }
    message.innerHTML = `${won ? `<img class="victory-art" src="${victoryUrl}" alt="ALL LEVELS CLEAR!">` : `<img class="game-over-art" src="${gameOverUrl}" alt="GAME OVER">`}
      <div class="result-actions"><button class="play-button retry-icon-button" data-again aria-label="RETRY"><img src="${retryIconUrl}" alt=""></button><a class="play-button pink-button home-icon-link" href="#home" aria-label="HOME"><img src="${homeIconUrl}" alt=""></a></div>`
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
  function keydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    if (key === 'j') {
      event.preventDefault()
      if (event.repeat) return
      clearTimeout(transition)
      level = levels.length - 1
      beginLevel()
      return
    }
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
    if (introActive) {
      if (countdownLoaded) introTime += dt
      const step = introTime < .7 ? 0 : introTime < 1.35 ? 1 : introTime < 2 ? 2 : introTime < 2.65 ? 3 : 4
      showIntro(step)
      if (introTime >= 3.2) {
        introActive = false; message.hidden = true; message.classList.remove('is-countdown'); running = true; keys.clear()
      }
    }
    if (running) {
      remaining = Math.max(0, remaining - dt)
      const direction = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'))
      if (direction) hasMoved = true
      hintTime += dt
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
        const targetChance = level === 4 ? .4 : .5 - level * .045
        const kind = Math.random() < targetChance ? target : others[Math.floor(Math.random() * others.length)]!
        drops.push({ x: 30 + Math.random() * (width - 60), y: -50,
          speed: height * (.26 + level * .065 + Math.random() * .13) * (level === 4 ? .85 : 1), kind,
          angle: (Math.random() - .5) * .6, double: level >= 3 && kind === target && Math.random() < .15 })
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i]!
        const lastY = drop.y
        drop.y += drop.speed * dt
        if (Math.abs(drop.x - player * width) < playerSize * .45 + 15 && drop.y >= playerY + 20 && lastY < height - 30) {
          drops.splice(i, 1)
          if (drop.kind === heartKind) {
            const recovered = lives < 3
            lives = Math.min(3, lives + 1)
            if (recovered) flyHeart(player * width, playerY + playerSize / 2, lives - 1)
            else updateLives()
            catchEffect(true, playerY + 20)
            effects[effects.length - 1]!.label = recovered ? '♥ +1' : '♥ MAX'
            effects[effects.length - 1]!.bonus = 1
            itemSound.currentTime = 0
            void itemSound.play().catch(() => { /* Audio playback is optional. */ })
          } else if (drop.kind === levels[level]!.target) {
            const amount = drop.double ? 2 : 1
            caught = Math.min(levels[level]!.count, caught + amount); score += 10 * (level + 1) * amount
            catchEffect(true, playerY + 20)
            effects[effects.length - 1]!.bonus = amount
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
      if (drop.double) {
        ctx.save(); ctx.font = '900 18px Arial'; ctx.textAlign = 'left'
        ctx.strokeStyle = '#171717'; ctx.lineWidth = 4; ctx.fillStyle = '#f5ff00'
        ctx.strokeText('x2', drop.x + size / 2 - 4, drop.y)
        ctx.fillText('x2', drop.x + size / 2 - 4, drop.y); ctx.restore()
      }
    }
    const bob = running ? Math.sin(time / 150) * 3 : 0
    moveHint.hidden = !running || hasMoved || hintTime > 5
    moveHint.style.left = `${player * width}px`
    moveHint.style.top = `${height - 50}px`
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
      if (effect.correct && effect.age < .5) {
        const sparkleProgress = effect.age / .5
        ctx.globalAlpha = Math.min(1, (1 - sparkleProgress) * 1.5)
        ctx.fillStyle = '#fff9a0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
        for (let star = 0; star < 32; star++) {
          const angle = star * Math.PI * 2 / 32
          const spread = .8 + (star % 3) * .1
          const radius = reducedMotion.matches ? 42 : (12 + sparkleProgress * 115) * spread
          const sx = x + Math.cos(angle) * radius
          const sy = y + playerSize / 2 - 20 + Math.sin(angle) * radius
          const size = (star % 3 === 0 ? 7 : 3 + star % 3) * (1 - sparkleProgress * .5)
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
      ctx.globalAlpha = Math.min(1, (1 - progress) * 2)
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
        ctx.strokeText(`+${effect.bonus}`, x, bonusY); ctx.fillText(`+${effect.bonus}`, x, bonusY)
      }
      ctx.restore()
    }
    frame = requestAnimationFrame(loop)
  }
  resize(); start(); frame = requestAnimationFrame(loop)
  return () => {
    window.removeEventListener('glyf-sound-change', syncSound)
    disposed = true; cancelAnimationFrame(frame); clearTimeout(transition); observer.disconnect()
    clearHeartFlights()
    itemSound.pause()
    levelSound.pause()
    wrongSound.pause()
    gameOverSound.pause()
    winSound.pause()
    countdownSound.pause()
    clearTimeout(targetGlowTimer)
    window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', clearKeys); document.removeEventListener('visibilitychange', visibility)
  }
}
