import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  idbSaveNotebook,
  idbLoadNotebook,
  idbPutImage,
  idbGetAllImages,
} from "../lib/storage";

// Autosave for freeLN-authored notes only (not dropped folders — those are
// the user's own files already; we don't shadow them in localStorage, which
// also keeps us well under the ~5MB quota). Cookies were considered and
// rejected: capped at ~4KB and sent on every request, the wrong tool for
// document text.
const DRAFT_KEY = "sciarch_freeln_draft";

function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.markdown?.length ? parsed : null;
  } catch {
    return null;
  }
}

function saveDraft(ws) {
  try {
    if (!ws || ws.origin !== "created") return;
    const persistable = {
      rootName: ws.rootName,
      origin: "created",
      markdown: ws.markdown.map(({ path, name, text, dir, editable, history, edited, dirty }) => ({
        path,
        name,
        text,
        dir,
        editable,
        history,
        edited,
        dirty,
      })),
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(persistable));
  } catch {
    // Storage full or unavailable (private browsing) — fail silently, never crash on autosave.
  }
}

// Mirror every authored-notebook autosave into IndexedDB, fire-and-forget.
// idbSaveNotebook strips the transient `images` blob-URL map itself, so only
// JSON-serializable notebook data is stored (image blobs live in their own
// store, written by addImage). Never awaited, never throws — if IndexedDB is
// unavailable the localStorage draft path is untouched and the app behaves
// exactly as before.
function persist(ws) {
  saveDraft(ws);
  try {
    if (!ws || ws.origin !== "created") return;
    Promise.resolve(idbSaveNotebook(ws)).catch(() => {});
  } catch {
    // ignore — mirroring is best-effort only
  }
}

// Stable image ids without Date.now()/Math.random: prefer crypto.randomUUID,
// fall back to a module-level counter (in-session uniqueness only, which is
// all the fallback path needs — it's used when IndexedDB likely failed too).
let imageSeq = 0;
function newImageId() {
  try {
    const uuid = typeof crypto !== "undefined" ? crypto.randomUUID?.() : null;
    if (uuid) return uuid;
  } catch {
    // fall through to counter
  }
  imageSeq += 1;
  return `local-${imageSeq}`;
}

const sanitizeImageName = (name) =>
  (String(name || "image").trim().replace(/[^\w.-]+/g, "_") || "image").slice(0, 80);

// Notes live under `${rootName}/${dir}/${name}`; dir may be "" for root-level
// notes, so empty segments are dropped.
const joinPath = (rootName, dir, fname) => [rootName, dir, fname].filter(Boolean).join("/");

const sanitizeName = (name) => (name || "untitled").trim().replace(/\.md$/i, "") || "untitled";

const WorkspaceContext = createContext({
  workspace: null,
  setWorkspace: () => {},
  activePath: null,
  setActivePath: () => {},
  clear: () => {},
  closeWorkspace: () => {},
  createNote: () => {},
  renameNote: () => {},
  deleteNote: () => {},
  duplicateNote: () => {},
  updateNote: () => {},
  downloadNote: () => {},
  addImage: async () => null,
});

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspaceState] = useState(() => {
    if (typeof window === "undefined") return null;
    const draft = loadDraft();
    return draft ? { ...draft, images: {} } : null;
  });
  const [activePath, setActivePath] = useState(() => {
    if (typeof window === "undefined") return null;
    return loadDraft()?.markdown?.[0]?.path || null;
  });

  // On first mount only: if nothing hydrated from the localStorage draft and
  // no workspace is live, fall back to the IndexedDB snapshot (survives
  // localStorage clears and holds pasted images, which the draft never does).
  // Purely additive: any error or absence leaves state exactly as it was.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (loadDraft()) return; // draft already hydrated via useState initializer
        const saved = await idbLoadNotebook();
        if (cancelled || !saved || !Array.isArray(saved.markdown) || !saved.markdown.length) {
          return;
        }
        const images = await idbGetAllImages(); // { ref: objectURL }
        if (cancelled) {
          Object.values(images).forEach((u) => {
            try { URL.revokeObjectURL(u); } catch { /* ignore */ }
          });
          return;
        }
        let applied = false;
        setWorkspaceState((prev) => {
          // Something opened while we were loading (folder drop, createNote) —
          // never clobber a live workspace.
          if (prev) return prev;
          applied = true;
          return { ...saved, images, origin: saved.origin || "created" };
        });
        if (applied) {
          setActivePath((cur) => cur || saved.markdown[0]?.path || null);
        }
      } catch {
        // Never throw from restore — the app simply starts empty, as before.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Close is NON-destructive: it drops the in-memory workspace (revoking any
  // folder image blob URLs) but never touches the saved DRAFT_KEY snapshot, so
  // the last saved authored notebook survives and is restored on next open
  // (createNote falls back to the saved draft when no workspace is live).
  const closeWorkspace = useCallback(() => {
    setWorkspaceState((prev) => {
      if (prev?.images) {
        Object.values(prev.images).forEach((u) => {
          try { URL.revokeObjectURL(u); } catch { /* ignore */ }
        });
      }
      return null;
    });
    setActivePath(null);
  }, []);

  // Folder-drop path: load the user's own files. Never autosaved to
  // localStorage (see DRAFT_KEY note above) but fully editable in-session.
  const setWorkspace = useCallback((ws) => {
    const tagged = ws ? { ...ws, origin: "folder" } : ws;
    setWorkspaceState(tagged);
    setActivePath(tagged?.markdown?.[0]?.path || null);
  }, []);

  // Create a new editable note. Always APPENDS to whatever workspace is open —
  // including an imported folder (it must never replace or clear the folder's
  // notes). With no workspace open it restores the last saved draft (so a
  // previous Close can't be clobbered by a fresh empty buffer) and only
  // scaffolds a brand-new notebook when no draft exists either. If an untouched
  // blank note with the same name already exists, it's focused instead of
  // stacking untitled-2/-3 duplicates on every revisit.
  const createNote = useCallback((name, dir = "") => {
    const safe = sanitizeName(name);
    const cleanDir = (dir || "").trim().replace(/^\/+|\/+$/g, "");
    setWorkspaceState((prev) => {
      let root = prev;
      if (!root) {
        const draft = loadDraft();
        root = draft
          ? { ...draft, images: {} }
          : { rootName: "My notebook", markdown: [], images: {}, origin: "created" };
      }
      const template = `# ${safe}\n\n`;
      const pristine = root.markdown.find(
        (m) =>
          m.dir === cleanDir &&
          m.name === `${safe}.md` &&
          m.editable &&
          !m.edited &&
          !m.dirty &&
          m.text === template
      );
      if (pristine) {
        setActivePath(pristine.path);
        return root;
      }
      let fname = `${safe}.md`;
      let i = 2;
      while (root.markdown.some((m) => m.dir === cleanDir && m.name === fname)) {
        fname = `${safe}-${i}.md`;
        i += 1;
      }
      const path = joinPath(root.rootName, cleanDir, fname);
      const entry = {
        path,
        name: fname,
        text: template,
        dir: cleanDir,
        editable: true,
        history: [{ label: "created entry", at: Date.now() }],
        edited: false,
        dirty: false,
      };
      const next = { ...root, markdown: [...root.markdown, entry] };
      persist(next);
      setActivePath(path);
      return next;
    });
  }, []);

  // Rename a note in place, PRESERVING its directory (only the filename — and
  // therefore the path — changes).
  const renameNote = useCallback((path, newName) => {
    const safe = sanitizeName(newName);
    setWorkspaceState((prev) => {
      if (!prev) return prev;
      const entry = prev.markdown.find((m) => m.path === path);
      if (!entry) return prev;
      let fname = `${safe}.md`;
      let i = 2;
      while (prev.markdown.some((m) => m.path !== path && m.dir === entry.dir && m.name === fname)) {
        fname = `${safe}-${i}.md`;
        i += 1;
      }
      if (fname === entry.name) return prev;
      const newPath = joinPath(prev.rootName, entry.dir, fname);
      const next = {
        ...prev,
        markdown: prev.markdown.map((m) =>
          m.path === path
            ? {
                ...m,
                path: newPath,
                name: fname,
                history: [...(m.history || []), { label: `renamed to ${fname}`, at: Date.now() }],
              }
            : m
        ),
      };
      persist(next);
      setActivePath((cur) => (cur === path ? newPath : cur));
      return next;
    });
  }, []);

  // Delete a note. If it was active, focus its nearest neighbor.
  const deleteNote = useCallback((path) => {
    setWorkspaceState((prev) => {
      if (!prev) return prev;
      const idx = prev.markdown.findIndex((m) => m.path === path);
      if (idx === -1) return prev;
      const markdown = prev.markdown.filter((m) => m.path !== path);
      const next = { ...prev, markdown };
      persist(next);
      setActivePath((cur) => {
        if (cur !== path) return cur;
        const neighbor = markdown[Math.min(idx, markdown.length - 1)];
        return neighbor ? neighbor.path : null;
      });
      return next;
    });
  }, []);

  // Duplicate a note as "<name> copy.md" in the same directory, right after
  // the original. The copy starts a fresh audit history.
  const duplicateNote = useCallback((path) => {
    setWorkspaceState((prev) => {
      if (!prev) return prev;
      const idx = prev.markdown.findIndex((m) => m.path === path);
      if (idx === -1) return prev;
      const src = prev.markdown[idx];
      const base = src.name.replace(/\.md$/i, "");
      let fname = `${base} copy.md`;
      let i = 2;
      while (prev.markdown.some((m) => m.dir === src.dir && m.name === fname)) {
        fname = `${base} copy ${i}.md`;
        i += 1;
      }
      const newPath = joinPath(prev.rootName, src.dir, fname);
      const entry = {
        path: newPath,
        name: fname,
        text: src.text,
        dir: src.dir,
        editable: true,
        history: [{ label: `duplicated from ${src.name}`, at: Date.now() }],
        edited: false,
        dirty: false,
      };
      const markdown = [...prev.markdown];
      markdown.splice(idx + 1, 0, entry);
      const next = { ...prev, markdown };
      persist(next);
      setActivePath(newPath);
      return next;
    });
  }, []);

  // Edits mark the note dirty; the first edit since the last save/export logs
  // a single audit row so the log doesn't spam per-keystroke.
  const updateNote = useCallback((path, text) => {
    setWorkspaceState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        markdown: prev.markdown.map((m) =>
          m.path === path
            ? {
                ...m,
                text,
                edited: true,
                dirty: true,
                history: m.dirty
                  ? m.history
                  : [...(m.history || []), { label: "saved new version", at: Date.now() }],
              }
            : m
        ),
      };
      persist(next);
      return next;
    });
  }, []);

  // Export to disk — the explicit "save" for a note, so it clears the dirty
  // flag and lands in the audit history.
  const downloadNote = useCallback((path) => {
    setWorkspaceState((prev) => {
      const entry = prev?.markdown.find((m) => m.path === path);
      if (!entry) return prev;
      const blob = new Blob([entry.text], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const next = {
        ...prev,
        markdown: prev.markdown.map((m) =>
          m.path === path
            ? {
                ...m,
                dirty: false,
                history: [...(m.history || []), { label: "downloaded copy", at: Date.now() }],
              }
            : m
        ),
      };
      persist(next);
      return next;
    });
  }, []);

  // Re-insert a note verbatim — used by the Delete → Undo toast. Restores the
  // exact text, directory and audit history (deduping per-directory so it never
  // clobbers a same-named note living in another folder). This is the reliable
  // undo path: it never guesses the path createNote would pick.
  const restoreNote = useCallback((snap) => {
    if (!snap) return;
    const dir = (snap.dir || "").trim().replace(/^\/+|\/+$/g, "");
    const base = (snap.name || "untitled.md").replace(/\.md$/i, "");
    setWorkspaceState((prev) => {
      const root =
        prev || { rootName: "My notebook", markdown: [], images: {}, origin: "created" };
      let fname = `${base}.md`;
      let i = 2;
      while (root.markdown.some((m) => m.dir === dir && m.name === fname)) {
        fname = `${base}-${i}.md`;
        i += 1;
      }
      const path = joinPath(root.rootName, dir, fname);
      const entry = {
        path,
        name: fname,
        text: snap.text ?? "",
        dir,
        editable: true,
        history: [...(snap.history || []), { label: "restored", at: Date.now() }],
        edited: false,
        dirty: false,
      };
      const next = { ...root, markdown: [...root.markdown, entry] };
      persist(next);
      setActivePath(path);
      return next;
    });
  }, []);

  // Register a pasted/attached image. Stores the Blob in IndexedDB under its
  // ref (the same string used in markdown, e.g. "images/<id>-<name>.png"),
  // registers a live object URL in the current workspace's images map, and
  // resolves to the ref for insertion into note text. If IndexedDB is
  // unavailable the ref is still returned backed by the in-memory object URL,
  // so paste keeps working for the session (it just won't survive reload).
  const addImage = useCallback(async (file) => {
    if (!file) return null;
    const ref = `images/${newImageId()}-${sanitizeImageName(file.name)}`;
    try {
      await idbPutImage(ref, file); // safe: resolves null on failure, never rejects
    } catch {
      // keep going — in-session object URL below still makes the ref usable
    }
    let url = "";
    try {
      url = URL.createObjectURL(file);
    } catch {
      // ignore — ref still resolves once reloaded from IndexedDB
    }
    setWorkspaceState((prev) => {
      // Same fallback chain as createNote: restore the saved draft, else
      // scaffold a fresh authored notebook, so a paste is never dropped.
      let root = prev;
      if (!root) {
        const draft = loadDraft();
        root = draft
          ? { ...draft, images: {} }
          : { rootName: "My notebook", markdown: [], images: {}, origin: "created" };
      }
      const next = { ...root, images: { ...(root.images || {}), [ref]: url } };
      persist(next);
      return next;
    });
    return ref;
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setWorkspace,
        activePath,
        setActivePath,
        clear: closeWorkspace,
        closeWorkspace,
        createNote,
        renameNote,
        deleteNote,
        duplicateNote,
        restoreNote,
        updateNote,
        downloadNote,
        addImage,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
