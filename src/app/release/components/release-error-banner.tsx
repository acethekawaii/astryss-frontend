"use client";

import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { Button } from "@/components/ui/button";

type Props = {
  isVisible: boolean;
  onRetry: () => void;
};

/** Shown in the card when a send fails. Deliberately says nothing about why. */
export default function ReleaseErrorBanner({ isVisible, onRetry }: Props) {
  const shouldReduceMotion = usePrefersReducedMotion() === true;

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key="release-error"
          className="overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={
            shouldReduceMotion
              ? { height: { duration: 0 }, opacity: { duration: 0.2 } }
              : { duration: 0.25, ease: "easeOut" }
          }
        >
          <div
            role="alert"
            className="flex flex-col gap-3 border-t-2 bg-chart-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-center gap-2 text-sm font-bold">
              <TriangleAlert aria-hidden className="size-4 shrink-0" />
              The stars didn&apos;t catch that. Try again.
            </p>
            <Button
              type="button"
              size="sm"
              variant="neutral"
              onClick={onRetry}
              className="cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw aria-hidden />
              Retry
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
