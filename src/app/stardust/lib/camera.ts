export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** `scale` is CSS px per board pixel; `x`/`y` are where the board's top-left corner sits in the view. */
export interface Camera {
  scale: number
  x: number
  y: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Zoom at which the whole board fits in the view. */
export function fitScale(view: Size, board: Size): number {
  return Math.min(view.width / board.width, view.height / board.height)
}

export function fitCamera(view: Size, board: Size): Camera {
  const scale = fitScale(view, board)
  return {
    scale,
    x: (view.width - board.width * scale) / 2,
    y: (view.height - board.height * scale) / 2,
  }
}

export function screenToBoard(camera: Camera, point: Point): Point {
  return { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale }
}

/** Changes the zoom while keeping the board point under `focus` fixed on screen. */
export function zoomAround(camera: Camera, focus: Point, scale: number): Camera {
  const anchor = screenToBoard(camera, focus)
  return { scale, x: focus.x - anchor.x * scale, y: focus.y - anchor.y * scale }
}

/** Places the board point `anchor` at screen position `focus` for the given zoom. */
export function anchorAt(anchor: Point, focus: Point, scale: number): Camera {
  return { scale, x: focus.x - anchor.x * scale, y: focus.y - anchor.y * scale }
}

function clampOffset(offset: number, viewLength: number, contentLength: number): number {
  if (contentLength <= viewLength) {
    return (viewLength - contentLength) / 2
  }
  return clamp(offset, viewLength - contentLength, 0)
}

/**
 * Keeps the zoom in range and never lets the view leave the board: once zoomed in, the board
 * always covers the view, and while it is smaller than the view it stays centered.
 */
export function clampCamera(camera: Camera, view: Size, board: Size, minScale: number, maxScale: number): Camera {
  const scale = clamp(camera.scale, minScale, maxScale)
  return {
    scale,
    x: clampOffset(camera.x, view.width, board.width * scale),
    y: clampOffset(camera.y, view.height, board.height * scale),
  }
}
