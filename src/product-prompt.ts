import promptUrl from './assets/prompt-window.png'

export function createProductPrompt(app: HTMLElement) {
  const dialog = document.createElement('dialog')
  dialog.className = 'product-prompt'
  const image = document.createElement('img')
  image.className = 'product-prompt-art'
  image.src = promptUrl; image.alt = ''
  const question = document.createElement('div')
  question.className = 'product-prompt-question'
  const yes = document.createElement('button'), no = document.createElement('button'), close = document.createElement('button')
  for (const button of [yes, no, close]) button.type = 'button'
  yes.className = 'product-prompt-yes'; yes.setAttribute('aria-label', 'YES')
  yes.textContent = 'YES'
  no.className = 'product-prompt-no'; no.setAttribute('aria-label', 'NO')
  no.textContent = 'NO'
  close.className = 'product-prompt-close'; close.setAttribute('aria-label', '닫기')
  dialog.append(image, question, yes, no, close); app.appendChild(dialog)
  let destination = '#home'
  yes.addEventListener('click', () => { dialog.close(); location.hash = destination })
  no.addEventListener('click', () => dialog.close())
  close.addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
  window.addEventListener('hashchange', () => { if (dialog.open) dialog.close() })
  return (game: boolean) => {
    dialog.classList.toggle('is-game-prompt', game)
    destination = game ? '#game' : '#camera'
    question.textContent = game ? 'PLAY GAME?' : 'TAKE A PHOTO?'
    dialog.setAttribute('aria-label', question.textContent)
    if (!dialog.open) { dialog.showModal(); yes.focus() }
  }
}
