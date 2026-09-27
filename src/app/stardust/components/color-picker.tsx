'use client'

import { KeyboardEvent, useRef } from 'react'

import { cn } from '@/vendor/lib/utils'

import { COLOR_NAMES } from '../constants/stardust.constants'

interface ColorPickerProps {
  palette: readonly string[]
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
  const name = COLOR_NAMES[hex.toUpperCase()]
  return name ? `${name} ${hex}` : hex
}

/** Black or white, whichever stays readable on top of `hex`. */
function markerColor(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16)
  const luminance = 0.2126 * ((value >> 16) & 0xff) + 0.7152 * ((value >> 8) & 0xff) + 0.0722 * (value & 0xff)
  return luminance > LIGHT_COLOR_LUMINANCE ? '#000000' : '#FFFFFF'
}

export default function ColorPicker({ palette, selectedIndex, onSelect }: ColorPickerProps) {
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])

  const selectWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const offset = ARROW_OFFSETS[event.key]
    const lastIndex = palette.length - 1
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? lastIndex
          : offset === undefined
            ? null
            : (selectedIndex + offset + palette.length) % palette.length
    if (target === null) {
      return
    }
    event.preventDefault()
    onSelect(target)
    swatchRefs.current[target]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Pixel color"
      onKeyDown={selectWithKeyboard}
      className="grid grid-cols-8 gap-1.5 md:grid-cols-16 xl:grid-cols-4 xl:gap-2"
    >
      {palette.map((hex, index) => {
        const isSelected = index === selectedIndex
        return (
          <button
            key={hex}
            ref={(element) => {
              swatchRefs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={describeColor(hex)}
            title={describeColor(hex)}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(index)}
            style={{ backgroundColor: hex }}
            className={cn(
              'relative aspect-square w-full cursor-pointer touch-manipulation rounded-base border-2 border-border transition-transform focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden',
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
