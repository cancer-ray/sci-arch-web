import * as React from "react";

import { cn } from "@/lib/utils";

const Kbd = React.forwardRef(({ className, ...props }, ref) => (
  <kbd
    ref={ref}
    className={cn(
      "inline-flex items-center border border-border bg-secondary rounded-[2px] px-1 font-mono text-[11px] leading-relaxed text-muted-foreground",
      className
    )}
    {...props}
  />
));
Kbd.displayName = "Kbd";

export { Kbd };
