import './style.css'

void import('./main').catch(() => {
  document.documentElement.classList.remove('is-loading')
  const message = document.createElement('div')
  message.className = 'startup-error'
  message.setAttribute('role', 'alert')
  const text = document.createElement('p')
  text.textContent = '페이지를 시작하지 못했어요. 다시 시도하거나 앱 메뉴에서 외부 브라우저로 열어 주세요.'
  const retry = document.createElement('button')
  retry.type = 'button'
  retry.textContent = '다시 시도'
  retry.addEventListener('click', () => location.reload())
  const link = document.createElement('input')
  link.type = 'url'
  link.readOnly = true
  link.value = location.href
  link.setAttribute('aria-label', '외부 브라우저에서 열 페이지 주소')
  link.addEventListener('click', () => link.select())
  message.append(text, retry, link)
  document.body.appendChild(message)
})
