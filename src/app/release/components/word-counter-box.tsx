"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type BaseSyntheticEvent } from "react";
import { flushSync } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { animate, AnimatePresence, MotionConfig, motion, type AnimationPlaybackControls } from "motion/react";
import { useForm, useWatch } from "react-hook-form";

import { CreateEntryInput, createEntrySchema } from "@/app/entries/schema/entry.schema";
import type { CreateEntryDTO } from "@/app/entries/types/entry.types";
import type { ApiResponse } from "@/shared/types/api.types";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import { DEFAULT_ENTRY_VALUES, RELEASE_HOLD_MS } from "../constants/release.constants";
import { useReleaseDraft } from "../hooks/use-release-draft";
import { useTimedRelease } from "../hooks/use-timed-release";
import { prefersFinePointer } from "../lib/input-device";
import {
  getReleaseSkyState,
  resetReleaseStar,
  subscribeToReleaseSky,
  updateReleaseSky,
} from "../lib/release-sky-store";
import { pickSettlePoint } from "../lib/settle-point";
import ReleaseCountdown from "./release-countdown";
import ReleaseForm from "./release-form";
import ReleaseSuccess from "./release-success";

type ReleasedEntry = {
  entryId: string | null;
  revealDelay: number;
};

// The registry Card as it ships (2px border, black hard shadow); these only fit it to the slot.
const CARD_CLASS_NAME = "relative min-h-0 w-full grow gap-0 overflow-hidden py-0";
const CROSSFADE_SECONDS = 0.3;
const SUCCESS_FADE_SECONDS = 0.45;
/** Lets the star clear the card's spot before "It's out there" fades in there. */
const SUCCESS_REVEAL_DELAY_SECONDS = 0.8;
const HOLD_SECONDS = RELEASE_HOLD_MS / 1000;
/** The countdown fades in once the card has mostly folded away. */
const COUNTDOWN_AFTER_FOLD_SECONDS = 0.4;
/** The card folds inward, spinning a quarter turn onto its corner, down to a point of light. */
const FOLDED = { scale: 0.04, rotate: 45 };
const UNFOLDED = { scale: 1, rotate: 0 };

function readEntryId(response: ApiResponse<CreateEntryDTO> | undefined): string | null {
  const id = response?.data?._id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function readIsSceneReady(): boolean {
  return getReleaseSkyState().isSceneReady;
}

function readIsSceneReadyOnServer(): boolean {
  return false;
}

/** Stable, so React doesn't re-pin the star on every render. */
function pinStarTo(element: HTMLDivElement | null) {
  updateReleaseSky({ starAnchor: element });
}

export default function WordCounterBox() {
  const [releasedEntry, setReleasedEntry] = useState<ReleasedEntry | null>(null);
  const [hasReleaseError, setHasReleaseError] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  /** Whether the sky's 3D star carries the current release. Fixed when the release begins. */
  const [isStarInSky, setIsStarInSky] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion() === true;
  const isSceneReady = useSyncExternalStore(subscribeToReleaseSky, readIsSceneReady, readIsSceneReadyOnServer);

  const slotRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const foldRef = useRef<AnimationPlaybackControls | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<CreateEntryInput>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: DEFAULT_ENTRY_VALUES,
  });
  const { clearDraft } = useReleaseDraft(form);
  const emotion = useWatch({ control: form.control, name: "emotion" });
  const release = useTimedRelease({ clearDraft, onReleased: showReleased, onFailed: restoreAfterFailure });
  const isHolding = release.status.kind !== "idle";

  useEffect(() => {
    updateReleaseSky({ emotion });
  }, [emotion]);

  // The store outlives the page; leave the sky neutral and starless for the next visit.
  useEffect(() => {
    return () => {
      updateReleaseSky({ emotion: undefined });
      resetReleaseStar();
    };
  }, []);

  // Runs after the draft is restored. Touch devices skip it so the keyboard doesn't cover the page.
  useEffect(() => {
    if (prefersFinePointer()) textareaRef.current?.focus({ preventScroll: true });
  }, []);

  function focusComposer() {
    const target = prefersFinePointer() ? textareaRef.current : composerHeadingRef.current;
    target?.focus({ preventScroll: true });
  }

  /** The card collapses into a point where the star forms. Without the sky's star it just fades. */
  function foldComposer(intoStar: boolean) {
    const composer = composerRef.current;
    const flash = flashRef.current;
    if (!composer || !flash) return;

    foldRef.current?.stop();
    foldRef.current = intoStar
      ? animate([
          [flash, { opacity: 1 }, { duration: 0.16, ease: "easeOut" }],
          [composer, FOLDED, { duration: 0.48, ease: [0.7, 0, 0.84, 0], at: 0.06 }],
          [composer, { opacity: 0 }, { duration: 0.12, at: 0.42 }],
        ])
      : animate(composer, { opacity: 0 }, { duration: CROSSFADE_SECONDS });
  }

  function unfoldComposer(fromStar: boolean) {
    const composer = composerRef.current;
    const flash = flashRef.current;
    if (!composer || !flash) return;

    foldRef.current?.stop();
    foldRef.current = fromStar
      ? animate([
          [composer, { opacity: 1 }, { duration: 0.1 }],
          [composer, UNFOLDED, { duration: 0.5, ease: [0.16, 1, 0.3, 1], at: 0 }],
          [flash, { opacity: 0 }, { duration: 0.3, at: 0.25 }],
        ])
      : animate(composer, { opacity: 1 }, { duration: CROSSFADE_SECONDS });
  }

  /** The countdown sits in the card's place; on a scrolled phone that place may be off screen. */
  function bringSlotIntoView() {
    const slot = slotRef.current;
    if (!slot) return;

    const { top, bottom } = slot.getBoundingClientRect();
    const center = (top + bottom) / 2;
    if (center > 0 && center < window.innerHeight) return;
    slot.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "center" });
  }

  function beginRelease(values: CreateEntryInput) {
    const intoStar = isSceneReady && !shouldReduceMotion;
    if (!release.begin(values)) return;

    setHasReleaseError(false);
    setIsStarInSky(intoStar);
    setAnnouncement(`Releasing in ${HOLD_SECONDS} seconds. Choose Undo to keep editing.`);
    if (intoStar) updateReleaseSky({ starPhase: "holding" });
    foldComposer(intoStar);
    bringSlotIntoView();
  }

  /** Validates first; only a message that would be accepted starts the countdown. */
  function submitRelease(event?: BaseSyntheticEvent) {
    return form.handleSubmit(beginRelease)(event);
  }

  /** Undo and a failed send both bring the card back exactly as it was. */
  function returnToComposer() {
    if (isStarInSky) updateReleaseSky({ starPhase: "returning" });
    unfoldComposer(isStarInSky);
    focusComposer();
  }

  function undoRelease() {
    let didUndo = false;
    // Flushed so the composer is no longer inert when it takes focus back.
    flushSync(() => {
      didUndo = release.undo();
      if (didUndo) setAnnouncement("Release undone. Your message is back.");
    });
    if (didUndo) returnToComposer();
  }

  function restoreAfterFailure() {
    flushSync(() => {
      setAnnouncement("");
      setHasReleaseError(true);
    });
    returnToComposer();
  }

  function showReleased(response: ApiResponse<CreateEntryDTO>) {
    // Picked while the card's spot is still empty: the success message is about to fill it.
    const slot = slotRef.current;
    if (slot) updateReleaseSky({ starSettleAt: pickSettlePoint(slot.getBoundingClientRect()) });

    if (isStarInSky) {
      updateReleaseSky({ starPhase: "rising" });
    } else {
      updateReleaseSky({ instantSettleCount: getReleaseSkyState().instantSettleCount + 1 });
    }

    flushSync(() => {
      setAnnouncement("");
      setReleasedEntry({
        entryId: readEntryId(response),
        revealDelay: isStarInSky ? SUCCESS_REVEAL_DELAY_SECONDS : 0,
      });
    });
    successHeadingRef.current?.focus({ preventScroll: true });
  }

  function writeAnother() {
    clearDraft();
    // The last star may still be rising; it settles on its own.
    form.reset(DEFAULT_ENTRY_VALUES);
    flushSync(() => {
      setHasReleaseError(false);
      setReleasedEntry(null);
    });
    focusComposer();
  }

  return (
    <MotionConfig reducedMotion="user">
      <Form {...form}>
        <div ref={slotRef} className="release-slot relative flex w-full flex-col">
          <AnimatePresence mode="popLayout" initial={false}>
            {releasedEntry ? (
              <motion.div
                key="released"
                className="w-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, pointerEvents: "none", transition: { duration: CROSSFADE_SECONDS } }}
                transition={{ duration: SUCCESS_FADE_SECONDS, ease: "easeOut", delay: releasedEntry.revealDelay }}
              >
                <Card className={CARD_CLASS_NAME}>
                  <ReleaseSuccess
                    entryId={releasedEntry.entryId}
                    headingRef={successHeadingRef}
                    revealDelay={releasedEntry.revealDelay}
                    onWriteAnother={writeAnother}
                  />
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="compose"
                className="flex min-h-0 w-full grow flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, pointerEvents: "none", transition: { duration: CROSSFADE_SECONDS } }}
                transition={{ duration: CROSSFADE_SECONDS }}
              >
                <div ref={composerRef} inert={isHolding} className="flex min-h-0 grow flex-col">
                  <Card className={CARD_CLASS_NAME}>
                    <span ref={flashRef} aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-main opacity-0" />
                    <ReleaseForm
                      onRelease={submitRelease}
                      isReleasing={isHolding}
                      hasReleaseError={hasReleaseError}
                      textareaRef={textareaRef}
                      headingRef={composerHeadingRef}
                    />
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {release.status.kind !== "idle" && (
              <ReleaseCountdown
                key="countdown"
                endsAt={release.status.kind === "holding" ? release.status.endsAt : null}
                showStarGlyph={!isStarInSky}
                appearDelay={isStarInSky ? COUNTDOWN_AFTER_FOLD_SECONDS : 0}
                shouldReduceMotion={shouldReduceMotion}
                onUndo={undoRelease}
                anchorRef={pinStarTo}
              />
            )}
          </AnimatePresence>

          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </div>
      </Form>
    </MotionConfig>
  );
}
