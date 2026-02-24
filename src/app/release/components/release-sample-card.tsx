import { memo } from "react";
import Image from "next/image";

import { cn } from "@/vendor/lib/utils";
import { Badge } from "@/vendor/ui/badge";
import { Card, CardContent, CardFooter } from "@/vendor/ui/card";

import { Sparkles } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { motion } from "motion/react"

import { Emotion, EMOTION_STYLES } from "@/shared/constants/emotions";
import { Variant, VARIANT_ICONS, VARIANT_STYLES } from "@/shared/constants/variants";

type Props = {
  className?: string;
  index: number;
  displayName: string;
  content: string;
  emotion: Emotion;
  variants?: Variant[];
  createdAt: string;
}

const ReleaseSampleCard = memo(function ReleaseSampleCard({ 
  className, 
  index, 
  displayName, 
  content, 
  emotion, 
  variants, 
  createdAt 
}: Props) {
  const emotionClass = EMOTION_STYLES[emotion] ?? "bg-gray-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          "border-4 rotate-2 flex flex-col justify-between h-full",
          emotionClass,
          className
        )} 
      >
        <CardContent className='text-sm flex flex-col gap-3'>
          <Sparkles className='w-5 h-5 absolute right-5'/>
          <Image 
            src={`/assets/emotions/${emotion}.png`} 
            width={150} 
            height={150} 
            alt="sadness" 
            className="absolute h-full w-auto top-0 right-0 -z-40 opacity-15"
          />
          <p className='mt-1 leading-relaxed w-9/10 line-clamp-3'>{content}</p>
          
          <div className="flex gap-2">
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
        </CardContent>
        <CardFooter className='flex justify-between'>
          <span className='opacity-50 text-xs'>
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          <span className='text-xs font-bold line-clamp-1'>- {displayName}</span>
        </CardFooter>
      </Card>
    </motion.div>
  )
});

export default ReleaseSampleCard;