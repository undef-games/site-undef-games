import type { ButtonHTMLAttributes } from 'react'

export function ScanlinesButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={type} className={['scanlines-button', className].filter(Boolean).join(' ')} />
}
