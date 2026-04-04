import { z } from "zod";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export const createEntrySchema = z.object({
  displayName: z.string().max(15).optional(),
  title: z.string().max(20).optional(),
  content: z.string().min(1, "Content is required").max(500),
  type: z.enum(["release", "unsent", "whisper"]),
  emotion: z.enum(["sad", "angry", "inlove", "other"]),
  variants: z.array(z.enum(["legacy", "dev", "beta", "respawned"])).optional(),
  avatar: z
    .any()
    .optional()
    .refine(
      files => !files || files.length === 1,
      "Only one file allowed"
    )
    .refine(
      files => !files || files[0]?.size <= MAX_FILE_SIZE,
      "Max 2MB"
    )
    .refine(
      files => !files || ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      "Invalid file type"
    ),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;