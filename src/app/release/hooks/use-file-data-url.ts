import { useEffect, useState } from "react";

import { readFileAsDataUrl } from "../lib/file-data-url";

/** A data URL for previewing `file`, or null while there is no file or it is still being read. */
export function useFileDataUrl(file: File | undefined): string | null {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file) return;

    let isCurrent = true;
    readFileAsDataUrl(file)
      .then((url) => {
        if (isCurrent) setPreview({ file, url });
      })
      .catch(() => {
        // An unreadable file keeps the default avatar in the preview.
      });

    return () => {
      isCurrent = false;
    };
  }, [file]);

  return file && preview?.file === file ? preview.url : null;
}
