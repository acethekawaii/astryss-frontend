"use client";

import { SiFacebook, SiX } from "@icons-pack/react-simple-icons";
import { FacebookShareButton, XShareButton } from "react-share";

type ShareButtonsProps = {
  url: string;
  title: string;
  description?: string;
};

export default function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const shareText = description ? `${title} — ${description}` : title;

  return (
    <div className="flex gap-4 items-center">
      <XShareButton
        url={url}
        text={shareText}
        via="astryss"
      >
        <div className="cursor-pointer rounded-base bg-main px-3 py-2 border-2 border-border">
          <SiX size={24} aria-hidden />
        </div>
      </XShareButton>

      <FacebookShareButton
        url={url}
        hashtag="#astryss"
      >
        <div className="cursor-pointer rounded-base bg-main px-3 py-2 border-2 border-border">
          <SiFacebook size={24} aria-hidden />
        </div>
      </FacebookShareButton>
    </div>
  )
}
