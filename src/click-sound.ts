export function createClickSound() {
  const sound = new Audio(`${import.meta.env.BASE_URL}audio/click.mp3`)
  sound.preload = 'auto'
  sound.volume = .55
  document.addEventListener('click', event => {
    const view = document.documentElement.dataset.view ?? 'home'
    if (view !== 'home' && view !== 'game') return
    if (event.defaultPrevented || !(event.target instanceof Element)) return
    const control = event.target.closest('button, a[href], input, select, label')
    if (!control || control.matches(':disabled, [aria-disabled="true"]')) return
    sound.currentTime = 0
    void sound.play().catch(() => { /* Audio playback is optional. */ })
  })
}
