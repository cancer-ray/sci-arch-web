import { createContext, useCallback, useContext, useState } from "react";

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
      markdown: ws.markdown.map(({ path, name, text, dir, editable, history, edited }) => ({
        path,
        name,
        text,
        dir,
        editable,
        history,
        edited,
      })),
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(persistable));
  } catch {
    // Storage full or unavailable (private browsing) — fail silently, never crash on autosave.
  }
}

const WorkspaceContext = createContext({
  workspace: null,
  setWorkspace: () => {},
  activePath: null,
  setActivePath: () => {},
  clear: () => {},
  createNote: () => {},
  renameNote: () => {},
  updateNote: () => {},
  downloadNote: () => {},
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

  const clear = useCallback(() => {
    if (workspace?.images) {
      Object.values(workspace.images).forEach((u) => {
        try { URL.revokeObjectURL(u); } catch { /* ignore */ }
      });
    }
    if (workspace?.origin === "created") {
      try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    }
    setWorkspaceState(null);
    setActivePath(null);
  }, [workspace]);

  // Folder-drop path: read-only viewer, never autosaved (see DRAFT_KEY note above).
  const setWorkspace = useCallback((ws) => {
    const tagged = ws ? { ...ws, origin: "folder" } : ws;
    setWorkspaceState(tagged);
    setActivePath(tagged?.markdown?.[0]?.path || null);
  }, []);

  // freeLN authoring path: create a new editable, autosaved note.
  const createNote = useCallback((name) => {
    const safe = (name || "untitled").trim().replace(/\.md$/i, "") || "untitled";
    setWorkspaceState((prev) => {
      const root = prev?.origin === "created" ? prev : { rootName: "My notebook", markdown: [], images: {}, origin: "created" };
      let fname = `${safe}.md`;
      let i = 2;
      while (root.markdown.some((m) => m.name === fname)) {
        fname = `${safe}-${i}.md`;
        i += 1;
      }
      const path = `${root.rootName}/${fname}`;
      const entry = {
        path,
        name: fname,
        text: `# ${safe}\n\n`,
        dir: "",
        editable: true,
        history: [{ label: "created entry" }],
        edited: false,
      };
      const next = { ...root, markdown: [...root.markdown, entry] };
      saveDraft(next);
      setActivePath(path);
      return next;
    });
  }, []);

  // Rename a freeLN-authored note (path is derived from the name, so it changes too).
  const renameNote = useCallback((path, newName) => {
    const safe = (newName || "untitled").trim().replace(/\.md$/i, "") || "untitled";
    setWorkspaceState((prev) => {
      if (!prev) return prev;
      let fname = `${safe}.md`;
      let i = 2;
      while (prev.markdown.some((m) => m.path !== path && m.name === fname)) {
        fname = `${safe}-${i}.md`;
        i += 1;
      }
      const newPath = `${prev.rootName}/${fname}`;
      const next = {
        ...prev,
        markdown: prev.markdown.map((m) =>
          m.path === path
            ? {
                ...m,
                path: newPath,
                name: fname,
                history: [...(m.history || []), { label: `renamed to ${fname}` }],
              }
            : m
        ),
      };
      saveDraft(next);
      setActivePath((cur) => (cur === path ? newPath : cur));
      return next;
    });
  }, []);

  // The first edit to a note logs a single "saved new version" audit row;
  // later keystrokes just update the text so the log doesn't spam per-character.
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
                history: m.edited ? m.history : [...(m.history || []), { label: "saved new version" }],
              }
            : m
        ),
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const downloadNote = useCallback((path) => {
    setWorkspaceState((prev) => {
      const entry = prev?.markdown.find((m) => m.path === path);
      if (entry) {
        const blob = new Blob([entry.text], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = entry.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      return prev;
    });
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{ workspace, setWorkspace, activePath, setActivePath, clear, createNote, renameNote, updateNote, downloadNote }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
