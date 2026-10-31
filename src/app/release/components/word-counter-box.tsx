"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flame, Frown, Heart, ImagePlus, Send, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";

import { CreateEntryInput, createEntrySchema } from "@/app/entries/schema/entry.schema";
import { useCreateEntry } from "@/app/entries/hooks/use-entries";
import { EMOTION_LABELS, Emotion } from "@/shared/constants/emotions";
import { cn } from "@/vendor/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/vendor/ui/accordion";
import { Button, buttonVariants } from "@/vendor/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/vendor/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/vendor/ui/form";
import { Input } from "@/vendor/ui/input";
import { Textarea } from "@/vendor/ui/textarea";

import AvatarPreview from "./avatar-preview";

const CONTENT_LIMIT = 500;

const DEFAULT_VALUES: CreateEntryInput = {
  displayName: "",
  title: "",
  content: "",
  avatar: undefined,
  type: "release",
  emotion: undefined,
  variants: ["halloween"],
};

const EMOTION_OPTIONS: Array<{
  value: Emotion;
  icon: typeof Heart;
  activeClassName: string;
}> = [
  { value: "inlove", icon: Heart, activeClassName: "bg-pink-200 text-pink-800" },
  { value: "sad", icon: Frown, activeClassName: "bg-blue-200 text-blue-800" },
  { value: "angry", icon: Flame, activeClassName: "bg-red-200 text-red-800" },
  { value: "other", icon: Sparkles, activeClassName: "bg-zinc-200 text-zinc-800" },
];

export default function WordCounterBox() {
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [submittedEntryId, setSubmittedEntryId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const createEntryMutation = useCreateEntry();

  const form = useForm<CreateEntryInput>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const content = form.watch("content") ?? "";
  const displayName = form.watch("displayName")?.trim() ?? "";
  const avatarFiles = form.watch("avatar") as FileList | undefined;
  const count = content.length;

  const postingAs = useMemo(() => {
    if (displayName) return `Posting as ${displayName}`;
    if (avatarFiles?.length) return "Posting anonymously with an avatar";
    return "Posting anonymously";
  }, [avatarFiles, displayName]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  function handleAvatarChange(files: FileList | null) {
    setAvatarPreviewUrl(files?.[0] ? URL.createObjectURL(files[0]) : null);
  }

  function onSubmit(values: CreateEntryInput) {
    createEntryMutation.mutate(values, {
      onSuccess: (response) => {
        setSubmittedEntryId(response.data?._id ?? null);
        setShowSuccess(true);
        setAvatarPreviewUrl(null);
        form.reset(DEFAULT_VALUES);
      },
    });
  }

  if (showSuccess) {
    return (
      <Card
        className="mt-10 w-full max-w-2xl items-center gap-4 border-4 px-6 py-10 text-center"
        role="status"
      >
        <div className="flex size-14 items-center justify-center rounded-full border-2 bg-main shadow-shadow">
          <Sparkles className="size-7" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-bold">It&apos;s out there.</h2>
          <p className="mt-1 opacity-70">You&apos;re not carrying it alone.</p>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {submittedEntryId && (
            <Button asChild>
              <Link href={`/entries/${submittedEntryId}`}>View your message</Link>
            </Button>
          )}
          <Button variant="neutral" onClick={() => setShowSuccess(false)}>
            Write another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-10 w-full max-w-2xl gap-0 overflow-hidden border-4 py-0">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="gap-1 border-b-4 bg-secondary-background px-6 py-5">
            <h2 className="text-xl font-bold">Let it out</h2>
            <p className="text-sm opacity-70">Write what you need to release. You can stay completely anonymous.</p>
          </CardHeader>

          <CardContent className="p-0">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="gap-0">
                  <FormLabel className="sr-only">Your message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      autoFocus
                      maxLength={CONTENT_LIMIT + 1}
                      placeholder="Write whatever you're feeling..."
                      className="min-h-56 resize-none rounded-none border-0 px-6 py-5 text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={createEntryMutation.isPending}
                    />
                  </FormControl>
                  <div className="flex min-h-10 items-center justify-between border-t-2 px-6 py-2 text-xs">
                    <FormMessage />
                    <span
                      className={cn("ml-auto tabular-nums opacity-60", count > CONTENT_LIMIT && "font-bold text-red-600 opacity-100")}
                      aria-live="polite"
                    >
                      {count}/{CONTENT_LIMIT}
                    </span>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>

          <div className="border-t-4 bg-chart-3/30 px-6 py-5">
            <FormField
              control={form.control}
              name="emotion"
              render={({ field }) => (
                <FormItem>
                  <div>
                    <p className="font-bold">How does this feel?</p>
                    <p className="text-xs opacity-60">Optional — leave it blank if no label fits.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {EMOTION_OPTIONS.map((emotion) => {
                      const isActive = field.value === emotion.value;
                      const Icon = emotion.icon;

                      return (
                        <button
                          key={emotion.value}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => field.onChange(isActive ? undefined : emotion.value)}
                          disabled={createEntryMutation.isPending}
                          className={cn(
                            "flex min-h-20 flex-col items-center justify-center gap-1 border-2 bg-secondary-background px-2 py-3 text-xs transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            isActive && emotion.activeClassName,
                          )}
                        >
                          <Icon className="size-6" aria-hidden />
                          <span>{EMOTION_LABELS[emotion.value]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="more-options" className="rounded-none border-0 shadow-none">
                <AccordionTrigger className="bg-secondary-background px-6 py-4 text-foreground hover:bg-main/20">
                  <span>
                    <span className="block font-bold">More options</span>
                    <span className="block text-xs font-normal opacity-60">Add a title, name, or avatar</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-5 border-t-2 p-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title <span className="font-normal opacity-60">(optional)</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={20}
                            placeholder="Give your message a short headline"
                            disabled={createEntryMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display name <span className="font-normal opacity-60">(optional)</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={15}
                            placeholder="Leave blank to stay anonymous"
                            disabled={createEntryMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field: { onChange, value: _value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Avatar <span className="font-normal opacity-60">(optional)</span></FormLabel>
                        <div className="flex flex-wrap items-center gap-4">
                          <AvatarPreview src={avatarPreviewUrl} />
                          <div className="min-w-0 flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                id="release-avatar"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                className="sr-only"
                                onChange={(event) => {
                                  handleAvatarChange(event.target.files);
                                  onChange(event.target.files);
                                }}
                                disabled={createEntryMutation.isPending}
                              />
                            </FormControl>
                            <label
                              htmlFor="release-avatar"
                              className={cn(buttonVariants({ variant: "neutral", size: "sm" }), "cursor-pointer")}
                            >
                              <ImagePlus aria-hidden />
                              Choose image
                            </label>
                            <p className="mt-2 truncate text-xs opacity-60">
                              {avatarFiles?.[0]?.name ?? "PNG or JPG, up to 2 MB"}
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

          <CardFooter className="flex-col gap-3 border-t-4 bg-main px-6 py-4 sm:flex-row sm:justify-between">
            <p className="text-sm font-bold">{postingAs}</p>
            <Button
              type="submit"
              size="lg"
              variant="neutral"
              disabled={!content.trim() || count > CONTENT_LIMIT || createEntryMutation.isPending}
              className="w-full cursor-pointer sm:w-auto"
            >
              {createEntryMutation.isPending ? "Releasing..." : "Release it"}
              <Send aria-hidden />
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
