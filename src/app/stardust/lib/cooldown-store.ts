import { COOLDOWN_STORAGE_KEY } from '../constants/stardust.constants'
import type { Cooldown } from '../types/stardust.types'

// A tiny external store (for useSyncExternalStore) so the cooldown survives reloads and is shared
// between tabs, without reading localStorage during server rendering.
const listeners = new Set<() => void>()
let current: Cooldown | null | undefined

function readStoredCooldown(): Cooldown | null {
  try {
    const raw = window.localStorage.getItem(COOLDOWN_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Cooldown>) : null
    if (typeof parsed?.until !== 'number' || typeof parsed.durationMs !== 'number') {
      return null
    }
    return parsed.until > Date.now() ? { until: parsed.until, durationMs: parsed.durationMs } : null
  } catch {
    return null
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

function syncFromOtherTab(event: StorageEvent) {
  if (event.key !== COOLDOWN_STORAGE_KEY) {
    return
  }
  current = undefined
  notify()
}

export function getCooldown(): Cooldown | null {
  if (current === undefined) {
    current = readStoredCooldown()
  }
  return current
}

export function getServerCooldown(): Cooldown | null {
  return null
}

export function subscribeToCooldown(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener('storage', syncFromOtherTab)
  }
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('storage', syncFromOtherTab)
    }
  }
}

export function isCoolingDown(): boolean {
  const cooldown = getCooldown()
  return cooldown !== null && cooldown.until > Date.now()
}

/** Starts (or re-syncs) the placement cooldown to end `durationMs` from now. */
export function startCooldown(durationMs: number) {
  current = durationMs > 0 ? { until: Date.now() + durationMs, durationMs } : null
  try {
    if (current) {
      window.localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(current))
    } else {
      window.localStorage.removeItem(COOLDOWN_STORAGE_KEY)
    }
  } catch {
    // Storage is unavailable; the cooldown still runs for this visit.
  }
  notify()
}
