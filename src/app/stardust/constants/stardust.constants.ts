/** Palette from the Stardust API note, in index order. Board snapshots carry the live palette. */
export const DEFAULT_PALETTE: readonly string[] = [
  '#FFFFFF', '#E4E4E4', '#888888', '#222222',
  '#FFA7D1', '#E50000', '#E59500', '#A06A42',
  '#E5D900', '#94E044', '#02BE01', '#00D3DD',
  '#0083C7', '#0000EA', '#CF6EE4', '#820080',
]

export const COLOR_NAMES: Readonly<Record<string, string>> = {
  '#FFFFFF': 'White',
  '#E4E4E4': 'Light gray',
  '#888888': 'Gray',
  '#222222': 'Black',
  '#FFA7D1': 'Pink',
  '#E50000': 'Red',
  '#E59500': 'Orange',
  '#A06A42': 'Brown',
  '#E5D900': 'Yellow',
  '#94E044': 'Lime',
  '#02BE01': 'Green',
  '#00D3DD': 'Cyan',
  '#0083C7': 'Blue',
  '#0000EA': 'Indigo',
  '#CF6EE4': 'Lavender',
  '#820080': 'Purple',
}

export const DEFAULT_COLOR_INDEX = 5

/** Board size used to shape the frame before the first snapshot arrives (the snapshot is authoritative). */
export const DEFAULT_BOARD_SIZE = { width: 192, height: 108 } as const

/** Used only if a successful placement comes back without a readable `nextAllowedAt`. */
export const FALLBACK_COOLDOWN_MS = 30_000
export const COOLDOWN_TICK_MS = 250

export const SESSION_TOKEN_STORAGE_KEY = 'astryss:stardust:token'
export const COOLDOWN_STORAGE_KEY = 'astryss:stardust:cooldown'

export const RECONNECT_BASE_DELAY_MS = 1_000
export const RECONNECT_MAX_DELAY_MS = 15_000
export const SOCKET_CONNECT_TIMEOUT_MS = 10_000
/** A tab hidden for longer than this re-fetches the snapshot when it becomes visible again. */
export const RESYNC_AFTER_HIDDEN_MS = 60_000
/** Close code the live socket uses for a missing, late, or invalid token (and foreign origins). */
export const POLICY_VIOLATION_CLOSE_CODE = 1008

/** Zoom levels are CSS pixels per board pixel. */
export const MAX_ZOOM = 48
/**
 * Selecting a pixel smaller than this also zooms in on it. Fingertips need far bigger targets
 * than a mouse pointer, so touch zooms in much sooner.
 */
export const TOUCH_TAP_ZOOM_THRESHOLD = 10
export const MOUSE_TAP_ZOOM_THRESHOLD = 4
export const TAP_ZOOM_TARGET = 16
export const ZOOM_STEP = 2
/** The grid appears at GRID_MIN_ZOOM and reaches full strength at GRID_FULL_ZOOM. */
export const GRID_MIN_ZOOM = 4
export const GRID_FULL_ZOOM = 12
export const GRID_MIN_ALPHA = 0.1
export const GRID_MAX_ALPHA = 0.16
/** Finger or mouse travel (CSS px) that turns a press into a pan instead of a tap. */
export const TAP_SLOP_PX = 8
export const CAMERA_ANIMATION_MS = 220
/** After a pinch or scroll the zoom settles on whole device pixels, so every pixel is the same square. */
export const SETTLE_ANIMATION_MS = 120
export const WHEEL_SETTLE_DELAY_MS = 150
/** Keyboard selection pans the view once the selected pixel gets this close (CSS px) to an edge. */
export const REVEAL_MARGIN_PX = 24
export const WHEEL_ZOOM_SPEED = 0.0015
export const PINCH_WHEEL_ZOOM_SPEED = 0.01
/** The selection outline hugs the pixel; its thickness (CSS px) scales with the pixel size. */
export const RETICLE_OUTLINE_RATIO = 0.2
export const RETICLE_OUTLINE_MIN_PX = 1.5
export const RETICLE_OUTLINE_MAX_PX = 3
export const SELECTION_PREVIEW_ALPHA = 0.7
