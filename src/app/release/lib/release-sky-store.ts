import type { Emotion } from "@/shared/constants/emotions";

/**
 * What the release star in the sky is doing. The composer drives it; the 3D scene only reads it.
 * - holding: forms where the card was and hovers over `anchor` during the countdown.
 * - sending: still hovering, pulsing while the request is in flight.
 * - rising: flies up into the sky and stays there as a settled star.
 * - returning: shrinks back into the card (Undo, or a failed send).
 */
export type StarPhase = "hidden" | "holding" | "sending" | "rising" | "returning";

export type ReleaseSkyState = {
  emotion: Emotion | undefined;
  starPhase: StarPhase;
  /** The element the hovering star is pinned to on screen. */
  starAnchor: HTMLElement | null;
  /** Where, in viewport pixels, a released star comes to rest: a patch of open sky. */
  starSettleAt: { x: number; y: number } | null;
  /** Bumped when a release succeeded without the flight, so the sky adds its star in place. */
  instantSettleCount: number;
  /** True once the 3D scene has drawn its first frame. */
  isSceneReady: boolean;
};

const INITIAL_STATE: ReleaseSkyState = {
  emotion: undefined,
  starPhase: "hidden",
  starAnchor: null,
  starSettleAt: null,
  instantSettleCount: 0,
  isSceneReady: false,
};

// A tiny external store shared by the composer (DOM) and the lazily loaded scene, so neither has to
// re-render the other: the scene reads it inside its frame loop.
const listeners = new Set<() => void>();
let state: ReleaseSkyState = INITIAL_STATE;

export function getReleaseSkyState(): ReleaseSkyState {
  return state;
}

export function getServerReleaseSkyState(): ReleaseSkyState {
  return INITIAL_STATE;
}

export function updateReleaseSky(patch: Partial<ReleaseSkyState>): void {
  const next = { ...state, ...patch };
  const hasChanged = (Object.keys(patch) as Array<keyof ReleaseSkyState>).some((key) => next[key] !== state[key]);
  if (!hasChanged) return;

  state = next;
  listeners.forEach((listener) => listener());
}

/** Clears the star choreography. The scene's readiness survives, since the canvas may stay mounted. */
export function resetReleaseStar(): void {
  updateReleaseSky({ starPhase: "hidden", starAnchor: null });
}

export function subscribeToReleaseSky(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
