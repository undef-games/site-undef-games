import type { ProminentEntranceConfig } from './prominent-config'

export function getProminentEntranceStorageKey(config: ProminentEntranceConfig) {
  return config.storageKey ?? `undef-prominent-entrance:${config.id}`
}

function getReplayStore(config: ProminentEntranceConfig) {
  if (config.replay === 'session') return window.sessionStorage
  return window.localStorage
}

export function shouldPlayProminentEntrance(config: ProminentEntranceConfig) {
  if (config.replay === 'always') return true
  if (config.replay === 'never') return false
  try {
    return getReplayStore(config).getItem(getProminentEntranceStorageKey(config)) !== 'true'
  } catch {
    return false
  }
}

export function markProminentEntranceComplete(config: ProminentEntranceConfig) {
  if (config.replay !== 'once' && config.replay !== 'session') return
  try {
    getReplayStore(config).setItem(getProminentEntranceStorageKey(config), 'true')
  } catch {
    // Storage can be unavailable in strict browser modes; the visual entrance can still complete.
  }
}

export function resetProminentEntranceCompletion(config: ProminentEntranceConfig) {
  if (config.replay !== 'once' && config.replay !== 'session') return
  try {
    getReplayStore(config).removeItem(getProminentEntranceStorageKey(config))
  } catch {
    // Storage can be unavailable in strict browser modes; clearing the visual replay is best-effort.
  }
}

export function resetProminentEntrances(configs: ProminentEntranceConfig[]) {
  configs.forEach(resetProminentEntranceCompletion)
}
