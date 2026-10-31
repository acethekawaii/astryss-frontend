'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { animate, motion, useInView, useMotionValue, useTransform, type AnimationPlaybackControls } from 'motion/react'

import { fetchTotalPixels } from '@/app/stardust/api/stardust.api'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/vendor/lib/utils'

/** With the server's 30 s count cache, a new pixel shows up here within about 90 s. */
const REFRESH_INTERVAL_MS = 60_000
const COUNT_UP_SECONDS = 1.6

const pixelCountFormat = new Intl.NumberFormat('en-US')

/** False while the element or an ancestor is fully transparent, e.g. held back by an entrance. */
function isOpaque(element: HTMLElement): boolean {
  return typeof element.checkVisibility !== 'function' || element.checkVisibility({ opacityProperty: true })
}

/**
 * The live pixel total. It counts up from 0 once, as soon as any of it scrolls into view, then shows
 * each refreshed total directly. Its footer space remains visible while the first request loads or
 * fails; after a successful request, a failed refresh keeps the last known total on screen.
 */
export default function StardustPixelCount({ className }: { className?: string }) {
  // react-query keeps the last total when a refresh fails. The interval pauses while the tab is
  // hidden, and the query refetches when it is shown again.
  const { data: totalPixels, isError } = useQuery({
    queryKey: ['stardust', 'stats'],
    queryFn: fetchTotalPixels,
    refetchInterval: REFRESH_INTERVAL_MS,
  })
  const prefersReducedMotion = usePrefersReducedMotion()
  const statRef = useRef<HTMLDivElement>(null)
  // Any visible part starts the count-up, so a resting 0 is never on screen.
  const isInView = useInView(statRef, { once: true, amount: 'some' })
  const shownTotal = useMotionValue(0)
  const shownText = useTransform(shownTotal, (total) => pixelCountFormat.format(Math.round(total)))
  const countUpRef = useRef<AnimationPlaybackControls | null>(null)

  // A layout effect, so a total set directly is in place before the browser paints.
  useLayoutEffect(() => {
    if (totalPixels === undefined || prefersReducedMotion === null) {
      return
    }
    // After the one count-up (or with reduced motion), refreshed totals replace the number as is.
    if (prefersReducedMotion || countUpRef.current) {
      countUpRef.current?.stop()
      shownTotal.set(totalPixels)
      return
    }
    if (!isInView) {
      return
    }
    // On screen but still transparent (the section's entrance has not revealed it yet): wait, so
    // the count-up starts with the fade-in instead of finishing unseen.
    let frame = 0
    const startCountUp = () => {
      const stat = statRef.current
      if (stat && !isOpaque(stat)) {
        frame = requestAnimationFrame(startCountUp)
        return
      }
      countUpRef.current = animate(shownTotal, totalPixels, { duration: COUNT_UP_SECONDS, ease: 'easeOut' })
    }
    startCountUp()
    return () => cancelAnimationFrame(frame)
  }, [totalPixels, prefersReducedMotion, isInView, shownTotal])

  useEffect(() => () => countUpRef.current?.stop(), [])

  return (
    <div
      ref={statRef}
      aria-live="polite"
      className={cn('flex min-w-0 items-center gap-2.5', className)}
    >
      <span
        aria-hidden
        className={cn(
          'size-3 shrink-0 bg-chart-4',
          totalPixels === undefined && !isError && 'animate-pulse',
          totalPixels === undefined && isError && 'bg-chart-3',
        )}
      />
      <p className="leading-tight font-bold tabular-nums">
        {totalPixels === undefined ? (
          isError ? 'Live pixel count unavailable' : 'Loading live pixel count…'
        ) : (
          <>
            {/* Screen readers get the settled total instead of every step of the count-up. */}
            <motion.span aria-hidden>{shownText}</motion.span>
            <span className="sr-only">{pixelCountFormat.format(totalPixels)}</span>
            <span> pixels placed by strangers</span>
          </>
        )}
      </p>
    </div>
  )
}
