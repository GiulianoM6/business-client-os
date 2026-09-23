import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(24,62,47,0.16),0_6px_16px_rgba(24,62,47,0.10)] hover:-translate-y-px hover:bg-primary/92 hover:shadow-[0_2px_4px_rgba(24,62,47,0.16),0_9px_20px_rgba(24,62,47,0.12)]",
        outline:
          "border border-border bg-card text-foreground shadow-[0_1px_2px_rgba(20,40,30,0.04)] hover:-translate-y-px hover:border-primary/20 hover:bg-muted",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3.5 text-xs",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
