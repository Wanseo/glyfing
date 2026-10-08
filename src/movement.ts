export function getControls(keys: ReadonlySet<string>) {
  return {
    turn: Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')),
    forward: Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown')),
  }
}

export function getTravel(heading: number, forward: number) {
  return { x: Math.sin(heading) * forward, y: -Math.cos(heading) * forward }
}

export function clampPosition(value: number, extent: number, padding: number) {
  const limit = Math.max(0, extent - padding)
  return Math.max(-limit, Math.min(limit, value))
}
