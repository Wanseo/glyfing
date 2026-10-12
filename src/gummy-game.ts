import { drawFit } from './play-assets'
import type { PlayAssets } from './play-assets'

type Drop = { x: number; y: number; speed: number; kind: number; angle: number }
export function createGummyGame(host: HTMLElement, assets: PlayAssets, openPhoto: (score: number) => void) {
  host.innerHTML = `
    <div class="experience-heading"><div><span class="eyebrow">01 / THE SNACK BREAK</span>
      <h1>GUMMY <em>RUSH!</em></h1><p>작은 발. 큰 식욕. 20초 동안 젤리를 모아봐.</p></div>
      <div class="stamp">STAY<br>HUNGRY ✦</div></div>
    <section class="game-shell" aria-label="젤리 모으기 게임">
      <div class="game-hud"><span>SNACKS <b data-score>0</b></span><span>BEST <b data-best>0</b></span><span>TIME <b data-time>20</b>s</span></div>
      <div class="game-stage"><canvas class="game-canvas" aria-label="방향키 또는 드래그로 움직여 떨어지는 젤리를 받으세요"></canvas>
        <div class="game-message"><span class="eyebrow">READY, LITTLE WEIRDO?</span><h2>Catch feelings.<br>And gummies.</h2>
        <p>← → 방향키 · 마우스 또는 손가락으로 드래그<br>젤리 +10 · 별 +20 · 반짝이는 치아 +25</p>
        <button class="play-button" data-start>LET’S PLAY ↗</button></div>
      </div>
      <div class="game-footer"><span data-feedback>놓쳐도 괜찮아. 다음 젤리가 오고 있어!</span><button class="text-button" data-restart>다시 시작 ↻</button></div>
    </section>`
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!
  const ctx = canvas.getContext('2d')!
  const stage = host.querySelector<HTMLDivElement>('.game-stage')!
  const message = host.querySelector<HTMLDivElement>('.game-message')!
  const scoreEl = host.querySelector<HTMLElement>('[data-score]')!
  const bestEl = host.querySelector<HTMLElement>('[data-best]')!
  const timeEl = host.querySelector<HTMLElement>('[data-time]')!
  const feedback = host.querySelector<HTMLElement>('[data-feedback]')!
  let width = 900, height = 460, player = .5, score = 0, remaining = 20
  let best = 0
  try { best = Number(localStorage.getItem('glyf-gummy-best')) || 0 } catch { /* optional */ }
  bestEl.textContent = String(best)
  let running = false, spawn = 0, previous = 0, frame = 0, disposed = false
  const keys = new Set<string>(), drops: Drop[] = []
  function resize() {
    width = stage.clientWidth; height = stage.clientHeight
    const ratio = Math.min(devicePixelRatio, 2)
    canvas.width = width * ratio; canvas.height = height * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  const observer = new ResizeObserver(resize); observer.observe(stage)
  function start() {
    score = 0; remaining = 20; spawn = 0; player = .5; drops.length = 0
    scoreEl.textContent = '0'; timeEl.textContent = '20'
    feedback.textContent = 'Yum. Yum. Yum. 바로 그거야!'
    message.hidden = true; running = true; keys.clear()
  }
  function finish() {
    running = false; keys.clear(); timeEl.textContent = '0'
    if (score > best) {
      best = score
      try { localStorage.setItem('glyf-gummy-best', String(best)) } catch { /* optional */ }
      bestEl.textContent = String(best)
    }
    const title = score >= 200 ? 'Certified snack legend.' : score >= 100 ? 'A very hungry icon.' : 'Cute. Still hungry.'
    message.innerHTML = `<span class="eyebrow">YOUR SNACK REPORT</span><h2>${title}</h2><div class="result-score">${score}<small>POINTS</small></div>
      <p>이 순간을 GLYF 포토카드로 남겨볼까?</p><div class="result-actions"><button class="play-button" data-again>ONE MORE ↻</button><button class="play-button pink-button" data-photo>PHOTO TIME ↗</button></div>`
    message.hidden = false
    message.querySelector('[data-again]')!.addEventListener('click', start)
    message.querySelector('[data-photo]')!.addEventListener('click', () => openPhoto(score))
  }
  host.querySelector('[data-start]')!.addEventListener('click', start)
  host.querySelector('[data-restart]')!.addEventListener('click', start)
  function keydown(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) return
    event.preventDefault(); keys.add(event.key)
  }
  function keyup(event: KeyboardEvent) { keys.delete(event.key) }
  function clearKeys() { keys.clear(); previous = 0 }
  window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup)
  window.addEventListener('blur', clearKeys)
  function move(event: PointerEvent) {
    if (!running) return
    const rect = canvas.getBoundingClientRect()
    player = Math.max(.08, Math.min(.92, (event.clientX - rect.left) / rect.width))
  }
  canvas.addEventListener('pointerdown', event => { canvas.setPointerCapture(event.pointerId); move(event) })
  canvas.addEventListener('pointermove', event => { if (event.buttons || event.pointerType === 'mouse') move(event) })
  function loop(time: number) {
    if (disposed) return
    const dt = previous && !document.hidden ? Math.min((time - previous) / 1000, .05) : 0
    previous = time
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#fff4fc'; ctx.globalAlpha = .7; ctx.fillRect(0, 0, width, height); ctx.globalAlpha = 1
    ctx.strokeStyle = '#ec80bd35'; ctx.lineWidth = 1
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke() }
    for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }
    if (running) {
      remaining = Math.max(0, remaining - dt); timeEl.textContent = String(Math.ceil(remaining))
      const direction = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'))
      player = Math.max(.08, Math.min(.92, player + direction * dt * .75))
      spawn -= dt
      if (spawn <= 0) {
        spawn = .34
        const random = Math.random()
        drops.push({ x: 26 + Math.random() * (width - 52), y: -40,
          speed: height * (.28 + Math.random() * .2), kind: random > .92 ? 3 : random > .75 ? 2 : random > .5 ? 1 : 0,
          angle: (Math.random() - .5) * .6 })
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i]!
        drop.y += drop.speed * dt
        if (Math.abs(drop.x - player * width) < 45 && drop.y > height - 105 && drop.y < height - 42) {
          score += drop.kind === 3 ? 25 : drop.kind === 2 ? 20 : 10
          scoreEl.textContent = String(score)
          feedback.textContent = drop.kind === 3 ? '✦ SHINY TEETH! +25' : ['Tasty little victory!', 'You’re on a snack roll!', 'That one was definitely yours.'][score % 3]!
          drops.splice(i, 1)
        } else if (drop.y > height + 50) drops.splice(i, 1)
      }
    }
    for (const drop of drops) {
      ctx.save(); ctx.translate(drop.x, drop.y); ctx.rotate(drop.angle)
      drawFit(ctx, assets.candies[drop.kind]!, -26, -26, 52, 52); ctx.restore()
    }
    drawFit(ctx, assets.character, player * width - 52, height - 117, 104, 116)
    if (running && remaining <= 0) finish()
    frame = requestAnimationFrame(loop)
  }
  resize(); frame = requestAnimationFrame(loop)
  return () => {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect()
    window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', clearKeys)
  }
}
