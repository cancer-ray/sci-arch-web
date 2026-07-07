import * as React from "react";

import { cn } from "@/lib/utils";

const Panel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border border-border bg-card rounded-[2px]", className)}
    {...props}
  />
));
Panel.displayName = "Panel";

const PanelHeader = React.forwardRef(({ className, label, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-9 items-center justify-between gap-2 border-b border-border px-3",
      className
    )}
    {...props}
  >
    {label != null && (
      <span className="font-mono text-[12px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    )}
    {children}
  </div>
));
PanelHeader.displayName = "PanelHeader";

export { Panel, PanelHeader };
