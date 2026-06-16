import { cloneElement, isValidElement, type ReactElement, useEffect, useState } from 'react'
import type { ProminentEntranceConfig } from './prominent-config'
import { markProminentEntranceComplete, shouldPlayProminentEntrance } from './prominent-storage'

export { PROMINENT_ENTRANCE_CONFIGS, PROMINENT_ENTRANCE_EFFECTS } from './prominent-config'
export type {
  ProminentEntranceConfig,
  ProminentEntranceEffect,
  ProminentEntranceReplay,
  ProminentEntranceRole,
} from './prominent-config'
export { getProminentEntranceStorageKey, shouldPlayProminentEntrance } from './prominent-storage'

type ClassableElement = ReactElement<{ className?: string; [key: string]: unknown }>

function composeClassName(baseClassName: string | undefined, activeClassName: string | undefined, config: ProminentEntranceConfig) {
  return [
    baseClassName,
    'prominent-entrance',
    'prominent-entrance--active',
    `prominent-entrance--${config.effect}`,
    activeClassName,
  ]
    .filter(Boolean)
    .join(' ')
}

export function ProminentEntrance({
  activeClassName,
  children,
  config,
  enabled = true,
}: {
  activeClassName?: string
  children: ClassableElement
  config: ProminentEntranceConfig
  enabled?: boolean
}) {
  const [isActive, setIsActive] = useState(() => enabled && shouldPlayProminentEntrance(config))

  useEffect(() => {
    setIsActive(enabled && shouldPlayProminentEntrance(config))
  }, [config, enabled])

  useEffect(() => {
    if (!isActive) return
    const timer = window.setTimeout(() => {
      markProminentEntranceComplete(config)
      setIsActive(false)
    }, config.durationMs)
    return () => window.clearTimeout(timer)
  }, [config, isActive])

  if (!isValidElement(children)) return children

  const childProps = children.props
  const activeProps = isActive
    ? {
        className: composeClassName(childProps.className, activeClassName, config),
        'data-prominent-effect': config.effect,
        'data-prominent-role': config.role,
      }
    : {
        className: childProps.className,
      }

  return (
    <>
      {isActive && config.veil && <span className="prominent-control-veil" data-testid="prominent-control-veil" aria-hidden="true" />}
      {cloneElement(children, activeProps)}
    </>
  )
}
