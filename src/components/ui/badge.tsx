import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-kicker font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "bg-secondary text-muted-foreground",
        solid: "bg-primary text-primary-foreground",
        gain: "bg-gain/15 text-gain",
        loss: "bg-loss/15 text-loss",
        outline: "shadow-[0_0_0_1px_rgba(255,255,255,0.1)] text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
