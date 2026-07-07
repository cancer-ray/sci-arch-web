import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * PrintedCard — presentational surface using the global .printed-card class.
 * Consumers handle positioning (absolute/fixed) themselves.
 */
const PrintedCard = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("printed-card", className)} {...props} />
));
PrintedCard.displayName = "PrintedCard";

export { PrintedCard };
