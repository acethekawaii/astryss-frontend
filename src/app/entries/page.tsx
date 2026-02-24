import { Metadata } from "next";

import * as motion from "motion/react-client";

import { Card } from "@/vendor/ui/card";

import ReleaseMessages from "./components/release-messages";
import { getEntries } from "@/app/entries/api/entries.api";

export const metadata: Metadata = {
  title: "Entries - astryss*",
  description: "Browse all public entries created accross the platform.",
  keywords: ["astryss", "freedom wall entries", "astryss entries", "public confessions", "anonymous pinoy confession", "write anonymously online"]
};

export default async function EntriesPage() {
  const entries = await getEntries(18);

  return (
    <main className="main-container pt-12 md:pt-20">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="inline-flex px-8 mx-auto mt-8 bg-chart-3">
          <h1 className="text-xl md:text-6xl text-center font-normal">RELEASED MESSAGES</h1>
        </Card>
        <p className="mt-4 md:text-xl font-normal">Anonymous thoughts and feelings from the community</p>
        <div className="mt-8 inline-flex items-center gap-2 bg-accent text-main px-6 py-4 rotate-2 hover:rotate-0 transition-all cursor-pointer">
          Found {entries.meta.total} Messages 
        </div>
      </motion.div>

      <ReleaseMessages initialEntries={entries} />
    </main>
  )
}