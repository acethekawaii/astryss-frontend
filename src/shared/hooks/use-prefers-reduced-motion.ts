import { useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Whether the visitor asked for reduced motion, kept current if they change the setting.
 * `null` while server rendering and hydrating, where the preference is unknown, so the server
 * HTML and the first client render always match.
 */
export function usePrefersReducedMotion(): boolean | null {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => null,
  )
}
