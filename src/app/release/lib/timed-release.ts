import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";
import type { CreateEntryDTO } from "@/app/entries/types/entry.types";
import type { ApiResponse } from "@/shared/types/api.types";

import { firstAvatarFile } from "./avatar";

export type TimedReleaseStatus =
  | { kind: "idle" }
  /** `endsAt` is on the `performance.now()` clock. */
  | { kind: "holding"; endsAt: number }
  | { kind: "sending" };

type CreateEntryResponse = ApiResponse<CreateEntryDTO>;

export type TimedReleaseHandlers = {
  send: (values: CreateEntryInput, options: { keepalive: boolean }) => Promise<CreateEntryResponse>;
  clearDraft: () => void;
  /** Refreshes the entry feeds once a release has landed, whether or not the composer is still open. */
  refreshFeeds: () => void;
  onReleased: (response: CreateEntryResponse) => void;
  onFailed: () => void;
};

type CommitReason = "countdown" | "leave" | "unmount";

type Attempt = {
  values: CreateEntryInput;
  timeoutId: number;
  isSent: boolean;
};

const IDLE: TimedReleaseStatus = { kind: "idle" };

// Browsers refuse keepalive bodies over 64 KiB. Leave room for the multipart framing.
const KEEPALIVE_BODY_LIMIT_BYTES = 60 * 1024;
const MULTIPART_OVERHEAD_BYTES = 1024;
// Worst case for UTF-8 text.
const BYTES_PER_CHARACTER = 4;

/** Whether the request body is small enough to be sent with `keepalive`. */
export function fitsInKeepalive(values: CreateEntryInput): boolean {
  const textLength = values.content.length + (values.title?.length ?? 0) + (values.displayName?.length ?? 0);
  const avatarBytes = firstAvatarFile(values.avatar)?.size ?? 0;
  const estimatedBytes = textLength * BYTES_PER_CHARACTER + avatarBytes + MULTIPART_OVERHEAD_BYTES;
  return estimatedBytes <= KEEPALIVE_BODY_LIMIT_BYTES;
}

/**
 * Holds a validated release for `holdMs` before sending it, so it can be undone. The send happens
 * exactly once, triggered by whichever comes first: the countdown ending, the page being hidden for
 * good (`commitOnLeave`, for `pagehide`), or the composer unmounting on in-app navigation.
 *
 * Plain JS rather than React state, so a re-render or a re-run effect can never send twice.
 */
export function createTimedRelease(holdMs: number) {
  let status: TimedReleaseStatus = IDLE;
  let attempt: Attempt | null = null;
  let handlers: TimedReleaseHandlers | null = null;
  const listeners = new Set<() => void>();

  function setStatus(next: TimedReleaseStatus) {
    status = next;
    listeners.forEach((listener) => listener());
  }

  function begin(values: CreateEntryInput): boolean {
    if (attempt) return false;

    attempt = { values, isSent: false, timeoutId: window.setTimeout(() => commit("countdown"), holdMs) };
    setStatus({ kind: "holding", endsAt: performance.now() + holdMs });
    return true;
  }

  /** Cancels the release if it hasn't been sent yet. Returns whether anything was cancelled. */
  function undo(): boolean {
    if (!attempt || attempt.isSent) return false;

    window.clearTimeout(attempt.timeoutId);
    attempt = null;
    setStatus(IDLE);
    return true;
  }

  function commit(reason: CommitReason) {
    const current = attempt;
    if (!current || current.isSent || !handlers) return;

    current.isSent = true;
    window.clearTimeout(current.timeoutId);
    const { send, clearDraft, refreshFeeds, onReleased, onFailed } = handlers;
    // `send` starts the request synchronously, before the page has a chance to go away.
    const request = send(current.values, { keepalive: fitsInKeepalive(current.values) });

    // Leaving means the writer is done with this message; there may be no later chance to forget it.
    if (reason !== "countdown") clearDraft();

    if (reason === "unmount") {
      // The composer is gone, so there is nobody left to show the outcome to.
      attempt = null;
      request.then(refreshFeeds, () => {});
      return;
    }

    setStatus({ kind: "sending" });
    request.then(
      (response) => {
        if (attempt !== current) return;
        attempt = null;
        clearDraft();
        refreshFeeds();
        setStatus(IDLE);
        onReleased(response);
      },
      () => {
        if (attempt !== current) return;
        attempt = null;
        setStatus(IDLE);
        onFailed();
      },
    );
  }

  return {
    begin,
    undo,
    commitOnLeave: () => commit("leave"),
    commitOnUnmount: () => commit("unmount"),
    getStatus: () => status,
    setHandlers: (next: TimedReleaseHandlers) => {
      handlers = next;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type TimedRelease = ReturnType<typeof createTimedRelease>;
