export const ORBIT_RADIUS = 26;
/** How far the message travels upward while it shrinks into a star. */
const RISE_DISTANCE = 220;
const SIDEWAYS_DRIFT = 18;
/** Keeps the orbit below the fixed site header. */
const SKY_TOP = 112;

export type LaunchPlan = {
  message: string;
  scrollTop: number;
  /** Where the flying copy of the message starts, in viewport coordinates. */
  box: { left: number; top: number; width: number; height: number };
  driftX: number;
  rise: number;
  /** The star joins this circle at its lowest point and orbits it once. */
  orbitCenter: { x: number; y: number };
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Measures the message box so the flight starts exactly where the text sits on screen. */
export function planLaunch(textarea: HTMLTextAreaElement): LaunchPlan {
  const rect = textarea.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const centerY = rect.top + rect.height / 2;
  // On phones the Release button sits far below the message, which may be scrolled out of view.
  // Start the flight inside the viewport so it can still be seen.
  const startY = clamp(centerY, viewportHeight * 0.3, viewportHeight * 0.75);
  const highestArrivalY = SKY_TOP + ORBIT_RADIUS * 2;
  const arrivalY = Math.min(startY, Math.max(startY - RISE_DISTANCE, highestArrivalY));

  return {
    message: textarea.value,
    scrollTop: textarea.scrollTop,
    box: { left: rect.left, top: rect.top + (startY - centerY), width: rect.width, height: rect.height },
    driftX: SIDEWAYS_DRIFT,
    rise: startY - arrivalY,
    orbitCenter: { x: rect.left + rect.width / 2 + SIDEWAYS_DRIFT, y: arrivalY - ORBIT_RADIUS },
  };
}
