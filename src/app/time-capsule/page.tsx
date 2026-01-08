import { Metadata } from "next";

import * as motion from "motion/react-client";

import { Card } from "@/vendor/ui/card";
import PageUnderDevelopment from "@/shared/components/page-under-development";

export const metadata: Metadata = {
  title: 'Time Capsule - astryss*',
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


export default function TimeCapsulePage() {
  return (
    <main className="main-container pt-12 md:pt-20">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="inline-flex px-8 mx-auto mt-8 bg-chart-3">
          <h1 className="text-xl md:text-6xl text-center font-normal">TIME CAPSULE</h1>
        </Card>

        <p className="mt-4 md:text-xl font-normal">Send a message to your future self and open it again after two years (or whatever time you want).</p>
      </motion.div>

      <PageUnderDevelopment />
    </main>
  )
}