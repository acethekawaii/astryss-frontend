import { EMOTIONS, type Emotion } from "@/shared/constants/emotions";

import {
  CONTENT_LIMIT,
  DISPLAY_NAME_MAX_LENGTH,
  DRAFT_AVATAR_STORAGE_KEY,
  DRAFT_STORAGE_KEY,
  TITLE_MAX_LENGTH,
} from "../constants/release.constants";
import { isAcceptedAvatar } from "./avatar";
import { dataUrlToFile, readFileAsDataUrl, rememberFileDataUrl } from "./file-data-url";

export type ReleaseDraft = {
  content: string;
  emotion?: Emotion;
  title: string;
  displayName: string;
};

type StoredAvatar = { name: string; dataUrl: string };

// Bumped on every avatar write and on discard, so a slow file read can never store a stale avatar.
let avatarWriteVersion = 0;

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage is full or blocked (e.g. some private modes). Drop the key so an older value
    // can't come back on reload; the form itself keeps working.
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage is unavailable altogether.
    }
  }
}

function readRecord(key: string): Record<string, unknown> | null {
  const raw = readItem(key);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function isEmotion(value: unknown): value is Emotion {
  return typeof value === "string" && (EMOTIONS as readonly string[]).includes(value);
}

function isBlankDraft(draft: ReleaseDraft): boolean {
  return !draft.content.trim() && !draft.emotion && !draft.title.trim() && !draft.displayName.trim();
}

export function loadDraft(): ReleaseDraft | null {
  const stored = readRecord(DRAFT_STORAGE_KEY);
  if (!stored) return null;

  const draft: ReleaseDraft = {
    // The message box allows one character past the limit so the counter can show it in red.
    content: readText(stored.content, CONTENT_LIMIT + 1),
    emotion: isEmotion(stored.emotion) ? stored.emotion : undefined,
    title: readText(stored.title, TITLE_MAX_LENGTH),
    displayName: readText(stored.displayName, DISPLAY_NAME_MAX_LENGTH),
  };
  return isBlankDraft(draft) ? null : draft;
}

/** Stores the draft, or forgets it once every field is empty again. */
export function saveDraft(draft: ReleaseDraft): void {
  writeItem(DRAFT_STORAGE_KEY, isBlankDraft(draft) ? null : JSON.stringify(draft));
}

export function loadDraftAvatar(): File | null {
  const stored = readRecord(DRAFT_AVATAR_STORAGE_KEY);
  if (typeof stored?.name !== "string" || typeof stored.dataUrl !== "string") return null;

  const file = dataUrlToFile(stored.dataUrl, stored.name);
  if (!file || !isAcceptedAvatar(file)) return null;

  rememberFileDataUrl(file, stored.dataUrl);
  return file;
}

/** Avatars are stored as data URLs, apart from the text so typing never re-serialises the image. */
export async function saveDraftAvatar(file: File | undefined): Promise<void> {
  avatarWriteVersion += 1;
  const version = avatarWriteVersion;

  if (!file || !isAcceptedAvatar(file)) {
    writeItem(DRAFT_AVATAR_STORAGE_KEY, null);
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    if (version !== avatarWriteVersion) return;

    const stored: StoredAvatar = { name: file.name, dataUrl };
    writeItem(DRAFT_AVATAR_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    if (version === avatarWriteVersion) writeItem(DRAFT_AVATAR_STORAGE_KEY, null);
  }
}

export function discardDraft(): void {
  avatarWriteVersion += 1;
  writeItem(DRAFT_STORAGE_KEY, null);
  writeItem(DRAFT_AVATAR_STORAGE_KEY, null);
}
