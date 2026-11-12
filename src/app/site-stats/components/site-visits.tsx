'use client'

import { useQuery } from '@tanstack/react-query'

import { cn } from '@/lib/utils'

import { fetchVisitSummary } from '../api/site-stats.api'
import { formatCompactCount, formatFullCount } from '../lib/format-count'

/** The server reuses one read of the counts for 60 s, so refreshing faster gains nothing. */
const REFRESH_INTERVAL_MS = 60_000
/** One retry rides out a blip; a backend that stays down hides the line instead of piling up requests. */
const FAILED_REQUEST_RETRIES = 1

function VisitsLine({ totalPageviews, todayVisitors }: { totalPageviews: number; todayVisitors: number }) {
  const total = formatFullCount(totalPageviews)
  const today = formatFullCount(todayVisitors)
  const hasVisitorsToday = todayVisitors > 0

  return (
    <p className="flex items-baseline gap-x-2.5 whitespace-nowrap tabular-nums animate-in fade-in duration-500 motion-reduce:animate-none">
      <span className="sr-only">
        {hasVisitorsToday ? `Site visits: ${total} total, ${today} today` : `Site visits: ${total} total`}
      </span>
      <span aria-hidden className="text-xs font-bold tracking-[0.2em] text-text-600 uppercase">
        Site visits
      </span>
      <span aria-hidden className="text-3xl font-extrabold text-foreground">
        {formatCompactCount(totalPageviews)}
      </span>
      {hasVisitorsToday && (
        <span aria-hidden className="text-sm text-text-600">
          · {today} today
        </span>
      )}
    </p>
  )
}

/**
 * The site's page views, all time, and today's visitors on one line. Its height is held while the
 * counts load, when the request fails, and before anything is counted, so the content below never
 * moves; only real, non-zero counts are ever shown.
 */
export default function SiteVisits({ className }: { className?: string }) {
  // The interval pauses while the tab is hidden, and the query refetches when it's shown again.
  const { data, isError } = useQuery({
    queryKey: ['site-stats', 'visits'],
    queryFn: fetchVisitSummary,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: FAILED_REQUEST_RETRIES,
  })
  const visits = !isError && data && data.totalPageviews > 0 ? data : null

  return (
    <div className={cn('flex h-10 items-center justify-center', className)}>
      {visits && <VisitsLine totalPageviews={visits.totalPageviews} todayVisitors={visits.todayVisitors} />}
    </div>
  )
}
