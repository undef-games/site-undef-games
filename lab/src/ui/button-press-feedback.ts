const RELEASE_MS = 240

function clearReleaseTimer(button: HTMLButtonElement) {
  const timer = Number(button.dataset.pressTimerId ?? 0)
  if (timer) {
    window.clearTimeout(timer)
    delete button.dataset.pressTimerId
  }
}

function setReleaseState(button: HTMLButtonElement | null) {
  if (!button || !button.isConnected) return
  clearReleaseTimer(button)
  button.dataset.pressState = 'release'
  const timer = window.setTimeout(() => {
    if (button.dataset.pressState === 'release') {
      delete button.dataset.pressState
    }
    delete button.dataset.pressTimerId
  }, RELEASE_MS)
  button.dataset.pressTimerId = String(timer)
}

export function attachButtonPressFeedback(container: HTMLElement) {
  let activeButton: HTMLButtonElement | null = null

  const onPointerDown = (event: PointerEvent) => {
    const button = (event.target as HTMLElement | null)?.closest('button')
    if (!(button instanceof HTMLButtonElement) || !container.contains(button) || button.disabled) return
    activeButton = button
    clearReleaseTimer(button)
    button.dataset.pressState = 'down'
  }

  const onPointerUp = () => {
    setReleaseState(activeButton)
    activeButton = null
  }

  const onPointerCancel = () => {
    if (activeButton) {
      clearReleaseTimer(activeButton)
      delete activeButton.dataset.pressState
    }
    activeButton = null
  }

  container.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)

  return () => {
    container.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerCancel)
  }
}
