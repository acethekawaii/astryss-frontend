import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { placePixel } from '../api/stardust.api'
import type { BoardModel } from '../lib/board-model'
import { isCoolingDown, startCooldown } from '../lib/cooldown-store'
import { getSessionToken, renewSessionToken } from '../lib/session-token'
import type { Cell, PlacementOutcome } from '../types/stardust.types'

// The palette and Place button live at the bottom of the screen on phones; keep toasts off them.
const TOAST_OPTIONS = { position: 'top-center' } as const

/** Sends the placement, minting a fresh token once if the stored one is rejected. */
async function submitPlacement(cell: Cell, color: number): Promise<PlacementOutcome> {
  const token = await getSessionToken()
  const outcome = await placePixel(token, cell, color)
  if (outcome.kind !== 'unauthorized') {
    return outcome
  }

  const retried = await placePixel(await renewSessionToken(token), cell, color)
  return retried.kind === 'unauthorized'
    ? { kind: 'failed', message: 'Your anonymous session was rejected. Reload the page and try again.' }
    : retried
}

/** Places a pixel optimistically, then keeps or reverts it based on the server's answer. */
export function usePlacePixel(board: BoardModel) {
  const [isPlacing, setIsPlacing] = useState(false)
  // A ref, not the state above, so two taps within one frame cannot both get through.
  const inFlightRef = useRef(false)

  const placeSelectedPixel = async (cell: Cell, color: number) => {
    if (inFlightRef.current || isCoolingDown()) {
      return
    }

    inFlightRef.current = true
    setIsPlacing(true)
    const optimisticPixel = board.paintOptimistic(cell.x, cell.y, color)
    try {
      const outcome = await submitPlacement(cell, color)
      if (outcome.kind === 'placed') {
        optimisticPixel.commit()
        startCooldown(outcome.cooldownMs)
        return
      }

      optimisticPixel.rollback()
      if (outcome.kind === 'cooldown') {
        startCooldown(outcome.remainingMs)
        toast.warning('Still cooling down. Your next pixel unlocks when the timer ends.', TOAST_OPTIONS)
      } else if (outcome.kind === 'failed') {
        toast.error(outcome.message, TOAST_OPTIONS)
      }
    } catch (error) {
      optimisticPixel.rollback()
      console.error('[stardust] Placing a pixel failed', error)
      toast.error("Couldn't reach Stardust. Check your connection and try again.", TOAST_OPTIONS)
    } finally {
      inFlightRef.current = false
      setIsPlacing(false)
    }
  }

  return { isPlacing, placeSelectedPixel }
}
