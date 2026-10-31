'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { cn } from '@/vendor/lib/utils'

import { FALLBACK_COOLDOWN_MS } from '../constants/stardust.constants'

const CONTENT_ID = 'stardust-how-to-play-content'
const HEADING_ID = 'stardust-how-to-play-heading'
const COOLDOWN_SECONDS = FALLBACK_COOLDOWN_MS / 1_000

export default function HowToPlay() {
  const [isOpen, setIsOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="w-full max-w-(--frame-width) justify-self-center overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow xl:col-start-1 xl:row-start-2">
      <h2>
        <button
          id={HEADING_ID}
          type="button"
          aria-expanded={isOpen}
          aria-controls={CONTENT_ID}
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full cursor-pointer touch-manipulation items-center gap-3 bg-secondary-background px-4 py-3 text-left font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-chart-5"
        >
          <BookOpen aria-hidden className="size-5 shrink-0" />
          <span className="flex-1">How to play</span>
          <ChevronDown
            aria-hidden
            className={cn(
              'size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </h2>

      <motion.div
        id={CONTENT_ID}
        role="region"
        aria-labelledby={HEADING_ID}
        aria-hidden={!isOpen}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
        className="overflow-hidden border-t-2 border-border"
      >
        <dl className="grid gap-5 px-4 py-4 text-sm leading-relaxed sm:px-5 sm:py-5">
          <div>
            <dt className="font-bold">How do I draw?</dt>
            <dd className="mt-1">
              Pick a color, tap a pixel, then hit Place (or press Enter on desktop). Drag to move around, and scroll
              or pinch to zoom.
            </dd>
          </div>
          <div>
            <dt className="font-bold">How do I erase?</dt>
            <dd className="mt-1">Paint over it with white. That&apos;s the eraser.</dd>
          </div>
          <div>
            <dt className="font-bold">Why can&apos;t I place right now?</dt>
            <dd className="mt-1">
              Every pixel starts a {COOLDOWN_SECONDS}-second cooldown, so everyone gets a turn. The timer shows when
              you can go again.
            </dd>
          </div>
        </dl>
      </motion.div>
    </section>
  )
}
