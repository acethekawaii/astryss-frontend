"use client"
import { Sparkle } from "lucide-react";
import { motion } from "motion/react";

import StarField from "./star-field";

export default function Hero() {
  return (
    <section className="bg-linear-to-b from-[#0c0a1a] via-[#09040e] to-[#050208]">
      <StarField />

      <div className="main-container h-screen flex flex-col items-center justify-center gap-8">
        <motion.div
          initial={{ opacity: 0}}
          animate={{ opacity: 1}}
          transition={{ delay: 2, duration: 0.75, ease: "easeOut" }} 
        >
          <Sparkle className="h-5 w-5 text-[#f6dbbc] fill-current animate-pulse"/>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: .5, duration: 1.4, ease: "easeOut" }}
          className="md:w-2/3 leading-relaxed md:text-3xl text-white text-center text-xl"
        >
          Newton's third law: to move forward you have to leave something behind.
        </motion.p>
      </div>
    </section>
  )
}
