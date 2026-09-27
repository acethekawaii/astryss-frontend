import type { BoardSnapshot, PixelUpdate } from '../types/stardust.types'

export interface OptimisticWrite {
  /** The server accepted the pixel; keep it. */
  commit: () => void
  /** The server rejected the pixel; restore the previous color unless newer data replaced it. */
  rollback: () => void
}

interface PendingWrite {
  previousColor: number
  superseded: boolean
}

const NOOP_WRITE: OptimisticWrite = { commit: () => {}, rollback: () => {} }

const IS_LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1

/** Packs `#RRGGBB` into one opaque RGBA pixel for a Uint32 view over ImageData. */
function packColor(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16)
  const red = (value >> 16) & 0xff
  const green = (value >> 8) & 0xff
  const blue = value & 0xff
  return IS_LITTLE_ENDIAN
    ? ((0xff << 24) | (blue << 16) | (green << 8) | red) >>> 0
    : ((red << 24) | (green << 16) | (blue << 8) | 0xff) >>> 0
}

/**
 * The client's copy of the board: one palette index per cell, mirrored into an offscreen
 * bitmap at one canvas pixel per board pixel so the viewport can draw it with a single
 * drawImage call at any zoom level.
 */
export class BoardModel {
  width = 0
  height = 0
  palette: readonly string[] = []

  private snapshotSeq = 0
  private pixels: Uint8Array | null = null
  private surface: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private readonly pendingWrites = new Map<number, PendingWrite>()
  private readonly listeners = new Set<() => void>()

  get isLoaded(): boolean {
    return this.pixels !== null
  }

  get image(): HTMLCanvasElement | null {
    return this.pixels ? this.surface : null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Replaces the whole board with a snapshot; it is authoritative over any optimistic pixel. */
  load(snapshot: BoardSnapshot) {
    this.width = snapshot.width
    this.height = snapshot.height
    this.palette = snapshot.palette
    this.snapshotSeq = snapshot.seq
    this.pixels = snapshot.pixels
    this.pendingWrites.forEach((write) => {
      write.superseded = true
    })
    this.pendingWrites.clear()
    this.renderAll()
    this.notify()
  }

  /** Applies live updates, skipping any already contained in the loaded snapshot. */
  apply(updates: readonly PixelUpdate[]) {
    let changed = false
    for (const update of updates) {
      if (update.seq <= this.snapshotSeq || !this.write(update.x, update.y, update.color)) {
        continue
      }
      const index = update.y * this.width + update.x
      const pending = this.pendingWrites.get(index)
      if (pending) {
        pending.superseded = true
        this.pendingWrites.delete(index)
      }
      changed = true
    }
    if (changed) {
      this.notify()
    }
  }

  contains(x: number, y: number): boolean {
    return this.isLoaded && x >= 0 && y >= 0 && x < this.width && y < this.height
  }

  /** Shows a pixel immediately, before the server confirms it. */
  paintOptimistic(x: number, y: number, color: number): OptimisticWrite {
    if (!this.pixels || !this.contains(x, y)) {
      return NOOP_WRITE
    }
    const index = y * this.width + x
    const pending: PendingWrite = { previousColor: this.pixels[index], superseded: false }
    if (!this.write(x, y, color)) {
      return NOOP_WRITE
    }
    this.pendingWrites.set(index, pending)
    this.notify()

    return {
      commit: () => {
        if (this.pendingWrites.get(index) === pending) {
          this.pendingWrites.delete(index)
        }
      },
      rollback: () => {
        if (pending.superseded || this.pendingWrites.get(index) !== pending) {
          return
        }
        this.pendingWrites.delete(index)
        this.write(x, y, pending.previousColor)
        this.notify()
      },
    }
  }

  private write(x: number, y: number, color: number): boolean {
    if (!this.pixels || !this.context || !this.contains(x, y) || color >= this.palette.length) {
      return false
    }
    this.pixels[y * this.width + x] = color
    this.context.fillStyle = this.palette[color]
    this.context.fillRect(x, y, 1, 1)
    return true
  }

  private renderAll() {
    if (!this.pixels) {
      return
    }
    this.surface ??= document.createElement('canvas')
    this.surface.width = this.width
    this.surface.height = this.height
    this.context = this.surface.getContext('2d')
    if (!this.context) {
      return
    }

    const image = this.context.createImageData(this.width, this.height)
    const output = new Uint32Array(image.data.buffer)
    const packedPalette = this.palette.map(packColor)
    for (let index = 0; index < this.pixels.length; index++) {
      output[index] = packedPalette[this.pixels[index]] ?? packedPalette[0]
    }
    this.context.putImageData(image, 0, 0)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }
}
