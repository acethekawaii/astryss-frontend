"use client";

import type { BaseSyntheticEvent, KeyboardEvent, RefObject } from "react";
import { Send } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";

import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { MOOD_ATMOSPHERES } from "../constants/mood-atmospheres";
import { CONTENT_LIMIT, TEXTAREA_MIN_ROWS } from "../constants/release.constants";
import { firstAvatarFile } from "../lib/avatar";
import CharacterCounter from "./character-counter";
import MoodConstellation from "./mood-constellation";
import MoodPicker from "./mood-picker";
import MoodTint from "./mood-tint";
import MoreOptions from "./more-options";
import ReleaseErrorBanner from "./release-error-banner";
import ReleaseShortcutHint from "./release-shortcut-hint";

type Props = {
  onRelease: (event?: BaseSyntheticEvent) => Promise<void>;
  isReleasing: boolean;
  hasReleaseError: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

function describeIdentity(displayName: string | undefined, avatarFile: File | undefined): string {
  const name = displayName?.trim();
  if (name) return `Posting as ${name}`;
  if (avatarFile) return "Posting anonymously with an avatar";
  return "Posting anonymously";
}

/**
 * The smallest the message area gets: the box's own minimum (`min-h-16`, `sm:min-h-22`) plus the
 * counter strip under it. The wrappers must not shrink past what they hold, or the box would spill
 * over the sections below.
 */
const MESSAGE_AREA_MIN_HEIGHT = "min-h-[calc(4rem+30px)] sm:min-h-[calc(5.5rem+34px)]";

/**
 * The card is capped at the screen's height (see `.release-slot`). Every section keeps its size and
 * the message box alone gives or takes the difference: it grows into spare room and, past the cap,
 * shrinks and scrolls inside itself. Its shrink factor of 100 makes it give way long before the open
 * More options panel does; only once it's at its minimum does that panel start scrolling too.
 */
export default function ReleaseForm({ onRelease, isReleasing, hasReleaseError, textareaRef, headingRef }: Props) {
  const { control } = useFormContext<CreateEntryInput>();
  const [content = "", emotion, displayName, avatar] = useWatch({
    control,
    name: ["content", "emotion", "displayName", "avatar"],
  });
  const count = content.length;
  const canRelease = content.trim().length > 0 && count <= CONTENT_LIMIT && !isReleasing;

  // Cmd/Ctrl+Enter mirrors the Release button. A plain Enter never releases: it adds a line in the
  // message, and in the one-line fields it would otherwise submit the form by accident.
  function releaseOnShortcut(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    if (!event.metaKey && !event.ctrlKey) {
      if (event.target instanceof HTMLInputElement && event.target.type === "text") event.preventDefault();
      return;
    }

    event.preventDefault();
    if (canRelease && !event.repeat) void onRelease();
  }

  return (
    <form
      onSubmit={onRelease}
      onKeyDown={releaseOnShortcut}
      noValidate
      // Scrolls only as a last resort, on screens too short for even the smallest message box.
      className="flex min-h-0 grow flex-col overflow-y-auto overscroll-contain"
    >
      <CardHeader className="relative isolate shrink-0 gap-0.5 overflow-hidden border-b-2 bg-secondary-background px-4 py-2 sm:px-5 sm:py-3">
        <MoodTint emotion={emotion} />
        <MoodConstellation emotion={emotion} />
        <h2 ref={headingRef} tabIndex={-1} className="text-lg leading-snug font-bold outline-none sm:text-xl">
          Let it out
        </h2>
        <p className="text-xs leading-4 opacity-70">
          Write what you need to release. You can stay completely anonymous.
        </p>
      </CardHeader>

      <CardContent className={cn("flex shrink-[100] grow flex-col p-0", MESSAGE_AREA_MIN_HEIGHT)}>
        <FormField
          control={control}
          name="content"
          render={({ field }) => (
            <FormItem className={cn("flex shrink grow flex-col gap-0", MESSAGE_AREA_MIN_HEIGHT)}>
              <FormLabel className="sr-only">Your message</FormLabel>
              <FormControl>
                <TextareaAutosize
                  {...field}
                  ref={(element) => {
                    field.ref(element);
                    // Only ever point at a mounted box, so a panel that is fading out can't clear
                    // the ref after a fresh form has taken it.
                    if (element) textareaRef.current = element;
                  }}
                  // `rows` sizes the server-rendered box so it doesn't jump when autosizing takes over.
                  rows={TEXTAREA_MIN_ROWS}
                  minRows={TEXTAREA_MIN_ROWS}
                  maxLength={CONTENT_LIMIT + 1}
                  readOnly={isReleasing}
                  placeholder="Write whatever you're feeling..."
                  className={cn(
                    "block min-h-16 w-full shrink grow resize-none overflow-y-auto rounded-none border-0 bg-secondary-background px-4 py-2.5 font-base text-base leading-relaxed text-foreground selection:bg-main selection:text-main-foreground placeholder:text-foreground/50 focus-visible:outline-none sm:min-h-22 sm:px-5 sm:py-3",
                    emotion && MOOD_ATMOSPHERES[emotion].caretClassName,
                  )}
                />
              </FormControl>
              <div className="relative isolate flex min-h-7 shrink-0 items-center gap-3 border-t-2 px-4 py-1 text-xs sm:min-h-8 sm:px-5">
                <MoodTint emotion={emotion} />
                <FormMessage />
                <ReleaseShortcutHint />
                <CharacterCounter count={count} />
              </div>
            </FormItem>
          )}
        />
      </CardContent>

      <MoodPicker isDisabled={isReleasing} />
      <MoreOptions isDisabled={isReleasing} />
      <ReleaseErrorBanner isVisible={hasReleaseError && !isReleasing} onRetry={() => void onRelease()} />

      <CardFooter className="shrink-0 gap-3 border-t-2 bg-main px-4 py-2 sm:px-5">
        <p className="min-w-0 flex-1 text-xs font-bold sm:text-sm">{describeIdentity(displayName, firstAvatarFile(avatar))}</p>
        <Button
          type="submit"
          variant="neutral"
          disabled={!canRelease}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          className="shrink-0 cursor-pointer"
        >
          {isReleasing ? "Releasing..." : "Release it"}
          <Send aria-hidden />
        </Button>
      </CardFooter>
    </form>
  );
}
