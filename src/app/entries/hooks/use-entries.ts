import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createEntry, getEntries, getEntry } from "../api/entries.api";
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
    
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEntry,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      
      toast.success("Your message has been sent to the stars! ✨");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send your message");
      console.log(error);
    },
  });
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: ["entry", id],
    queryFn: () => getEntry(id),
  });
}