'use client'

import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { inView, motion, useAnimationControls, type Variants } from 'motion/react'

import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

import StardustPixelCount from './stardust-pixel-count'
import StardustTimelapse from './stardust-timelapse'

const MotionLink = motion.create(Link)

/** Entrance order on scroll-in: frame, headline, stat, button. */
const ENTRANCE_ORDER = { frame: 0, headline: 1, stat: 2, button: 3 } as const
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

/** The button presses halfway toward its shadow on hover and all the way in on press. */
const PRESS_OFFSET_PX = 6
const PRESS_SPRING = { type: 'spring', stiffness: 700, damping: 35 } as const

/** The fixed site header is 6rem tall from md up; on desktop the section fits the screen below it. */
const SITE_HEADER_HEIGHT = '6rem'
/** Space kept free above and below the section when it fills the screen. */
const SCREEN_BREATHING_ROOM = '3rem'
const HEADLINE_LINE_HEIGHT = 0.95
/** Matches lg:gap-x-10 and the 36/64 column split. */
const COLUMN_GAP = '2.5rem'
const COPY_COLUMN_SHARE = 0.36
/** "together." is 4.95em wide with tracking-tighter; the rest is slack. */
const LAST_LINE_WIDTH_EM = 5.2
/** The frame's hard shadow hangs 14px below it. */
const FRAME_SHADOW = '14px'
/** Title bar (44px), caption strip (40px) and the 4px borders above, between and below them. */
const FRAME_CHROME_HEIGHT = '100px'
/** The frame's left and right 4px borders. */
const FRAME_SIDE_BORDERS = '8px'

/**
 * Desktop sizing, used by the lg: classes, in CSS so the server render already fits. The headline
 * shrinks on narrow or short screens, and the frame takes the largest 16:9 size that still fits the
 * screen's height under the headline's first line. `100cqw` is the grid's width.
 */
const DESKTOP_SIZING = {
  '--showcase-height': `calc(100svh - ${SITE_HEADER_HEIGHT} - ${SCREEN_BREATHING_ROOM})`,
  '--headline-size': `min(7rem, (100cqw - ${COLUMN_GAP}) * ${COPY_COLUMN_SHARE} / ${LAST_LINE_WIDTH_EM}, var(--showcase-height) * 0.13)`,
  '--frame-max-width': `calc((var(--showcase-height) - var(--headline-size) * ${HEADLINE_LINE_HEIGHT} - ${FRAME_SHADOW} - ${FRAME_CHROME_HEIGHT}) * 16 / 9 + ${FRAME_SIDE_BORDERS})`,
} as CSSProperties

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

function AddPixelButton({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  return (
    <div className="relative inline-flex">
      <span
        aria-hidden
        className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-base border-2 border-border bg-main"
      />
      <MotionLink
        href="/stardust"
        whileHover={{ x: PRESS_OFFSET_PX / 2, y: PRESS_OFFSET_PX / 2 }}
        whileTap={{ x: PRESS_OFFSET_PX, y: PRESS_OFFSET_PX }}
        transition={prefersReducedMotion === false ? PRESS_SPRING : { duration: 0 }}
        className="relative inline-flex h-14 items-center gap-3 rounded-base border-2 border-border bg-foreground px-7 text-lg font-bold text-main focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-chart-5"
      >
        Add a pixel
        <ArrowRight aria-hidden className="size-5" />
      </MotionLink>
    </div>
  )
}

/**
 * The homepage Stardust showcase. Phones and tablets stack headline, frame, stat and button. From
 * lg up the headline's first line runs across the top, its last line sits beside the frame's top,
 * and the whole section fits one screen below the site header.
 */
export default function StardustFeature() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const controls = useScrollEntrance(sectionRef, prefersReducedMotion)

  return (
    <section
      ref={sectionRef}
      aria-labelledby="stardust-feature-heading"
      className="main-container mt-16 mb-12 md:mt-28 md:mb-16"
    >
      <div
        style={DESKTOP_SIZING}
        className="@container grid gap-8 lg:grid-cols-[minmax(0,36fr)_minmax(0,64fr)] lg:gap-x-10 lg:gap-y-0"
      >
        <motion.h2
          id="stardust-feature-heading"
          custom={ENTRANCE_ORDER.headline}
          variants={entrance}
          initial={false}
          animate={controls}
          // From lg up the negative margin lifts row 2 to the last line, so it sits beside the frame.
          className="text-[calc((100vw-2rem)/5.6)] leading-[0.95] font-extrabold tracking-tighter [font-family:inherit] md:text-[min(calc((100vw-2rem)/10.6),7rem)] lg:col-span-2 lg:-mb-[0.95em] lg:text-(length:--headline-size)"
        >
          <span className="block md:inline">Draw on</span> <span className="block md:inline">the stars</span>{' '}
          <span className="block">together.</span>
        </motion.h2>

        <motion.div
          custom={ENTRANCE_ORDER.frame}
          variants={entrance}
          initial={false}
          animate={controls}
          className="min-w-0 lg:col-start-2 lg:row-start-2 lg:w-[min(100%,var(--frame-max-width))] lg:justify-self-end"
        >
          <StardustTimelapse />
        </motion.div>

        {/*
          Stat, body, then button. From lg up the column fills the frame's height and two flexible
          spacers center the group against the frame; the top one never gets shorter than the
          headline's last line plus 48px.
        */}
        <div className="flex min-w-0 flex-col items-start lg:col-start-1 lg:row-start-2 lg:self-stretch">
          <span aria-hidden className="hidden lg:block lg:min-h-[calc(var(--headline-size)*0.95+48px)] lg:flex-1" />
          <motion.div
            custom={ENTRANCE_ORDER.stat}
            variants={entrance}
            initial={false}
            animate={controls}
            // Collapses with the stat until the first count arrives, so it leaves no gap.
            className="mb-4 has-[>[hidden]]:hidden lg:mb-10"
          >
            <StardustPixelCount />
          </motion.div>
          <p className="mb-8 max-w-md text-base leading-relaxed md:text-lg lg:mb-6">
            One shared canvas. Place a pixel, and everyone sees it instantly.
          </p>
          <motion.div custom={ENTRANCE_ORDER.button} variants={entrance} initial={false} animate={controls}>
            <AddPixelButton prefersReducedMotion={prefersReducedMotion} />
          </motion.div>
          <span aria-hidden className="hidden lg:block lg:flex-1" />
        </div>
      </div>
    </section>
  )
}
