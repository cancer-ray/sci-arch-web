import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * SegmentedControl
 * props:
 * - options: [{ value, label }]
 * - value: currently selected value
 * - onChange: (value) => void
 * - className: extra classes for the track
 */
const SegmentedControl = React.forwardRef(
  ({ options = [], value, onChange, className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "inline-flex h-8 items-stretch border border-border rounded-[2px] bg-card overflow-hidden",
        className
      )}
      {...props}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange && onChange(option.value)}
            className={cn(
              "relative inline-flex items-center px-3 font-mono text-[12px] transition-colors",
              index > 0 && "border-l border-border",
              selected
                ? "bg-primary/10 text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  )
);
SegmentedControl.displayName = "SegmentedControl";

export { SegmentedControl };
