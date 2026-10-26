'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { animate, motion, useInView, useMotionValue, useTransform, type AnimationPlaybackControls } from 'motion/react'

import { fetchTotalPixels } from '@/app/stardust/api/stardust.api'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

import StardustLiveMarker from './stardust-live-marker'

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
 * each refreshed total directly. It is hidden only until the first total arrives; after that a
 * failed refresh keeps the last known total on screen.
 */
export default function StardustPixelCount({ className }: { className?: string }) {
  // react-query keeps the last total when a refresh fails. The interval pauses while the tab is
  // hidden, and the query refetches when it is shown again.
  const { data: totalPixels } = useQuery({
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
    <div ref={statRef} hidden={totalPixels === undefined} className={className}>
      <span aria-hidden className="block h-1 w-16 bg-border" />
      {/*
        About 0.75x the headline: a fixed 48-56px on phones, then the md and lg headline sizes from
        stardust-feature.tsx scaled down.
      */}
      <p className="mt-3 text-[clamp(3rem,14vw,3.5rem)] leading-none font-extrabold tracking-tighter tabular-nums md:text-[calc(min((100vw-2rem)/10.6,7rem)*0.75)] lg:text-[calc(var(--headline-size)*0.75)]">
        {/* Screen readers get the settled total instead of every step of the count-up. */}
        <motion.span aria-hidden>{shownText}</motion.span>
        {totalPixels !== undefined && <span className="sr-only">{pixelCountFormat.format(totalPixels)}</span>}
      </p>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold tracking-[0.14em] uppercase sm:text-xs sm:tracking-[0.2em]">
        <StardustLiveMarker className="gap-1.5 text-[length:inherit] tracking-[inherit]" />
        <span>Pixels placed by strangers</span>
      </p>
    </div>
  )
}
