"use client";

import { useId } from "react";
import { Flame, Frown, Heart, Sparkles, type LucideIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";

import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";
import { EMOTION_LABELS, type Emotion } from "@/shared/constants/emotions";
import { cn } from "@/vendor/lib/utils";
import { FormField, FormItem, FormMessage } from "@/vendor/ui/form";

import { MOOD_ATMOSPHERES } from "../constants/mood-atmospheres";

const MOOD_OPTIONS: Array<{ value: Emotion; icon: LucideIcon }> = [
  { value: "inlove", icon: Heart },
  { value: "sad", icon: Frown },
  { value: "angry", icon: Flame },
  { value: "other", icon: Sparkles },
];

export default function MoodPicker({ isDisabled }: { isDisabled: boolean }) {
  const { control } = useFormContext<CreateEntryInput>();
  const labelId = useId();

  return (
    <div className="border-t-4 bg-chart-3/30 px-6 py-5">
      <FormField
        control={control}
        name="emotion"
        render={({ field }) => (
          <FormItem>
            <div>
              <p id={labelId} className="font-bold">How does this feel?</p>
              <p className="text-xs opacity-60">Optional — leave it blank if no label fits.</p>
            </div>
            <div role="group" aria-labelledby={labelId} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MOOD_OPTIONS.map(({ value, icon: Icon }) => {
                const isSelected = field.value === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => field.onChange(isSelected ? undefined : value)}
                    disabled={isDisabled}
                    className={cn(
                      "flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 border-2 bg-secondary-background px-2 py-3 text-xs transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      isSelected && MOOD_ATMOSPHERES[value].selectedClassName,
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                    <span>{EMOTION_LABELS[value]}</span>
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
