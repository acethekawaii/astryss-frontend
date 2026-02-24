"use client";
import { useEntries } from "@/app/entries/hooks/use-entries";
import ReleaseSampleCard from "./release-sample-card";
import { EntriesResponse, Entry } from "@/app/entries/types/entry.types";

export default function ReleaseSample({ initialEntries }: { initialEntries: EntriesResponse }) {
  const { data, isFetchingNextPage, error } = useEntries({ limit: 6, type: 'release', initialData: initialEntries });

  const entries = data?.pages.flatMap((page) => page.data) ?? [];
  
  if (isFetchingNextPage) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <section className="mt-12 grid md:grid-cols-3 gap-10">
      {entries?.map((entry: Entry, index: number) => (
        <ReleaseSampleCard 
          key={entry._id}
          index={index}
          displayName={entry.displayName}
          content={entry.content}
          emotion={entry.emotion}
          variants={entry.variants}
          createdAt={entry.created_at}
          className={index % 3 === 0 ? 'rotate-1' : index % 3 === 1 ? '-rotate-1' : 'rotate-2'}
        />
      ))}
    </section>
  )
}