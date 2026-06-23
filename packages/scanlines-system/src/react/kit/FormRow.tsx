import type { ReactNode } from 'react'

export interface FormRowProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
}

export function FormRow({ label, htmlFor, hint, error, children }: FormRowProps) {
  return (
    <div className="form-row">
      <label className="form-row__label" htmlFor={htmlFor}>{label}</label>
      <div className="form-row__control">{children}</div>
      {hint ? <p className="form-row__hint">{hint}</p> : null}
      {error ? <p className="form-row__error" role="alert">{error}</p> : null}
    </div>
  )
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>
}
