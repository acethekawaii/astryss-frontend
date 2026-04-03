import Image from "next/image";
import { Loader2 } from "lucide-react";
import neonCat from "@/assets/gifs/neon-cat.gif";

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center py-12">
      <div className="bg-chart-3 border-4 border-accent p-8 md:p-12 rotate-2 hover:-rotate-1 transition-transform relative max-w-sm w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="absolute -top-6 -left-6 bg-white border-4 border-accent p-3 -rotate-12">
          <Loader2 className="w-8 h-8 animate-spin stroke-[3px]" />
        </div>
        
        <Image 
          width={320} 
          height={180} 
          src={neonCat}
          alt="Neon Cat Loading" 
          className="h-32 md:h-40 w-auto rounded-none border-4 border-accent mx-auto mb-8 bg-black object-cover" 
        />
        
        <h2 className="text-2xl md:text-3xl font-black uppercase text-center mb-2 leading-tight">
          Entering The Void
        </h2>
        <div className="bg-white border-4 border-accent py-2 mt-4 -mx-4 -mb-16 md:-mb-20 rotate-1 flex justify-center">
          <p className="text-center font-bold uppercase tracking-[0.2em] text-sm animate-pulse">
            Loading Data...
          </p>
        </div>
      </div>
    </div>
  )
}