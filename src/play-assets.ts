import badgeUrl from './assets/badge-candies.webp'
import glossUrl from './assets/gloss-cutouts.webp'
import logoUrl from './assets/glyf-logo.webp'
import plushUrl from './assets/plush-cutouts.png'
import { cutout } from './badge-candies'
import { productTexture } from './gloss-props'

export async function loadImage(url: string) {
  const image = new Image()
  image.src = url
  await image.decode()
  return image
}
export async function loadPlayAssets(characterUrl: string, blinkUrl: string) {
  const [source, gloss, logo, character, plush, characterBlink] = await Promise.all([
    loadImage(badgeUrl), loadImage(glossUrl), loadImage(logoUrl), loadImage(characterUrl), loadImage(plushUrl), loadImage(blinkUrl),
  ])
  const candies = [[.56, .03, .22, .195], [.62, .425, .14, .14],
    [.65, .545, .14, .165], [.74, .725, .08, .125]].map(region => {
    const mesh = cutout(source, region as [number, number, number, number])!
    const material = mesh.material
    const canvas = material.map!.image as HTMLCanvasElement
    mesh.geometry.dispose(); material.map!.dispose(); material.dispose()
    return canvas
  })
  const carton = productTexture(gloss, true), tube = productTexture(gloss, false)
  const toys = Array.from({ length: 8 }, (_, index) => {
    const mesh = cutout(plush, [index % 4 / 4, index < 4 ? 0 : .52, .25, index < 4 ? .52 : .48])!
    const image = mesh.material.map!.image as HTMLCanvasElement
    mesh.geometry.dispose(); mesh.material.map!.dispose(); mesh.material.dispose()
    return image
  })
  const box = carton.texture.image as HTMLCanvasElement
  const chrome = tube.texture.image as HTMLCanvasElement
  carton.texture.dispose(); tube.texture.dispose()
  return { candies, toys, logo, character, characterBlink, box, chrome }
}
export type PlayAssets = Awaited<ReturnType<typeof loadPlayAssets>>

export function drawFit(ctx: CanvasRenderingContext2D, image: CanvasImageSource,
  x: number, y: number, width: number, height: number) {
  const source = image as HTMLImageElement | HTMLCanvasElement
  const aspect = source.width / source.height
  const w = Math.min(width, height * aspect), h = w / aspect
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h)
}
