import { useCallback, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";

import { DEFAULT_ENTRY_VALUES, DRAFT_SAVE_DELAY_MS } from "../constants/release.constants";
import { firstAvatarFile } from "../lib/avatar";
import {
  discardDraft,
  loadDraft,
  loadDraftAvatar,
  saveDraft,
  saveDraftAvatar,
  type ReleaseDraft,
} from "../lib/release-draft";

type PendingSave = { timeoutId: number; draft: ReleaseDraft };

function toDraft(values: CreateEntryInput): ReleaseDraft {
  return {
    content: values.content ?? "",
    emotion: values.emotion,
    title: values.title ?? "",
    displayName: values.displayName ?? "",
  };
}

/**
 * Keeps the composer's draft in localStorage: restores it on mount, saves while the writer types
 * (debounced, and flushed when the page is hidden or closed), and forgets it via `clearDraft` —
 * which callers use only after a successful release.
 */
export function useReleaseDraft(form: UseFormReturn<CreateEntryInput>) {
  const { reset, subscribe } = form;
  const pendingSaveRef = useRef<PendingSave | null>(null);

  const flushPendingSave = useCallback(() => {
    const pending = pendingSaveRef.current;
    if (!pending) return;

    pendingSaveRef.current = null;
    window.clearTimeout(pending.timeoutId);
    saveDraft(pending.draft);
  }, []);

  const clearDraft = useCallback(() => {
    if (pendingSaveRef.current) window.clearTimeout(pendingSaveRef.current.timeoutId);
    pendingSaveRef.current = null;
    discardDraft();
  }, []);

  useEffect(() => {
    const restoredDraft = loadDraft();
    const restoredAvatar = loadDraftAvatar() ?? undefined;
    if (restoredDraft || restoredAvatar) {
      reset(
        { ...DEFAULT_ENTRY_VALUES, ...restoredDraft, avatar: restoredAvatar ? [restoredAvatar] : undefined },
        { keepDefaultValues: true },
      );
    }

    let storedAvatar = restoredAvatar;
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        if (pendingSaveRef.current) window.clearTimeout(pendingSaveRef.current.timeoutId);
        pendingSaveRef.current = {
          draft: toDraft(values),
          timeoutId: window.setTimeout(flushPendingSave, DRAFT_SAVE_DELAY_MS),
        };

        const avatar = firstAvatarFile(values.avatar);
        if (avatar !== storedAvatar) {
          storedAvatar = avatar;
          void saveDraftAvatar(avatar);
        }
      },
    });

    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushPendingSave();
    };
    window.addEventListener("pagehide", flushPendingSave);
    document.addEventListener("visibilitychange", flushWhenHidden);

    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", flushPendingSave);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      flushPendingSave();
    };
  }, [reset, subscribe, flushPendingSave]);

  return { clearDraft };
}
