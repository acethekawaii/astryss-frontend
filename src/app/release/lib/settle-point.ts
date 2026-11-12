/** Elements that are just transparent page structure: the sky shows through wherever they are on top. */
const OPEN_SKY_SELECTOR = "html, body, main, header, .release-stage, .release-hero";
const EDGE_MARGIN_PX = 24;
const ATTEMPTS = 40;
/** The star's glow needs a little clear space around its centre, not just a single pixel. */
const CLEARANCE_PX = 12;
const CLEARANCE_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [CLEARANCE_PX, 0],
  [-CLEARANCE_PX, 0],
  [0, CLEARANCE_PX],
  [0, -CLEARANCE_PX],
];

function isOpenSky(x: number, y: number): boolean {
  return CLEARANCE_OFFSETS.every(([dx, dy]) => {
    const element = document.elementFromPoint(x + dx, y + dy);
    return !element || element.matches(OPEN_SKY_SELECTOR);
  });
}

/**
 * Picks where a released star comes to rest: a patch of open sky above the card's spot, near it
 * sideways so the flight reads as rising. The success message is about to fill that spot, so
 * anything below the card's top edge would hide the star.
 */
export function pickSettlePoint(slot: DOMRect, random: () => number = Math.random): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const bandBottom = slot.top - EDGE_MARGIN_PX;
  const centerX = slot.left + slot.width / 2;
  const spreadX = Math.max(slot.width * 0.65, 160);
  const clampX = (x: number) => Math.min(Math.max(x, EDGE_MARGIN_PX), viewportWidth - EDGE_MARGIN_PX);

  if (bandBottom > EDGE_MARGIN_PX) {
    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
      const x = clampX(centerX + (random() * 2 - 1) * spreadX);
      const y = EDGE_MARGIN_PX + random() * (bandBottom - EDGE_MARGIN_PX);
      if (isOpenSky(x, y)) return { x, y };
    }
  }

  return { x: clampX(centerX), y: Math.max(EDGE_MARGIN_PX, bandBottom / 2) };
}
