import { createSession } from '../api/stardust.api'
import { SESSION_TOKEN_STORAGE_KEY } from '../constants/stardust.constants'

// Fallback for browsers that block localStorage (e.g. some private modes): the token then lasts
// for this visit only.
let memoryToken: string | null = null
let pendingSession: Promise<string> | null = null

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

function storeToken(token: string | null) {
  memoryToken = token
  try {
    if (token) {
      window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token)
    } else {
      window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
    }
  } catch {
    // Storage is unavailable; the in-memory token still works for this visit.
  }
}

/** Returns the anonymous session token, minting and persisting one on the first visit. */
export function getSessionToken(): Promise<string> {
  const stored = readStoredToken()
  if (stored) {
    return Promise.resolve(stored)
  }

  pendingSession ??= createSession()
    .then((token) => {
      storeToken(token)
      return token
    })
    .finally(() => {
      pendingSession = null
    })
  return pendingSession
}

/** Forgets a token the server rejected and returns a freshly minted one. */
export function renewSessionToken(rejectedToken: string): Promise<string> {
  if (readStoredToken() === rejectedToken) {
    storeToken(null)
  }
  return getSessionToken()
}
