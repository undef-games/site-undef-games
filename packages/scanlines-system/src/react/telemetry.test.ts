import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@provide-io/telemetry', () => ({
  getLogger: vi.fn(() => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() })),
  shouldAllow: vi.fn(() => true),
}))

vi.mock('@provide-io/telemetry/react', () => ({
  TelemetryErrorBoundary: class {},
  useTelemetryContext: vi.fn(),
}))

import { getLogger, shouldAllow } from '@provide-io/telemetry'
import { createScanlinesLogger, wireScanlinesTelemetry } from './telemetry'
import { scanlinesLog, setScanlinesLogger } from '../tokens/log'

afterEach(() => {
  // Reset the log seam back to noop after each test
  setScanlinesLogger(null)
  vi.clearAllMocks()
})

describe('scanlines telemetry seam', () => {
  it('guards logs with shouldAllow (skips when disabled)', () => {
    ;(shouldAllow as ReturnType<typeof vi.fn>).mockReturnValue(false)
    const log = createScanlinesLogger('test')
    log.warn('e', { a: 1 })
    expect(shouldAllow).toHaveBeenCalledWith('log', 'warn')
    // underlying logger.warn should NOT be called when shouldAllow returns false
    const mockLogger = (getLogger as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('calls underlying logger methods when shouldAllow is true', () => {
    ;(shouldAllow as ReturnType<typeof vi.fn>).mockReturnValue(true)
    const log = createScanlinesLogger('test')
    log.warn('warn-event', { x: 1 })
    log.error('error-event', { y: 2 })
    log.info('info-event', { z: 3 })
    const mockLogger = (getLogger as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mockLogger.warn).toHaveBeenCalledWith({ event: 'warn-event', x: 1 })
    expect(mockLogger.error).toHaveBeenCalledWith({ event: 'error-event', y: 2 })
    expect(mockLogger.info).toHaveBeenCalledWith({ event: 'info-event', z: 3 })
  })

  it('calls underlying logger with no data when data is omitted', () => {
    ;(shouldAllow as ReturnType<typeof vi.fn>).mockReturnValue(true)
    const log = createScanlinesLogger()
    log.warn('no-data')
    log.error('no-data')
    log.info('no-data')
    const mockLogger = (getLogger as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mockLogger.warn).toHaveBeenCalledWith({ event: 'no-data' })
    expect(mockLogger.error).toHaveBeenCalledWith({ event: 'no-data' })
    expect(mockLogger.info).toHaveBeenCalledWith({ event: 'no-data' })
  })

  it('wireScanlinesTelemetry installs the logger into the tokens/log seam', () => {
    ;(shouldAllow as ReturnType<typeof vi.fn>).mockReturnValue(true)
    wireScanlinesTelemetry('wired-scope')
    const log = scanlinesLog()
    log.info('after-wiring', { check: true })
    // The mock logger for 'wired-scope' should have received the call
    const calls = (getLogger as ReturnType<typeof vi.fn>).mock.calls
    expect(calls.some((c) => c[0] === 'wired-scope')).toBe(true)
    const mockLogger = (getLogger as ReturnType<typeof vi.fn>).mock.results.at(-1)!.value
    expect(mockLogger.info).toHaveBeenCalledWith({ event: 'after-wiring', check: true })
  })
})
