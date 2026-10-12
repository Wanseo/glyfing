import * as THREE from 'three'

export function createBadgeViewer(app: HTMLElement) {
  const button = document.createElement('button')
  button.type = 'button'; button.className = 'badge-trigger'; button.hidden = true
  button.setAttribute('aria-label', 'GLYF 사원증 크게 보기')
  button.setAttribute('aria-haspopup', 'dialog')
  const dialog = document.createElement('dialog')
  dialog.className = 'badge-viewer'; dialog.setAttribute('aria-label', 'GLYF 사원증 확대 보기')
  const image = document.createElement('img')
  image.className = 'badge-viewer-image'; image.alt = '세 눈 캐릭터의 GLYF 사원증, 흰 목줄과 참 장식'
  const close = document.createElement('button')
  close.className = 'badge-close'; close.type = 'button'; close.textContent = '✕'
  close.setAttribute('aria-label', '사원증 닫기')
  dialog.append(image, close); app.append(button, dialog)
  button.addEventListener('click', () => {
    if (image.src && !dialog.open) { dialog.showModal(); close.focus() }
  })
  close.addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
  const position = new THREE.Vector3(), scale = new THREE.Vector3(), rotation = new THREE.Quaternion()
  const euler = new THREE.Euler()
  return {
    setImage(canvas: HTMLCanvasElement) { image.src = canvas.toDataURL('image/png') },
    sync(mesh: THREE.Mesh | null, camera: THREE.OrthographicCamera, visible: boolean) {
      button.hidden = !visible || !mesh
      if (!visible && dialog.open) dialog.close()
      if (!visible || !mesh) return
      mesh.getWorldPosition(position); mesh.getWorldScale(scale); mesh.getWorldQuaternion(rotation)
      position.project(camera); euler.setFromQuaternion(rotation)
      const geometry = mesh.geometry as THREE.PlaneGeometry
      const pixels = window.innerWidth / (camera.right - camera.left)
      button.style.left = `${(position.x + 1) * window.innerWidth / 2}px`
      button.style.top = `${(1 - position.y) * window.innerHeight / 2}px`
      button.style.width = `${geometry.parameters.width * scale.x * pixels}px`
      button.style.height = `${geometry.parameters.height * scale.y * pixels}px`
      button.style.transform = `translate(-50%, -50%) rotate(${-euler.z}rad)`
    },
  }
}
