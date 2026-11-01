import { useSyncExternalStore } from "react";

import { isApplePlatform } from "../lib/input-device";

type ShortcutModifier = { label: string; spokenLabel: string };

const APPLE_MODIFIER: ShortcutModifier = { label: "⌘", spokenLabel: "Command" };
const DEFAULT_MODIFIER: ShortcutModifier = { label: "Ctrl", spokenLabel: "Control" };

const subscribeToNothing = () => () => {};

/** The modifier key for the release shortcut. The server render and hydration assume Ctrl. */
export function useShortcutModifier(): ShortcutModifier {
  return useSyncExternalStore(
    subscribeToNothing,
    () => (isApplePlatform() ? APPLE_MODIFIER : DEFAULT_MODIFIER),
    () => DEFAULT_MODIFIER,
  );
}
