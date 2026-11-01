import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";

/** Longest message the API accepts. */
export const CONTENT_LIMIT = 500;
/** The counter stays out of the way until the writer gets close to the limit. */
export const COUNTER_VISIBLE_FROM = 400;
export const TITLE_MAX_LENGTH = 20;
export const DISPLAY_NAME_MAX_LENGTH = 15;

/** The message box starts at this many rows, grows with the text, and scrolls once it reaches the maximum. */
export const TEXTAREA_MIN_ROWS = 5;
export const TEXTAREA_MAX_ROWS = 12;

export const DRAFT_STORAGE_KEY = "astryss:release:draft";
export const DRAFT_AVATAR_STORAGE_KEY = "astryss:release:draft-avatar";
export const DRAFT_SAVE_DELAY_MS = 500;

export const RELEASES_FEED_PATH = "/entries";

export const DEFAULT_ENTRY_VALUES: CreateEntryInput = {
  displayName: "",
  title: "",
  content: "",
  avatar: undefined,
  type: "release",
  emotion: undefined,
  variants: ["halloween"],
};
