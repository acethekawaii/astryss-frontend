"use client"
import Link from "next/link";
import { useEffect, useState } from "react";

import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger, 
  navigationMenuTriggerStyle
} from "@/vendor/ui/navigation-menu"
import { Button } from "@/vendor/ui/button";

import { Menu,Github, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Release",
    href: "/release",
    description:
      "Release your feelings to the stars — a place for your thoughts to live.",
  },
  {
    title: "Unsent",
    href: "/unsent",
    description:
      "A collection of text messages that never reached their ddestination.",
  },
  {
    title: "Entries",
    href: "/entries",
    description:
      "Browse all public entries created across the platform.",
  },
]

export default function Header() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <>
      <header 
        className={`px-4 w-full py-4 fixed top-0 flex justify-between md:justify-center items-center gap-6 z-60 transition-all duration-500 ease-in-out ${hasScrolled ? "shadow-sm bg-background" : "shadow-none"}`}
      >
        <Image src="/assets/brand-logo-outlined.png" alt="Logo" width={100} height={100} className="hidden md:block h-16 w-auto relative"/>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/">
                  Home
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Begin Here</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-full md:w-[400px] gap-2 p-2">
                  {components.map((component) => (
                    <ListItem
                      key={component.title}
                      title={component.title}
                      href={component.href}
                    >
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/time-capsule">
                  Time Capsule
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="hidden">
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/">
                  API
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/faqs">
                  FAQ's
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        <div className="md:hidden flex gap-2 items-center">
          {isOpen ? (
            <Button variant="neutral" onClick={() => setIsOpen(false)} >
              <X size={32}/>
            </Button>
          ) : (
            <Button variant="neutral" onClick={() => setIsOpen(true)} >
              <Menu size={32} />
            </Button>
          )}
        </div>

        <Button variant="neutral" className="cursor-pointer" asChild>
          <Link href="https://github.com/lugh-tuatha/astryss-frontend" target="_blank" >
            2 Stars
            <Github />
          </Link>
        </Button>
      </header>

      {isOpen && (
        <div className="md:hidden main-container bg-background py-4 fixed top-[73px] overflow-auto h-screen z-50">
          <h1 className="font-thin opacity-75">Menu</h1>
          <ul className="text-2xl space-y-4">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/faqs">FAQ's</Link>
            </li>
          </ul>

          <h1 className="font-thin opacity-75 mt-8">Begin Here</h1>
          <ul className="text-2xl mt-2 space-y-4">
            <li>
              <Link href="/entries">Entries</Link>
            </li>
            <li>
              <Link href="/release">Release</Link>
            </li>
            <li>
              <Link href="/unsent">Unsent</Link>
            </li>
          </ul>
        </div>
      )}
    </>
  )
}

interface ListItemProps {
  title: string;
  children: React.ReactNode;
  href: string;
}

function ListItem({ title, children, href }: ListItemProps) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link href={href} className="block text-main-foreground select-none space-y-1 rounded-base border-2 border-transparent p-3 leading-none no-underline outline-hidden transition-colors hover:border-border">
          <div className="text-base font-heading leading-none">{title}</div>
          <p className="font-base line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
ListItem.displayName = "ListItem"