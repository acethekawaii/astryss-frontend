"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";
import { cn } from "@/vendor/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/vendor/ui/accordion";
import { Button, buttonVariants } from "@/vendor/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from "@/vendor/ui/form";
import { Input } from "@/vendor/ui/input";

import { DISPLAY_NAME_MAX_LENGTH, TITLE_MAX_LENGTH } from "../constants/release.constants";
import { useFileDataUrl } from "../hooks/use-file-data-url";
import { firstAvatarFile } from "../lib/avatar";
import AvatarPreview from "./avatar-preview";

const MORE_OPTIONS_ITEM = "more-options";

export default function MoreOptions({ isDisabled }: { isDisabled: boolean }) {
  const { control, setValue } = useFormContext<CreateEntryInput>();
  const [title, displayName, avatar] = useWatch({ control, name: ["title", "displayName", "avatar"] });
  const avatarFile = firstAvatarFile(avatar);
  const avatarPreviewUrl = useFileDataUrl(avatarFile);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [openItem, setOpenItem] = useState("");
  const [hasRevealedOptions, setHasRevealedOptions] = useState(false);
  const hasOptionValues = Boolean(title?.trim() || displayName?.trim() || avatarFile);
  // A restored draft can bring back a title, name, or avatar. Open the section once so they're
  // visible; after that it's entirely the writer's to open and close.
  if (hasOptionValues && !hasRevealedOptions) {
    setHasRevealedOptions(true);
    setOpenItem(MORE_OPTIONS_ITEM);
  }

  function removeAvatar() {
    setValue("avatar", undefined, { shouldDirty: true });
    // Lets the same file be picked again straight away.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="border-t-4">
      <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem}>
        <AccordionItem value={MORE_OPTIONS_ITEM} className="rounded-none border-0 shadow-none">
          <AccordionTrigger className="bg-secondary-background px-6 py-4 text-foreground hover:bg-main/20">
            <span>
              <span className="block font-bold">More options</span>
              <span className="block text-xs font-normal opacity-60">Add a title, name, or avatar</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-5 border-t-2 p-6">
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title <span className="font-normal opacity-60">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={TITLE_MAX_LENGTH}
                      placeholder="Give your message a short headline"
                      readOnly={isDisabled}
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
                <FormItem>
                  <FormLabel>Display name <span className="font-normal opacity-60">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={DISPLAY_NAME_MAX_LENGTH}
                      placeholder="Leave blank to stay anonymous"
                      readOnly={isDisabled}
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
                <FormItem>
                  <FormLabel>Avatar <span className="font-normal opacity-60">(optional)</span></FormLabel>
                  <div className="flex flex-wrap items-center gap-4">
                    <AvatarPreview src={avatarPreviewUrl} />
                    <div className="min-w-0 flex-1">
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
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            // Cancelling the picker keeps the current avatar.
                            if (file) field.onChange([file]);
                          }}
                          disabled={isDisabled}
                        />
                      </FormControl>
                      <div className="flex flex-wrap items-center gap-2">
                        <ChooseImageButton />
                        {avatarFile && (
                          <Button
                            type="button"
                            variant="neutral"
                            size="sm"
                            onClick={removeAvatar}
                            disabled={isDisabled}
                            className="cursor-pointer"
                          >
                            <X aria-hidden />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="mt-2 truncate text-xs opacity-60">
                        {avatarFile?.name ?? "PNG or JPG, up to 2 MB"}
                      </p>
                    </div>
                  </div>
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

/** A label styled as a button, pointing at the visually hidden file input of the same form item. */
function ChooseImageButton() {
  const { formItemId } = useFormField();

  return (
    <label
      htmlFor={formItemId}
      className={cn(buttonVariants({ variant: "neutral", size: "sm" }), "cursor-pointer")}
    >
      <ImagePlus aria-hidden />
      Choose image
    </label>
  );
}
