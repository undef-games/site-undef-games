import type { ReactNode } from 'react'

export interface ToolbarProps {
  title?: string
  children?: ReactNode
}

export function Toolbar({ title, children }: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar">
      {title ? <h2 className="toolbar__title">{title}</h2> : null}
      <div className="toolbar__actions">{children}</div>
    </div>
  )
}
