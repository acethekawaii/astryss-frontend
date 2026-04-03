import { Metadata } from "next";

import * as motion from "motion/react-client";

import { Card } from "@/vendor/ui/card";
import UnsentMessages from "./components/unsent-messages";
import { FileWarning, PenLine } from "lucide-react";
import { Button } from "@/vendor/ui/button";

export const metadata: Metadata = {
  title: 'Unsent - astryss*',
  description: 'A collection of text messages that never reached their destination.',
  keywords: ["astryss", "freedom wall", "anonymous messages", "the unsent project"],
  openGraph: {
    title: "",
    description: "A collection of text messages that never reached their ddestination.",
    images: [""]
  },
  twitter: {
    title: "",
    description: "A collection of text messages that never reached their destination.",
    images: [""]
  },
};

export default function EntriesPage() {
  return (
    <main className="main-container pt-12 md:pt-20">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* <Card className="inline-flex px-8 mx-auto mt-8 bg-chart-3">
          <h1 className="text-xl md:text-6xl text-center font-normal">UNSENT MESSAGES</h1>
        </Card> */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-8"
        >
          <Card className="bg-chart-4 p-8 md:p-12 relative rotate-1 hover:rotate-0 transition-transform duration-300">
            <FileWarning className="absolute -top-8 -right-8 w-16 h-16 text-black rotate-12 bg-white rounded-full p-2 border-4 border-accent" />
            
            <h2 className="text-2xl md:text-5xl font-black uppercase leading-tight">
              Have something you<br/>can't send?
            </h2>
            <p className="md:text-xl font-bold opacity-80">
              Write it. Seal it. Release it to the void. Let it be seen.
            </p>
            
            <Button 
              className="md:text-lg py-6 md:py-8 cursor-pointer"
            >
              <PenLine className="mr-2 w-6 h-6 stroke-3" />
              SEAL A MESSAGE
            </Button>
          </Card>
        </motion.div>

        <div className="mt-8 inline-flex items-center gap-2 bg-accent text-main px-6 py-4 rotate-2 hover:rotate-0 transition-all cursor-pointer font-bold">
          Found 0 Message 
        </div>
      </motion.div>

      <UnsentMessages />

      {/* <p>Heavily inspired by The Unsent Project</p> */}
    </main>
  )
}