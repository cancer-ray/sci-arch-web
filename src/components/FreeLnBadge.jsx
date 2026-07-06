/**
 * freeLN — the free, client-side notebook tool. A small lockup so the name
 * renders consistently wherever it needs its own identity (pricing card,
 * section headings), distinct from the "Free for students" action copy.
 */
export function FreeLnBadge({ size = "base", className = "" }) {
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className={`font-serif italic tracking-tight ${textSize} text-foreground`}>freeLN</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        by sci-arch
      </span>
    </span>
  );
}
