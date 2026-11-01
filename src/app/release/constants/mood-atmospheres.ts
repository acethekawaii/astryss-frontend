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
  /** Selected state of the mood's button in the picker. */
  selectedClassName: string;
  /** Caret colour in the message box. */
  caretClassName: string;
  starClassName: string;
  alternateStarClassName?: string;
  /** Drawn in an 80 × 40 box: the outline joining the stars, then the stars on top. */
  constellation: { outline: string; stars: ConstellationStar[] };
};

/**
 * One palette per mood, chosen to sit next to the site's yellow without fighting it: pastel washes
 * for the large areas, saturated fills for the small star motif. With no mood selected none of this
 * applies and the card keeps its default look.
 */
export const MOOD_ATMOSPHERES: Record<Emotion, MoodAtmosphere> = {
  inlove: {
    tintClassName: "bg-pink-100",
    selectedClassName: "bg-pink-200 text-pink-800",
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
  },
  sad: {
    tintClassName: "bg-blue-100",
    selectedClassName: "bg-blue-200 text-blue-800",
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
  },
  angry: {
    tintClassName: "bg-red-100",
    selectedClassName: "bg-red-200 text-red-800",
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
  },
  other: {
    tintClassName: "bg-violet-100",
    selectedClassName: "bg-violet-200 text-violet-800",
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
  },
};
