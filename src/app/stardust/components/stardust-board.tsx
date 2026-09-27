'use client'

import { useState, type CSSProperties } from 'react'
import { Sparkles } from 'lucide-react'

import { DEFAULT_COLOR_INDEX } from '../constants/stardust.constants'
import { useDevicePixelRatio } from '../hooks/use-device-pixel-ratio'
import { useLiveBoard } from '../hooks/use-live-board'
import { usePlacePixel } from '../hooks/use-place-pixel'
import { BoardModel } from '../lib/board-model'
import type { Cell } from '../types/stardust.types'
import ColorPicker from './color-picker'
import LiveStatus from './live-status'
import PixelCanvas from './pixel-canvas'
import PlacePanel from './place-panel'

const PANEL_WIDTH = '14rem'
const PANEL_GAP = '1.5rem'
/** The frame's 4px border, on both sides. */
const FRAME_BORDERS = '8px'
/** Short screens (landscape phones) still get a usable board; the page scrolls instead. */
const FRAME_MIN_WIDTH = '20rem'

/**
 * Sizes the board frame in CSS, so even the server render has the right shape: the frame keeps
 * the board's aspect ratio and is as large as the screen allows. Its width is capped by the space
 * left beside the panel (desktop) or the full width (stacked layouts), and by the viewport height
 * minus `--board-reserve`, the height everything else on the page needs.
 *
 * The board area is then rounded down so every board pixel covers the same whole number of
 * device pixels: at a fractional scale some columns would be a device pixel wider than others
 * and the grid would look uneven. Until the pixel ratio is known (server render), it only rounds
 * to whole CSS pixels.
 */
function frameSizing({ width, height }: { width: number; height: number }, pixelRatio: number | null): CSSProperties {
  const ratio = width / height
  const widthForScreenHeight = `calc((100svh - var(--board-reserve)) * ${ratio} + ${FRAME_BORDERS})`
  const snapStep = pixelRatio ? `${width / pixelRatio}px` : '1px'
  return {
    '--frame-max-width-stacked': `min(100cqw, max(${FRAME_MIN_WIDTH}, ${widthForScreenHeight}))`,
    '--frame-max-width-beside': `min(calc(100cqw - ${PANEL_WIDTH} - ${PANEL_GAP}), ${widthForScreenHeight})`,
    '--board-area-width': `round(down, calc(var(--frame-max-width) - ${FRAME_BORDERS}), ${snapStep})`,
    '--frame-width': `calc(var(--board-area-width) + ${FRAME_BORDERS})`,
    '--frame-height': `calc(var(--board-area-width) * ${height} / ${width} + ${FRAME_BORDERS})`,
  } as CSSProperties
}

export default function StardustBoard() {
  const [board] = useState(() => new BoardModel())
  const { status, palette, boardSize, isReady } = useLiveBoard(board)
  const pixelRatio = useDevicePixelRatio()
  const { isPlacing, placeSelectedPixel } = usePlacePixel(board)
  const [colorIndex, setColorIndex] = useState(DEFAULT_COLOR_INDEX)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)

  const activeColorIndex = Math.min(colorIndex, palette.length - 1)

  const placeAtSelection = () => {
    if (selectedCell) {
      void placeSelectedPixel(selectedCell, activeColorIndex)
    }
  }

  return (
    // The size container that `100cqw` in frameSizing refers to.
    <div className="@container">
      <div
        style={frameSizing(boardSize, pixelRatio)}
        className="grid gap-3 [--board-reserve:23rem] [--frame-max-width:var(--frame-max-width-stacked)] md:[--board-reserve:22.5rem] xl:h-(--frame-height) xl:grid-cols-[var(--frame-width)_14rem] xl:grid-rows-[auto_minmax(0,1fr)] xl:justify-center xl:gap-x-6 xl:gap-y-4 xl:[--board-reserve:10rem] xl:[--frame-max-width:var(--frame-max-width-beside)]"
      >
        <header className="flex w-full max-w-(--frame-width) items-center justify-between gap-3 justify-self-center xl:col-start-2 xl:row-start-1 xl:flex-col xl:items-start">
          <h1 className="inline-flex -rotate-1 items-center gap-2 rounded-base border-2 border-border bg-main px-3 py-1 text-xl font-bold uppercase shadow-shadow [font-family:inherit] lg:text-2xl">
            <Sparkles aria-hidden className="size-5 lg:size-6" />
            Stardust
          </h1>
          <LiveStatus status={status} />
        </header>

        <PixelCanvas
          board={board}
          isReady={isReady}
          selectedCell={selectedCell}
          selectedColor={palette[activeColorIndex]}
          onSelectCell={setSelectedCell}
          className="h-(--frame-height) w-(--frame-width) justify-self-center xl:col-start-1 xl:row-span-2 xl:row-start-1"
        />

        {/* Side by side (xl) this card stretches to the frame's bottom edge so both columns line up. */}
        <section
          aria-label="Paint"
          className="flex w-full max-w-(--frame-width) flex-col gap-3 self-start justify-self-center rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow xl:col-start-2 xl:row-start-2 xl:min-h-0 xl:gap-4 xl:self-stretch xl:overflow-y-auto xl:p-4"
        >
          <ColorPicker palette={palette} selectedIndex={activeColorIndex} onSelect={setColorIndex} />
          <PlacePanel
            selectedCell={selectedCell}
            color={palette[activeColorIndex]}
            isReady={isReady}
            isPlacing={isPlacing}
            onPlace={placeAtSelection}
          />
          <p className="hidden text-xs leading-relaxed text-text-600 xl:mt-auto xl:block">
            Drag to pan, scroll to zoom, click a pixel to select it. Placing starts a short cooldown.
          </p>
        </section>
      </div>
    </div>
  )
}
