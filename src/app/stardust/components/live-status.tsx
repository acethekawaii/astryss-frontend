import { cn } from '@/vendor/lib/utils'

import type { ConnectionStatus } from '../types/stardust.types'

const STATUS_DISPLAY: Record<ConnectionStatus, { label: string; dotClassName: string }> = {
  connecting: { label: 'Connecting', dotClassName: 'bg-chart-1 motion-safe:animate-pulse' },
  live: { label: 'Live', dotClassName: 'bg-chart-4' },
  reconnecting: { label: 'Reconnecting', dotClassName: 'bg-chart-1 motion-safe:animate-pulse' },
  offline: { label: 'Offline', dotClassName: 'bg-chart-3' },
}

export default function LiveStatus({ status }: { status: ConnectionStatus }) {
  const { label, dotClassName } = STATUS_DISPLAY[status]

  return (
    <p
      role="status"
      className="inline-flex shrink-0 items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-2.5 py-1 text-xs font-bold tracking-wider uppercase"
    >
      <span aria-hidden className={cn('size-2.5 rounded-full border-2 border-border', dotClassName)} />
      {label}
    </p>
  )
}
