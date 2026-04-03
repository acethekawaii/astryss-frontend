import { Button } from "@/vendor/ui/button";
import { ArrowRight, Facebook, Twitter } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-accent mt-12 md:mt-54">
      <div className="main-container md:pt-40 py-6 w-full  relative ">
        <div className="md:absolute md:-top-36 md:left-1/2 md:-translate-x-1/2 inline-block border-accent border-4 bg-main px-8 py-8 space-y-5">
          <h1 className="md:text-6xl font-black">Ready to share?</h1>
          <p className="leading-relaxed opacity-75">You're not alone. Hundreds of voices are already whispering their stories into the stars — and yours might be the one someone needs tonight.</p>
          <Link href="/release">
            <Button className="cursor-pointer" variant="neutral">
              Release
              <ArrowRight />
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-12 border-t-4 border-main mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl text-main">astryss*</h1>

            <div className="flex gap-2">
              <Twitter className="w-8 h-8 text-main"/>
              <Link href="https://www.facebook.com/acethekawaii" target="_blank">
                <Facebook className="w-8 h-8 text-main"/>
              </Link>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-white opacity-50 text-center mt-8">Made with ✦ for everyone who needs to be heard</p>
      </div>
    </footer>
  )
}