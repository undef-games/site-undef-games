const root = document.documentElement

function updateScroll() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  root.style.setProperty('--scan-scroll', String(Math.min(1, Math.max(0, window.scrollY / maxScroll))))
}

function updatePointer(event) {
  root.style.setProperty('--scan-pointer-x', String((event.clientX / Math.max(1, window.innerWidth) - 0.5).toFixed(4)))
}

window.addEventListener('scroll', updateScroll, { passive: true })
window.addEventListener('resize', updateScroll)
window.addEventListener('pointermove', updatePointer, { passive: true })
updateScroll()
