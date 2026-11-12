'use client'

import { useEffect, useRef, type RefObject } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { inView, motion, useAnimationControls, type Variants } from 'motion/react'

import { buttonVariants } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

import StardustTimelapse from './stardust-timelapse'

/** Entrance order on scroll-in: frame first, then the copy from top to bottom. */
const ENTRANCE_ORDER = { frame: 0, kicker: 1, headline: 2, body: 3, button: 4 } as const
const ENTRANCE_STAGGER_SECONDS = 0.12
const ENTRANCE_VISIBLE_AMOUNT = 0.2
/** A section showing in more than this share of the screen at load is left as is, not hidden. */
const ENTRANCE_SKIP_SCREEN_SHARE = 0.15

const entrance: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (order: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: order * ENTRANCE_STAGGER_SECONDS, duration: 0.5, ease: 'easeOut' },
  }),
}

/**
 * Hides the section's pieces while it is still (nearly) below the fold, then reveals them in order
 * when it scrolls in. A section already well on screen, or a visitor who prefers reduced motion,
 * gets no entrance, and nothing is ever hidden in the server HTML.
 */
function useScrollEntrance(sectionRef: RefObject<HTMLElement | null>, prefersReducedMotion: boolean | null) {
  const controls = useAnimationControls()

  useEffect(() => {
    const section = sectionRef.current
    if (prefersReducedMotion !== false || !section) {
      return
    }
    const isWellOnScreen = section.getBoundingClientRect().top < window.innerHeight * (1 - ENTRANCE_SKIP_SCREEN_SHARE)
    if (isWellOnScreen) {
      return
    }
    controls.set('hidden')
    const stopWatching = inView(section, () => void controls.start('visible'), { amount: ENTRANCE_VISIBLE_AMOUNT })
    return () => {
      stopWatching()
      controls.set('visible')
    }
  }, [sectionRef, prefersReducedMotion, controls])

  return controls
}

export default function StardustFeature() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const controls = useScrollEntrance(sectionRef, prefersReducedMotion)

  return (
    <section
      ref={sectionRef}
      aria-labelledby="stardust-feature-heading"
      className="main-container my-16 md:my-28"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 xl:gap-16">
        <div className="flex min-w-0 flex-col items-start">
          <motion.p
            custom={ENTRANCE_ORDER.kicker}
            variants={entrance}
            initial={false}
            animate={controls}
            className="text-xs font-bold tracking-[0.22em] uppercase sm:text-sm"
          >
            A little pixel. A shared universe.
          </motion.p>

          <motion.h2
            id="stardust-feature-heading"
            custom={ENTRANCE_ORDER.headline}
            variants={entrance}
            initial={false}
            animate={controls}
            className="mt-5 text-[clamp(3.75rem,18vw,6rem)] leading-[0.88] font-extrabold tracking-tighter sm:text-[clamp(4.75rem,13vw,7rem)] lg:text-[clamp(4.5rem,6.5vw,6.5rem)]"
          >
            <span className="block">draw on</span>
            <span className="block">the stars</span>
            <span className="block">together.</span>
          </motion.h2>

          <motion.p
            custom={ENTRANCE_ORDER.body}
            variants={entrance}
            initial={false}
            animate={controls}
            className="mt-6 max-w-lg md:mt-12 leading-relaxed"
          >
            One shared unmoderated canvas. No filters, no judgment—every pixel goes live for everyone to see.
          </motion.p>

          <motion.div
            custom={ENTRANCE_ORDER.button}
            variants={entrance}
            initial={false}
            animate={controls}
            className="mt-8 lg:mt-10"
          >
            <Link href="/stardust" className={buttonVariants({ size: 'lg', className: 'h-13 cursor-pointer' })}>
              Add a pixel
              <ArrowRight aria-hidden />
            </Link>
          </motion.div>
        </div>

        <motion.div
          custom={ENTRANCE_ORDER.frame}
          variants={entrance}
          initial={false}
          animate={controls}
          className="min-w-0 w-full"
        >
          <StardustTimelapse />
        </motion.div>
      </div>
    </section>
  )
}
