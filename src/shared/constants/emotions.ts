export const EMOTIONS = [
  'sad',
  'angry',
  'inlove',
  'other',
] as const;

export type Emotion = typeof EMOTIONS[number];

export const EMOTION_STYLES: Record<Emotion, string> = {
  sad: 'bg-blue-300',
  angry: 'bg-red-300',
  inlove: 'bg-pink-300',
  other: 'bg-zinc-300',
} as const;

