"use client";

import { AnimatePresence, motion } from "motion/react";

import type { Emotion } from "@/shared/constants/emotions";
import { cn } from "@/vendor/lib/utils";

import { MOOD_ATMOSPHERES } from "../constants/mood-atmospheres";

/**
 * A soft wash of the mood's colour behind a strip of the form card. The parent needs
 * `relative isolate` so the wash sits above its background and below its content.
 */
export default function MoodTint({ emotion }: { emotion?: Emotion }) {
  return (
    <AnimatePresence initial={false}>
      {emotion && (
        <motion.span
          key={emotion}
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 -z-10", MOOD_ATMOSPHERES[emotion].tintClassName)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}
