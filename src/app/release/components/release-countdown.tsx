"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import { motion } from "motion/react";
import { Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { RELEASE_HOLD_MS } from "../constants/release.constants";
import { sparklePath } from "../lib/sparkle-path";

const HOLD_SECONDS = RELEASE_HOLD_MS / 1000;
const TICK_MS = 200;
const RING_RADIUS = 64;
const GLYPH_PATH = sparklePath(22);

type Props = {
  /** When the send starts, on the `performance.now()` clock. Null once it has started. */
  endsAt: number | null;
  /** Draws a flat star in the ring, for when the sky's 3D star isn't carrying this release. */
  showStarGlyph: boolean;
  /** Seconds to wait before fading in, so the card can finish folding first. */
  appearDelay: number;
  shouldReduceMotion: boolean;
  onUndo: () => void;
  /** The ring's centre is where the sky pins the hovering star. */
  anchorRef: Ref<HTMLDivElement>;
};

/**
 * Shown in the card's place while a release waits: a ring that empties over the countdown, the
 * seconds left, and Undo. Once the send starts, Undo goes and the ring holds while it lands.
 */
export default function ReleaseCountdown({ endsAt, showStarGlyph, appearDelay, shouldReduceMotion, onUndo, anchorRef }: Props) {
  const isSending = endsAt === null;
  const secondsLeft = useSecondsLeft(endsAt);
  const statusId = useId();
  const undoButtonRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Keyboard and screen reader users land on Undo; once it's gone, on the status that replaced it.
    (isSending ? statusRef.current : undoButtonRef.current)?.focus({ preventScroll: true });
  }, [isSending]);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, delay: appearDelay } }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="relative">
        <div ref={anchorRef} className="relative size-36">
          {showStarGlyph && <StarGlyph />}
          <svg viewBox="0 0 144 144" aria-hidden className="absolute inset-0 size-full -rotate-90 overflow-visible">
            <circle cx={72} cy={72} r={RING_RADIUS} fill="none" strokeWidth={2} className="stroke-white/20" />
            <motion.circle
              cx={72}
              cy={72}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={4}
              className="stroke-main"
              initial={{ pathLength: 1 }}
              animate={{ pathLength: isSending ? 0 : shouldReduceMotion ? secondsLeft / HOLD_SECONDS : 0 }}
              transition={
                shouldReduceMotion || isSending
                  ? { duration: 0 }
                  : { duration: HOLD_SECONDS, ease: "linear" }
              }
            />
          </svg>
        </div>

        <div className="absolute top-full left-1/2 mt-4 flex w-64 -translate-x-1/2 flex-col items-center gap-3 text-center">
          <p
            ref={statusRef}
            id={statusId}
            tabIndex={-1}
            className="text-sm text-white outline-none"
          >
            {isSending ? (
              "Releasing..."
            ) : (
              <>
                Releasing in <span className="font-bold tabular-nums">{secondsLeft}</span>
              </>
            )}
          </p>
          {!isSending && (
            <Button ref={undoButtonRef} type="button" onClick={onUndo} aria-describedby={statusId} className="cursor-pointer">
              <Undo2 aria-hidden />
              Undo
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** Whole seconds until `endsAt`, counting down from the full hold. */
function useSecondsLeft(endsAt: number | null): number {
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);

  useEffect(() => {
    if (endsAt === null) return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft(Math.max(1, Math.ceil((endsAt - performance.now()) / 1000)));
    }, TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [endsAt]);

  return secondsLeft;
}

/** A flat, still star for when the sky can't carry the release (not loaded yet, or reduced motion). */
function StarGlyph() {
  return (
    <div aria-hidden className="absolute inset-0 flex items-center justify-center">
      <div className="absolute size-24 rounded-full bg-[radial-gradient(circle,rgba(250,204,0,0.5)_0%,rgba(250,204,0,0)_70%)]" />
      <svg viewBox="-24 -24 48 48" className="relative size-12 overflow-visible">
        <path d={GLYPH_PATH} className="fill-main stroke-foreground" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
