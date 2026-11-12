import Image from "next/image";

import { cn } from "@/lib/utils";

import { DEFAULT_AVATAR_URL } from "../constants/release.constants";

type Props = {
  src: string | null;
  className?: string;
};

export default function AvatarPreview({ src, className }: Props) {
  return (
    <Image
      src={src ?? DEFAULT_AVATAR_URL}
      alt={src ? "Selected avatar preview" : "Default pixel-art avatar"}
      width={80}
      height={80}
      className={cn("h-20 w-20 shrink-0 rounded-sm border-2 border-border bg-gray-100 object-cover", className)}
      loading="lazy"
      unoptimized
    />
  );
}
