import { API_CONFIG } from '@/shared/config/api.config'
import { ApiResponse } from '@/shared/types/api.types'

import { FALLBACK_COOLDOWN_MS } from '../constants/stardust.constants'
import { decodeSnapshot } from '../lib/board-protocol'
import type { BoardSnapshot, Cell, PlacementOutcome } from '../types/stardust.types'

const STARDUST_URL = `${API_CONFIG.BASE_URL}/stardust`

interface PlacedPixel extends Cell {
  color: number
  nextAllowedAt: string
}

interface CooldownRejection {
  message?: { remainingMs?: unknown }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

/** The 429 body carries `message.remainingMs`, which is relative and so immune to clock skew. */
function readRemainingMs(body: unknown): number | null {
  const remainingMs = (body as CooldownRejection | null)?.message?.remainingMs
  return typeof remainingMs === 'number' && Number.isFinite(remainingMs) ? remainingMs : null
}

function msUntil(nextAllowedAt: string | undefined): number {
  const until = nextAllowedAt ? Date.parse(nextAllowedAt) : Number.NaN
  return Number.isFinite(until) ? until - Date.now() : FALLBACK_COOLDOWN_MS
}

/** Mints an anonymous session token. */
export async function createSession(): Promise<string> {
  const response = await fetch(`${STARDUST_URL}/session`, { method: 'POST' })
  if (!response.ok) {
    throw new Error(`Session request failed with status ${response.status}`)
  }

  const body = (await readJson(response)) as ApiResponse<{ token?: unknown }> | null
  const token = body?.data?.token
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Session response did not include a token')
  }
  return token
}

/** Downloads and decodes the full board snapshot. */
export async function fetchBoard(): Promise<BoardSnapshot> {
  const response = await fetch(`${STARDUST_URL}/board`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Board request failed with status ${response.status}`)
  }
  return decodeSnapshot(await response.arrayBuffer())
}

/** Places one pixel. Expected rejections come back as outcomes; network failures throw. */
export async function placePixel(token: string, cell: Cell, color: number): Promise<PlacementOutcome> {
  const response = await fetch(`${STARDUST_URL}/pixels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ x: cell.x, y: cell.y, color }),
  })
  const body = await readJson(response)

  if (response.ok) {
    const placed = (body as ApiResponse<Partial<PlacedPixel>> | null)?.data
    return { kind: 'placed', cooldownMs: msUntil(placed?.nextAllowedAt) }
  }

  switch (response.status) {
    case 429: {
      const remainingMs = readRemainingMs(body)
      return remainingMs === null
        ? { kind: 'failed', message: 'Stardust is busy right now. Try again in a moment.' }
        : { kind: 'cooldown', remainingMs }
    }
    case 401:
      return { kind: 'unauthorized' }
    case 400:
      return { kind: 'failed', message: 'That pixel or color was rejected. Pick again and retry.' }
    case 503:
      return { kind: 'failed', message: 'The board is not ready yet. Try again in a moment.' }
    default:
      return { kind: 'failed', message: `Placing failed (error ${response.status}). Try again.` }
  }
}
