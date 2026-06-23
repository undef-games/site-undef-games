import type { ReactNode } from 'react'
import { ConsoleHeader, type ConsoleHeaderProps } from './ConsoleHeader'
import { TelemetryErrorBoundary } from '../telemetry'

export function ConsoleShell({ children, ...header }: ConsoleHeaderProps & { children: ReactNode }) {
  return (
    <TelemetryErrorBoundary fallback={null}>
      <div className="console-shell" data-surface="console">
        <ConsoleHeader {...header} />
        <main className="console-main">{children}</main>
      </div>
    </TelemetryErrorBoundary>
  )
}
