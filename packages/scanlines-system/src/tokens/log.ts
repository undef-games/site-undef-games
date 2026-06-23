export type ScanlinesLogger = {
  warn(event: string, data?: Record<string, unknown>): void
  error(event: string, data?: Record<string, unknown>): void
  info(event: string, data?: Record<string, unknown>): void
}

const noop: ScanlinesLogger = { warn() {}, error() {}, info() {} }
let current: ScanlinesLogger = noop

/** Wire a real logger (e.g. the @provide-io/telemetry seam in the react layer). */
export function setScanlinesLogger(logger: ScanlinesLogger | null): void {
  current = logger ?? noop
}
export function scanlinesLog(): ScanlinesLogger {
  return current
}
