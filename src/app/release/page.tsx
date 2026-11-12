import { Metadata } from 'next';
import Link from "next/link";
import './release.css';

import { Sparkle } from "lucide-react";

import { getEntries } from '@/app/entries/api/entries.api';
import ReleaseSample from '@/app/release/components/release-samples';
import ReleaseSky from '@/app/release/components/sky/release-sky';
import WordCounterBox from '@/app/release/components/word-counter-box';
import { RELEASES_FEED_PATH } from '@/app/release/constants/release.constants';
import Typewriter from '@/components/fancy/text/typewriter';
import { buttonVariants } from '@/components/ui/button';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Release - astryss*',
  description: 'Release your feelings to the stars — a place for your thoughts to live.',
  keywords: ["astryss", "anonymous messages", "release feelings", "online diary", "safe space to share feelings", "sulyap", "freedom wall app philippines", "post anonymously online"],
  openGraph: {
    title: "",
    description: "Release your feelings to the stars — a place for your thoughts to live. The stars are listening.",
    images: [""]
  },
  twitter: {
    title: "",
    description: "Release your feelings to the stars — a place for your thoughts to live. The stars are listening.",
    images: [""]
  },
};

export default async function ReleasePage() {
  const entries = await getEntries(6, undefined, "release");

  return (
    <main className="release-page">
      <ReleaseSky />

      <section className="release-stage main-container">
        <div className="release-hero flex flex-col items-center gap-3 text-center lg:items-start lg:gap-5 lg:text-left">
          <h1 className="text-4xl font-bold text-[#fff4dc] sm:text-5xl lg:text-7xl">astryss*</h1>

          <p className="max-w-md rotate-2 border-4 border-black bg-secondary-background px-4 py-2 text-xs leading-5 text-foreground sm:text-sm lg:max-w-lg lg:px-6 lg:py-4 lg:text-base lg:leading-7">
            <span>
              Send your feelings to the stars — a place for your thoughts to&nbsp;
            </span>
            <span className="bg-main px-1">
              <Typewriter
                as="span"
                text={["shine", "live", "stay", "glow", "sparkle", "radiate", "twinkle"]}
                speed={70}
                waitTime={1500}
                deleteSpeed={40}
                cursorChar={"_"}
              />
            </span>
          </p>

          <p className="inline-flex -rotate-1 items-center gap-2 border-4 border-black bg-chart-3 px-4 py-1.5 text-xs text-foreground sm:text-sm lg:px-6 lg:py-2">
            The stars are listening.
            <Sparkle aria-hidden className="size-4 lg:size-5" />
          </p>
        </div>

        <WordCounterBox />
      </section>

      <section className="main-container pb-8">
        <ReleaseSample initialEntries={entries} />

        <div className="mt-8 flex justify-center">
          <Link
            href={RELEASES_FEED_PATH}
            className={buttonVariants({ variant: "neutral", className: "cursor-pointer" })}
          >
            See what others released.
          </Link>
        </div>
      </section>
    </main>
  )
}
