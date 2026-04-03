"use client"
import { useState } from "react";
import { Emotion, EMOTIONS } from "@/shared/constants/emotions";
import { motion } from "motion/react";
import { cn } from "@/vendor/lib/utils";

const MOCK_ENTRIES: any[] = [
  {
    id: "1",
    recipient: "J.",
    sender: "Shattered",
    content: "I wrote 4 paragraphs then deleted it all. You were right, we're just fundamentally different people. I just wish you told me before 2 years went by.",
    emotion: "sad",
    variants: ["legacy"],
    createdAtToNow: "2 days ago",
    createdAtFormatted: "Apr 01, 2026"
  },
  {
    id: "2",
    recipient: "Manager Tom",
    sender: "Burnout Dev",
    content: "If you ask me to work one more weekend for 'equity' that doesn't exist, I swear I am deleting the prod database. Fix your management style.",
    emotion: "angry",
    variants: ["dev"],
    createdAtToNow: "5 hours ago",
    createdAtFormatted: "Apr 03, 2026"
  },
  {
    id: "3",
    recipient: "Coffee Shop Girl",
    sender: "Macbook Guy",
    content: "You draw little cats on my cup every morning and it's the only genuine smile I get all day. I'm too shy to say thank you out loud.",
    emotion: "inlove",
    variants: ["beta"],
    createdAtToNow: "1 day ago",
    createdAtFormatted: "Apr 02, 2026"
  },
  {
    id: "4",
    recipient: "Myself from 2018",
    sender: "Future You",
    content: "Don't sell the Bitcoin yet. And definitely don't date Sarah. We are exhausted right now, but hey, we survived.",
    emotion: "other",
    variants: [],
    createdAtToNow: "4 minutes ago",
    createdAtFormatted: "Apr 03, 2026"
  },
  {
    id: "5",
    recipient: "M.",
    sender: "Anonymous",
    content: "I still wear the hoodie you left at my place. Not because I miss you, but because it's objectively a really comfortable hoodie. Stop asking for it back.",
    emotion: "angry",
    variants: ["legacy", "beta"],
    createdAtToNow: "1 week ago",
    createdAtFormatted: "Mar 27, 2026"
  },
  {
    id: "6",
    recipient: "The Void",
    sender: "Observer",
    content: "Just testing if this actually works or if I am screaming into absolutely nothing.",
    emotion: "other",
    variants: ["dev"],
    createdAtToNow: "Just now",
    createdAtFormatted: "Apr 03, 2026"
  }
];

export default function UnsentMessages() {
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | undefined>();

  const filteredEntries = selectedEmotion 
    ? MOCK_ENTRIES.filter(entry => entry.emotion === selectedEmotion)
    : MOCK_ENTRIES;

  return (
    <section className="mt-12 space-y-16">
      <motion.div 
        className="flex justify-center gap-4 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {EMOTIONS.map((emotion) => (
          <motion.button
            key={emotion}
            onClick={() => setSelectedEmotion(selectedEmotion === emotion ? undefined : emotion)}
            className={cn(
              "will-change-transform px-6 py-3 border-4 border-accent cursor-pointer font-bold transition-colors",
              selectedEmotion === emotion ? 'bg-accent text-main' : 'bg-white text-black hover:bg-gray-100'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
          </motion.button>
        ))}
      </motion.div>

      {/* Grid Display for Unsent Messages */}
      <p className="text-center">under development</p>

      {filteredEntries.length === 0 && (
        <div className="text-center py-20 px-4 border-4 bg-white rotate-2 max-w-xl mx-auto">
          <p className="text-2xl font-black uppercase">No unsent messages found.</p>
          <p className="font-bold opacity-60 mt-2">The void is empty for this emotion.</p>
        </div>
      )}
    </section>
  )
}