/** Primary input is a mouse or trackpad, so focusing a field won't pop up an on-screen keyboard. */
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

export function prefersFinePointer(): boolean {
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

export function isApplePlatform(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}
