"use client";
import * as Dialog from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
export function SheetContent({
  children,
  className,
  ...props
}: ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(20rem,88vw)] bg-sidebar text-sidebar-foreground shadow-2xl",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          className="absolute right-3 top-5 flex size-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
