import Image from "next/image";

type Props = { 
  src: string | null 
};

const DEFAULT_AVATAR_URL = "https://api.dicebear.com/9.x/pixel-art/svg?seed=undefined&size=80";

export default function AvatarPreview({ src }: Props) {
  return (
    <Image
      src={src ?? DEFAULT_AVATAR_URL}
      alt={src ? "Selected avatar preview" : "Default pixel-art avatar"}
      width={80}
      height={80}
      className="h-20 w-20 rounded-sm border-2 border-border bg-gray-100 object-cover"
      loading="lazy"
      unoptimized
    />
  );
}
