import { forwardRef } from "react";

/**
 * sci-arch monogram — an editorial arch with a DNA double-helix inside.
 * Monochrome, stroke-based, currentColor for both light and dark modes.
 */
export const LogoMark = forwardRef(function LogoMark({ size = 22, className = "" }, ref) {
  const s = size;
  return (
    <svg
      ref={ref}
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Archway: the architecture / archive. Heavier stroke than the helix. */}
      <path d="M5 29 L5 14 A11 11 0 0 1 27 14 L27 29" strokeWidth="2.1" />
      <path d="M4 29 H28" strokeWidth="2.1" />
      {/* DNA double-helix as the keystone: two strands that actually cross. */}
      <g strokeWidth="1.5">
        <path d="M12 7 C 20 10, 20 13, 16 16 C 12 19, 12 22, 20 25" />
        <path d="M20 7 C 12 10, 12 13, 16 16 C 20 19, 20 22, 12 25" />
        {/* base-pair rungs, shorter toward the crossing for a 3D read */}
        <line x1="13.4" y1="8.6" x2="18.6" y2="8.6" />
        <line x1="12.4" y1="11.4" x2="19.6" y2="11.4" />
        <line x1="12.4" y1="20.6" x2="19.6" y2="20.6" />
        <line x1="13.4" y1="23.4" x2="18.6" y2="23.4" />
      </g>
    </svg>
  );
});

/** Wordmark used in nav / footer. */
export function Wordmark({ className = "" }) {
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span className="font-serif text-lg tracking-tight lowercase">sci-</span>
      <span className="font-serif text-lg italic tracking-tight lowercase">arch</span>
    </span>
  );
}
