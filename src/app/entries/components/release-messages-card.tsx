import Image from "next/image";
import { memo } from "react";
import { motion } from "motion/react"

import { cn } from "@/vendor/lib/utils";
import { Badge } from "@/vendor/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/vendor/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/vendor/ui/card";

import { Sparkles } from "lucide-react";

import { Emotion, EMOTION_STYLES } from "@/shared/constants/emotions";
import { Variant, VARIANT_ICONS, VARIANT_STYLES } from "@/shared/constants/variants";
import Link from "next/link";
import ShareButtons from "@/shared/components/share-buttons";

type Props = {
  id: string;
  className?: string;
  index: number;
  displayName: string;
  avatarUrl: string;
  title: string;
  content: string;
  emotion: Emotion;
  variants?: Variant[];
  createdAtToNow?: string;
  createdAtFormatted?: string;
}

const ReleaseMessagesCard = memo(function ReleaseMessagesCard({ 
  id,
  className, 
  index, 
  displayName, 
  avatarUrl,  
  title,
  content, 
  emotion, 
  variants, 
  createdAtToNow,
  createdAtFormatted,
}: Props) {
  const emotionClass = EMOTION_STYLES[emotion] ?? "bg-gray-300";
  
  return (
    <motion.div
      className={cn(
        className,
        "will-change-transform",
      )}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 18) * 0.05 }}
    >
      <Card className="border-4">
        <CardHeader className="border-b-4 py-4 px-4 -mt-6 bg-white">
          <Sparkles className='w-5 h-5 absolute right-5'/>

          <div className="flex items-center gap-4">
            <Avatar className="rounded-none">
              <AvatarImage src={avatarUrl} alt="Avatar" />
              <AvatarFallback>
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-sm font-bold line-clamp-1">{displayName}</h1>
              <p className="text-sm opacity-50">
                {createdAtToNow}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {variants?.map((variant) => {
              const variantClass = VARIANT_STYLES[variant] ?? "bg-gray-200";
              const Icon = VARIANT_ICONS[variant];

              return (
                <Badge key={variant} className={`${variantClass}`}>
                  <Icon className='stroke-3'/>
                  {variant}
                </Badge>
              )
            })}
          </div>
        </CardHeader>
        
        <Link href={`/entries/${id}`}>
          <CardContent className={`px-4 py-4 -my-6 relative ${emotionClass}`}>
            <Image
              src={`/assets/emotions/${emotion}.png`}
              width={150}
              height={150}
              alt="sadness"
              className="absolute h-full w-auto top-0 right-0 opacity-15"
            />
            <h2 className="font-bold text-lg mb-1">{title}</h2>
            <p className="leading-relaxed min-h-36 line-clamp-6 opacity-75">{content}</p>
          </CardContent>
        </Link>

        <CardFooter className="border-t-4 px-4 py-4 -mb-6 flex justify-between bg-white">
          <ShareButtons
            url={`https://astryss.com/entries/${id}`}
            title={title}
            description={content}
          />
          <p className="text-sm opacity-50">{createdAtFormatted}</p>
        </CardFooter>
      </Card> 
    </motion.div>
  )
});

export default ReleaseMessagesCard;