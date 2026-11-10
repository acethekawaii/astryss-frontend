import { API_CONFIG } from '@/shared/config/api.config'

import type { VisitSummary } from '../types/site-stats.types'

const VISITS_URL = `${API_CONFIG.BASE_URL}/stats/visits`
/** The server rejects a longer path with 400. */
const MAX_PATH_LENGTH = 2048

/**
 * Counts one page view without waiting on it, and never throws. `keepalive` lets the request
 * finish when the visitor leaves right away. `sendBeacon` can't be used: it sends `text/plain`,
 * which the endpoint rejects.
 */
export function sendPageView(path: string): void {
  try {
    void fetch(`${VISITS_URL}/hit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: path.slice(0, MAX_PATH_LENGTH) }),
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // A browser that refuses the request outright leaves this view uncounted, nothing more.
  }
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0
}

/**
 * Reads the site's visit counts. The body has no envelope. `no-cache` revalidates the browser's
 * 60 s copy, so each refresh gets the server's current read instead of one up to a minute older.
 */
export async function fetchVisitSummary(): Promise<VisitSummary> {
  const response = await fetch(VISITS_URL, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`Visit stats request failed with status ${response.status}`)
  }

  const body = (await response.json()) as Partial<Record<keyof VisitSummary, unknown>> | null
  const { totalPageviews, todayPageviews, todayVisitors, since } = body ?? {}
  if (!isCount(totalPageviews) || !isCount(todayPageviews) || !isCount(todayVisitors)) {
    throw new Error('Visit stats response did not include valid counts')
  }
  return { totalPageviews, todayPageviews, todayVisitors, since: typeof since === 'string' ? since : null }
}
