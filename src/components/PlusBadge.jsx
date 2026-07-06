/**
 * sci-arch+ — the umbrella brand for the cloud product (soloLN and groupLN
 * together). Mirrors the site's own wordmark styling (sci- plain, arch
 * italic) with the "+" in the accent color, the site's one earned accent
 * moment, to read as the premium/paid mark wherever it needs its own
 * identity (pricing cards, section headings, gating copy).
 */
export function PlusBadge({ size = "base", className = "" }) {
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span className={`font-serif tracking-tight lowercase ${textSize} text-foreground`}>sci-</span>
      <span className={`font-serif italic tracking-tight lowercase ${textSize} text-foreground`}>arch</span>
      <span className={`font-serif tracking-tight ${textSize} text-primary`}>+</span>
    </span>
  );
}
