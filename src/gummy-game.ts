import { drawFit } from './play-assets'
import type { PlayAssets } from './play-assets'
import levelUpUrl from './assets/level-up.png'
import gameOverUrl from './assets/game-over.png'

type Drop = { x: number; y: number; speed: number; kind: number; angle: number }
type CatchEffect = { x: number; y: number; age: number; correct: boolean }
const levels = [
  { target: 0, count: 7, seconds: 35 },
  { target: 4, count: 9, seconds: 33 },
  { target: 1, count: 11, seconds: 31 },
  { target: 11, count: 13, seconds: 29 },
  { target: 6, count: 15, seconds: 27 },
]
const levelGlyphs: Record<string, string[]> = {
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['10010','10010','10010','11111','00010','00010','00010'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '/': ['00001','00001','00010','00100','01000','10000','10000'],
}
function levelLettering(text: string) {
  let pixels = ''
  for (const [index, letter] of [...text].entries()) {
    levelGlyphs[letter]?.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel === '1') pixels += `<rect x="${index * 6 + x + 1}" y="${y + 1}" width="1" height="1"/>`
    }))
  }
  return `<svg class="level-pixel-text" viewBox="0 0 ${text.length * 6 + 2} 10" role="img" aria-label="${text}" xmlns="http://www.w3.org/2000/svg"><g fill="#171717" transform="translate(1 1)">${pixels}</g><g fill="#f5ff00">${pixels}</g></svg>`
}
export function createGummyGame(host: HTMLElement, assets: PlayAssets) {
  host.innerHTML = `
    <section class="rain-game" aria-label="젤리와 인형 수집 게임">
      <a class="play-button rain-home" href="#home">메인으로 ↗</a>
      <canvas class="game-canvas" aria-label="방향키 또는 A와 D 키로 목표 아이템을 받으세요"></canvas>
      <div class="rain-level"><b data-level></b><span data-count></span>
        <div class="rain-goal-images"><img class="rain-mascot" alt="움직이는 GLYF 캐릭터"><span>→</span><canvas data-target width="100" height="100" role="img" aria-label="이번 단계에서 받을 아이템"></canvas></div>
      </div>
      <div class="rain-timer" role="timer" aria-label="남은 시간"><small>TIME LEFT</small><span data-time></span></div>
      <aside class="rain-goal"><h1 class="rain-title"><span>GUMMY</span><span>RUSH</span></h1>
        <p data-feedback role="status"></p>
      </aside>
      <div class="rain-help">← → / A·D 키로 이동<br>목표만 받아요! 다른 아이템은 -2sec</div>
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
  const countEl = host.querySelector<HTMLElement>('[data-count]')!
  const timeEl = host.querySelector<HTMLElement>('[data-time]')!
  const feedback = host.querySelector<HTMLElement>('[data-feedback]')!
  host.querySelector<HTMLImageElement>('.rain-mascot')!.src = assets.character.src
  const items = [...assets.candies, ...assets.toys]
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
    effects.push({ x: player, y, age: 0, correct })
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
      levelEl.dataset.label = label; levelEl.innerHTML = levelLettering(label)
    }
    countEl.textContent = `${caught} / ${levels[level]!.count}개`
    timeEl.textContent = `${Math.ceil(remaining)}초`
  }
  function beginLevel() {
    caught = 0; remaining = levels[level]!.seconds; spawn = 0; drops.length = 0
    targetCtx.clearRect(0, 0, 100, 100)
    drawFit(targetCtx, items[levels[level]!.target]!, 5, 5, 90, 90)
    updateHud(); message.hidden = true; message.classList.remove('is-level-up'); running = true; keys.clear(); previous = 0
    feedback.textContent = ''
  }
  function start() {
    clearTimeout(transition); effects.length = 0; shakeRemaining = 0; level = 0; score = 0; player = .5; beginLevel()
  }
  function finish(won: boolean) {
    running = false; keys.clear()
    message.classList.remove('is-level-up')
    try {
      const best = Number(localStorage.getItem('glyf-gummy-best')) || 0
      if (score > best) localStorage.setItem('glyf-gummy-best', String(score))
    } catch { /* optional */ }
    message.innerHTML = `${won ? '<h2>ALL LEVELS CLEAR! ✦</h2>' : `<img class="game-over-art" src="${gameOverUrl}" alt="GAME OVER">`}
      <p>${won ? '5단계 모두 성공!' : `LEVEL ${level + 1} · ${caught} / ${levels[level]!.count}개`} · ${score} POINTS</p>
      <div class="result-actions"><button class="play-button" data-again>RETRY ↻</button><a class="play-button pink-button" href="#home">HOME ↗</a></div>`
    message.hidden = false
    message.querySelector('[data-again]')!.addEventListener('click', start)
  }
  function clearLevel() {
    running = false; drops.length = 0; keys.clear()
    if (level === levels.length - 1) { finish(true); return }
    message.classList.add('is-level-up')
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
    const playerSize = Math.min(152, width * .31)
    const playerY = height - playerSize - 20
    if (running) {
      remaining = Math.max(0, remaining - dt)
      const direction = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'))
      player = Math.max(.07, Math.min(.93, player + direction * dt * .8))
      spawn -= dt
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
          if (drop.kind === levels[level]!.target) {
            catchEffect(true, playerY + 20)
            caught++; score += 10 * (level + 1); feedback.textContent = '맞아요! +1 ✦'
            if (caught >= levels[level]!.count) { updateHud(); clearLevel(); break }
          } else {
            catchEffect(false, playerY + 20)
            remaining = Math.max(0, remaining - 2); feedback.textContent = '✕ -2sec'
          }
        } else if (drop.y > height + 50) drops.splice(i, 1)
      }
      updateHud()
      if (running && remaining <= 0) finish(false)
    }
    for (const drop of drops) {
      const size = drop.kind < 4 ? 52 : 66
      ctx.save(); ctx.translate(drop.x, drop.y); ctx.rotate(drop.angle)
      drawFit(ctx, items[drop.kind]!, -size / 2, -size / 2, size, size); ctx.restore()
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
        for (let star = 0; star < 9; star++) {
          const angle = star * Math.PI * 2 / 9
          const radius = reducedMotion.matches ? 38 : 18 + progress * 75
          const sx = x + Math.cos(angle) * radius, sy = y + Math.sin(angle) * radius
          const size = (star % 2 ? 7 : 11) * (1 - progress * .5)
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
      const label = effect.correct ? '✦ +1' : '✕ -2sec'
      const labelY = y - 28 - (reducedMotion.matches ? 0 : progress * 35)
      ctx.strokeText(label, x, labelY); ctx.fillText(label, x, labelY)
      ctx.restore()
    }
    frame = requestAnimationFrame(loop)
  }
  resize(); start(); frame = requestAnimationFrame(loop)
  return () => {
    disposed = true; cancelAnimationFrame(frame); clearTimeout(transition); observer.disconnect()
    window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', clearKeys); document.removeEventListener('visibilitychange', visibility)
  }
}
