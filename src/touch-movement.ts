export function createTouchMovement(surface: HTMLElement, anchor?: () => { x: number; y: number }) {
  const touches = new Map<number, { x: number; y: number }>()
  const controls: HTMLElement[] = []
  const controlDirections = new Map<HTMLElement, { x: number; y: number }>()
  function nearbyDirection(event: PointerEvent, activePanel?: HTMLElement) {
    for (const panel of controls) {
      const bounds = panel.getBoundingClientRect()
      if (!bounds.width || !bounds.height) continue
      if (panel !== activePanel && (event.clientX < bounds.left - 28 || event.clientX > bounds.right + 28
        || event.clientY < bounds.top - 28 || event.clientY > bounds.bottom + 28)) continue
      let nearest: { x: number; y: number } | undefined
      let distance = Infinity
      for (const button of panel.querySelectorAll('button')) {
        const rect = button.getBoundingClientRect()
        const next = Math.hypot(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2)
        if (next < distance) { distance = next; nearest = controlDirections.get(button) }
      }
      return nearest
    }
  }
  function update(event: PointerEvent) {
    if (event.pointerType !== 'touch' || !touches.has(event.pointerId)) return
    const nearby = nearbyDirection(event)
    if (nearby) { touches.set(event.pointerId, nearby); return }
    const center = anchor?.() ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const dx = event.clientX - center.x, dy = event.clientY - center.y
    touches.set(event.pointerId, anchor && Math.abs(dy) > Math.abs(dx)
      ? { x: 0, y: dy < 0 ? 1 : -1 } : { x: dx < 0 ? -1 : 1, y: 0 })
  }
  function down(event: PointerEvent) {
    if (event.pointerType !== 'touch') return
    touches.set(event.pointerId, { x: 0, y: 0 })
    surface.setPointerCapture(event.pointerId); update(event)
  }
  function release(event: PointerEvent) { touches.delete(event.pointerId) }
  function clear() { touches.clear() }
  function visibility() { if (document.hidden) clear() }
  surface.style.touchAction = 'none'
  surface.addEventListener('pointerdown', down)
  surface.addEventListener('pointermove', update)
  surface.addEventListener('pointerup', release)
  surface.addEventListener('pointercancel', release)
  surface.addEventListener('lostpointercapture', release)
  window.addEventListener('blur', clear)
  document.addEventListener('visibilitychange', visibility)
  return {
    addControls(host: HTMLElement, vertical = false) {
      const panel = document.createElement('div')
      panel.className = 'movement-hint mobile-touch-controls'
      const directions = vertical ? ['left', 'up', 'down', 'right'] : ['left', 'right']
      const vectors: Record<string, { x: number; y: number }> = {
        left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: 1 }, down: { x: 0, y: -1 },
      }
      const labels: Record<string, string> = { left: '왼쪽 이동', right: '오른쪽 이동', up: '위로 이동', down: '아래로 이동' }
      for (const direction of directions) {
        const button = document.createElement('button')
        button.type = 'button'; button.setAttribute('aria-label', labels[direction]!)
        button.innerHTML = `<span class="pixel-move-arrow ${direction}" aria-hidden="true"></span>`
        controlDirections.set(button, vectors[direction]!)
        panel.appendChild(button)
      }
      function updatePanel(event: PointerEvent) {
        if (event.pointerType !== 'touch' || !touches.has(event.pointerId)) return
        const direction = nearbyDirection(event, panel)
        if (direction) touches.set(event.pointerId, direction)
      }
      panel.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') return
        event.preventDefault()
        panel.setPointerCapture(event.pointerId)
        touches.set(event.pointerId, { x: 0, y: 0 })
        updatePanel(event)
      })
      panel.addEventListener('pointermove', updatePanel)
      panel.addEventListener('pointerup', release)
      panel.addEventListener('pointercancel', release)
      panel.addEventListener('lostpointercapture', release)
      host.appendChild(panel); controls.push(panel)
    },
    direction() { return Math.sign([...touches.values()].reduce((sum, value) => sum + value.x, 0)) },
    vector() {
      const x = Math.sign([...touches.values()].reduce((sum, value) => sum + value.x, 0))
      const y = Math.sign([...touches.values()].reduce((sum, value) => sum + value.y, 0))
      const length = Math.hypot(x, y) || 1
      return { x: x / length, y: y / length }
    },
    clear,
    dispose() {
      clear()
      controls.forEach(panel => panel.remove())
      controlDirections.clear()
      surface.removeEventListener('pointerdown', down); surface.removeEventListener('pointermove', update)
      surface.removeEventListener('pointerup', release); surface.removeEventListener('pointercancel', release)
      surface.removeEventListener('lostpointercapture', release)
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', visibility)
    },
  }
}
