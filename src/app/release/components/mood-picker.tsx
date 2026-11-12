"use client";

import { useId } from "react";
import { Flame, Frown, Heart, Sparkles, type LucideIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";

import type { CreateEntryInput } from "@/app/entries/schema/entry.schema";
import { EMOTION_LABELS, type Emotion } from "@/shared/constants/emotions";
import { cn } from "@/lib/utils";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { MOOD_ATMOSPHERES } from "../constants/mood-atmospheres";

const MOOD_OPTIONS: Array<{ value: Emotion; icon: LucideIcon }> = [
  { value: "inlove", icon: Heart },
  { value: "sad", icon: Frown },
  { value: "angry", icon: Flame },
  { value: "other", icon: Sparkles },
];

/**
 * One row of four on every screen: icon over label on phones, side by side once there's room.
 * Pressing the picked mood again clears it.
 */
export default function MoodPicker({ isDisabled }: { isDisabled: boolean }) {
  const { control } = useFormContext<CreateEntryInput>();
  const labelId = useId();

  return (
    <div className="shrink-0 border-t-2 bg-chart-3/30 px-4 py-2 sm:px-5 sm:py-2.5">
      <FormField
        control={control}
        name="emotion"
        render={({ field }) => (
          <FormItem className="gap-1.5">
            <p className="text-xs leading-4">
              <span id={labelId} className="text-sm font-bold">How does this feel?</span>{" "}
              <span className="opacity-60">Optional — leave it blank if no label fits.</span>
            </p>
            <ToggleGroup
              aria-labelledby={labelId}
              value={field.value ? [field.value] : []}
              onValueChange={(values) => field.onChange(values[0])}
              disabled={isDisabled}
              className="grid w-full grid-cols-4 gap-1.5 sm:gap-2"
            >
              {MOOD_OPTIONS.map(({ value, icon: Icon }) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className={cn(
                    "h-auto min-h-11 min-w-0 cursor-pointer flex-col gap-0.5 px-1 py-1 text-center text-[11px] leading-tight whitespace-normal sm:flex-row sm:gap-1.5 sm:px-2 sm:text-xs",
                    MOOD_ATMOSPHERES[value].selectedClassName,
                  )}
                >
                  <Icon aria-hidden />
                  <span>{EMOTION_LABELS[value]}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
