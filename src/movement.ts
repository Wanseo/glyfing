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

type Obstacle = { minX: number; maxX: number; minZ: number; maxZ: number }

export function moveInRoom(x: number, z: number, dx: number, dz: number, obstacles: readonly Obstacle[]) {
  const radius = 0.6
  const blocked = (px: number, pz: number) => obstacles.some(o =>
    px > o.minX - radius && px < o.maxX + radius && pz > o.minZ - radius && pz < o.maxZ + radius)
  const nextX = clampPosition(x + dx, 6, radius + 0.15)
  if (!blocked(nextX, z)) x = nextX
  const nextZ = clampPosition(z + dz, 4.7, radius + 0.1)
  if (!blocked(x, nextZ)) z = nextZ
  return { x, z }
}
