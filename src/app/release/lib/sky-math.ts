/**
 * Shared geometry for the night sky. Stars are stored in "sky coordinates": `u` and `v` run from -1
 * to 1 across the screen (like NDC, with some overscan) and `depth` is the distance from the camera.
 * Turning them into world space at draw time fills any aspect ratio without regenerating stars.
 */

export const SKY_FOV_DEGREES = 60;
export const TAN_HALF_FOV = Math.tan(((SKY_FOV_DEGREES / 2) * Math.PI) / 180);

/** Stars are scattered this far past the screen edge, so parallax and drift never reveal a gap. */
export const SKY_OVERSCAN = 1.3;

/** Sideways drift, in sky units per second, for a star 10 units away. Nearer stars move faster. */
export const SKY_DRIFT_SPEED = 0.006;
const DRIFT_REFERENCE_DEPTH = 10;

export type SkyPoint = { u: number; v: number; depth: number };

/** Wraps `u` back into the overscanned band, matching the vertex shader. */
function wrapU(u: number): number {
  const span = SKY_OVERSCAN * 2;
  return ((((u + SKY_OVERSCAN) % span) + span) % span) - SKY_OVERSCAN;
}

export function driftedU(point: SkyPoint, timeSeconds: number): number {
  return wrapU(point.u + (timeSeconds * SKY_DRIFT_SPEED * DRIFT_REFERENCE_DEPTH) / point.depth);
}

/** World position of a sky point at `timeSeconds`, written into `out` as [x, y, z]. */
export function skyToWorld(point: SkyPoint, timeSeconds: number, aspect: number, out: [number, number, number]) {
  const u = driftedU(point, timeSeconds);
  out[0] = u * point.depth * TAN_HALF_FOV * aspect;
  out[1] = point.v * point.depth * TAN_HALF_FOV;
  out[2] = -point.depth;
}

/** World units covered by one CSS pixel at `depth`, for a viewport `viewportHeight` pixels tall. */
export function worldUnitsPerPixel(depth: number, viewportHeight: number): number {
  return (2 * depth * TAN_HALF_FOV) / viewportHeight;
}

/** Deterministic PRNG (mulberry32), so the sky looks the same on every visit. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Frame-rate independent approach toward `target`; higher `rate` settles faster. */
export function damp(current: number, target: number, rate: number, deltaSeconds: number): number {
  return lerp(current, target, 1 - Math.exp(-rate * deltaSeconds));
}

export const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
export const easeInCubic = (t: number) => t ** 3;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export function easeOutBack(t: number): number {
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2;
}
