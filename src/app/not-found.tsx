import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold">404</h1>
      <h2 className="mb-4 text-2xl font-semibold">Entry Not Found</h2>
      <p className="mb-8 max-w-md text-lg opacity-75">
        The entry you're looking for doesn't exist or may have been removed.
      </p>
      <Link href="/entries" className={buttonVariants()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Entries
      </Link>
    </main>
  );
}
