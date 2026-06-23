import type { HTMLAttributes, ReactNode } from 'react'

export interface ScanlinesFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  children: ReactNode
  htmlFor?: string
  hint?: string
  error?: string
}

export function ScanlinesField({
  label,
  children,
  htmlFor,
  hint,
  error,
  className,
  ...props
}: ScanlinesFieldProps) {
  return (
    <div {...props} className={['scanlines-field', className].filter(Boolean).join(' ')}>
      <label className="scanlines-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="scanlines-field__control">{children}</div>
      {hint ? <p className="scanlines-field__hint">{hint}</p> : null}
      {error ? <p className="scanlines-field__error">{error}</p> : null}
    </div>
  )
}
