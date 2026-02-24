import Image from "next/image";

type Props = { 
  src: string | null 
};

export default function AvatarPreview({ src }: Props) {
  if (!src) {
    return <div className="w-20 h-20 bg-gray-100 rounded-full" aria-hidden />;
  }
  return (
    <>
      <Image
        src={src}
        alt="Avatar preview"
        width={80}
        height={80}
        className="border-2 border-border rounded-sm w-20 h-20"
        loading="lazy"
      />
    </>
  );
}
