import type { HTMLAttributes, ReactNode } from 'react'

export interface ScanlinesNoticeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}

export function ScanlinesNotice({
  tone = 'info',
  children,
  className,
  ...props
}: ScanlinesNoticeProps) {
  const role = tone === 'error' ? 'alert' : 'status'

  return (
    <div
      {...props}
      role={role}
      className={['scanlines-notice', `scanlines-notice--${tone}`, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
