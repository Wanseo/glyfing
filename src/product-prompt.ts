import playPromptUrl from './assets/play-prompt.png'
import photoPromptUrl from './assets/photo-prompt.png'

export function createProductPrompt(app: HTMLElement) {
  const dialog = document.createElement('dialog')
  dialog.className = 'product-prompt'
  const image = document.createElement('img')
  image.className = 'product-prompt-art'
  const yes = document.createElement('button'), no = document.createElement('button'), close = document.createElement('button')
  for (const button of [yes, no, close]) button.type = 'button'
  yes.className = 'product-prompt-yes'; yes.setAttribute('aria-label', 'YES')
  no.className = 'product-prompt-no'; no.setAttribute('aria-label', 'NO')
  close.className = 'product-prompt-close'; close.setAttribute('aria-label', '닫기')
  dialog.append(image, yes, no, close); app.appendChild(dialog)
  let destination = '#home'
  yes.addEventListener('click', () => { dialog.close(); location.hash = destination })
  no.addEventListener('click', () => dialog.close())
  close.addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
  window.addEventListener('hashchange', () => { if (dialog.open) dialog.close() })
  return (game: boolean) => {
    dialog.classList.toggle('is-game-prompt', game)
    destination = game ? '#game' : '#camera'
    image.src = game ? playPromptUrl : photoPromptUrl
    image.alt = game ? 'PLAY GAME?' : 'TAKE A PHOTO?'
    dialog.setAttribute('aria-label', image.alt)
    if (!dialog.open) { dialog.showModal(); yes.focus() }
  }
}
