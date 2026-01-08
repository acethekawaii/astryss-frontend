"use client"
import { useState } from "react";

import { MousePointerClick } from "lucide-react"; 
import { motion } from "motion/react";

const timelineData = [
  { 
    year: 2023, 
    content: "Formerly known as Masked Emotions. It began quietly as a capstone project built by a team of three during the Kodego Web Development Bootcamp. It meant to give people a place to speak without being seen." 
  },
  { 
    year: 2024, 
    content: "The site floated in the void of the internet, technically alive but mostly unheard. Only 58 messages ever passed through. Proof that someone, somewhere, still needed it." 
  },
  { 
    year: 2025, 
    content: "Development of version 2 began — We rebuilt everything from the ground up. Astryss was born." 
  },
  { 
    year: 2026, 
    content: "Astryss goes live. Not as a product, but as a place where unspoken things are finally allowed to glow." 
  },
]

export default function Timeline() {
  const [selectedYearIndex, setSelectedYearIndex] = useState(2);

  return (
    <section className="main-container md:h-screen md:flex gap-20 mt-4">
      <div className="w-full md:w-1/2 md:h-240 md:py-16 py-8 text-2xl md:text-[12.5rem] font-year font-black flex md:flex-col justify-between items-start leading-none">
        {timelineData.map((item, index) => {
          const isSelected = index === selectedYearIndex;
          
          return (
            <motion.button 
              key={item.year} 
              onClick={() => setSelectedYearIndex(index)}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.7 }}
              className={`cursor-pointer`}
            >
              <time className={`transition-all duration-700 ${isSelected ? "" : "opacity-35 text-text-600"}`} dateTime={`${item.year}`}>
                {item.year}
              </time>
            </motion.button>
          )
        })}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.65 }}
        className="md:w-1/2 flex flex-col justify-center"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-0.5 bg-linear-to-r from-[#8b7355] to-transparent" />
          <span className="text-sm tracking-widest" style={{ color: '#8b7355' }}>TIMELINE</span>
        </div>
        <h1 className="text-5xl font-bold my-4">Our Story</h1>
        <div className="w-24 h-1 bg-linear-to-r from-[#8b7355] to-[#d4c5a0]" />

        <motion.p 
          key={selectedYearIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: .7, delay: 0.5 }}
          className="leading-relaxed mt-8 md:mt-16"
        >
          {timelineData[selectedYearIndex].content}
        </motion.p>

        <motion.div 
          className="mt-8 md:mt-16 flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-10 h-10 border-2 rounded-lg flex items-center justify-center border-[#8b7355]">
            <MousePointerClick className="text-[#8b7355]" />
          </div>
          <span className="text-sm tracking-wide" style={{ color: '#8b7355' }}>
            Click on any year to explore
          </span>
        </motion.div>
      </motion.div>
    </section>
  )
}