import { Metadata } from 'next';
import './release.css';

import { Sparkle } from "lucide-react";
import * as motion from "motion/react-client";

import { getEntries } from '@/app/entries/api/entries.api';
import ReleaseSample from '@/app/release/components/release-samples';
import WordCounterBox from '@/app/release/components/word-counter-box';
import Typewriter from '@/vendor/fancy/text/typewriter';

export const metadata: Metadata = {
  title: 'Release - astryss*',
  description: 'Release your feelings to the stars — a place for your thoughts to live.',
  keywords: ["astryss", "freedom wall", "anonymous messages", "release feelings", "online diary", "safe space to share feelings"],
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
  const entries = await getEntries(6);

  return (
    <main className="main-container pt-12 md:pt-20">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex flex-col items-center"
      >
        <h1 className="text-6xl text-accent font-bold">astryss*</h1>

        <div className="bg-accent px-6 py-4 rotate-2 mt-6 text-secondary-background">
          <span>
            Send your feelings to the stars — a place for your thoughts to&nbsp;
          </span>
          <span className=''>
            <Typewriter
              text={["shine", "live", "stay", "glow", "sparkle", "radiate", "twinkle"]}
              speed={70}
              className="text-yellow-500"
              waitTime={1500}
              deleteSpeed={40}
              cursorChar={"_"}
            />
          </span>
        </div>

        <div className="inline-flex items-center gap-2 bg-chart-3 px-6 py-2 -rotate-1 mt-8 text-foreground border-4">
          The stars are listening.
          
          <Sparkle className="w-5 h-5"/>
        </div>

        <WordCounterBox />
      </motion.section>

      <ReleaseSample initialEntries={entries} />
    </main>
  )
}