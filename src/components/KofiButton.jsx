import { useEffect, useState } from "react";
import { Coffee, X } from "lucide-react";

/**
 * A "Buy me a coffee" button that opens the Ko-fi tip panel as an on-page
 * overlay (not a navigation to ko-fi.com). Ko-fi's own overlay-widget only
 * exposes a *floating* button and lazy-loads its panel iframe on that button's
 * click, so a custom trigger opened a blank panel. Instead we embed Ko-fi's
 * widget URL in our own modal iframe — reliable, self-contained, and only
 * loaded when the button is clicked.
 */
const KOFI_ID = "cancer_ray";
const KOFI_EMBED = `https://ko-fi.com/${KOFI_ID}/?hidefeed=true&widget=true&embed=true&preview=true`;

export function KofiButton({ className = "" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Coffee className="h-4 w-4" />
        Buy me a coffee
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Support Ryan Lee on Ko-fi"
        >
          <div
            className="relative w-full max-w-[360px] overflow-hidden border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center border border-border bg-background text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              title="Support Ryan Lee on Ko-fi"
              src={KOFI_EMBED}
              className="h-[80vh] max-h-[680px] w-full border-0 bg-white"
            />
          </div>
        </div>
      )}
    </>
  );
}
