import { useEffect, useState } from "react";

import { 
  Dialog, 
  DialogContent,
  DialogFooter,
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/vendor/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/vendor/ui/form";
import { Button } from "@/vendor/ui/button";
import { Input } from "@/vendor/ui/input";

import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod'

import AvatarPreview from "./avatar-preview";
import { CreateEntryInput, createEntrySchema } from "@/features/entries/schema/entry.schema";
import { useCreateEntry } from "@/features/entries/hooks/use-entries";
import { Flame, Frown, Heart, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  content: string;
};

const EMOTIONS = [
  { value: "inlove", icon: Heart, color: "text-pink-400" },
  { value: "sad", icon: Frown, color: "text-blue-400" },
  { value: "angry", icon: Flame, color: "text-red-400" },
  { value: "other", icon: Sparkles, color: "text-zinc-400" },
] as const;

export default function IdentityConfirmationModal({ isOpen, setIsOpen, content }: Props) {
  const [avatarPreview, setAvatarPreview] = useState<File | null>(null);

  const createEntryMutation = useCreateEntry();

  const form = useForm<CreateEntryInput>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: {
      displayName: "",
      title: "",
      content: "",
      avatar: undefined,
      type: "release",
      emotion: "other",
      variants: ["beta"],
    }
  });

  useEffect(() => {
    if (isOpen) {
      form.setValue('content', content);
    }
  }, [isOpen, content, form]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(file);
    } else {
      setAvatarPreview(null);
    }
  }

  function onSubmit(values: CreateEntryInput) {
    console.log('Form values:', values);

    createEntryMutation.mutate(values, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
        setAvatarPreview(null);
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Before your message reaches the stars...</DialogTitle>
          <DialogDescription className="opacity-75">
            You can share this message with a name, an avatar, both — or completely anonymous.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-1">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="px-1">Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Give your message a headline… or leave it Untitled." 
                        {...field} 
                        disabled={createEntryMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="px-1">Display Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Leave blank to stay anonymous" 
                        {...field} 
                        disabled={createEntryMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatar"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel className="px-1">Avatar (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => {
                          handleFileChange(e);
                          onChange(e.target.files);
                        }}
                        disabled={createEntryMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs px-1 opacity-75">
                      A small image to represent you. Skip it to stay faceless.
                    </p>

                    {avatarPreview && (
                      <AvatarPreview 
                        src={URL.createObjectURL(avatarPreview)} 
                      />
                    )}
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emotion"
                render={({ field }) => (
                  <FormItem>
                    <div className="px-1 flex gap-8">
                      {EMOTIONS.map((emotion) => {
                        const isActive = field.value === emotion.value;
                        return(   
                          <button
                            key={emotion.value}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => field.onChange(emotion.value)}
                            className={`text-sm flex gap-1 flex-col items-center capitalize cursor-pointer ${isActive ? `${emotion.color}` : 'opacity-50'}`}
                          >
                            <emotion.icon className='h-8 w-8' />
                            {emotion.value}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs px-1 opacity-75 mt-1">
                      Pick the emotion that best matches this message.
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button 
                variant="neutral"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Back
              </Button>

              <Button 
                type="submit"
                disabled={createEntryMutation.isPending}
                className="cursor-pointer"
              >
                {createEntryMutation.isPending ? "Sending..." : "Send to the stars"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}