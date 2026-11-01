"use client";

import { useShortcutModifier } from "../hooks/use-shortcut-modifier";

const KEY_CLASS_NAME =
  "rounded-[3px] border border-border bg-secondary-background px-1 py-px font-base text-[11px] leading-none text-foreground shadow-[1px_1px_0_0_var(--border)]";

/** Mouse-and-keyboard devices only; the media query matches `prefersFinePointer`. */
export default function ReleaseShortcutHint() {
  const modifier = useShortcutModifier();

  return (
    <p className="hidden items-center gap-1 text-foreground/60 [@media(hover:hover)_and_(pointer:fine)]:inline-flex">
      <kbd className={KEY_CLASS_NAME}>
        <span aria-hidden>{modifier.label}</span>
        <span className="sr-only">{modifier.spokenLabel}</span>
      </kbd>
      <span aria-hidden>+</span>
      <kbd className={KEY_CLASS_NAME}>Enter</kbd>
      <span>to release</span>
    </p>
  );
}
