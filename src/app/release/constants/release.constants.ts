import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";

/** Longest message the API accepts. */
export const CONTENT_LIMIT = 500;
/** The counter stays out of the way until the writer gets close to the limit. */
export const COUNTER_VISIBLE_FROM = 400;
export const TITLE_MAX_LENGTH = 20;
export const DISPLAY_NAME_MAX_LENGTH = 15;

/**
 * The message box starts at this many rows and grows with the text until the card reaches the bottom
 * of the screen; past that it gives up height to the other sections and scrolls inside itself.
 */
export const TEXTAREA_MIN_ROWS = 4;

/** How long the star waits, with Undo available, before the message is actually sent. */
export const RELEASE_HOLD_MS = 3000;

export const DRAFT_STORAGE_KEY = "astryss:release:draft";
export const DRAFT_AVATAR_STORAGE_KEY = "astryss:release:draft-avatar";
export const DRAFT_SAVE_DELAY_MS = 500;

export const RELEASES_FEED_PATH = "/entries";

/** Shown wherever the writer hasn't picked an avatar of their own. */
export const DEFAULT_AVATAR_URL = "https://api.dicebear.com/9.x/pixel-art/svg?seed=undefined&size=80";

export const DEFAULT_ENTRY_VALUES: CreateEntryInput = {
  displayName: "",
  title: "",
  content: "",
  avatar: undefined,
  type: "release",
  emotion: undefined,
  variants: ["halloween"],
};
