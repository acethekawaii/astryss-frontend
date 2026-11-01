// One read per file, shared by the avatar preview and the draft store.
const dataUrlCache = new WeakMap<File, Promise<string>>();

export function readFileAsDataUrl(file: File): Promise<string> {
  const cached = dataUrlCache.get(file);
  if (cached) return cached;

  const pending = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("FileReader did not return a data URL"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });

  dataUrlCache.set(file, pending);
  pending.catch(() => dataUrlCache.delete(file));
  return pending;
}

/** Seeds the cache for a file rebuilt from a data URL we already hold. */
export function rememberFileDataUrl(file: File, dataUrl: string): void {
  dataUrlCache.set(file, Promise.resolve(dataUrl));
}

export function dataUrlToFile(dataUrl: string, name: string): File | null {
  const separatorIndex = dataUrl.indexOf(",");
  const header = /^data:([^;,]+);base64$/.exec(dataUrl.slice(0, separatorIndex));
  if (separatorIndex < 0 || !header) return null;

  try {
    const binary = atob(dataUrl.slice(separatorIndex + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new File([bytes], name, { type: header[1] });
  } catch {
    return null;
  }
}
