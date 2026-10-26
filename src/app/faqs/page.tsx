import { Metadata } from "next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/vendor/ui/accordion";

type FaqEntry = { id: number; question: string; answer: string };

const FAQS: FaqEntry[] = [
  {
    id: 1,
    question: "Are My Posts Truly Anonymous?",
    answer: "Yes, your posts are genuinely anonymous. Even our developers remain unaware of your true identity."
  },
  {
    id: 2,
    question: "Will the person I wrote this about know it's for them?",
    answer: "Only if you tell them. Astryss doesn't snitch.",
  },
  {
    id: 3,
    question: "I cried while writing an entry, and I would like to file charges. Help?",
    answer: "Heh.",
  },
]

export const metadata: Metadata = {
  title: "FAQ's - astryss*",
  description: "astryss* is an anonymous freedom wall where thoughts, emotions, and unspoken feelings are released into the stars. No profiles. No judgment. Just honesty.",
  keywords: ["Astryss FAQ's", "anonymous sharing", "freedom wall", "star themed website"]
};

export default function Home() {
  return (
    <main className="main-container pt-12 md:pt-20">
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:grid-rows-[auto_1fr] md:gap-x-12 md:gap-y-8 lg:gap-x-16">
        <div className="md:col-start-1 md:row-start-1">
          <h1 className="text-5xl font-black">FAQ's</h1>
          <p className="opacity-50 mt-2">Yes, somehow we do have Frequently Asked Questions.</p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="min-w-0 w-full space-y-4 md:col-start-2 md:row-start-1 md:row-span-2"
        >
          {FAQS.map((faq) => (
            <AccordionItem key={faq.id} value={`faq-${faq.id}`} className="w-full">
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <img
          src="/assets/astryss-quote.svg"
          alt=""
          aria-hidden="true"
          className="hidden md:block md:col-start-1 md:row-start-2 md:self-end md:justify-self-start w-[280px] max-w-full h-auto object-contain select-none pointer-events-none"
        />
      </div>
    </main>
  )
}