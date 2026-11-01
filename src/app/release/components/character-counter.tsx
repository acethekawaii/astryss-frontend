"use client";

import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/vendor/lib/utils";

import { CONTENT_LIMIT, COUNTER_VISIBLE_FROM } from "../constants/release.constants";

/** Hidden while there's plenty of room; appears near the limit and turns red once it's reached. */
export default function CharacterCounter({ count }: { count: number }) {
  const isVisible = count >= COUNTER_VISIBLE_FROM;
  const isAtLimit = count >= CONTENT_LIMIT;

  return (
    // The live region stays mounted so screen readers notice when the counter appears.
    <span aria-live="polite" className="ml-auto tabular-nums">
      <AnimatePresence initial={false}>
        {isVisible && (
          <motion.span
            key="character-count"
            className={cn("inline-block text-foreground/60", isAtLimit && "font-bold text-red-600")}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {count}/{CONTENT_LIMIT}
            <span className="sr-only"> characters</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
