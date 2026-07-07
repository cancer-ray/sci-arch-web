import * as React from "react";

import { cn } from "@/lib/utils";

const baseFieldClasses =
  "w-full border border-border bg-card rounded-[2px] px-3 text-sm text-foreground placeholder:font-mono placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(baseFieldClasses, "h-9", className)}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(baseFieldClasses, "min-h-9 py-2", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
