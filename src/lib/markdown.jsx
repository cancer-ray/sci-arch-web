import { resolveImageSrc } from "@/lib/folder";
import { cn } from "@/lib/utils";

/**
 * Shared react-markdown component overrides for the freeLN notebook. Used by the
 * Split-mode live preview AND by the WYSIWYG editor (which renders this to an
 * HTML string via react-dom/server, then makes it contentEditable). Keeping a
 * single source means the rendered look is identical in every view mode.
 *
 * react-markdown v10 notes: components no longer receive an `inline` prop, and
 * every component receives a `node` (hast) prop that must NOT be spread onto
 * DOM elements. Inline vs block code is handled structurally — block code is
 * always wrapped in `<pre>`, so the `pre` override neutralizes the inline-chip
 * styling on its child `<code>`.
 *
 * `images` is the workspace filename → Blob URL map so `![](assets/x.png)`
 * references resolve to the in-memory image the user loaded.
 */
export const mdComponents = (images) => ({
  h1: ({ node, className, ...props }) => (
    <h1 className={cn("mt-2 font-serif text-3xl text-foreground", className)} {...props} />
  ),
  h2: ({ node, className, ...props }) => (
    <h2
      className={cn("mt-6 border-b border-border pb-1 font-serif text-2xl text-foreground", className)}
      {...props}
    />
  ),
  h3: ({ node, className, ...props }) => (
    <h3 className={cn("mt-5 font-serif text-xl text-foreground", className)} {...props} />
  ),
  p: ({ node, className, ...props }) => (
    <p className={cn("mt-3 text-sm leading-relaxed text-foreground/85", className)} {...props} />
  ),
  li: ({ node, className, ...props }) => (
    <li className={cn("ml-5 mt-1 list-disc text-sm text-foreground/85", className)} {...props} />
  ),
  // Inline code renders as a chip; block code always sits inside <pre>, where
  // the chip styling is reset so it reads as one bordered block, not a box in
  // a box.
  code: ({ node, className, ...props }) => (
    <code
      className={cn(
        "rounded-[2px] border border-border bg-secondary/50 px-1 font-mono text-[12px]",
        className
      )}
      {...props}
    />
  ),
  pre: ({ node, className, ...props }) => (
    <pre
      className={cn(
        "my-3 overflow-x-auto rounded-[2px] border border-border bg-secondary/40 p-3 font-mono text-[12px] leading-relaxed",
        "[&>code]:block [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0",
        className
      )}
      {...props}
    />
  ),
  table: ({ node, className, ...props }) => (
    <table className={cn("my-4 w-full border-collapse font-mono text-[11px]", className)} {...props} />
  ),
  th: ({ node, className, ...props }) => (
    <th className={cn("border-b border-border px-2 py-1 text-left font-medium", className)} {...props} />
  ),
  td: ({ node, className, ...props }) => (
    <td className={cn("border-b border-border/50 px-2 py-1 text-foreground/85", className)} {...props} />
  ),
  img: ({ node, src, alt }) => (
    <img
      className="my-4 max-w-full border border-border"
      src={resolveImageSrc(src, images || {})}
      alt={alt || ""}
    />
  ),
  a: ({ node, className, ...props }) => (
    <a className={cn("text-primary underline underline-offset-2", className)} {...props} />
  ),
  blockquote: ({ node, className, ...props }) => (
    <blockquote
      className={cn("my-3 border-l-2 border-border pl-3 text-sm italic text-muted-foreground", className)}
      {...props}
    />
  ),
});
