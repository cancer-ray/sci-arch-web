/**
 * groupLN — the team cloud tier. Same lockup family as FreeLnBadge/SoloLnBadge
 * so the product names read consistently wherever they need their own identity.
 */
export function GroupLnBadge({ size = "base", className = "" }) {
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className={`font-serif italic tracking-tight ${textSize} text-foreground`}>groupLN</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        by sci-arch
      </span>
    </span>
  );
}
