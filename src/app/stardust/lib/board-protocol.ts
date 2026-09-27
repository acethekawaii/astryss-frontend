import type { BoardSnapshot, PixelUpdate } from '../types/stardust.types'

// Binary layouts are documented in docs/stardust-api.md. All integers are big-endian.
const PROTOCOL_VERSION = 1
const SNAPSHOT_MAGIC = 'STBD'
const DELTA_MAGIC = 'STPX'
const SNAPSHOT_FIXED_HEADER_BYTES = 14
const DELTA_HEADER_BYTES = 7
const DELTA_RECORD_BYTES = 9

function readMagic(view: DataView): string {
  return String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
}

function toHexByte(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase()
}

/** Decodes a `STBD` board snapshot. */
export function decodeSnapshot(buffer: ArrayBuffer): BoardSnapshot {
  const view = new DataView(buffer)
  if (buffer.byteLength < SNAPSHOT_FIXED_HEADER_BYTES || readMagic(view) !== SNAPSHOT_MAGIC) {
    throw new Error('Board snapshot has an unknown format')
  }
  if (view.getUint8(4) !== PROTOCOL_VERSION) {
    throw new Error(`Board snapshot version ${view.getUint8(4)} is not supported`)
  }

  const width = view.getUint16(5)
  const height = view.getUint16(7)
  const seq = view.getUint32(9)
  const paletteLength = view.getUint8(13)
  const headerLength = SNAPSHOT_FIXED_HEADER_BYTES + paletteLength * 3
  if (width === 0 || height === 0 || paletteLength === 0) {
    throw new Error('Board snapshot has an empty board or palette')
  }
  if (buffer.byteLength < headerLength + width * height) {
    throw new Error('Board snapshot is truncated')
  }

  const palette = Array.from({ length: paletteLength }, (_, index) => {
    const offset = SNAPSHOT_FIXED_HEADER_BYTES + index * 3
    return `#${toHexByte(view.getUint8(offset))}${toHexByte(view.getUint8(offset + 1))}${toHexByte(view.getUint8(offset + 2))}`
  })

  return { width, height, seq, palette, pixels: new Uint8Array(buffer, headerLength, width * height) }
}

/** Decodes a `STPX` live frame into pixel updates. */
export function decodeDelta(buffer: ArrayBuffer): PixelUpdate[] {
  const view = new DataView(buffer)
  if (
    buffer.byteLength < DELTA_HEADER_BYTES ||
    readMagic(view) !== DELTA_MAGIC ||
    view.getUint8(4) !== PROTOCOL_VERSION
  ) {
    throw new Error('Live frame has an unknown format')
  }

  const count = view.getUint16(5)
  if (buffer.byteLength < DELTA_HEADER_BYTES + count * DELTA_RECORD_BYTES) {
    throw new Error('Live frame is truncated')
  }

  return Array.from({ length: count }, (_, index) => {
    const offset = DELTA_HEADER_BYTES + index * DELTA_RECORD_BYTES
    return {
      seq: view.getUint32(offset),
      x: view.getUint16(offset + 4),
      y: view.getUint16(offset + 6),
      color: view.getUint8(offset + 8),
    }
  })
}
