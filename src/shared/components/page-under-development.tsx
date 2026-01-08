import { Button } from "@/vendor/ui/button";
import { Pointer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function PageUnderDevelopment() {
  return (
    <div className="text-center text-red-600 py-8 space-y-4">
      <p className="text-sm">This page is still under development. Come back soon!</p>
      <p className="text-sm">For now, here's a meme.</p>
      <Image 
        src="/assets/meme/skibidi-bop.png" 
        alt="Skibidi Bop Yes Meme" 
        width={500} 
        height={500} 
        className="md:w-1/2 mx-auto border-4 border-border"
      />
      <Link href="/release">
        <Button className="cursor-pointer">
          Check out Release
        </Button>
      </Link>
    </div>
  )
}