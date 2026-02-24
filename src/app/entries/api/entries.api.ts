import { CreateEntryInput } from "../schema/entry.schema";
import { EntriesResponse, Entry, CreateEntryDTO } from "../types/entry.types";
import { API_CONFIG } from "@/shared/config/api.config"; 
import { Emotion } from "@/shared/constants/emotions";
import { EntryType } from "@/shared/constants/entry-type";
import { ApiResponse } from "@/shared/types/api.types";

export async function getEntries(
  limit: number, 
  cursor?: string,
  type?: EntryType,
  emotion?: Emotion
): Promise<EntriesResponse> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) {
      params.append('cursor', cursor);
    }
    
    if (type) {
      params.append('type', type);
    }
    
    if (emotion) {
      params.append('emotion', emotion);
    }

    const url = `${API_CONFIG.BASE_URL}/entries?${params.toString()}`;

    const response = await fetch(url, {
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: EntriesResponse = await response.json();

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Fetch error:', error.message);
      throw error;
    }
    
    throw new Error('An unexpected error occurred while fetching entries');
  }
}

export async function createEntry(data: CreateEntryInput): Promise<ApiResponse<CreateEntryDTO>> {
  const formData = new FormData();

  if (data.displayName) {
    formData.append("displayName", data.displayName);
  }
  formData.append("content", data.content);
  formData.append("type", data.type);
  if (data.emotion) {
    formData.append("emotion", data.emotion);
  }
  if (data.variants?.length) {
    data.variants.forEach((v) => {
      formData.append("variants[]", v);
    });
  }

  if (data.avatar && data.avatar.length > 0) {
    formData.append("image", data.avatar[0]);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}/entries`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create entry");
  }

  return response.json();
}

export async function getEntry(id: string): Promise<Entry | null> {
  try {
    const url = `${API_CONFIG.BASE_URL}/entries/${id}`;

    const response = await fetch(url, {
      next: {
        revalidate: 300,
        tags: [`entry-${id}`],
      },
    });

    console.log(response)

    if (!response.ok) {
      return null;
    }

    const data: ApiResponse<Entry> = await response.json();

    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Fetch error:', error.message);
      throw error;
    }
    
    throw new Error('An unexpected error occurred while fetching entry');
  }
}