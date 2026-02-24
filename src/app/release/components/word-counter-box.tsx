"use client";
import { useState } from "react";

import { Textarea } from "@/vendor/ui/textarea";
import { Button } from '@/vendor/ui/button';
import { Card, CardContent, CardFooter } from "@/vendor/ui/card";
import { Send } from "lucide-react";
import IdentityConfirmationModal from "./identity-confirmation-dialog";

export default function WordCounterBox() {
  const [content, setContent] = useState("")
  const [isOpen, setIsOpen] = useState(false);

  const limit = 500;
  const count = content.length;

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Card className="mt-10 w-full md:w-1/2 p-0 border-4 gap-0 -rotate-2">
        <CardContent className="p-0">
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your feelings with stars..." 
            className="resize-none rounded-none min-h-52 no-focus px-6 py-5 leading-relaxed"
          />
        </CardContent>
        <CardFooter className="bg-main px-6 py-4 border-t-4 flex items-center justify-between">
            <span className={`${count > limit ? "text-red-500" : ""}`}>
              {count}/{limit}
            </span>
            <Button 
              disabled={count === 0 || count > limit}
              className='cursor-pointer'
              onClick={handleOpenModal}
            >
              Send to Stars <Send />
            </Button>
        </CardFooter>
      </Card>

      <IdentityConfirmationModal 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        content={content}
      />
    </>
  )
}