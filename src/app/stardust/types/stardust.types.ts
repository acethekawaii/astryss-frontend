export interface Cell {
  x: number
  y: number
}

/** Hex colors in the order users should encounter them in the picker. */
export type PaletteDisplayOrder = readonly string[]

/** A displayed swatch paired with the storage index sent to the placement API. */
export interface PaletteSwatch {
  hex: string
  paletteIndex: number
}

export interface BoardSnapshot {
  width: number
  height: number
  seq: number
  /** `#RRGGBB` colors, indexed by the values in `pixels`. */
  palette: string[]
  /** Optional API-provided picker order. Colors are matched back to `palette` by hex. */
  paletteDisplayOrder?: PaletteDisplayOrder
  /** One palette index per cell, row by row. */
  pixels: Uint8Array
}

export interface PixelUpdate extends Cell {
  seq: number
  color: number
}

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline'

export interface Cooldown {
  /** Epoch ms (client clock) when the next placement is allowed. */
  until: number
  durationMs: number
}

export type PlacementOutcome =
  | { kind: 'placed'; cooldownMs: number }
  | { kind: 'cooldown'; remainingMs: number }
  | { kind: 'unauthorized' }
  | { kind: 'failed'; message: string }
