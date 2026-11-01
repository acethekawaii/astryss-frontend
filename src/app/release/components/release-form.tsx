"use client";

import type { BaseSyntheticEvent, KeyboardEvent, RefObject } from "react";
import { Send } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";

import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";
import { cn } from "@/vendor/lib/utils";
import { Button } from "@/vendor/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/vendor/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/vendor/ui/form";

import { MOOD_ATMOSPHERES } from "../constants/mood-atmospheres";
import { CONTENT_LIMIT, TEXTAREA_MAX_ROWS, TEXTAREA_MIN_ROWS } from "../constants/release.constants";
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
    <form onSubmit={onRelease} onKeyDown={releaseOnShortcut} noValidate>
      <CardHeader className="relative isolate gap-1 overflow-hidden border-b-4 bg-secondary-background px-6 py-5">
        <MoodTint emotion={emotion} />
        <MoodConstellation emotion={emotion} />
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">Let it out</h2>
        <p className="text-sm opacity-70">Write what you need to release. You can stay completely anonymous.</p>
      </CardHeader>

      <CardContent className="p-0">
        <FormField
          control={control}
          name="content"
          render={({ field }) => (
            <FormItem className="gap-0">
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
                  maxRows={TEXTAREA_MAX_ROWS}
                  maxLength={CONTENT_LIMIT + 1}
                  readOnly={isReleasing}
                  placeholder="Write whatever you're feeling..."
                  className={cn(
                    "block w-full resize-none rounded-none border-0 bg-secondary-background px-6 py-5 font-base text-base leading-relaxed text-foreground selection:bg-main selection:text-main-foreground placeholder:text-foreground/50 focus-visible:outline-none",
                    emotion && MOOD_ATMOSPHERES[emotion].caretClassName,
                  )}
                />
              </FormControl>
              <div className="relative isolate flex min-h-10 items-center gap-3 border-t-2 px-6 py-2 text-xs">
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

      <CardFooter className="flex-col gap-3 border-t-4 bg-main px-6 py-4 sm:flex-row sm:justify-between">
        <p className="text-sm font-bold">{describeIdentity(displayName, firstAvatarFile(avatar))}</p>
        <Button
          type="submit"
          size="lg"
          variant="neutral"
          disabled={!canRelease}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          className="w-full cursor-pointer sm:w-auto"
        >
          {isReleasing ? "Releasing..." : "Release it"}
          <Send aria-hidden />
        </Button>
      </CardFooter>
    </form>
  );
}
