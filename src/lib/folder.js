/**
 * Client-side folder loader for sci-arch.
 * Uses the `webkitdirectory` input attribute (works in Chrome/Edge/Safari/Firefox).
 * Produces a normalized in-memory workspace: markdown files + a filename → Blob
 * URL map so image references inside markdown can be resolved.
 *
 * A "notebook folder" is any folder the user picks. If it doesn't yet contain
 * the sci-arch structure, callers can call `scaffoldStructure()` to synthesize
 * default virtual folders in memory (real disk writes require File System
 * Access API which isn't universally supported; we keep it read-only for MVP).
 */

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];
const MD_EXT = ["md", "markdown"];

// Everything runs in the browser and markdown is text, so limits only exist to
// keep memory sane. A .md/.txt note over 5 MB is almost certainly not a note; a
// referenced image over 25 MB is unreasonable for a notebook. Oversized files
// are skipped and reported, not silently dropped.
export const MAX_MD_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const extOf = (name) => name.split(".").pop().toLowerCase();

/**
 * Turn a FileList (from `<input webkitdirectory>` or a drop event) into a
 * structured workspace object.
 * @returns {{
 *   rootName: string,
 *   markdown: Array<{path: string, name: string, file: File, text: string, dir: string}>,
 *   images: Record<string, string>,  // relative path or bare filename → Blob URL
 *   allPaths: string[]
 * }}
 */
export async function readFolder(fileList) {
  const files = Array.from(fileList);
  if (!files.length) return null;

  // Root folder name — first path segment (webkitRelativePath preserves it for
  // folder picks/drops). When the user selects individual .md files there is no
  // folder path, so fall back to a generic notebook name.
  const rel0 = files[0].webkitRelativePath || files[0].name;
  const rootName = rel0.includes("/") ? rel0.split("/")[0] : "Imported notes";

  const markdown = [];
  const images = {};
  const skipped = [];

  for (const f of files) {
    const rel = f.webkitRelativePath || f.name;
    const parts = rel.split("/");
    const name = parts[parts.length - 1];
    const dir = parts.slice(1, -1).join("/") || "";
    const ext = extOf(name);
    const isMd = MD_EXT.includes(ext) || ext === "txt";
    const isImage = IMAGE_EXT.includes(ext);

    if ((isMd && f.size > MAX_MD_BYTES) || (isImage && f.size > MAX_IMAGE_BYTES)) {
      skipped.push(name);
      continue;
    }

    if (isMd) {
      const text = await f.text();
      // Imported files are editable in-session (changes stay in memory and can
      // be downloaded back out; we never write to the user's disk). The audit
      // history starts with the import event.
      markdown.push({
        path: rel,
        name,
        file: f,
        text,
        dir,
        editable: true,
        history: [{ label: "imported entry", at: Date.now() }],
        edited: false,
        dirty: false,
      });
    } else if (IMAGE_EXT.includes(ext)) {
      const url = URL.createObjectURL(f);
      // Store by relative path (no root prefix) and by bare filename
      const relFromRoot = parts.slice(1).join("/");
      images[relFromRoot] = url;
      images[name] = url;
    }
  }

  // Sort markdown files: experiments first, then protocols, then everything else
  const priority = (p) => {
    if (p.includes("experiments/")) return 0;
    if (p.includes("protocols/")) return 1;
    if (p.includes("inventory/")) return 2;
    return 3;
  };
  markdown.sort((a, b) => {
    const p = priority(a.path) - priority(b.path);
    return p !== 0 ? p : a.path.localeCompare(b.path);
  });

  return {
    rootName,
    markdown,
    images,
    skipped,
    allPaths: files.map((f) => f.webkitRelativePath || f.name),
  };
}

/**
 * Walk a drag-and-drop DataTransfer into a flat File[] (recursing into any
 * dropped folders), preserving a webkitRelativePath-like shape so readFolder
 * can group them. Entries are captured synchronously (webkitGetAsEntry is only
 * valid during the drop event), then walked. Falls back to `.files` when the
 * entries API is unavailable.
 */
export async function filesFromDrop(dataTransfer) {
  const items = dataTransfer?.items;
  const entries = [];
  if (items?.length) {
    for (let i = 0; i < items.length; i += 1) {
      const entry = items[i].webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }
  }
  if (!entries.length) {
    return dataTransfer?.files ? Array.from(dataTransfer.files) : [];
  }

  const files = [];
  const walk = (entry, path = "") =>
    new Promise((resolve) => {
      if (entry.isFile) {
        entry.file(
          (f) => {
            try {
              Object.defineProperty(f, "webkitRelativePath", {
                value: `${path}${f.name}`,
                writable: false,
              });
            } catch {
              /* property already defined — leave as-is */
            }
            files.push(f);
            resolve();
          },
          () => resolve()
        );
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readAll = (accum = []) =>
          new Promise((res) =>
            reader.readEntries(
              async (batch) => {
                if (!batch.length) return res(accum);
                res(await readAll(accum.concat(batch)));
              },
              () => res(accum)
            )
          );
        readAll().then(async (children) => {
          for (const c of children) await walk(c, `${path}${entry.name}/`);
          resolve();
        });
      } else {
        resolve();
      }
    });

  await Promise.all(entries.map((e) => walk(e)));
  return files;
}

/** Resolve an image reference inside a markdown file to the loaded Blob URL. */
export function resolveImageSrc(src, images) {
  if (!src) return src;
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  // Try exact then normalized keys
  const key = src.replace(/^\.\//, "");
  const bare = key.split("/").pop();
  return images[key] || images[bare] || src;
}

/** Default sci-arch notebook structure (used for guidance in the empty state). */
export const DEFAULT_STRUCTURE = [
  "experiments/",
  "protocols/",
  "inventory/",
  "assets/",
  "README.md",
  ".sciarch/manifest.json",
];

/**
 * Note templates for the "new entry" flow. Bodies are plain GFM markdown.
 * Deliberately no Date.now() at module scope — "Date:" lines stay blank and
 * are for the scientist to fill in (or for callers to stamp at creation time).
 */
export const TEMPLATES = [
  {
    id: "blank",
    label: "Blank",
    filename: "Untitled.md",
    body: "# Untitled\n\n",
  },
  {
    id: "experiment",
    label: "Experiment",
    filename: "Experiment.md",
    body: [
      "# Experiment",
      "",
      "Date: ",
      "Author: ",
      "",
      "## Objective",
      "",
      "What question is this experiment answering?",
      "",
      "## Materials",
      "",
      "- ",
      "",
      "## Procedure",
      "",
      "1. ",
      "2. ",
      "3. ",
      "",
      "## Results",
      "",
      "| Sample | Condition | Measurement | Notes |",
      "| --- | --- | --- | --- |",
      "|  |  |  |  |",
      "",
      "## Conclusion",
      "",
      "",
    ].join("\n"),
  },
  {
    id: "protocol",
    label: "Protocol",
    filename: "Protocol.md",
    body: [
      "# Protocol",
      "",
      "Date: ",
      "Version: 1.0",
      "",
      "## Purpose",
      "",
      "",
      "## Materials",
      "",
      "- ",
      "",
      "## Steps",
      "",
      "1. ",
      "2. ",
      "3. ",
      "",
    ].join("\n"),
  },
  {
    id: "reagent-log",
    label: "Reagent log",
    filename: "Reagent log.md",
    body: [
      "# Reagent log",
      "",
      "Date: ",
      "",
      "| Reagent | Lot # | Vendor | Received | Opened | Expires | Location |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      "|  |  |  |  |  |  |  |",
      "",
    ].join("\n"),
  },
  {
    id: "daily-notes",
    label: "Daily notes",
    filename: "Daily notes.md",
    body: [
      "# Daily notes",
      "",
      "Date: ",
      "",
      "## Today",
      "",
      "- ",
      "",
      "## Follow-ups",
      "",
      "- ",
      "",
    ].join("\n"),
  },
];

/**
 * Build an in-memory demo notebook so first-time users can explore the app
 * without picking a folder. Notes are synthesized from TEMPLATES plus a README
 * describing the DEFAULT_STRUCTURE. Timestamps are stamped at call time (never
 * at module scope).
 * @returns {{rootName: string, markdown: Array<object>, images: object, origin: string}}
 */
export function sampleWorkspace() {
  const rootName = "Sample notebook";
  const at = Date.now();
  const makeNote = (name, text) => ({
    path: `${rootName}/${name}`,
    name,
    text,
    dir: "",
    editable: true,
    history: [{ label: "created entry", at }],
    edited: false,
    dirty: false,
  });

  const readme = [
    "# Sample notebook",
    "",
    "Welcome! This is an in-memory demo notebook — nothing here touches your disk.",
    "Edit any entry, add new ones from templates, and export a `.zip` when ready.",
    "",
    "A typical sci-arch notebook folder looks like:",
    "",
    ...DEFAULT_STRUCTURE.map((entry) => `- \`${entry}\``),
    "",
  ].join("\n");

  const byId = (id) => TEMPLATES.find((t) => t.id === id);
  const notes = [makeNote("README.md", readme)];
  for (const id of ["experiment", "protocol", "reagent-log", "daily-notes"]) {
    const t = byId(id);
    if (t) notes.push(makeNote(t.filename, t.body));
  }

  return { rootName, markdown: notes, images: {}, origin: "created" };
}

/**
 * Persist / retrieve most-recent notebook name in localStorage so the landing
 * page can show a "resume" hint. (Actual file access requires re-picking.)
 */
const RECENT_KEY = "sciarch_recent_notebook";
export const rememberNotebook = (name) => {
  try { window.localStorage.setItem(RECENT_KEY, JSON.stringify({ name, at: Date.now() })); } catch { /* ignore */ }
};
export const getRecentNotebook = () => {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};
