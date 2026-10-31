'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Pause, Play } from 'lucide-react'

import { cn } from '@/vendor/lib/utils'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

import StardustLiveMarker from './stardust-live-marker'
import StardustPixelCount from './stardust-pixel-count'

const POSTER_SRC = '/assets/stardust/stardust-poster.png'
const POSTER_WIDTH = 1920
const POSTER_HEIGHT = 1080
const TIMELAPSE_LABEL = 'Timelapse of the Stardust canvas filling with pixel art'
/** Board pixels stay hard-edged squares at any display size. */
const MEDIA_CLASS = 'block aspect-video w-full [image-rendering:pixelated]'

function TimelapseVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Stays false until playback really starts, since autoplay can be blocked (e.g. iOS Low Power Mode).
  const [isPlaying, setIsPlaying] = useState(false)

  const toggleTimelapse = () => {
    const video = videoRef.current
    if (!video) {
      return
    }
    if (video.paused) {
      video.play().catch(() => setIsPlaying(false))
    } else {
      video.pause()
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={POSTER_SRC}
        aria-label={TIMELAPSE_LABEL}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className={MEDIA_CLASS}
      >
        <source src="/assets/stardust/stardust-loop.webm" type="video/webm" />
        <source src="/assets/stardust/stardust-loop.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        aria-label={isPlaying ? 'Pause timelapse' : 'Play timelapse'}
        onClick={toggleTimelapse}
        className="absolute right-2 bottom-2 grid size-11 cursor-pointer touch-manipulation place-items-center rounded-base border-2 border-border bg-secondary-background text-foreground shadow-shadow transition-transform hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-chart-5 sm:right-3 sm:bottom-3"
      >
        {isPlaying ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5" />}
      </button>
    </>
  )
}

/**
 * The Stardust frame: a title bar, the looping timelapse (or its poster when the visitor prefers
 * reduced motion) and a caption strip.
 */
export default function StardustTimelapse({ className }: { className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-base border-4 border-border bg-foreground shadow-[8px_8px_0_0_var(--border)] lg:shadow-[14px_14px_0_0_var(--border)]',
        className,
      )}
    >
      <div className="flex h-11 items-center justify-between gap-6 px-3 text-main lg:px-4">
        <span className="text-sm font-bold tracking-[0.3em] uppercase">Stardust</span>
        <StardustLiveMarker blink className="text-secondary-background" />
      </div>

      <div className="relative border-y-4 border-border bg-secondary-background">
        {/* The server renders the poster; the video replaces it once motion is known to be allowed. */}
        {prefersReducedMotion === false ? (
          <TimelapseVideo />
        ) : (
          <Image
            src={POSTER_SRC}
            width={POSTER_WIDTH}
            height={POSTER_HEIGHT}
            // The optimizer would resample the pixel art smoothly, blurring every pixel edge.
            unoptimized
            alt={TIMELAPSE_LABEL}
            className={MEDIA_CLASS}
          />
        )}
      </div>

      <figcaption className="flex min-h-14 flex-col justify-center gap-2 bg-main px-3 py-3 text-xs font-bold text-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-sm lg:px-4">
        <StardustPixelCount />
        <Link
          href="/stardust"
          className="inline-flex shrink-0 items-center gap-1.5 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-chart-5"
        >
          Your pixel is next
          <ArrowUpRight aria-hidden className="size-4" />
        </Link>
      </figcaption>
    </figure>
  )
}
