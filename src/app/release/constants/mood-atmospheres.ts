import type { Emotion } from "@/shared/constants/emotions";

export type ConstellationStar = {
  x: number;
  y: number;
  /** A smaller star off the figure, for depth. */
  isMinor?: boolean;
  /** Drawn in the mood's second star colour. */
  isAlternate?: boolean;
};

export type MoodAtmosphere = {
  /** Soft wash over the header and counter strips of the form card. */
  tintClassName: string;
  /**
   * Pressed colours of the mood's toggle in the picker. Written under the same `aria-pressed:` and
   * `data-pressed:` variants the toggle uses for its own yellow, so they replace it rather than tie.
   */
  selectedClassName: string;
  /** Caret colour in the message box. */
  caretClassName: string;
  starClassName: string;
  alternateStarClassName?: string;
  /** Drawn in an 80 × 40 box: the outline joining the stars, then the stars on top. */
  constellation: { outline: string; stars: ConstellationStar[] };
  /** Wash laid over the night sky behind the page, faded in when the mood is picked. */
  skyBackground: string;
  /** The colour the sky's stars lean toward. */
  starTint: string;
};

/**
 * One palette per mood, chosen to sit next to the site's yellow without fighting it: pastel washes
 * for the large areas, saturated fills for the small star motif. With no mood selected none of this
 * applies and the card keeps its default look.
 */
export const MOOD_ATMOSPHERES: Record<Emotion, MoodAtmosphere> = {
  inlove: {
    tintClassName: "bg-pink-100",
    selectedClassName:
      "aria-pressed:bg-pink-200 aria-pressed:text-pink-800 data-pressed:bg-pink-200 data-pressed:text-pink-800",
    caretClassName: "caret-pink-600",
    starClassName: "fill-pink-400",
    // A heart.
    constellation: {
      outline: "M40 37 L26 26 L20 15 L28 4 L40 11 L52 4 L60 15 L54 26 Z",
      stars: [
        { x: 40, y: 37 },
        { x: 26, y: 26 },
        { x: 20, y: 15 },
        { x: 28, y: 4 },
        { x: 40, y: 11 },
        { x: 52, y: 4 },
        { x: 60, y: 15 },
        { x: 54, y: 26 },
        { x: 9, y: 31, isMinor: true },
        { x: 71, y: 8, isMinor: true },
      ],
    },
    // Warm pink rising from the lower left.
    skyBackground: [
      "radial-gradient(80% 60% at 18% 100%, rgba(255, 92, 157, 0.55), transparent 70%)",
      "radial-gradient(60% 45% at 90% 12%, rgba(255, 150, 190, 0.22), transparent 70%)",
      "linear-gradient(180deg, rgba(70, 8, 52, 0.62) 0%, rgba(140, 30, 90, 0.4) 100%)",
    ].join(", "),
    starTint: "#ffc2da",
  },
  sad: {
    tintClassName: "bg-blue-100",
    selectedClassName:
      "aria-pressed:bg-blue-200 aria-pressed:text-blue-800 data-pressed:bg-blue-200 data-pressed:text-blue-800",
    caretClassName: "caret-blue-600",
    starClassName: "fill-blue-400",
    // A teardrop, with a little rain beside it.
    constellation: {
      outline: "M40 3 L33 15 L31 27 L40 37 L49 27 L47 15 Z",
      stars: [
        { x: 40, y: 3 },
        { x: 33, y: 15 },
        { x: 31, y: 27 },
        { x: 40, y: 37 },
        { x: 49, y: 27 },
        { x: 47, y: 15 },
        { x: 14, y: 10, isMinor: true },
        { x: 18, y: 25, isMinor: true },
        { x: 66, y: 18, isMinor: true },
      ],
    },
    // Cool blue, deepest at the top.
    skyBackground: [
      "radial-gradient(85% 60% at 75% 100%, rgba(61, 123, 255, 0.5), transparent 70%)",
      "radial-gradient(60% 45% at 10% 8%, rgba(80, 160, 255, 0.2), transparent 70%)",
      "linear-gradient(180deg, rgba(2, 20, 70, 0.6) 0%, rgba(10, 50, 130, 0.45) 100%)",
    ].join(", "),
    starTint: "#b8d0ff",
  },
  angry: {
    tintClassName: "bg-red-100",
    selectedClassName:
      "aria-pressed:bg-red-200 aria-pressed:text-red-800 data-pressed:bg-red-200 data-pressed:text-red-800",
    caretClassName: "caret-red-600",
    starClassName: "fill-red-500",
    // A lightning strike.
    constellation: {
      outline: "M50 2 L33 19 L47 21 L30 38",
      stars: [
        { x: 50, y: 2 },
        { x: 33, y: 19 },
        { x: 47, y: 21 },
        { x: 30, y: 38 },
        { x: 16, y: 28, isMinor: true },
        { x: 66, y: 10, isMinor: true },
        { x: 62, y: 31, isMinor: true },
      ],
    },
    // Red-orange heat along the horizon.
    skyBackground: [
      "radial-gradient(85% 60% at 50% 105%, rgba(255, 90, 31, 0.6), transparent 70%)",
      "radial-gradient(50% 40% at 85% 0%, rgba(220, 40, 30, 0.3), transparent 70%)",
      "linear-gradient(180deg, rgba(60, 4, 10, 0.6) 0%, rgba(140, 30, 10, 0.45) 100%)",
    ].join(", "),
    starTint: "#ffc09a",
  },
  other: {
    tintClassName: "bg-violet-100",
    selectedClassName:
      "aria-pressed:bg-violet-200 aria-pressed:text-violet-800 data-pressed:bg-violet-200 data-pressed:text-violet-800",
    caretClassName: "caret-violet-600",
    starClassName: "fill-violet-400",
    alternateStarClassName: "fill-main",
    // Ups and downs, in two colours.
    constellation: {
      outline: "M8 28 L21 10 L34 27 L47 9 L60 26 L73 11",
      stars: [
        { x: 8, y: 28 },
        { x: 21, y: 10, isAlternate: true },
        { x: 34, y: 27 },
        { x: 47, y: 9, isAlternate: true },
        { x: 60, y: 26 },
        { x: 73, y: 11, isAlternate: true },
      ],
    },
    // The other moods at once: pink, orange, and blue in different corners.
    skyBackground: [
      "radial-gradient(60% 50% at 8% 95%, rgba(255, 92, 157, 0.45), transparent 70%)",
      "radial-gradient(60% 50% at 92% 92%, rgba(255, 120, 40, 0.4), transparent 70%)",
      "radial-gradient(70% 50% at 70% 0%, rgba(61, 123, 255, 0.38), transparent 70%)",
      "linear-gradient(180deg, rgba(30, 10, 60, 0.5) 0%, rgba(60, 20, 80, 0.35) 100%)",
    ].join(", "),
    starTint: "#e8d6ff",
  },
};
