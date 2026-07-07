// Export utilities — notebook-to-zip and single-file text downloads.
//
// Everything here is additive and dependency-light: fflate (already a
// dependency) for the zip, plain anchor-click downloads otherwise. All
// image fetching is best-effort — an image that can't be resolved from its
// object URL is skipped, never a reason to fail the whole export.
import { strToU8, zipSync } from "fflate";

// Characters that are unsafe in filenames on at least one major platform
// (Windows is the strictest). Control characters are stripped separately to
// keep this regex free of control-char escapes.
const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*]+/g;

function stripControlChars(s) {
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    if (s.charCodeAt(i) >= 32) out += s[i];
  }
  return out;
}

// Make a single path segment safe for both zip entries and downloaded files.
function sanitizeSegment(segment) {
  return stripControlChars(String(segment || ""))
    .replace(UNSAFE_FILENAME_CHARS, "-")
    .replace(/\s+/g, " ")
    .replace(/^\.+$/, "")
    .trim();
}

/**
 * Safe `.md` filename for a note entry ({ name, path, ... }).
 * Always returns something ending in ".md", never empty.
 */
export function noteFilename(note) {
  const raw =
    (note && note.name) ||
    (note && typeof note.path === "string" ? note.path.split("/").pop() : "") ||
    "untitled";
  const base = sanitizeSegment(String(raw).replace(/\.(md|markdown)$/i, "")) || "untitled";
  return `${base}.md`;
}

// Shared anchor-click download used by both exports (same pattern as
// downloadNote in WorkspaceContext).
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on a delay so the browser has started the download first.
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }, 1000);
}

/**
 * Small helper: download `text` as `filename` with the given mime type
 * (defaults to markdown, the common case here).
 */
export function downloadText(filename, text, mime = "text/markdown;charset=utf-8") {
  const blob = new Blob([text == null ? "" : String(text)], { type: mime });
  triggerDownload(blob, sanitizeSegment(filename) || "download.txt");
}

// Insert a numeric suffix before the extension: "photo.png" -> "photo-2.png".
function withSuffix(filename, n) {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return `${filename}-${n}`;
  return `${filename.slice(0, dot)}-${n}${filename.slice(dot)}`;
}

// Reserve a unique path in the zip tree, suffixing on collision.
function uniquePath(files, path) {
  if (!(path in files)) return path;
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
  const base = path.slice(dir.length);
  let n = 2;
  let candidate = dir + withSuffix(base, n);
  while (candidate in files) {
    n += 1;
    candidate = dir + withSuffix(base, n);
  }
  return candidate;
}

// Fetch an object URL back into bytes. Returns null (never throws) when the
// URL is stale/revoked or fetch is unavailable.
async function urlToBytes(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Build and download "<rootName>.zip" containing every note at its dir/name
 * path plus an images/ folder with any images resolvable from
 * workspace.images (a map of key -> blob/object URL; the same URL may appear
 * under several keys, so entries are deduped by URL). Unfetchable images are
 * skipped silently. Returns true if a download was triggered, false when
 * there was nothing to export.
 */
export async function exportNotebookZip(workspace) {
  if (!workspace || !Array.isArray(workspace.markdown) || workspace.markdown.length === 0) {
    return false;
  }

  const files = {};

  // Notes: keep the folder structure (dir/name), sanitized per segment.
  for (const note of workspace.markdown) {
    const dir = String(note.dir || "")
      .split("/")
      .map(sanitizeSegment)
      .filter(Boolean)
      .join("/");
    const entryPath = uniquePath(files, [dir, noteFilename(note)].filter(Boolean).join("/"));
    // Level 6 is fflate's balanced default for text.
    files[entryPath] = [strToU8(note.text == null ? "" : String(note.text)), { level: 6 }];
  }

  // Images: dedupe by URL (folder import registers the same object URL under
  // both its relative path and its bare filename), preferring the shortest
  // key as the human-facing name.
  const imageMap = workspace.images && typeof workspace.images === "object" ? workspace.images : {};
  const byUrl = new Map();
  for (const [key, url] of Object.entries(imageMap)) {
    if (typeof url !== "string" || !url) continue;
    const prev = byUrl.get(url);
    if (!prev || key.length < prev.length) byUrl.set(url, key);
  }

  const fetched = await Promise.all(
    Array.from(byUrl.entries()).map(async ([url, key]) => ({ key, bytes: await urlToBytes(url) }))
  );
  for (const { key, bytes } of fetched) {
    if (!bytes) continue; // unfetchable — skip, per contract
    const base = sanitizeSegment(key.split("/").pop()) || "image";
    const entryPath = uniquePath(files, `images/${base}`);
    // Images are already compressed — store without deflate.
    files[entryPath] = [bytes, { level: 0 }];
  }

  const zipped = zipSync(files);
  const rootName = sanitizeSegment(workspace.rootName) || "notebook";
  triggerDownload(new Blob([zipped], { type: "application/zip" }), `${rootName}.zip`);
  return true;
}
