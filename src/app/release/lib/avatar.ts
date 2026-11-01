import { createEntrySchema } from "@/app/entries/schema/entry.schema";

/** The form keeps the avatar as a one-item list (array or FileList); this reads the file out of it. */
export function firstAvatarFile(value: unknown): File | undefined {
  if (!value || typeof value !== "object" || !("length" in value)) return undefined;

  const [file] = Array.from(value as ArrayLike<unknown>);
  return file instanceof File ? file : undefined;
}

/** Same type and size rules the form checks on submit. */
export function isAcceptedAvatar(file: File): boolean {
  return createEntrySchema.shape.avatar.safeParse([file]).success;
}
