import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createEntry, getEntries, getEntry } from "../api/entries.api";
import type { CreateEntryInput } from "../schema/entry.schema";
import { EntriesResponse } from "../types/entry.types";
import { Emotion } from "../../../shared/constants/emotions";
import { EntryType } from "../../../shared/constants/entry-type";

interface UseEntriesOptions {
  type?: EntryType;
  emotion?: Emotion;
  limit?: number;
  initialData?: EntriesResponse;
}

export function useEntries(options: UseEntriesOptions = {}) {
  const { type, emotion, limit = 18, initialData } = options;

  return useInfiniteQuery({
    queryKey: ["entries", { limit, type, emotion }],

    queryFn: ({ pageParam }) => getEntries(limit, pageParam, type, emotion),

    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined;
    },

    initialPageParam: undefined as string | undefined,

    initialData: initialData ? {
      pages: [initialData],
      pageParams: [undefined],
    } : undefined,
    
    // Server data gives the page an immediate first render, then an on-mount
    // refetch protects client-side navigation from a prefetched/stale RSC tree.
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
}

/** Success and failure feedback belongs to the caller, so raw server messages never reach writers. */
export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEntryInput) => createEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["entries"],
        refetchType: "all",
      });
    },
  });
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: ["entry", id],
    queryFn: () => getEntry(id),
  });
}
