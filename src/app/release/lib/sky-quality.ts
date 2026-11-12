export type StarLayerName = "far" | "mid" | "near";

export type SkyQuality = {
  isLite: boolean;
  maxPixelRatio: number;
  starCounts: Record<StarLayerName, number>;
};

const FULL_QUALITY: SkyQuality = {
  isLite: false,
  maxPixelRatio: 1.5,
  starCounts: { far: 1800, mid: 700, near: 140 },
};

/** Small screens and modest hardware: fewer stars, fewer pixels, and a calmer frame rate when idle. */
const LITE_QUALITY: SkyQuality = {
  isLite: true,
  maxPixelRatio: 1.25,
  starCounts: { far: 650, mid: 280, near: 60 },
};

const SMALL_SCREEN_PX = 768;
const MODEST_CORE_COUNT = 4;
const MODEST_MEMORY_GB = 4;

/** Client only: reads the screen and hardware hints. */
export function readSkyQuality(): SkyQuality {
  const { hardwareConcurrency } = navigator;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const isSmallScreen = Math.min(window.screen.width, window.screen.height) < SMALL_SCREEN_PX;
  const isModestHardware =
    (hardwareConcurrency !== undefined && hardwareConcurrency <= MODEST_CORE_COUNT) ||
    (deviceMemory !== undefined && deviceMemory <= MODEST_MEMORY_GB);

  return isSmallScreen || isModestHardware ? LITE_QUALITY : FULL_QUALITY;
}
