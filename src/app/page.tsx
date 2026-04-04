import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { ArrowRight, Star } from "lucide-react";
import * as motion from "motion/react-client"; 
import { Card, CardContent } from "@/vendor/ui/card";
import { Button } from "@/vendor/ui/button";

import Timeline from "@/app/components/timeline";
import Astronaut from "@/assets/astronaut.png";
import AboutHero from "@/assets/about-hero-bg.png";
import RandomLetterSwapForward from "@/vendor/fancy/text/random-letter-swap-forward-anim";

export const metadata: Metadata = {
  title: "Home - astryss*",
  description: "astryss* is an anonymous freedom wall where thoughts, emotions, and unspoken feelings are released into the stars. No profiles. No judgment. Just honesty.",
  keywords: ["astryss", "anonymous sharing", "freedom wall", "freedom wall ph", "star themed website", "space themed website", "masked emotions", "anonywall", "duoplay", "acethekawaii"]
};

export default function Home() {
  return (
    <main>
      <section className="main-container mt-24 md:mt-32">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-accent text-main px-6 py-4 rotate-4 hover:rotate-0"
        >
          <Star className="w-5 h-5" />
          Version 2.0
        </motion.div>

        <div className="md:flex items-center">
          <div className="w-full md:w-1/2">
            <motion.h1 
              className="text-6xl md:text-9xl mt-6 text-accent font-black"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.30, ease: "easeOut" }}
            >
              <RandomLetterSwapForward label="astryss*" reverse={true} />
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
            >
              <Card className="bg-main mt-6 md:mt-12">
                <CardContent className="leading-relaxed">
                  Send your feelings to the stars — a place for your thoughts to live. The stars are listening.
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.p 
              className="mt-6 md:mt-12 leading-relaxed text-justify"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.60 }}
            >
              Share your thoughts anonymously and without judgement with a community that listens. No judgments, no profiles — just pure, honest feelings floating among the stars.
            </motion.p>

            <motion.div
              className="mt-6 md:mt-12 flex gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.75, ease: "easeOut" }}
            >
              <Link href="/release">
                <Button className="px-8 py-6 cursor-pointer">
                  Release
                  <ArrowRight />
                </Button>
              </Link>
              <Link href="/entries">
                <Button variant="neutral" className="px-8 py-6 cursor-pointer">Read Others</Button>
              </Link>
            </motion.div> 
          </div>

          <div className="w-full h-full mt-6 md:mt-0 md:w-2/3 relative flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0}}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.90, ease: "easeOut" }}
            >
              <Image
                src={AboutHero}
                className="w-full rounded-base"
                width={600} 
                height={400} 
                alt="About Hero Background" 
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{
                opacity: 1,
                y: [0, -20, 0],
                x: [0, 10, 0],
                rotate: [0, 5, 0, -5, 0],
              }}
              viewport={{ once: true }}
              transition={{
                opacity: { duration: 0.5, delay: 1.05, ease: "easeOut" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-2/3 absolute"
            >
              <Image 
                src={Astronaut}
                width={400} 
                height={225} 
                alt="Astronaut holding star" 
              />
            </motion.div>
          </div>
        </div>
      </section>

      <Timeline />
    </main>
  );
}
