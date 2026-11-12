import { useEffect, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createEntry } from "@/app/entries/api/entries.api";

import { RELEASE_HOLD_MS } from "../constants/release.constants";
import { createTimedRelease, type TimedReleaseHandlers } from "../lib/timed-release";

type Options = Pick<TimedReleaseHandlers, "clearDraft" | "onReleased" | "onFailed">;

/**
 * A release with a grace period: `begin` starts the countdown, `undo` cancels it, and the entry is
 * sent once the countdown ends — or straight away if the writer closes the tab or leaves the page.
 */
export function useTimedRelease({ clearDraft, onReleased, onFailed }: Options) {
  const queryClient = useQueryClient();
  const [release] = useState(() => createTimedRelease(RELEASE_HOLD_MS));
  const status = useSyncExternalStore(release.subscribe, release.getStatus, release.getStatus);

  // Runs after every render so the release always reports to the latest callbacks.
  useEffect(() => {
    release.setHandlers({
      send: createEntry,
      clearDraft,
      refreshFeeds: () => void queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: "all" }),
      onReleased,
      onFailed,
    });
  });

  useEffect(() => {
    window.addEventListener("pagehide", release.commitOnLeave);
    return () => {
      window.removeEventListener("pagehide", release.commitOnLeave);
      // In-app navigation unmounts the composer without a pagehide.
      release.commitOnUnmount();
    };
  }, [release]);

  return { status, begin: release.begin, undo: release.undo };
}
