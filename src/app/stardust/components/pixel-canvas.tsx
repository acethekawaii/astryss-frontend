'use client'

import { useEffect, useEffectEvent, useRef } from 'react'
import { LoaderCircle, Maximize, Minus, Plus } from 'lucide-react'

import { cn } from '@/vendor/lib/utils'
import { Button } from '@/vendor/ui/button'

import { ZOOM_STEP } from '../constants/stardust.constants'
import type { BoardModel } from '../lib/board-model'
import { BoardViewport } from '../lib/board-viewport'
import type { Cell } from '../types/stardust.types'

interface PixelCanvasProps {
  board: BoardModel
  isReady: boolean
  selectedCell: Cell | null
  selectedColor: string
  onSelectCell: (cell: Cell) => void
  /** Must give the frame its size; the layout matches it to the board's aspect ratio. */
  className?: string
}

const ZOOM_BUTTON_CLASS = 'size-8 cursor-pointer touch-manipulation sm:size-9'

export default function PixelCanvas({
  board,
  isReady,
  selectedCell,
  selectedColor,
  onSelectCell,
  className,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<BoardViewport | null>(null)
  const selectCell = useEffectEvent((cell: Cell) => onSelectCell(cell))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const viewport = new BoardViewport(canvas, board, { onSelectCell: (cell) => selectCell(cell) })
    viewportRef.current = viewport
    return () => {
      viewport.destroy()
      viewportRef.current = null
    }
  }, [board])

  useEffect(() => {
    viewportRef.current?.setSelection(selectedCell, selectedColor)
  }, [selectedCell, selectedColor])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-base border-4 border-border bg-[#F3EBC3] bg-[radial-gradient(rgb(0_0_0/0.13)_1px,transparent_1px)] bg-size-[16px_16px] shadow-shadow has-[canvas:focus-visible]:outline-4 has-[canvas:focus-visible]:outline-offset-2 has-[canvas:focus-visible]:outline-chart-5',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-roledescription="pixel board"
        aria-label="Stardust board. Drag to pan, pinch or scroll to zoom, and tap a pixel to select it. Keyboard: arrow keys move the selection, plus and minus zoom, zero shows the whole board."
        className="absolute inset-0 size-full cursor-crosshair touch-none select-none outline-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      />
      {/* Soft inner shadow: the board reads as sitting just below the frame's edge. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_18px_rgb(0_0_0/0.22)]" />

      {!isReady && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
          <p
            role="status"
            className="inline-flex items-center gap-2 rounded-base border-2 border-border bg-main px-4 py-2 font-bold uppercase shadow-shadow"
          >
            <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" />
            Loading board
          </p>
        </div>
      )}

      <div className="absolute right-2 bottom-2 flex gap-1.5 sm:right-3 sm:bottom-3 sm:gap-2">
        <Button
          variant="neutral"
          size="icon"
          aria-label="Zoom in"
          className={ZOOM_BUTTON_CLASS}
          onClick={() => viewportRef.current?.zoomBy(ZOOM_STEP)}
        >
          <Plus />
        </Button>
        <Button
          variant="neutral"
          size="icon"
          aria-label="Zoom out"
          className={ZOOM_BUTTON_CLASS}
          onClick={() => viewportRef.current?.zoomBy(1 / ZOOM_STEP)}
        >
          <Minus />
        </Button>
        <Button
          variant="neutral"
          size="icon"
          aria-label="Show the whole board"
          className={ZOOM_BUTTON_CLASS}
          onClick={() => viewportRef.current?.showWholeBoard()}
        >
          <Maximize />
        </Button>
      </div>
    </div>
  )
}
