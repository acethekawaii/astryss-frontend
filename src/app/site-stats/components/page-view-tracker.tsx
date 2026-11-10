'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { sendPageView } from '../api/site-stats.api'

/**
 * The path counted last in this page load. Strict Mode's second run of the effect, or a remount
 * on the same path, is not a new view; going to another path and back is.
 */
let lastCountedPath: string | null = null

/** Counts one page view per route: the first load and every client-side navigation after it. */
export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || pathname === lastCountedPath) {
      return
    }
    lastCountedPath = pathname
    sendPageView(pathname)
  }, [pathname])

  return null
}
