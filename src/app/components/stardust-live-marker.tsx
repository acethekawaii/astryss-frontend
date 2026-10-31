'use client'

import { motion, type Transition } from 'motion/react'

import { cn } from '@/vendor/lib/utils'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

/** A hard on/off blink rather than a fade. */
const BLINK = { opacity: [1, 1, 0, 0] }
const BLINK_TRANSITION: Transition = { duration: 1.2, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: 'linear' }
const STEADY = { opacity: 1 }

interface StardustLiveMarkerProps {
  /** Blinks the red dot, unless the visitor prefers reduced motion. */
  blink?: boolean
  className?: string
}

export default function StardustLiveMarker({ blink = false, className }: StardustLiveMarkerProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isBlinking = blink && prefersReducedMotion === false

  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase', className)}>
      <motion.span
        aria-hidden
        animate={isBlinking ? BLINK : STEADY}
        transition={isBlinking ? BLINK_TRANSITION : { duration: 0 }}
        className="size-2.5 shrink-0 bg-chart-4"
      />
      Live
    </span>
  )
}
