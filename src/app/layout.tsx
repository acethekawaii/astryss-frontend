import { Space_Grotesk, JetBrains_Mono, Inter_Tight } from "next/font/google"
import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/vendor/ui/sonner"

import ReactQueryProvider from "@/shared/providers/react-query-provider";
import Header from "@/shared/components/navigation-menu";
import Footer from "@/shared/components/footer";
// import Footer from "@/shared/components/footer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
})

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
})

const interTight = Inter_Tight({
  variable: "--font-year",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://astryss.com"),
  openGraph: {
    siteName: "astryss*",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@astryss",
  },
  verification: {
    google: 'pWi6Py0Riifa7tY7mo2-i3sZhkvmClxghtZyiSwjA74',
  },
};

export default async function RootLayout({  
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrains.className} ${spaceGrotesk.className} ${interTight.variable} antialiased`}>
        <ReactQueryProvider>
          <Header />
          {children}
          <Footer />
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
