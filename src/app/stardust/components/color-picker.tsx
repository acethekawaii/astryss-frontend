'use client'

import { KeyboardEvent, useRef } from 'react'

import { cn } from '@/lib/utils'

import { COLOR_NAMES, DEFAULT_PALETTE_DISPLAY_ORDER } from '../constants/stardust.constants'
import type { PaletteDisplayOrder, PaletteSwatch } from '../types/stardust.types'

interface ColorPickerProps {
  palette: readonly string[]
  displayOrder?: PaletteDisplayOrder
  selectedIndex: number
  onSelect: (index: number) => void
}

const ARROW_OFFSETS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}
const LIGHT_COLOR_LUMINANCE = 150

export function describeColor(hex: string): string {
  return COLOR_NAMES[hex.toUpperCase()] ?? hex
}

/** Orders swatches for display without changing the storage indexes used by board pixels. */
export function orderPalette(
  palette: readonly string[],
  displayOrder: PaletteDisplayOrder = DEFAULT_PALETTE_DISPLAY_ORDER,
): PaletteSwatch[] {
  const displayPositionByHex = new Map<string, number>()
  displayOrder.forEach((hex, position) => {
    const normalizedHex = hex.toUpperCase()
    if (!displayPositionByHex.has(normalizedHex)) {
      displayPositionByHex.set(normalizedHex, position)
    }
  })

  return palette
    .map((hex, paletteIndex) => ({ hex, paletteIndex }))
    .sort((first, second) => {
      const firstPosition = displayPositionByHex.get(first.hex.toUpperCase())
      const secondPosition = displayPositionByHex.get(second.hex.toUpperCase())

      if (firstPosition === undefined && secondPosition === undefined) {
        return first.paletteIndex - second.paletteIndex
      }
      if (firstPosition === undefined) {
        return 1
      }
      if (secondPosition === undefined) {
        return -1
      }
      return firstPosition - secondPosition || first.paletteIndex - second.paletteIndex
    })
}

/** Resolves keyboard movement in display order and returns a display position, not a palette index. */
export function getKeyboardTargetDisplayIndex(
  key: string,
  swatches: readonly PaletteSwatch[],
  selectedIndex: number,
): number | null {
  if (swatches.length === 0) {
    return null
  }

  if (key === 'Home') {
    return 0
  }
  if (key === 'End') {
    return swatches.length - 1
  }

  const offset = ARROW_OFFSETS[key]
  if (offset === undefined) {
    return null
  }

  const selectedDisplayIndex = swatches.findIndex(({ paletteIndex }) => paletteIndex === selectedIndex)
  return (Math.max(selectedDisplayIndex, 0) + offset + swatches.length) % swatches.length
}

/** Black or white, whichever stays readable on top of `hex`. */
function markerColor(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16)
  const luminance = 0.2126 * ((value >> 16) & 0xff) + 0.7152 * ((value >> 8) & 0xff) + 0.0722 * (value & 0xff)
  return luminance > LIGHT_COLOR_LUMINANCE ? '#000000' : '#FFFFFF'
}

export default function ColorPicker({ palette, displayOrder, selectedIndex, onSelect }: ColorPickerProps) {
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])
  const swatches = orderPalette(palette, displayOrder)

  const selectWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const targetDisplayIndex = getKeyboardTargetDisplayIndex(event.key, swatches, selectedIndex)
    if (targetDisplayIndex === null) {
      return
    }

    const target = swatches[targetDisplayIndex]
    if (!target) {
      return
    }

    event.preventDefault()
    onSelect(target.paletteIndex)
    swatchRefs.current[targetDisplayIndex]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Pixel color"
      onKeyDown={selectWithKeyboard}
      className="grid grid-cols-8 gap-1.5 md:grid-cols-12 xl:grid-cols-6 xl:gap-2"
    >
      {swatches.map(({ hex, paletteIndex }, displayIndex) => {
        const isSelected = paletteIndex === selectedIndex
        return (
          <button
            key={paletteIndex}
            ref={(element) => {
              swatchRefs.current[displayIndex] = element
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={describeColor(hex)}
            data-palette-index={paletteIndex}
            title={describeColor(hex)}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(paletteIndex)}
            style={{ backgroundColor: hex }}
            className={cn(
              'relative aspect-square w-full cursor-pointer touch-manipulation rounded-base border-2 border-black transition-transform focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden',
              isSelected ? '-translate-x-0.5 -translate-y-0.5 shadow-shadow' : 'hover:-translate-y-0.5',
            )}
          >
            {isSelected && (
              <span
                aria-hidden
                className="absolute inset-0 m-auto size-2.5 rounded-full"
                style={{ backgroundColor: markerColor(hex) }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
