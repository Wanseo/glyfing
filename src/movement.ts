export function getDirection(keys: ReadonlySet<string>) {
  let x = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))
  let y = Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown'))
  const length = Math.hypot(x, y)
  if (length) { x /= length; y /= length }
  return { x, y, moving: length > 0 }
}

export function clampPosition(value: number, extent: number, padding: number) {
  const limit = Math.max(0, extent - padding)
  return Math.max(-limit, Math.min(limit, value))
}
