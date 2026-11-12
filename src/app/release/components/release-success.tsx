"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Eye, PenLine, Sparkles } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";

import { RELEASES_FEED_PATH } from "../constants/release.constants";

type Props = {
  /** Null when the API response carried no id; the link to the entry is left out rather than guessed. */
  entryId: string | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  /** Seconds to wait so the badge lands after the star animation has had its moment. */
  revealDelay: number;
  onWriteAnother: () => void;
};

export default function ReleaseSuccess({ entryId, headingRef, revealDelay, onWriteAnother }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <motion.div
        className="flex size-14 items-center justify-center rounded-full border-2 bg-main shadow-shadow"
        initial={{ scale: 0.4, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: revealDelay + 0.1 }}
      >
        <Sparkles className="size-7" aria-hidden />
      </motion.div>

      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">It&apos;s out there.</h2>
        <p className="mt-1 opacity-70">You&apos;re not carrying it alone.</p>
      </div>

      <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
        {entryId && (
          <Link
            href={`/entries/${encodeURIComponent(entryId)}`}
            className={buttonVariants({ className: "cursor-pointer" })}
          >
            View message
            <Eye aria-hidden />
          </Link>
        )}
        <Button type="button" variant="neutral" onClick={onWriteAnother} className="cursor-pointer">
          Write another
          <PenLine aria-hidden />
        </Button>
        <Link
          href={RELEASES_FEED_PATH}
          className={buttonVariants({ variant: "neutral", className: "cursor-pointer" })}
        >
          Browse releases
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </div>
  );
}
