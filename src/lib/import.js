/**
 * Single-file import for sci-arch: convert a picked file into a markdown note.
 *
 * Supported inputs:
 *   .md / .markdown / .txt  -> raw text passthrough
 *   .html / .htm            -> Turndown (with GFM tables/strikethrough/task lists)
 *   .docx                   -> mammoth (docx -> HTML) then Turndown
 *
 * Everything is best-effort and never throws: unsupported extensions or any
 * conversion failure resolve to `null` so callers can toast and move on.
 */

import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/** `accept` attribute value for the hidden file input. */
export const IMPORT_ACCEPT = ".md,.markdown,.txt,.html,.htm,.docx";

const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");
const baseOf = (name) => name.replace(/\.[^.]+$/, "") || "Imported note";

function htmlToMarkdown(html) {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.use(gfm);
  return turndown.turndown(html || "").replace(/\n{3,}/g, "\n\n");
}

/**
 * Convert a File into `{ name, markdown }` where `name` is the original base
 * name with a `.md` extension. Returns `null` for unsupported types or on any
 * read/conversion failure (never throws).
 * @param {File} file
 * @returns {Promise<{name: string, markdown: string} | null>}
 */
export async function importFileToMarkdown(file) {
  if (!file || !file.name) return null;
  const ext = extOf(file.name);
  const name = `${baseOf(file.name)}.md`;

  try {
    if (ext === "md" || ext === "markdown" || ext === "txt") {
      const text = await file.text();
      return { name, markdown: text };
    }

    if (ext === "html" || ext === "htm") {
      const html = await file.text();
      return { name, markdown: htmlToMarkdown(html) };
    }

    if (ext === "docx") {
      // mammoth is heavy; load it lazily so it stays out of the main bundle.
      const mod = await import("mammoth");
      const mammoth = mod.convertToHtml ? mod : mod.default;
      if (!mammoth || typeof mammoth.convertToHtml !== "function") return null;
      const arrayBuffer = await file.arrayBuffer();
      // Browser build reads `arrayBuffer`; the node build (used by jest)
      // reads `buffer` — both accept an ArrayBuffer, so pass both keys.
      const result = await mammoth.convertToHtml({ arrayBuffer, buffer: arrayBuffer });
      return { name, markdown: htmlToMarkdown(result?.value || "") };
    }

    return null; // unsupported extension
  } catch {
    return null; // any read/parse failure — caller decides how to report
  }
}
