'use client'

import { cn } from '@/vendor/lib/utils'
import { Button } from '@/vendor/ui/button'

import { useCooldown } from '../hooks/use-cooldown'
import type { Cell } from '../types/stardust.types'

interface PlacePanelProps {
  selectedCell: Cell | null
  color: string
  isReady: boolean
  isPlacing: boolean
  onPlace: () => void
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function PlacePanel({ selectedCell, color, isReady, isPlacing, onPlace }: PlacePanelProps) {
  const { cooldown, remainingSeconds } = useCooldown()
  const isCoolingDown = remainingSeconds > 0
  const cooldownLeft = cooldown && isCoolingDown ? Math.min(1, (remainingSeconds * 1000) / cooldown.durationMs) : 0
  const label = isPlacing ? 'Placing…' : isCoolingDown ? `Wait ${formatCountdown(remainingSeconds)}` : 'Place'

  return (
    <div className="flex items-center gap-3 xl:flex-col xl:items-stretch">
      <div className="min-w-0 flex-1 xl:flex-none" aria-live="polite">
        {selectedCell ? (
          <p className="flex items-center gap-2 font-bold tabular-nums">
            <span
              aria-hidden
              className="size-6 shrink-0 rounded-base border-2 border-border"
              style={{ backgroundColor: color }}
            />
            <span className="sr-only">Selected pixel</span>
            <span className="truncate">
              ({selectedCell.x}, {selectedCell.y})
            </span>
          </p>
        ) : (
          <p className="text-sm leading-snug text-text-600">Pick a pixel on the board.</p>
        )}
      </div>

      <Button
        onClick={onPlace}
        disabled={!isReady || !selectedCell || isCoolingDown || isPlacing}
        // While cooling down the button sits "pressed in" (shifted into its shadow's place).
        variant={isCoolingDown ? 'noShadow' : 'default'}
        className={cn(
          'relative h-12 min-w-32 shrink-0 cursor-pointer touch-manipulation overflow-hidden px-5 text-base font-bold uppercase tabular-nums xl:w-full',
          isCoolingDown &&
            'translate-x-boxShadowX translate-y-boxShadowY bg-secondary-background disabled:opacity-100',
        )}
      >
        {isCoolingDown && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-main transition-[width] duration-1000 ease-linear"
            style={{ width: `${cooldownLeft * 100}%` }}
          />
        )}
        <span className="relative">{label}</span>
      </Button>
    </div>
  )
}
