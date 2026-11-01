"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { animate, AnimatePresence, MotionConfig, motion, type AnimationPlaybackControls } from "motion/react";
import { useForm } from "react-hook-form";

import { CreateEntryInput, createEntrySchema } from "@/app/entries/schema/entry.schema";
import { useCreateEntry } from "@/app/entries/hooks/use-entries";
import type { CreateEntryDTO } from "@/app/entries/types/entry.types";
import type { ApiResponse } from "@/shared/types/api.types";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { Card } from "@/vendor/ui/card";
import { Form } from "@/vendor/ui/form";

import { DEFAULT_ENTRY_VALUES } from "../constants/release.constants";
import { useReleaseDraft } from "../hooks/use-release-draft";
import { prefersFinePointer } from "../lib/input-device";
import { planLaunch, type LaunchPlan } from "../lib/release-launch";
import ReleaseForm from "./release-form";
import ReleaseLaunch from "./release-launch";
import ReleaseSuccess from "./release-success";

type ReleasedEntry = {
  entryId: string | null;
  revealDelay: number;
};

const PANEL_FADE_SECONDS = 0.3;
const SUCCESS_FADE_SECONDS = 0.45;
/** Lets the message reach the sky before "It's out there" fades in beneath the star. */
const SUCCESS_REVEAL_DELAY_SECONDS = 0.55;
const CARD_RESIZE_SECONDS = 0.5;
/** Matches the card's scroll margin, which keeps it clear of the fixed site header. */
const HEADER_CLEARANCE_PX = 112;

function readEntryId(response: ApiResponse<CreateEntryDTO> | undefined): string | null {
  const id = response?.data?._id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export default function WordCounterBox() {
  const [releasedEntry, setReleasedEntry] = useState<ReleasedEntry | null>(null);
  const [launchPlan, setLaunchPlan] = useState<LaunchPlan | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion() === true;
  const createEntryMutation = useCreateEntry();

  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const cardResizeRef = useRef<AnimationPlaybackControls | null>(null);
  // State updates land a render late; this blocks a second send from a fast double press.
  const isReleasingRef = useRef(false);

  const form = useForm<CreateEntryInput>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: DEFAULT_ENTRY_VALUES,
  });
  const { clearDraft } = useReleaseDraft(form);

  // Runs after the draft is restored. Touch devices skip it so the keyboard doesn't cover the page.
  useEffect(() => {
    if (prefersFinePointer()) textareaRef.current?.focus({ preventScroll: true });
  }, []);

  const finishLaunch = useCallback(() => setLaunchPlan(null), []);

  /** Swaps what the card shows, then eases its height from the old content to the new. */
  function swapCardContent(applySwap: () => void): Promise<void> {
    const card = cardRef.current;
    const fromHeight = card?.getBoundingClientRect().height ?? 0;
    flushSync(applySwap);
    if (!card) return Promise.resolve();

    cardResizeRef.current?.stop();
    card.style.height = "";
    const toHeight = card.getBoundingClientRect().height;
    if (shouldReduceMotion || Math.abs(toHeight - fromHeight) < 1) return Promise.resolve();

    const resize = animate(card, { height: [fromHeight, toHeight] }, {
      duration: CARD_RESIZE_SECONDS,
      ease: [0.22, 1, 0.36, 1],
    });
    cardResizeRef.current = resize;
    return resize.then(() => {
      if (cardResizeRef.current !== resize) return;
      cardResizeRef.current = null;
      card.style.height = "";
    });
  }

  /** On phones the card top is usually scrolled away by the time Release is tapped. */
  function bringCardIntoView() {
    const card = cardRef.current;
    if (!card || card.getBoundingClientRect().top >= HEADER_CLEARANCE_PX) return;
    card.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
  }

  function celebrateRelease(entryId: string | null) {
    const textarea = textareaRef.current;
    const plan = !shouldReduceMotion && textarea ? planLaunch(textarea) : null;

    void swapCardContent(() => {
      setLaunchPlan(plan);
      setReleasedEntry({ entryId, revealDelay: plan ? SUCCESS_REVEAL_DELAY_SECONDS : 0 });
    });

    // The flying copy takes over from the text in the box, which fades out with the form.
    if (plan && textarea) textarea.style.color = "transparent";
    successHeadingRef.current?.focus({ preventScroll: true });
    // Scroll while the star is still in flight; the card's top edge stays put as it shrinks.
    bringCardIntoView();
  }

  async function releaseEntry(values: CreateEntryInput) {
    if (isReleasingRef.current) return;
    isReleasingRef.current = true;

    let response: ApiResponse<CreateEntryDTO>;
    try {
      response = await createEntryMutation.mutateAsync(values);
    } catch {
      // The mutation's error state shows the retry banner; everything the writer entered stays put.
      return;
    } finally {
      isReleasingRef.current = false;
    }

    clearDraft();
    celebrateRelease(readEntryId(response));
  }

  function writeAnother() {
    clearDraft();
    form.reset(DEFAULT_ENTRY_VALUES);
    createEntryMutation.reset();
    void swapCardContent(() => {
      setLaunchPlan(null);
      setReleasedEntry(null);
    });

    const focusTarget = prefersFinePointer() ? textareaRef.current : composerHeadingRef.current;
    focusTarget?.focus({ preventScroll: true });
  }

  return (
    <MotionConfig reducedMotion="user">
      <Form {...form}>
        <Card
          ref={cardRef}
          className="relative mt-10 w-full max-w-2xl scroll-mt-28 gap-0 overflow-hidden border-4 py-0"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {releasedEntry ? (
              <motion.div
                key="released"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, pointerEvents: "none", transition: { duration: PANEL_FADE_SECONDS } }}
                transition={{ duration: SUCCESS_FADE_SECONDS, ease: "easeOut", delay: releasedEntry.revealDelay }}
              >
                <ReleaseSuccess
                  entryId={releasedEntry.entryId}
                  headingRef={successHeadingRef}
                  revealDelay={releasedEntry.revealDelay}
                  onWriteAnother={writeAnother}
                />
              </motion.div>
            ) : (
              <motion.div
                key="compose"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, pointerEvents: "none", transition: { duration: PANEL_FADE_SECONDS } }}
                transition={{ duration: PANEL_FADE_SECONDS }}
              >
                <ReleaseForm
                  onRelease={form.handleSubmit(releaseEntry)}
                  isReleasing={createEntryMutation.isPending}
                  hasReleaseError={createEntryMutation.isError}
                  textareaRef={textareaRef}
                  headingRef={composerHeadingRef}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </Form>

      {launchPlan && <ReleaseLaunch plan={launchPlan} onComplete={finishLaunch} />}
    </MotionConfig>
  );
}
