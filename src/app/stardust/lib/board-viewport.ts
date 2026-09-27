import {
  CAMERA_ANIMATION_MS,
  DEFAULT_BOARD_SIZE,
  GRID_FULL_ZOOM,
  GRID_MAX_ALPHA,
  GRID_MIN_ALPHA,
  GRID_MIN_ZOOM,
  MAX_ZOOM,
  MOUSE_TAP_ZOOM_THRESHOLD,
  PINCH_WHEEL_ZOOM_SPEED,
  RETICLE_OUTLINE_MAX_PX,
  RETICLE_OUTLINE_MIN_PX,
  RETICLE_OUTLINE_RATIO,
  REVEAL_MARGIN_PX,
  SELECTION_PREVIEW_ALPHA,
  SETTLE_ANIMATION_MS,
  TAP_SLOP_PX,
  TAP_ZOOM_TARGET,
  TOUCH_TAP_ZOOM_THRESHOLD,
  WHEEL_SETTLE_DELAY_MS,
  WHEEL_ZOOM_SPEED,
  ZOOM_STEP,
} from '../constants/stardust.constants'
import type { Cell } from '../types/stardust.types'
import type { BoardModel } from './board-model'
import {
  anchorAt,
  clamp,
  clampCamera,
  fitCamera,
  fitScale,
  screenToBoard,
  zoomAround,
  type Camera,
  type Point,
  type Size,
} from './camera'

interface BoardViewportOptions {
  onSelectCell: (cell: Cell) => void
}

interface PinchGesture {
  kind: 'pinch'
  startDistance: number
  startScale: number
  /** Board point that stays under the midpoint of the two fingers. */
  anchor: Point
}

type Gesture =
  | { kind: 'idle' }
  | { kind: 'press'; pointerId: number; pointerType: string; start: Point }
  | { kind: 'pan'; pointerId: number; last: Point }
  | PinchGesture

const RETICLE_COLOR = '#000000'
const RETICLE_HALO_COLOR = '#FFFFFF'
const WHEEL_LINE_HEIGHT_PX = 16
const KEYBOARD_FAST_STEP = 10

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** How far to shift the view so a span starting at `start` stays `margin` inside the view. */
function revealOffset(start: number, size: number, viewLength: number, margin: number): number {
  if (start < margin) {
    return margin - start
  }
  const overflow = start + size - (viewLength - margin)
  return overflow > 0 ? -overflow : 0
}

function preventDefault(event: Event) {
  event.preventDefault()
}

/**
 * Draws the board into a canvas that fills its container and turns pointer, wheel and keyboard
 * input into pan, zoom and selection.
 *
 * A press becomes a tap (a selection) only when it never travels past TAP_SLOP_PX and no second
 * finger joins it. Panning or pinching therefore never selects anything, and selecting never
 * places anything: placing is a separate, explicit action outside the canvas.
 */
export class BoardViewport {
  private camera: Camera = { scale: 1, x: 0, y: 0 }
  private view: Size = { width: 0, height: 0 }
  private pixelRatio = 1
  private framedBoard: Size | null = null
  private selection: Cell | null = null
  private selectionColor = '#000000'
  private readonly pointers = new Map<number, Point>()
  private gesture: Gesture = { kind: 'idle' }
  private drawRequest = 0
  private animationRequest = 0
  private wheelSettleTimer: number | undefined
  private lastPinchFocus: Point | null = null
  private readonly resizeObserver: ResizeObserver
  private readonly unsubscribeBoard: () => void
  private readonly reducedMotion: MediaQueryList

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly board: BoardModel,
    private readonly options: BoardViewportOptions,
  ) {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.resizeObserver = new ResizeObserver(() => this.measure())
    this.resizeObserver.observe(canvas)
    this.unsubscribeBoard = board.subscribe(() => {
      this.frameBoard()
      this.requestDraw()
    })

    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointermove', this.handlePointerMove)
    canvas.addEventListener('pointerup', this.handlePointerUp)
    canvas.addEventListener('pointercancel', this.handlePointerCancel)
    canvas.addEventListener('lostpointercapture', this.handlePointerCancel)
    canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    canvas.addEventListener('keydown', this.handleKeyDown)
    // iOS Safari still pinch-zooms the page on some versions unless its gesture events are cancelled.
    canvas.addEventListener('gesturestart', preventDefault)
    this.measure()
  }

  destroy() {
    this.resizeObserver.disconnect()
    this.unsubscribeBoard()
    cancelAnimationFrame(this.drawRequest)
    window.clearTimeout(this.wheelSettleTimer)
    this.stopAnimation()

    const canvas = this.canvas
    canvas.removeEventListener('pointerdown', this.handlePointerDown)
    canvas.removeEventListener('pointermove', this.handlePointerMove)
    canvas.removeEventListener('pointerup', this.handlePointerUp)
    canvas.removeEventListener('pointercancel', this.handlePointerCancel)
    canvas.removeEventListener('lostpointercapture', this.handlePointerCancel)
    canvas.removeEventListener('wheel', this.handleWheel)
    canvas.removeEventListener('keydown', this.handleKeyDown)
    canvas.removeEventListener('gesturestart', preventDefault)
  }

  setSelection(cell: Cell | null, color: string) {
    this.selection = cell
    this.selectionColor = color
    this.requestDraw()
  }

  zoomBy(factor: number) {
    const focus = this.selectionFocus() ?? this.viewCenter()
    this.animateTo(this.clampToBoard(zoomAround(this.camera, focus, this.snapScale(this.camera.scale * factor))), focus)
  }

  showWholeBoard() {
    this.animateTo(fitCamera(this.view, this.boardSize()), this.viewCenter())
  }

  // ---- Layout -------------------------------------------------------------------------------

  private boardSize(): Size {
    return this.board.isLoaded ? { width: this.board.width, height: this.board.height } : DEFAULT_BOARD_SIZE
  }

  private viewCenter(): Point {
    return { x: this.view.width / 2, y: this.view.height / 2 }
  }

  private clampScale(scale: number): number {
    return clamp(scale, fitScale(this.view, this.boardSize()), MAX_ZOOM)
  }

  private clampToBoard(camera: Camera): Camera {
    return clampCamera(camera, this.view, this.boardSize(), fitScale(this.view, this.boardSize()), MAX_ZOOM)
  }

  /**
   * The nearest zoom at which a board pixel covers a whole number of device pixels. At anything
   * in between, neighbouring pixels come out a device pixel apart in size and the grid looks uneven.
   */
  private snapScale(scale: number): number {
    const devicePixels = Math.max(1, Math.round(scale * this.pixelRatio))
    return this.clampScale(devicePixels / this.pixelRatio)
  }

  /** Eases a free zoom (pinch, scroll wheel) onto the nearest whole-device-pixel zoom. */
  private settleScale(focus: Point) {
    const scale = this.snapScale(this.camera.scale)
    if (Math.abs(scale - this.camera.scale) < 1e-6) {
      return
    }
    this.animateTo(this.clampToBoard(zoomAround(this.camera, focus, scale)), focus, SETTLE_ANIMATION_MS)
  }

  private isShowingWholeBoard(): boolean {
    return this.camera.scale <= fitScale(this.view, this.boardSize()) + Number.EPSILON
  }

  private measure() {
    const { width, height } = this.canvas.getBoundingClientRect()
    if (width === 0 || height === 0) {
      return
    }
    // A view showing the whole board keeps doing so; otherwise whatever sat in the middle of
    // the view stays in the middle after a resize or rotation.
    const wasWholeBoard = this.framedBoard !== null && this.isShowingWholeBoard()
    const previousCenter = this.framedBoard ? screenToBoard(this.camera, this.viewCenter()) : null
    this.view = { width, height }
    this.pixelRatio = window.devicePixelRatio || 1
    this.canvas.width = Math.round(width * this.pixelRatio)
    this.canvas.height = Math.round(height * this.pixelRatio)
    if (wasWholeBoard) {
      this.camera = fitCamera(this.view, this.boardSize())
    } else if (previousCenter) {
      this.camera = this.clampToBoard(anchorAt(previousCenter, this.viewCenter(), this.camera.scale))
    }
    this.frameBoard()
    this.draw()
  }

  /** Fits the whole board in view once its size is known, and again only if that size changes. */
  private frameBoard() {
    if (this.view.width === 0) {
      return
    }
    const board = this.boardSize()
    if (this.framedBoard?.width === board.width && this.framedBoard.height === board.height) {
      return
    }
    this.camera = fitCamera(this.view, board)
    this.framedBoard = board
  }

  private setCamera(camera: Camera) {
    this.camera = this.clampToBoard(camera)
    this.requestDraw()
  }

  // ---- Pointer input ------------------------------------------------------------------------

  private localPoint(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }
    this.stopAnimation()
    try {
      this.canvas.setPointerCapture(event.pointerId)
    } catch {
      // The pointer is already gone; its move and up events will not arrive either.
    }

    const point = this.localPoint(event)
    this.pointers.set(event.pointerId, point)
    if (this.pointers.size === 1) {
      this.gesture = { kind: 'press', pointerId: event.pointerId, pointerType: event.pointerType, start: point }
    } else if (this.pointers.size === 2) {
      this.startPinch()
    }
    this.updateCursor()
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    if (!this.pointers.has(event.pointerId)) {
      return
    }
    const point = this.localPoint(event)
    this.pointers.set(event.pointerId, point)

    const gesture = this.gesture
    if (gesture.kind === 'press' && gesture.pointerId === event.pointerId) {
      if (distance(point, gesture.start) < TAP_SLOP_PX) {
        return
      }
      // Pan from the press origin so the board stays glued to the finger.
      this.gesture = { kind: 'pan', pointerId: event.pointerId, last: gesture.start }
      this.updateCursor()
    }

    const current = this.gesture
    if (current.kind === 'pan' && current.pointerId === event.pointerId) {
      this.setCamera({
        scale: this.camera.scale,
        x: this.camera.x + point.x - current.last.x,
        y: this.camera.y + point.y - current.last.y,
      })
      this.gesture = { ...current, last: point }
    } else if (current.kind === 'pinch') {
      this.updatePinch(current)
    }
  }

  private readonly handlePointerUp = (event: PointerEvent) => {
    const gesture = this.gesture
    if (!this.pointers.has(event.pointerId)) {
      return
    }
    this.releasePointer(event.pointerId)
    if (gesture.kind === 'press' && gesture.pointerId === event.pointerId) {
      this.tap(this.localPoint(event), gesture.pointerType)
    }
  }

  private readonly handlePointerCancel = (event: PointerEvent) => {
    this.releasePointer(event.pointerId)
  }

  private releasePointer(pointerId: number) {
    if (!this.pointers.delete(pointerId)) {
      return
    }
    if (this.pointers.size >= 2) {
      this.startPinch()
    } else if (this.pointers.size === 1) {
      // The finger left over from a pinch keeps panning; it can never turn into a tap.
      const [[remainingId, remainingPoint]] = this.pointers
      this.gesture = { kind: 'pan', pointerId: remainingId, last: remainingPoint }
    } else {
      this.gesture = { kind: 'idle' }
      this.settleScale(this.lastPinchFocus ?? this.viewCenter())
      this.lastPinchFocus = null
    }
    this.updateCursor()
  }

  private startPinch() {
    const [first, second] = [...this.pointers.values()]
    this.gesture = {
      kind: 'pinch',
      startDistance: Math.max(1, distance(first, second)),
      startScale: this.camera.scale,
      anchor: screenToBoard(this.camera, midpoint(first, second)),
    }
  }

  private updatePinch(gesture: PinchGesture) {
    const [first, second] = [...this.pointers.values()]
    const scale = this.clampScale((gesture.startScale * distance(first, second)) / gesture.startDistance)
    this.lastPinchFocus = midpoint(first, second)
    this.setCamera(anchorAt(gesture.anchor, this.lastPinchFocus, scale))
  }

  private tap(point: Point, pointerType: string) {
    const target = screenToBoard(this.camera, point)
    const cell = { x: Math.floor(target.x), y: Math.floor(target.y) }
    if (!this.board.contains(cell.x, cell.y)) {
      return
    }
    this.select(cell)
    const zoomThreshold = pointerType === 'touch' ? TOUCH_TAP_ZOOM_THRESHOLD : MOUSE_TAP_ZOOM_THRESHOLD
    if (this.camera.scale < zoomThreshold) {
      const zoomed = zoomAround(this.camera, point, this.snapScale(TAP_ZOOM_TARGET))
      this.animateTo(this.clampToBoard(zoomed), point)
    }
  }

  private updateCursor() {
    const isDragging = this.gesture.kind === 'pan' || this.gesture.kind === 'pinch'
    this.canvas.style.cursor = isDragging ? 'grabbing' : 'crosshair'
  }

  // ---- Wheel and keyboard -------------------------------------------------------------------

  private readonly handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    this.stopAnimation()
    const lineScale =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? WHEEL_LINE_HEIGHT_PX
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? this.view.height
          : 1
    // Trackpad pinches arrive as ctrl+wheel with small deltas.
    const speed = event.ctrlKey ? PINCH_WHEEL_ZOOM_SPEED : WHEEL_ZOOM_SPEED
    const scale = this.clampScale(this.camera.scale * Math.exp(-event.deltaY * lineScale * speed))
    const focus = this.localPoint(event)
    this.setCamera(zoomAround(this.camera, focus, scale))
    window.clearTimeout(this.wheelSettleTimer)
    this.wheelSettleTimer = window.setTimeout(() => this.settleScale(focus), WHEEL_SETTLE_DELAY_MS)
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return
    }
    const step = event.shiftKey ? KEYBOARD_FAST_STEP : 1
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const move = moves[event.key]
    if (move) {
      event.preventDefault()
      this.moveSelection(move[0], move[1])
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      this.zoomBy(ZOOM_STEP)
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      this.zoomBy(1 / ZOOM_STEP)
    } else if (event.key === '0') {
      event.preventDefault()
      this.showWholeBoard()
    }
  }

  /** Moves the selection with the keyboard, starting from the middle of the view. */
  private moveSelection(dx: number, dy: number) {
    if (!this.board.isLoaded) {
      return
    }
    // The first arrow press only selects the center cell; later presses move from there.
    const origin = this.selection ?? this.centerCell()
    const stepMultiplier = this.selection ? 1 : 0
    const cell = {
      x: clamp(origin.x + dx * stepMultiplier, 0, this.board.width - 1),
      y: clamp(origin.y + dy * stepMultiplier, 0, this.board.height - 1),
    }
    this.select(cell)
    this.revealCell(cell)
  }

  private centerCell(): Cell {
    const center = screenToBoard(this.camera, this.viewCenter())
    return {
      x: clamp(Math.floor(center.x), 0, this.board.width - 1),
      y: clamp(Math.floor(center.y), 0, this.board.height - 1),
    }
  }

  private revealCell(cell: Cell) {
    const { scale, x, y } = this.camera
    const margin = Math.max(scale * 2, REVEAL_MARGIN_PX)
    const dx = revealOffset(x + cell.x * scale, scale, this.view.width, margin)
    const dy = revealOffset(y + cell.y * scale, scale, this.view.height, margin)
    if (dx !== 0 || dy !== 0) {
      this.setCamera({ scale, x: x + dx, y: y + dy })
    }
  }

  private select(cell: Cell) {
    this.selection = cell
    this.requestDraw()
    this.options.onSelectCell(cell)
  }

  private selectionFocus(): Point | null {
    if (!this.selection) {
      return null
    }
    const { scale, x, y } = this.camera
    const focus = { x: x + (this.selection.x + 0.5) * scale, y: y + (this.selection.y + 0.5) * scale }
    const isVisible = focus.x >= 0 && focus.y >= 0 && focus.x <= this.view.width && focus.y <= this.view.height
    return isVisible ? focus : null
  }

  // ---- Animation ----------------------------------------------------------------------------

  /** Glides to `target`, zooming geometrically so the motion feels even at every zoom level. */
  private animateTo(target: Camera, focus: Point, durationMs = CAMERA_ANIMATION_MS) {
    this.stopAnimation()
    if (this.reducedMotion.matches) {
      this.setCamera(target)
      return
    }

    const from = this.camera
    const fromAnchor = screenToBoard(from, focus)
    const toAnchor = screenToBoard(target, focus)
    const startedAt = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs)
      const eased = 1 - (1 - progress) ** 3
      const scale = from.scale * (target.scale / from.scale) ** eased
      const anchor = {
        x: fromAnchor.x + (toAnchor.x - fromAnchor.x) * eased,
        y: fromAnchor.y + (toAnchor.y - fromAnchor.y) * eased,
      }
      this.camera = this.clampToBoard(anchorAt(anchor, focus, scale))
      this.draw()
      this.animationRequest = progress < 1 ? requestAnimationFrame(step) : 0
    }
    this.animationRequest = requestAnimationFrame(step)
  }

  private stopAnimation() {
    cancelAnimationFrame(this.animationRequest)
    this.animationRequest = 0
  }

  // ---- Rendering ----------------------------------------------------------------------------

  private requestDraw() {
    if (this.drawRequest) {
      return
    }
    this.drawRequest = requestAnimationFrame(() => {
      this.drawRequest = 0
      this.draw()
    })
  }

  private draw() {
    if (this.drawRequest) {
      cancelAnimationFrame(this.drawRequest)
      this.drawRequest = 0
    }
    const context = this.canvas.getContext('2d')
    if (!context || this.view.width === 0) {
      return
    }
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const image = this.board.image
    if (!image) {
      return
    }

    // Work in device pixels so edges and grid lines stay crisp on high-density screens.
    const ratio = this.pixelRatio
    const exactCellSize = this.camera.scale * ratio
    // Snapped zooms are whole device pixels; drop float noise so every cell really is the same size.
    const cellSize = Math.abs(exactCellSize - Math.round(exactCellSize)) < 1e-3 ? Math.round(exactCellSize) : exactCellSize
    const originX = Math.round(this.camera.x * ratio)
    const originY = Math.round(this.camera.y * ratio)

    context.imageSmoothingEnabled = false
    context.setTransform(cellSize, 0, 0, cellSize, originX, originY)
    context.drawImage(image, 0, 0)
    context.setTransform(1, 0, 0, 1, 0, 0)

    if (this.camera.scale >= GRID_MIN_ZOOM) {
      this.drawGrid(context, originX, originY, cellSize)
    }
    this.drawSelection(context, originX, originY, cellSize)
  }

  /** Grid lines fade in as pixels get big enough to tell apart. */
  private gridColor(): string {
    const strength = clamp((this.camera.scale - GRID_MIN_ZOOM) / (GRID_FULL_ZOOM - GRID_MIN_ZOOM), 0, 1)
    const alpha = GRID_MIN_ALPHA + (GRID_MAX_ALPHA - GRID_MIN_ALPHA) * strength
    return `rgba(0, 0, 0, ${alpha.toFixed(3)})`
  }

  private drawGrid(context: CanvasRenderingContext2D, originX: number, originY: number, cellSize: number) {
    const firstColumn = Math.max(0, Math.floor(-originX / cellSize))
    const lastColumn = Math.min(this.board.width, Math.ceil((this.canvas.width - originX) / cellSize))
    const firstRow = Math.max(0, Math.floor(-originY / cellSize))
    const lastRow = Math.min(this.board.height, Math.ceil((this.canvas.height - originY) / cellSize))
    const left = originX + firstColumn * cellSize
    const right = originX + lastColumn * cellSize
    const top = originY + firstRow * cellSize
    const bottom = originY + lastRow * cellSize

    context.beginPath()
    for (let column = firstColumn; column <= lastColumn; column++) {
      const lineX = Math.round(originX + column * cellSize) + 0.5
      context.moveTo(lineX, top)
      context.lineTo(lineX, bottom)
    }
    for (let row = firstRow; row <= lastRow; row++) {
      const lineY = Math.round(originY + row * cellSize) + 0.5
      context.moveTo(left, lineY)
      context.lineTo(right, lineY)
    }
    context.lineWidth = 1
    context.strokeStyle = this.gridColor()
    context.stroke()
  }

  private drawSelection(context: CanvasRenderingContext2D, originX: number, originY: number, cellSize: number) {
    if (!this.selection || !this.board.contains(this.selection.x, this.selection.y)) {
      return
    }
    const ratio = this.pixelRatio
    const left = originX + this.selection.x * cellSize
    const top = originY + this.selection.y * cellSize

    // Ghost preview of the chosen color, so the target reads as "not placed yet".
    context.globalAlpha = SELECTION_PREVIEW_ALPHA
    context.fillStyle = this.selectionColor
    context.fillRect(left, top, cellSize, cellSize)
    context.globalAlpha = 1

    // A black outline right against the pixel, as thick as the pixel size allows, then a hairline
    // of white outside it so the marker still reads on dark pixels.
    const outlineCss = clamp(this.camera.scale * RETICLE_OUTLINE_RATIO, RETICLE_OUTLINE_MIN_PX, RETICLE_OUTLINE_MAX_PX)
    const outline = Math.max(1, Math.round(outlineCss * ratio))
    const halo = Math.max(1, Math.round(ratio))
    context.lineJoin = 'miter'
    context.lineWidth = outline
    context.strokeStyle = RETICLE_COLOR
    context.strokeRect(left - outline / 2, top - outline / 2, cellSize + outline, cellSize + outline)
    context.lineWidth = halo
    context.strokeStyle = RETICLE_HALO_COLOR
    const haloInset = outline + halo / 2
    context.strokeRect(left - haloInset, top - haloInset, cellSize + haloInset * 2, cellSize + haloInset * 2)
  }
}
