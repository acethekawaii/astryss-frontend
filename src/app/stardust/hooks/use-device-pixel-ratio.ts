import { useSyncExternalStore } from 'react'

function subscribeToPixelRatio(onChange: () => void): () => void {
  let query: MediaQueryList | null = null

  // A resolution query only matches the current ratio, so re-arm it after every change.
  function handleChange() {
    watchCurrentRatio()
    onChange()
  }

  function watchCurrentRatio() {
    query?.removeEventListener('change', handleChange)
    query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    query.addEventListener('change', handleChange)
  }

  watchCurrentRatio()
  return () => query?.removeEventListener('change', handleChange)
}

/**
 * The screen's device pixel ratio, kept current across browser zoom and moving between
 * monitors. `null` while server rendering, where it is unknown.
 */
export function useDevicePixelRatio(): number | null {
  return useSyncExternalStore(
    subscribeToPixelRatio,
    () => window.devicePixelRatio || 1,
    () => null,
  )
}
