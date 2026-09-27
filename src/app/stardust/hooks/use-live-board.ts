import { useEffect, useState } from 'react'

import { DEFAULT_BOARD_SIZE, DEFAULT_PALETTE } from '../constants/stardust.constants'
import type { BoardModel } from '../lib/board-model'
import { LiveBoardSync } from '../lib/live-board-sync'
import type { ConnectionStatus } from '../types/stardust.types'

interface BoardSize {
  width: number
  height: number
}

/** Loads the board into `board` and keeps it live for as long as the component is mounted. */
export function useLiveBoard(board: BoardModel) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [palette, setPalette] = useState<readonly string[]>(DEFAULT_PALETTE)
  const [boardSize, setBoardSize] = useState<BoardSize>(DEFAULT_BOARD_SIZE)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const sync = new LiveBoardSync(board, {
      onStatusChange: setStatus,
      onSnapshot: ({ palette: snapshotPalette, width, height }) => {
        setPalette(snapshotPalette)
        setBoardSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        )
        setIsReady(true)
      },
    })
    sync.start()
    return () => sync.stop()
  }, [board])

  return { status, palette, boardSize, isReady }
}
