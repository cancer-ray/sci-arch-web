import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] px-1.5 py-0.5 font-mono text-[11px] leading-none uppercase tracking-wide",
  {
    variants: {
      variant: {
        live: "bg-success/15 text-success",
        soon: "bg-warning/15 text-warning",
        plus: "bg-primary/10 text-primary",
        neutral: "bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));
Badge.displayName = "Badge";

export { Badge, badgeVariants };
