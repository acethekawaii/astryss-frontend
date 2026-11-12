"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { DEFAULT_AVATAR_URL, DISPLAY_NAME_MAX_LENGTH, TITLE_MAX_LENGTH } from "../constants/release.constants";
import { useFileDataUrl } from "../hooks/use-file-data-url";
import { firstAvatarFile } from "../lib/avatar";

const MORE_OPTIONS_ITEM = "more-options";
/** For the panel's outer element, which only takes styling through props. */
const PANEL_SHRINK_STYLE = { display: "flex", flexDirection: "column", minHeight: 0 } as const;

export default function MoreOptions({ isDisabled }: { isDisabled: boolean }) {
  const { control, setValue } = useFormContext<CreateEntryInput>();
  const [title, displayName, avatar] = useWatch({ control, name: ["title", "displayName", "avatar"] });
  const avatarFile = firstAvatarFile(avatar);
  const avatarPreviewUrl = useFileDataUrl(avatarFile);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [openItems, setOpenItems] = useState<string[]>([]);
  const [hasRevealedOptions, setHasRevealedOptions] = useState(false);
  const hasOptionValues = Boolean(title?.trim() || displayName?.trim() || avatarFile);
  // A restored draft can bring back a title, name, or avatar. Open the section once so they're
  // visible; after that it's entirely the writer's to open and close.
  if (hasOptionValues && !hasRevealedOptions) {
    setHasRevealedOptions(true);
    setOpenItems([MORE_OPTIONS_ITEM]);
  }

  function removeAvatar() {
    setValue("avatar", undefined, { shouldDirty: true });
    // Lets the same file be picked again straight away.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    // On the shortest screens, once the message box is down to its minimum, the open panel gives up
    // height too and scrolls inside itself, so the Release button never leaves the screen. The message
    // area's much larger shrink factor (see ReleaseForm) keeps this panel whole until then.
    <div className="flex min-h-0 shrink flex-col border-t-2">
      <Accordion
        value={openItems}
        onValueChange={(value) => setOpenItems(value as string[])}
        className="flex min-h-0 flex-col"
      >
        <AccordionItem value={MORE_OPTIONS_ITEM} className="flex min-h-0 flex-col rounded-none border-0 shadow-none">
          <AccordionTrigger className="bg-secondary-background px-4 py-2 text-foreground hover:bg-main/20 sm:px-5 sm:py-2.5">
            <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-sm font-bold">More options</span>
              <span className="text-xs font-normal opacity-60">Add a title, name, or avatar</span>
            </span>
          </AccordionTrigger>
          <AccordionContent
            style={PANEL_SHRINK_STYLE}
            className="grid min-h-0 grid-cols-2 items-end gap-x-3 gap-y-2 overflow-y-auto overscroll-contain px-4 py-2.5 sm:px-5 sm:py-3"
          >
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem className="gap-1">
                  <FormLabel className="text-xs">Title <span className="font-normal opacity-60">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={TITLE_MAX_LENGTH}
                      placeholder="Give your message a short headline"
                      readOnly={isDisabled}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="gap-1">
                  <FormLabel className="text-xs">Display name <span className="font-normal opacity-60">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={DISPLAY_NAME_MAX_LENGTH}
                      placeholder="Leave blank to stay anonymous"
                      readOnly={isDisabled}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="avatar"
              render={({ field }) => (
                <FormItem className="col-span-2 gap-1">
                  <FormLabel className="text-xs">
                    Avatar <span className="font-normal opacity-60">(optional)</span>
                  </FormLabel>
                  <AvatarAttachment
                    file={avatarFile}
                    previewUrl={avatarPreviewUrl}
                    isDisabled={isDisabled}
                    onChoose={() => fileInputRef.current?.click()}
                    onRemove={removeAvatar}
                  >
                    <FormControl>
                      <Input
                        ref={(element) => {
                          field.ref(element);
                          fileInputRef.current = element;
                        }}
                        name={field.name}
                        onBlur={field.onBlur}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        // The attachment's own button is the one control; this stays out of the tab order.
                        tabIndex={-1}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          // Cancelling the picker keeps the current avatar.
                          if (file) field.onChange([file]);
                        }}
                        disabled={isDisabled}
                      />
                    </FormControl>
                  </AvatarAttachment>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

type AvatarAttachmentProps = {
  file: File | undefined;
  previewUrl: string | null;
  isDisabled: boolean;
  onChoose: () => void;
  onRemove: () => void;
  /** The visually hidden file input. */
  children: ReactNode;
};

/**
 * The avatar as one attachment row, after the registry's image example: clicking the row opens the
 * picker, ✕ clears it. Until a file is picked it shows the avatar the release will go out with.
 */
function AvatarAttachment({ file, previewUrl, isDisabled, onChoose, onRemove, children }: AvatarAttachmentProps) {
  const { error, formMessageId } = useFormField();

  return (
    <Attachment
      state={error ? "error" : file ? "done" : "idle"}
      className={cn("w-full", isDisabled && "opacity-50")}
    >
      {children}
      <AttachmentMedia variant="image">
        <Image src={previewUrl ?? DEFAULT_AVATAR_URL} alt="" width={80} height={80} className="size-full" unoptimized />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{file?.name ?? "Add image"}</AttachmentTitle>
        <AttachmentDescription>{file ? describeFile(file) : "PNG or JPG · up to 2 MB"}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentTrigger
        aria-label={file ? `Replace avatar, ${file.name}` : "Choose an avatar image"}
        aria-describedby={error ? formMessageId : undefined}
        disabled={isDisabled}
        onClick={onChoose}
        className="cursor-pointer"
      />
      {file && (
        <AttachmentActions>
          <AttachmentAction type="button" aria-label="Remove avatar" disabled={isDisabled} onClick={onRemove}>
            <X aria-hidden />
          </AttachmentAction>
        </AttachmentActions>
      )}
    </Attachment>
  );
}

/** Type and size, as in the registry's example: "JPG · 340 KB". */
function describeFile(file: File): string {
  const megabyte = 1024 * 1024;
  const size =
    file.size < megabyte ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / megabyte).toFixed(1)} MB`;
  const extension = file.name.includes(".") ? file.name.split(".").pop() : file.type.split("/")[1];
  return extension ? `${extension.toUpperCase()} · ${size}` : size;
}
