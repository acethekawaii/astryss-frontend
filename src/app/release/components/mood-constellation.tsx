"use client";

import { AnimatePresence, motion } from "motion/react";

import type { Emotion } from "@/shared/constants/emotions";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/vendor/lib/utils";

import { MOOD_ATMOSPHERES } from "../constants/mood-atmospheres";
import { sparklePath } from "../lib/sparkle-path";

const MAJOR_STAR_PATH = sparklePath(3.6);
const MINOR_STAR_PATH = sparklePath(2.4);

/** A small constellation for the selected mood, tucked into the header's top-right corner. */
export default function MoodConstellation({ emotion }: { emotion?: Emotion }) {
  return (
    <div aria-hidden className="pointer-events-none absolute top-2 right-4 h-10 w-20">
      <AnimatePresence initial={false}>
        {emotion && <Constellation key={emotion} emotion={emotion} />}
      </AnimatePresence>
    </div>
  );
}

function Constellation({ emotion }: { emotion: Emotion }) {
  const shouldReduceMotion = usePrefersReducedMotion() === true;
  const { constellation, starClassName, alternateStarClassName } = MOOD_ATMOSPHERES[emotion];

  return (
    <motion.svg
      viewBox="0 0 80 40"
      className="absolute inset-0 size-full overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.path
        d={constellation.outline}
        fill="none"
        className="stroke-foreground/70"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={shouldReduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      {constellation.stars.map((star, index) => (
        <g key={`${star.x}-${star.y}`} transform={`translate(${star.x} ${star.y})`}>
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 + index * 0.07, type: "spring", stiffness: 420, damping: 18 }}
          >
            <motion.path
              d={star.isMinor ? MINOR_STAR_PATH : MAJOR_STAR_PATH}
              className={cn(
                "stroke-foreground",
                star.isAlternate && alternateStarClassName ? alternateStarClassName : starClassName,
              )}
              strokeWidth={0.8}
              strokeLinejoin="round"
              animate={shouldReduceMotion ? undefined : { opacity: [1, 0.45, 1] }}
              transition={
                shouldReduceMotion
                  ? undefined
                  : { duration: 2.4 + (index % 3) * 0.6, delay: 1 + index * 0.35, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </motion.g>
        </g>
      ))}
    </motion.svg>
  );
}
