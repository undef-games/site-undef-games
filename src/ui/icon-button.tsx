import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

export function IconButton(props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button type="button" {...props} />
}
