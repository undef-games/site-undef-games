import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: target.getBoundingClientRect()
        } as ResizeObserverEntry
      ],
      this
    )
  }

  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverMock
