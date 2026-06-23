import { getLogger, shouldAllow } from '@provide-io/telemetry'
import type { ScanlinesLogger } from '../tokens/log'
import { setScanlinesLogger } from '../tokens/log'

export { TelemetryErrorBoundary, useTelemetryContext } from '@provide-io/telemetry/react'

export function createScanlinesLogger(scope = 'scanlines'): ScanlinesLogger {
  const logger = getLogger(scope)
  const emit = (level: 'warn' | 'error' | 'info', event: string, data?: Record<string, unknown>) => {
    if (!shouldAllow('log', level)) return // honor consent/level — no payload built when disabled
    logger[level]({ event, ...data })
  }
  return {
    warn: (event, data) => emit('warn', event, data),
    error: (event, data) => emit('error', event, data),
    info: (event, data) => emit('info', event, data),
  }
}

/** Call once at app boot (after setupTelemetry) to route tokens-layer logs through telemetry. */
export function wireScanlinesTelemetry(scope = 'scanlines'): void {
  setScanlinesLogger(createScanlinesLogger(scope))
}
