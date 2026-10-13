export function createTouchMovement(surface: HTMLElement) {
  const touches = new Map<number, number>()
  function update(event: PointerEvent) {
    if (event.pointerType !== 'touch' || !touches.has(event.pointerId)) return
    touches.set(event.pointerId, event.clientX < window.innerWidth / 2 ? -1 : 1)
  }
  function down(event: PointerEvent) {
    if (event.pointerType !== 'touch') return
    touches.set(event.pointerId, 0)
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
    direction() { return Math.sign([...touches.values()].reduce((sum, value) => sum + value, 0)) },
    clear,
    dispose() {
      clear()
      surface.removeEventListener('pointerdown', down); surface.removeEventListener('pointermove', update)
      surface.removeEventListener('pointerup', release); surface.removeEventListener('pointercancel', release)
      surface.removeEventListener('lostpointercapture', release)
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', visibility)
    },
  }
}
