import { API_CONFIG } from '@/shared/config/api.config'

import { fetchBoard } from '../api/stardust.api'
import {
  POLICY_VIOLATION_CLOSE_CODE,
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  RESYNC_AFTER_HIDDEN_MS,
  SOCKET_CONNECT_TIMEOUT_MS,
} from '../constants/stardust.constants'
import type { BoardSnapshot, ConnectionStatus, PixelUpdate } from '../types/stardust.types'
import type { BoardModel } from './board-model'
import { decodeDelta } from './board-protocol'
import { getSessionToken, renewSessionToken } from './session-token'

interface LiveBoardSyncOptions {
  onStatusChange: (status: ConnectionStatus) => void
  onSnapshot: (snapshot: BoardSnapshot) => void
}

function liveSocketUrl(): string {
  const url = new URL(`${API_CONFIG.BASE_URL}/stardust/live`, window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

/**
 * Keeps a BoardModel in sync with the server.
 *
 * Each connection opens the live socket first, authenticates with the session token, and only
 * then downloads the snapshot. Frames that arrive during the download are buffered and replayed
 * on top of it (records already inside the snapshot are skipped by seq), so no pixel falls into
 * the gap between the two. A dropped connection reconnects with jittered backoff and repeats the
 * whole sequence, re-fetching the snapshot.
 */
export class LiveBoardSync {
  private socket: WebSocket | null = null
  /** Non-null while the snapshot for the current socket is downloading. */
  private bufferedUpdates: PixelUpdate[] | null = null
  private connectAttempt = 0
  private failedAttempts = 0
  private reconnectTimer: number | undefined
  private connectTimeout: number | undefined
  private hiddenAt: number | null = null
  private hasSynced = false
  private renewedRejectedToken = false
  private stopped = true

  constructor(
    private readonly board: BoardModel,
    private readonly options: LiveBoardSyncOptions,
  ) {}

  start() {
    this.stopped = false
    window.addEventListener('online', this.reconnectNow)
    window.addEventListener('offline', this.goOffline)
    document.addEventListener('visibilitychange', this.resyncIfStale)
    // Deferred so a mount/unmount/mount cycle (React strict mode) opens a single socket.
    this.scheduleConnect(0)
  }

  stop() {
    this.stopped = true
    window.removeEventListener('online', this.reconnectNow)
    window.removeEventListener('offline', this.goOffline)
    document.removeEventListener('visibilitychange', this.resyncIfStale)
    window.clearTimeout(this.reconnectTimer)
    this.closeSocket()
  }

  private scheduleConnect(delayMs: number) {
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = window.setTimeout(() => void this.connect(), delayMs)
  }

  private scheduleReconnect() {
    const ceiling = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** this.failedAttempts)
    this.failedAttempts += 1
    this.scheduleConnect(ceiling / 2 + (Math.random() * ceiling) / 2)
  }

  private async connect() {
    const attempt = ++this.connectAttempt
    this.closeSocket()
    this.options.onStatusChange(this.pendingStatus())

    let token: string
    try {
      token = await getSessionToken()
    } catch (error) {
      console.error('[stardust] Could not start an anonymous session', error)
      if (!this.stopped && attempt === this.connectAttempt) {
        void this.loadSnapshotWithoutLive()
        this.handleDisconnect()
      }
      return
    }
    if (this.stopped || attempt !== this.connectAttempt) {
      return
    }

    const socket = new WebSocket(liveSocketUrl())
    socket.binaryType = 'arraybuffer'
    this.socket = socket
    this.connectTimeout = window.setTimeout(() => socket.close(), SOCKET_CONNECT_TIMEOUT_MS)

    socket.addEventListener('open', () => {
      if (socket !== this.socket) {
        return
      }
      window.clearTimeout(this.connectTimeout)
      socket.send(JSON.stringify({ token }))
      this.bufferedUpdates = []
      void this.syncSnapshot(socket)
    })
    socket.addEventListener('message', (event: MessageEvent) => this.receiveFrame(socket, event))
    socket.addEventListener('close', (event: CloseEvent) => void this.handleClose(socket, event, token))
  }

  private async syncSnapshot(socket: WebSocket) {
    let snapshot: BoardSnapshot
    try {
      snapshot = await fetchBoard()
    } catch (error) {
      console.error('[stardust] Could not download the board', error)
      if (socket === this.socket) {
        socket.close()
      }
      return
    }

    if (socket !== this.socket) {
      // The socket dropped mid-download. Still show the board if nothing is on screen yet.
      if (!this.board.isLoaded && !this.stopped) {
        this.showSnapshot(snapshot, [])
      }
      return
    }

    this.showSnapshot(snapshot, this.bufferedUpdates ?? [])
    this.bufferedUpdates = null
    this.failedAttempts = 0
    this.renewedRejectedToken = false
    this.hasSynced = true
    this.options.onStatusChange('live')
  }

  private async loadSnapshotWithoutLive() {
    if (this.board.isLoaded) {
      return
    }
    try {
      const snapshot = await fetchBoard()
      if (!this.stopped && !this.board.isLoaded) {
        this.showSnapshot(snapshot, [])
      }
    } catch (error) {
      console.error('[stardust] Could not download the board', error)
    }
  }

  private showSnapshot(snapshot: BoardSnapshot, updates: readonly PixelUpdate[]) {
    this.board.load(snapshot)
    this.board.apply(updates)
    this.options.onSnapshot(snapshot)
  }

  private receiveFrame(socket: WebSocket, event: MessageEvent) {
    if (socket !== this.socket || !(event.data instanceof ArrayBuffer)) {
      return
    }

    let updates: PixelUpdate[]
    try {
      updates = decodeDelta(event.data)
    } catch (error) {
      console.warn('[stardust] Ignoring a malformed live frame', error)
      return
    }

    if (this.bufferedUpdates) {
      for (const update of updates) {
        this.bufferedUpdates.push(update)
      }
    } else {
      this.board.apply(updates)
    }
  }

  private async handleClose(socket: WebSocket, event: CloseEvent, token: string) {
    if (socket !== this.socket) {
      return
    }
    window.clearTimeout(this.connectTimeout)
    this.socket = null
    this.bufferedUpdates = null
    if (this.stopped) {
      return
    }

    // 1008 also covers a rejected token (e.g. after a server secret rotation): mint a fresh one,
    // but only once per outage so a misconfigured origin cannot mint tokens in a loop.
    if (event.code === POLICY_VIOLATION_CLOSE_CODE && !this.renewedRejectedToken) {
      const attempt = this.connectAttempt
      this.renewedRejectedToken = true
      try {
        await renewSessionToken(token)
      } catch (error) {
        console.error('[stardust] Could not renew the anonymous session', error)
      }
      if (this.stopped || attempt !== this.connectAttempt) {
        return
      }
    }
    this.handleDisconnect()
  }

  private handleDisconnect() {
    this.options.onStatusChange(this.pendingStatus())
    this.scheduleReconnect()
  }

  /** Status to show while not live: offline when the browser knows it has no network. */
  private pendingStatus(): ConnectionStatus {
    if (navigator.onLine === false) {
      return 'offline'
    }
    return this.hasSynced ? 'reconnecting' : 'connecting'
  }

  private closeSocket() {
    window.clearTimeout(this.connectTimeout)
    const socket = this.socket
    this.socket = null
    this.bufferedUpdates = null
    if (socket && socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
      socket.close(1000)
    }
  }

  private readonly reconnectNow = () => {
    if (this.stopped) {
      return
    }
    this.failedAttempts = 0
    this.scheduleConnect(0)
  }

  private readonly goOffline = () => {
    if (this.stopped) {
      return
    }
    this.connectAttempt += 1
    this.closeSocket()
    this.options.onStatusChange('offline')
    this.scheduleReconnect()
  }

  private readonly resyncIfStale = () => {
    if (this.stopped) {
      return
    }
    if (document.visibilityState === 'hidden') {
      this.hiddenAt = Date.now()
      return
    }

    const hiddenFor = this.hiddenAt === null ? 0 : Date.now() - this.hiddenAt
    this.hiddenAt = null
    const isWaitingToReconnect = this.socket === null
    if (isWaitingToReconnect || hiddenFor >= RESYNC_AFTER_HIDDEN_MS) {
      this.reconnectNow()
    }
  }
}
