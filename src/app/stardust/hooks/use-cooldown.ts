import { useCallback, useSyncExternalStore } from 'react'

import { COOLDOWN_TICK_MS } from '../constants/stardust.constants'
import { getCooldown, getServerCooldown, subscribeToCooldown } from '../lib/cooldown-store'

const noop = () => {}

/** The current placement cooldown and its whole seconds left, re-rendering once per second. */
export function useCooldown() {
  const cooldown = useSyncExternalStore(subscribeToCooldown, getCooldown, getServerCooldown)
  const until = cooldown?.until ?? 0

  const subscribeToClock = useCallback(
    (onTick: () => void) => {
      if (until <= Date.now()) {
        return noop
      }
      const timer = window.setInterval(() => {
        onTick()
        if (Date.now() >= until) {
          window.clearInterval(timer)
        }
      }, COOLDOWN_TICK_MS)
      return () => window.clearInterval(timer)
    },
    [until],
  )

  const remainingSeconds = useSyncExternalStore(
    subscribeToClock,
    () => Math.max(0, Math.ceil((until - Date.now()) / 1000)),
    () => 0,
  )

  return { cooldown, remainingSeconds }
}
