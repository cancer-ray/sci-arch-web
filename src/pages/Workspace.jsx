import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  FolderOpen,
  Search,
  Lock,
  X,
  Home,
  Type,
  PlusCircle,
  Download,
  PenLine,
  Loader2,
  Wrench,
  FileCode,
  Columns2,
  Eye,
  ChevronDown,
  ChevronRight,
  Command,
  PanelLeft,
  PanelLeftClose,
  MoreVertical,
  Copy,
  Trash2,
  FileUp,
  Printer,
  FolderArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoldHint } from "@/components/ui/hold-hint";
import { SegmentedControl } from "@/components/ui/segmented";
import { PrintedCard } from "@/components/ui/popover";
import { FolderDrop } from "@/components/FolderDrop";
import { ToolDock } from "@/components/tools/ToolDock";
import { WysiwygEditor } from "@/components/WysiwygEditor";
import { Seo } from "@/components/Seo";
import CodeEditor from "@/components/editor/CodeEditor";
import CommandPalette from "@/components/CommandPalette";
import { ev } from "@/lib/analytics";
import { useTheme } from "@/context/ThemeContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { readFolder, rememberNotebook, filesFromDrop, TEMPLATES, sampleWorkspace } from "@/lib/folder";
import { exportNotebookZip } from "@/lib/export";
import { IMPORT_ACCEPT, importFileToMarkdown } from "@/lib/import";
import { mdComponents } from "@/lib/markdown";
import { WORKSPACE } from "@/constants/testIds";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
// Per-note dirty check. Prefers the context's dedicated `dirty` flag when it
// exists; falls back to the legacy `edited` flag until the context ships it.
const isDirty = (m) => (m?.dirty !== undefined ? Boolean(m.dirty) : Boolean(m?.edited));
// Trigger a browser download for a note. Deliberately a plain function OUTSIDE
// any setState updater so React StrictMode's double-invoked updaters can't
// fire the download twice.
const downloadEntry = (m) => {
  if (!m) return;
  ev("export_used", { type: "md" });
  const blob = new Blob([m.text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = m.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
const readLS = (k, d) => {
  try {
    const v = window.localStorage.getItem(k);
    return v == null ? d : v;
  } catch {
    return d;
  }
};
const readNum = (k, d) => {
  const n = parseFloat(readLS(k, ""));
  return Number.isFinite(n) ? n : d;
};
const writeLS = (k, v) => {
  try {
    window.localStorage.setItem(k, String(v));
  } catch {
    /* ignore */
  }
};
// Compact timestamp for audit rows ("Jul 5, 14:32").
const fmtWhen = (t) => {
  try {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// Drag-to-resize divider between two panels. Reports incremental pointer deltas;
// the parent clamps and persists the resulting size. Pointer events unify
// mouse + touch, and it's hidden below md where panels stack vertically.
function Resizer({ onDelta, testid }) {
  const last = useRef(null);
  const [dragging, setDragging] = useState(false);
  const onDown = (e) => {
    e.preventDefault();
    last.current = e.clientX;
    setDragging(true);
    const move = (ev) => {
      if (last.current == null) return;
      onDelta(ev.clientX - last.current);
      last.current = ev.clientX;
    };
    const up = () => {
      last.current = null;
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div
      className="ws-resizer hidden w-1.5 self-stretch md:block"
      data-testid={testid}
      data-dragging={dragging}
      onPointerDown={onDown}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

const VIEW_MODES = [
  { key: "markdown", label: "Write", icon: FileCode, testid: WORKSPACE.viewModeMarkdown, title: "Raw markdown source" },
  { key: "split", label: "Split", icon: Columns2, testid: WORKSPACE.viewModeSplit, title: "Editor and preview side by side" },
  { key: "wysiwyg", label: "Rich", icon: Type, testid: WORKSPACE.viewModeWysiwyg, title: "Rich-text (WYSIWYG) editing" },
  { key: "preview", label: "Read", icon: Eye, testid: WORKSPACE.viewModePreview, title: "Rendered preview" },
];

export default function Workspace() {
  const {
    workspace,
    activePath,
    setActivePath,
    clear,
    setWorkspace,
    createNote,
    renameNote,
    updateNote,
    deleteNote,
    duplicateNote,
    restoreNote,
    downloadNote,
    addImage,
  } = useWorkspace();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [menuFor, setMenuFor] = useState(null); // path of the note whose kebab menu is open
  const [rowRename, setRowRename] = useState(null); // { path, value } while renaming inline in the sidebar
  const [toolsOpen, setToolsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false); // Export split-button dropdown
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false); // New-note template dropdown
  const [printNote, setPrintNote] = useState(null); // { name, text } while "Export note (PDF)" runs
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  const [pageDragging, setPageDragging] = useState(false);
  const [viewMode, setViewMode] = useState(() => readLS("sciarch_workspace_viewmode", "split"));
  const [auditOpen, setAuditOpen] = useState(() => readLS("sciarch_workspace_audit", "1") === "1");
  const [sidebarW, setSidebarW] = useState(() => readNum("sciarch_ws_sidebar_w", 240));
  const [toolsW, setToolsW] = useState(() => readNum("sciarch_ws_tools_w", 320));
  const [splitPct, setSplitPct] = useState(() => readNum("sciarch_ws_split_pct", 0.5));
  const dragDepth = useRef(0);
  const splitRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const exportMenuRef = useRef(null); // wraps the Export split button + its dropdown
  const templateMenuRef = useRef(null); // wraps the New-note split button + its dropdown
  const importInputRef = useRef(null); // hidden <input type="file"> for Import
  // Latest workspace, readable from stable callbacks (toast Undo, fallbacks).
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;

  const anyDirty = useMemo(
    () => Boolean(workspace?.markdown?.some((m) => isDirty(m))),
    [workspace]
  );

  // Data safety: warn before the tab closes while any note has unsaved changes.
  useEffect(() => {
    if (!anyDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  // Close the kebab menu on outside click or Escape.
  useEffect(() => {
    if (!menuFor) return undefined;
    const onDocPointerDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuFor(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuFor(null);
    };
    document.addEventListener("mousedown", onDocPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuFor]);

  // Close the Export / New-note dropdowns on outside click or Escape (same
  // pattern as the kebab menu above; separate refs because both can't be open
  // from the same anchor).
  useEffect(() => {
    if (!exportMenuOpen && !templateMenuOpen) return undefined;
    const onDocPointerDown = (e) => {
      if (exportMenuOpen && !exportMenuRef.current?.contains(e.target)) setExportMenuOpen(false);
      if (templateMenuOpen && !templateMenuRef.current?.contains(e.target)) setTemplateMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setExportMenuOpen(false);
        setTemplateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportMenuOpen, templateMenuOpen]);

  // "Export note (PDF)": while `printNote` is set, a hidden .print-surface
  // portal (rendered at the bottom of this component) holds the note's
  // markdown render. body.printing makes the print stylesheet show ONLY that
  // surface; afterprint tears everything down. Cancelling the dialog also
  // fires afterprint, so cleanup is symmetric either way.
  useEffect(() => {
    if (!printNote) return undefined;
    const finish = () => {
      document.body.classList.remove("printing");
      setPrintNote(null);
    };
    window.addEventListener("afterprint", finish);
    document.body.classList.add("printing");
    // Give the portal one tick to paint before the (blocking) print dialog.
    const t = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", finish);
      document.body.classList.remove("printing");
    };
  }, [printNote]);

  // Track the desktop breakpoint so panel widths (inline styles) only apply when
  // panels sit side by side; below md everything stacks full-width.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => writeLS("sciarch_workspace_viewmode", viewMode), [viewMode]);
  useEffect(() => writeLS("sciarch_workspace_audit", auditOpen ? "1" : "0"), [auditOpen]);
  useEffect(() => writeLS("sciarch_ws_sidebar_w", sidebarW), [sidebarW]);
  useEffect(() => writeLS("sciarch_ws_tools_w", toolsW), [toolsW]);
  useEffect(() => writeLS("sciarch_ws_split_pct", splitPct), [splitPct]);

  // Global shortcuts. Cmd/Ctrl-K toggles the command palette (the palette itself
  // does NOT register this — the Workspace owns the `open` prop). "/" focuses the
  // sidebar search when the user isn't already typing somewhere.
  useEffect(() => {
    const onKey = (e) => {
      // If the editor (or any handler) already consumed this key, don't also
      // fire a global shortcut — prevents e.g. an editor Mod-key from also
      // toggling the palette.
      if (e.defaultPrevented) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target;
        const tag = t?.tagName;
        const typing =
          tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable;
        if (typing) return;
        e.preventDefault();
        setSidebarOpen(true);
        // The input may not exist yet if the sidebar was closed — focus next tick.
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Whole-page drop target: dropping .md files or a folder anywhere on the
  // workspace loads it, not just onto the little sidebar dropzone. A drag depth
  // counter avoids flicker as the cursor crosses child elements.
  const onPageDragEnter = (e) => {
    if (e.dataTransfer?.types?.includes("Files")) {
      dragDepth.current += 1;
      setPageDragging(true);
    }
  };
  const onPageDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setPageDragging(false);
  };
  const onPageDrop = async (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setPageDragging(false);
    const files = await filesFromDrop(e.dataTransfer);
    if (!files.length) return;
    const ws = await readFolder(files);
    if (ws) {
      if (!confirmReplace()) return;
      rememberNotebook(ws.rootName);
      if (ws.skipped?.length) {
        toast.warning(
          `Skipped ${ws.skipped.length} file${ws.skipped.length === 1 ? "" : "s"} over the size limit (5 MB / note, 25 MB / image).`
        );
      }
      setWorkspace(ws);
    }
  };

  const active = useMemo(
    () => workspace?.markdown.find((m) => m.path === activePath) || null,
    [workspace, activePath]
  );

  // Jump straight into a blank note instead of an empty-state screen. Fires again
  // after Close (workspace goes null), so there's always something to write in.
  // Guarded by a ref (not just the effect's own dependency check) so React 18
  // StrictMode's dev-only double-invoke can't create two "untitled" notes before
  // the first createNote's state update has settled.
  const autoCreatedRef = useRef(false);
  useEffect(() => {
    if (!workspace && !autoCreatedRef.current) {
      autoCreatedRef.current = true;
      createNote("untitled");
    } else if (workspace) {
      autoCreatedRef.current = false;
    }
  }, [workspace, createNote]);

  useEffect(() => {
    setRenaming(false);
  }, [activePath]);

  const startRename = () => {
    if (!active?.editable) return;
    setRenameValue(active.name.replace(/\.md$/i, ""));
    setRenaming(true);
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed) renameNote(active.path, trimmed);
    setRenaming(false);
  };

  const filtered = useMemo(() => {
    if (!workspace) return [];
    const q = query.trim().toLowerCase();
    if (!q) return workspace.markdown;
    return workspace.markdown.filter(
      (m) => m.name.toLowerCase().includes(q) || m.text.toLowerCase().includes(q)
    );
  }, [workspace, query]);

  // Data safety: never silently replace a workspace that has unsaved changes.
  const confirmReplace = () =>
    !anyDirty ||
    window.confirm(
      "Replace the current workspace? Notes with unsaved changes will be closed."
    );

  const closeNotebook = () => {
    if (!confirmReplace()) return;
    clear();
  };

  // Fallback used when the context does not (yet) expose duplicateNote /
  // restore-on-undo: create a note, then fill it with the given text. Mirrors
  // the context's name-dedup logic so we can address the note it will create.
  const createWithText = (baseName, text) => {
    const ws = workspaceRef.current;
    let fname = `${baseName}.md`;
    let i = 2;
    while (ws?.markdown?.some((n) => n.name === fname)) {
      fname = `${baseName}-${i}.md`;
      i += 1;
    }
    createNote(baseName);
    updateNote(`${ws?.rootName || "My notebook"}/${fname}`, text);
  };

  const handleDuplicate = (m) => {
    setMenuFor(null);
    if (typeof duplicateNote === "function") {
      duplicateNote(m.path);
      return;
    }
    createWithText(`${m.name.replace(/\.md$/i, "")} copy`, m.text);
  };

  const handleDelete = (m) => {
    setMenuFor(null);
    if (typeof deleteNote !== "function") return;
    // Capture the full note so Undo restores its text, directory AND history
    // verbatim (not a blank note at the root).
    const snapshot = { name: m.name, text: m.text, dir: m.dir, history: m.history };
    deleteNote(m.path);
    toast(`Deleted ${m.name}`, {
      action: {
        label: "Undo",
        onClick: () =>
          typeof restoreNote === "function"
            ? restoreNote(snapshot)
            : createWithText(snapshot.name.replace(/\.md$/i, ""), snapshot.text),
      },
    });
  };

  const startRowRename = (m) => {
    setMenuFor(null);
    setRowRename({ path: m.path, value: m.name.replace(/\.md$/i, "") });
  };

  const commitRowRename = () => {
    if (!rowRename) return;
    const trimmed = rowRename.value.trim();
    if (trimmed) renameNote(rowRename.path, trimmed);
    setRowRename(null);
  };

  // ——— Phase 3 wiring: templates, import, export (.zip/PDF), sample, Claude ———

  // Predict the path createNote() will assign for a root-level note, mirroring
  // the context's sanitize + pristine-reuse + "-2" dedupe rules. `claimed`
  // (a Set of filenames) lets batch imports reserve several names before
  // React has flushed the intermediate workspace states.
  const claimCreatePath = (name, claimed = new Set()) => {
    const ws = workspaceRef.current;
    const safe = (name || "untitled").trim().replace(/\.md$/i, "") || "untitled";
    const notes = ws?.markdown || [];
    const rootName = ws?.rootName || "My notebook";
    const template = `# ${safe}\n\n`;
    const pristine = notes.find(
      (m) =>
        m.dir === "" &&
        m.name === `${safe}.md` &&
        m.editable &&
        !m.edited &&
        !m.dirty &&
        m.text === template
    );
    if (pristine && !claimed.has(pristine.name)) {
      claimed.add(pristine.name);
      return pristine.path;
    }
    const taken = (fname) =>
      claimed.has(fname) || notes.some((m) => m.dir === "" && m.name === fname);
    let fname = `${safe}.md`;
    let i = 2;
    while (taken(fname)) {
      fname = `${safe}-${i}.md`;
      i += 1;
    }
    claimed.add(fname);
    return `${rootName}/${fname}`;
  };

  // New-from-template: create the note (named after the template), then fill
  // it with the template body. "Blank" is exactly the existing New note path.
  const createFromTemplate = (t) => {
    setTemplateMenuOpen(false);
    if (!t || t.id === "blank") {
      createNote("untitled");
      return;
    }
    const path = claimCreatePath(t.label);
    createNote(t.label);
    updateNote(path, t.body);
  };

  // Import picked files as new notes. Non-importable files are reported by
  // name — never silently dropped.
  const onImportFiles = async (files) => {
    if (!files.length) return;
    const claimed = new Set();
    const added = [];
    const skipped = [];
    for (const file of files) {
      let converted = null;
      try {
        converted = await importFileToMarkdown(file); // resolves null, never throws
      } catch {
        converted = null;
      }
      if (!converted) {
        skipped.push(file.name);
        continue;
      }
      const path = claimCreatePath(converted.name, claimed);
      createNote(converted.name);
      updateNote(path, converted.markdown);
      added.push(converted.name);
    }
    if (added.length) {
      toast.success(`Imported ${added.length} file${added.length === 1 ? "" : "s"} as notes`);
    }
    if (skipped.length) {
      toast.warning(
        `Skipped ${skipped.length} file${skipped.length === 1 ? "" : "s"} (unsupported or unreadable): ${skipped.join(", ")}`,
        { duration: 8000 }
      );
    }
  };

  const exportZip = async () => {
    setExportMenuOpen(false);
    const ok = await exportNotebookZip(workspaceRef.current);
    if (ok) toast.success("Notebook exported (.zip)");
    else toast.warning("Nothing to export yet");
  };

  const exportPdf = () => {
    setExportMenuOpen(false);
    const note = workspaceRef.current?.markdown.find((m) => m.path === activePath);
    if (!note) return;
    setPrintNote({ name: note.name, text: note.text || "" });
  };

  const loadSample = () => {
    if (!confirmReplace()) return;
    setWorkspace(sampleWorkspace());
    toast.success("Sample notebook loaded");
  };

  const copyForClaude = async () => {
    const note = workspaceRef.current?.markdown.find((m) => m.path === activePath);
    if (!note) return;
    try {
      await navigator.clipboard.writeText(`# ${note.path}\n\n${note.text || ""}`);
      toast.success("Copied for Claude — paste it into a Claude chat");
    } catch {
      toast.error("Couldn't write to the clipboard.");
    }
  };

  const pasteFromClaude = async () => {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      toast.error("Couldn't read the clipboard — allow clipboard access and retry.");
      return;
    }
    if (!text.trim()) {
      toast.warning("Clipboard is empty");
      return;
    }
    if (typeof restoreNote === "function") {
      // restoreNote inserts verbatim with a caller-supplied audit history, so
      // the note honestly records where its text came from.
      restoreNote({
        name: "from Claude.md",
        text,
        dir: "",
        history: [{ label: "pasted from Claude", at: Date.now() }],
      });
    } else {
      const path = claimCreatePath("from Claude");
      createNote("from Claude");
      updateNote(path, text);
    }
    toast.success("Pasted into a new note");
  };

  const resizeSplit = useCallback((dx) => {
    const w = splitRef.current?.getBoundingClientRect().width;
    if (!w) return;
    setSplitPct((p) => clamp(p + dx / w, 0.25, 0.8));
  }, []);

  const onEditorSave = useCallback(() => toast.success("Saved"), []);

  const wordCount = useMemo(
    () => (active?.text || "").trim().split(/\s+/).filter(Boolean).length,
    [active]
  );

  const paletteNotes = useMemo(
    () => (workspace?.markdown || []).map((m) => ({ path: m.path, name: m.name, text: m.text })),
    [workspace]
  );

  if (!workspace) {
    return (
      <div
        className="grid h-dvh min-h-dvh place-items-center bg-background text-foreground"
        data-testid={WORKSPACE.root}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const paletteActions = [
    { id: "new-note", label: "New note", hint: "creates untitled.md", group: "Notebook", run: () => createNote("untitled") },
    // One "New from template" action per template ("Blank" is the plain New note above).
    ...TEMPLATES.filter((t) => t.id !== "blank").map((t) => ({
      id: `new-from-${t.id}`,
      label: `New from template: ${t.label}`,
      group: "Notebook",
      run: () => createFromTemplate(t),
    })),
    { id: "import-files", label: "Import files as notes", hint: ".md .txt .html .docx", group: "Notebook", run: () => importInputRef.current?.click() },
    { id: "toggle-files", label: "Toggle files panel", group: "View", run: () => setSidebarOpen((o) => !o) },
    { id: "toggle-tools", label: "Toggle tools panel", group: "View", run: () => setToolsOpen((o) => !o) },
    { id: "download-current", label: "Download current note", hint: ".md", group: "Notebook", run: () => downloadEntry(active) },
    { id: "export-zip", label: "Export notebook", hint: ".zip", group: "Notebook", run: exportZip },
    { id: "export-pdf", label: "Export note (PDF)", hint: "print", group: "Notebook", run: exportPdf },
    { id: "load-sample", label: "Load sample notebook", group: "Notebook", run: loadSample },
    { id: "copy-for-claude", label: "Copy for Claude", hint: "clipboard", group: "Claude", run: copyForClaude },
    { id: "paste-from-claude", label: "Paste from Claude", hint: "clipboard", group: "Claude", run: pasteFromClaude },
    { id: "close-notebook", label: "Close notebook", group: "Notebook", run: closeNotebook },
  ];

  const activeDirty = isDirty(active);

  // Markdown-source editor (CodeMirror), shared by Write and Split modes.
  const sourceEditor = (
    <div data-testid={WORKSPACE.editorPane} className="min-h-0 min-w-0 flex-1 overflow-hidden">
      {active && (
        <CodeEditor
          key={active.path}
          value={active.text}
          onChange={(v) => updateNote(active.path, v)}
          onSave={onEditorSave}
          onInsertImage={async (file) => {
            // Pasted/dropped image: persist it (IndexedDB + object URL) and
            // append its markdown reference to the note.
            const path = active.path;
            const ref = await addImage(file);
            if (!ref) return;
            const note = workspaceRef.current?.markdown.find((m) => m.path === path);
            const base = note ? note.text || "" : active.text || "";
            updateNote(path, `${base.replace(/\n*$/, "\n")}\n![](${ref})\n`);
          }}
          theme={theme}
          images={workspace.images}
          className="h-full"
        />
      )}
    </div>
  );

  const livePreview = (
    <article className="prose-eln min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(workspace.images)}>
        {active?.text || ""}
      </ReactMarkdown>
    </article>
  );

  return (
    <div
      className="relative flex h-dvh min-h-dvh flex-col overflow-hidden bg-background text-foreground"
      data-testid={WORKSPACE.root}
      onDragEnter={onPageDragEnter}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
      }}
      onDragLeave={onPageDragLeave}
      onDrop={onPageDrop}
    >
      <Seo title="freeLN — sci-arch" description="A local-first markdown lab notebook. Write, import, and export — nothing leaves your device." />
      {/* Full-page drop feedback — appears only while dragging files over the
          page. Framed as opening a local file, never an "upload": nothing is
          sent anywhere. */}
      {pageDragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
          <div className="m-4 flex h-[calc(100%-2rem)] w-[calc(100%-2rem)] flex-col items-center justify-center border-2 border-dashed border-primary px-4 text-center">
            <FolderOpen className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <p className="mt-3 font-serif text-lg text-foreground">Drop to open your notebook</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              .md files or a folder · opens on this device, never sent anywhere
            </p>
          </div>
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        notes={paletteNotes}
        activePath={activePath}
        onSelectNote={setActivePath}
        actions={paletteActions}
      />

      {/* App bar — icon-only controls. Each one carries its label and
          description in a press-and-hold hint (HoldHint) instead of visible
          text, so the whole bar stays one row even at phone widths. */}
      <header className="flex h-11 flex-none items-center gap-2 border-b border-border px-3">
        <HoldHint
          icon={Home}
          label="Home"
          description="Back to the sci-arch site."
          onClick={() => navigate("/")}
        />
        <div
          data-testid={WORKSPACE.breadcrumb}
          className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[12px]"
        >
          <span className="text-primary">§</span>
          <span className="truncate text-foreground">{workspace.rootName}</span>
          <span className="hidden flex-none text-muted-foreground sm:inline">
            · {workspace.markdown.length} {workspace.markdown.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <SegmentedControl
          data-testid={WORKSPACE.toggleView}
          className="hidden h-7 flex-none sm:inline-flex"
          value={viewMode}
          onChange={setViewMode}
          options={VIEW_MODES.map((vm) => ({
            value: vm.key,
            label: (
              <span
                data-testid={vm.testid}
                title={vm.title}
                className="inline-flex items-center gap-1.5"
              >
                <vm.icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{vm.label}</span>
              </span>
            ),
          }))}
        />

        <div className="flex flex-1 items-center justify-end gap-1">
          <HoldHint
            icon={PanelLeft}
            label="Files"
            description={sidebarOpen ? "Hide the files panel." : "Show the files panel."}
            onClick={() => setSidebarOpen((o) => !o)}
            active={sidebarOpen}
            aria-pressed={sidebarOpen}
          />
          <HoldHint
            icon={Wrench}
            label="Tools"
            description={toolsOpen ? "Hide the tools panel." : "Show the tools panel."}
            onClick={() => setToolsOpen((o) => !o)}
            active={toolsOpen}
            aria-pressed={toolsOpen}
          />
          {/* New note — split control: primary click = blank note (unchanged),
              caret opens the template picker. */}
          <div ref={templateMenuRef} className="relative flex flex-none items-center">
            <HoldHint
              data-testid={WORKSPACE.newNoteBtn}
              icon={PlusCircle}
              label="New note"
              description="Start a blank note."
              onClick={() => createNote("untitled")}
              className="text-primary"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplateMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={templateMenuOpen}
              title="New note from a template"
              aria-label="New note from a template"
              className="-ml-px h-7 px-1"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            {templateMenuOpen && (
              <PrintedCard
                role="menu"
                aria-label="New note from template"
                className="absolute right-0 top-full z-30 mt-1 w-44 max-w-[calc(100vw-1rem)] py-1"
              >
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    role="menuitem"
                    onClick={() => createFromTemplate(t)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-foreground/80 hover:bg-secondary transition-colors"
                  >
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    {t.label}
                  </button>
                ))}
              </PrintedCard>
            )}
          </div>
          <HoldHint
            icon={FileUp}
            label="Import"
            description="Add .md, .txt, .html, or .docx files as notes."
            onClick={() => importInputRef.current?.click()}
            className="text-primary"
          />
          {/* Export — split control: primary click still downloads the current
              note as .md (same behavior + testid as before), caret opens the
              .md / .zip / PDF menu. */}
          <div ref={exportMenuRef} className="relative flex flex-none items-center">
            <HoldHint
              data-testid={WORKSPACE.downloadNoteBtn}
              icon={Download}
              label="Export"
              description="Download the current note as markdown."
              disabled={!active}
              onClick={() => downloadEntry(active)}
              className="text-primary"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              title="More export options"
              aria-label="More export options"
              className="-ml-px h-7 px-1"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            {exportMenuOpen && (
              <PrintedCard
                role="menu"
                aria-label="Export options"
                className="absolute right-0 top-full z-30 mt-1 w-52 max-w-[calc(100vw-1rem)] py-1"
              >
                <button
                  role="menuitem"
                  disabled={!active}
                  onClick={() => {
                    setExportMenuOpen(false);
                    if (!active) return;
                    if (typeof downloadNote === "function") downloadNote(active.path);
                    else downloadEntry(active);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-foreground/80 hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Download className="h-3 w-3 text-muted-foreground" />
                  Download .md
                </button>
                <button
                  role="menuitem"
                  onClick={exportZip}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-foreground/80 hover:bg-secondary transition-colors"
                >
                  <FolderArchive className="h-3 w-3 text-muted-foreground" />
                  Export notebook (.zip)
                </button>
                <button
                  role="menuitem"
                  disabled={!active}
                  onClick={exportPdf}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-foreground/80 hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Printer className="h-3 w-3 text-muted-foreground" />
                  Export note (PDF)
                </button>
              </PrintedCard>
            )}
          </div>
          {/* Signing is planned but not built yet — the control stays visible
              (sm and up) and disabled so the roadmap is honest. The extra
              span keeps the hidden button from leaving a stray flex gap. */}
          <span className="hidden sm:inline-flex">
            <HoldHint
              data-testid={WORKSPACE.gmpLockBtn}
              icon={Lock}
              label="Sign & lock — coming soon"
              description="E-signatures and locked entries are on the roadmap."
              variant="ghost"
              disabled
            />
          </span>
          <HoldHint
            icon={Command}
            label="Command palette"
            description="Search notes and actions. Cmd or Ctrl-K."
            onClick={() => setPaletteOpen(true)}
          />
          <HoldHint
            icon={X}
            label="Close notebook"
            description="Close this notebook."
            variant="ghost"
            onClick={closeNotebook}
          />
        </div>
      </header>

      {/* Body — a resizable row of panels on desktop (files · editor · tools);
          stacks to a single column on mobile so nothing is squeezed. */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Sidebar — collapsible and, on desktop, width-resizable. */}
        {sidebarOpen && (
          <aside
            className="flex min-h-0 w-full flex-col border-b border-border md:border-b-0 md:border-r"
            style={isDesktop ? { width: sidebarW, flex: "0 0 auto" } : undefined}
            data-testid={WORKSPACE.fileTree}
          >
            <div className="flex flex-none items-center gap-1.5 border-b border-border p-2">
              <div className="flex flex-1 items-center gap-1.5 border border-border px-2 focus-within:border-primary">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                  ref={searchRef}
                  data-testid={WORKSPACE.searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="search…  ( / )"
                  className="h-7 w-full border-none bg-transparent font-mono text-[11px] focus:outline-none"
                />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                title="Minimize files panel"
                aria-label="Minimize files panel"
                className="btn-lift inline-flex h-7 w-7 flex-none items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="max-h-[40vh] flex-1 overflow-y-auto p-1.5 md:max-h-none">
              {filtered.map((m, i) => (
                <li key={m.path} className="relative">
                  {rowRename?.path === m.path ? (
                    <div className="flex items-center gap-1.5 border-l-2 border-primary bg-primary/[0.08] px-2 py-1">
                      <FileText className="h-3 w-3 flex-none text-primary" />
                      <input
                        autoFocus
                        aria-label="Rename note"
                        value={rowRename.value}
                        onChange={(e) =>
                          setRowRename((r) => (r ? { ...r, value: e.target.value } : r))
                        }
                        onBlur={commitRowRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRowRename();
                          if (e.key === "Escape") setRowRename(null);
                        }}
                        className="w-full min-w-0 border-b border-primary bg-transparent font-mono text-[11px] text-foreground focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex w-full items-center border-l-2 transition-colors ${
                        m.path === activePath
                          ? "border-primary bg-primary/[0.08] text-primary"
                          : "border-transparent text-foreground/75 hover:bg-secondary"
                      }`}
                    >
                      <button
                        data-testid={
                          m.path === activePath ? WORKSPACE.activeFile : WORKSPACE.fileItem(i)
                        }
                        onClick={() => setActivePath(m.path)}
                        aria-current={m.path === activePath ? "true" : undefined}
                        className="flex min-w-0 flex-1 items-center gap-1.5 truncate px-2 py-1 text-left font-mono text-[11px]"
                      >
                        <FileText className="h-3 w-3 flex-none" />
                        <span className="truncate">
                          {m.path.replace(workspace.rootName + "/", "")}
                        </span>
                        {isDirty(m) && (
                          <span
                            className="ml-auto h-1.5 w-1.5 flex-none bg-warning"
                            title="Unsaved changes"
                            aria-label="Unsaved changes"
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={menuFor === m.path}
                        aria-label={`Actions for ${m.name}`}
                        title="Note actions"
                        onClick={() => setMenuFor(menuFor === m.path ? null : m.path)}
                        className="inline-flex h-6 w-6 flex-none items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {menuFor === m.path && (
                    <PrintedCard
                      ref={menuRef}
                      role="menu"
                      aria-label={`Actions for ${m.name}`}
                      className="absolute right-1 top-full z-30 mt-0.5 w-36 max-w-[calc(100vw-1rem)] py-1"
                    >
                      {m.editable && (
                        <button
                          role="menuitem"
                          onClick={() => startRowRename(m)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-foreground/80 hover:bg-secondary transition-colors"
                        >
                          <PenLine className="h-3 w-3 text-muted-foreground" />
                          Rename
                        </button>
                      )}
                      {m.editable && (
                        <button
                          role="menuitem"
                          onClick={() => handleDuplicate(m)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-foreground/80 hover:bg-secondary transition-colors"
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                          Duplicate
                        </button>
                      )}
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuFor(null);
                          downloadEntry(m);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-foreground/80 hover:bg-secondary transition-colors"
                      >
                        <Download className="h-3 w-3 text-muted-foreground" />
                        Download
                      </button>
                      {m.editable && typeof deleteNote === "function" && (
                        <button
                          role="menuitem"
                          onClick={() => handleDelete(m)}
                          className="flex w-full items-center gap-2 border-t border-border px-3 py-1.5 text-left font-mono text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </PrintedCard>
                  )}
                </li>
              ))}
              {!filtered.length && (
                <li className="p-3 font-mono text-[10px] text-muted-foreground">no matches</li>
              )}
            </ul>
            <div className="flex-none border-t border-border p-2">
              <FolderDrop
                onLoaded={(ws) => {
                  if (confirmReplace()) setWorkspace(ws);
                }}
                testid={WORKSPACE.dropzone}
                variant="sidebar"
              />
            </div>
          </aside>
        )}

        {sidebarOpen && <Resizer onDelta={(dx) => setSidebarW((w) => clamp(w + dx, 170, 460))} />}

        {/* Editor — the view mode decides the layout inside. */}
        <main
          data-testid={WORKSPACE.markdownPreview}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          {!active ? (
            <div className="grid h-full place-items-center p-8 text-muted-foreground">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em]">no file selected</p>
            </div>
          ) : (
            <>
              {/* Editor header: filename (click to rename) + view toggle on mobile. */}
              <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                {renaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenaming(false);
                    }}
                    className="min-w-0 border-b border-foreground bg-transparent font-mono text-[11px] text-foreground focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={startRename}
                    title="Rename"
                    className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="truncate">{active.name}</span>
                    <PenLine className="h-2.5 w-2.5 flex-none" />
                  </button>
                )}
                {/* Compact view-mode switch for small screens (the app-bar one is hidden there). */}
                <SegmentedControl
                  className="h-6 flex-none sm:hidden"
                  value={viewMode}
                  onChange={setViewMode}
                  options={VIEW_MODES.map((vm) => ({
                    value: vm.key,
                    label: <vm.icon className="h-3.5 w-3.5" title={vm.title} />,
                  }))}
                />
              </div>

              {/* Body per view mode */}
              {viewMode === "markdown" && sourceEditor}

              {viewMode === "wysiwyg" && (
                <div
                  data-testid={WORKSPACE.wysiwygPane}
                  className="min-h-0 flex-1 overflow-y-auto"
                >
                  <WysiwygEditor
                    key={active.path}
                    markdown={active.text}
                    images={workspace.images}
                    onChange={(md) => updateNote(active.path, md)}
                  />
                </div>
              )}

              {viewMode === "preview" && (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <article className="prose-eln mx-auto max-w-[72ch] p-4 md:p-8">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={mdComponents(workspace.images)}
                    >
                      {active.text || ""}
                    </ReactMarkdown>
                  </article>
                </div>
              )}

              {viewMode === "split" && (
                <div ref={splitRef} className="flex min-h-0 flex-1 flex-col md:flex-row">
                  <div
                    className="flex min-h-0 w-full flex-col border-b border-border md:border-b-0 md:border-r"
                    style={isDesktop ? { width: `${splitPct * 100}%`, flex: "0 0 auto" } : undefined}
                  >
                    {sourceEditor}
                  </div>
                  <Resizer onDelta={resizeSplit} />
                  <div className="flex min-h-0 w-full flex-1 flex-col">{livePreview}</div>
                </div>
              )}

              {/* Audit history — collapsible. Rows are live: they reflect real
                  actions taken on the active note (create, rename, edit). */}
              <div className="flex-none border-t border-border">
                <div className="flex items-center justify-between gap-2 bg-secondary/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <button
                    data-testid={WORKSPACE.auditToggle}
                    onClick={() => setAuditOpen((o) => !o)}
                    aria-expanded={auditOpen}
                    className="flex min-w-0 items-center gap-1.5 hover:text-foreground transition-colors"
                    title={auditOpen ? "Hide audit history" : "Show audit history"}
                  >
                    {auditOpen ? (
                      <ChevronDown className="h-3 w-3 flex-none" />
                    ) : (
                      <ChevronRight className="h-3 w-3 flex-none" />
                    )}
                    <span className="h-1.5 w-1.5 flex-none bg-primary" />
                    <span className="truncate">audit history · {active.name}</span>
                  </button>
                </div>
                {auditOpen && (
                  <ul className="max-h-32 divide-y divide-border overflow-y-auto border-t border-border">
                    {(active.history || [{ label: "created entry" }]).map((h, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                      >
                        <span className="min-w-0 truncate text-foreground/85">{h.label}</span>
                        <span className="flex-none font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                          human · you{h.at ? ` · ${fmtWhen(h.at)}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </main>

        {toolsOpen && <Resizer onDelta={(dx) => setToolsW((w) => clamp(w - dx, 220, 520))} />}
        {toolsOpen && (
          <div
            className="min-h-0 w-full overflow-y-auto border-t border-border md:border-l md:border-t-0"
            style={isDesktop ? { width: toolsW, flex: "0 0 auto" } : undefined}
          >
            <ToolDock />
          </div>
        )}
      </div>

      {/* Status strip */}
      <footer className="flex h-7 flex-none items-center justify-between gap-3 border-t border-border px-3 font-mono text-[11px] text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 flex-none ${activeDirty ? "bg-warning" : "bg-success"}`}
          />
          <span className="truncate">{activeDirty ? "Unsaved" : "Saved locally"}</span>
        </span>
        <span className="flex-none">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
        <span className="hidden truncate sm:inline">local · nothing leaves this device</span>
      </footer>

      {/* Hidden file input backing the Import button / palette action. */}
      <input
        ref={importInputRef}
        type="file"
        multiple
        accept={IMPORT_ACCEPT}
        aria-hidden="true"
        tabIndex={-1}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = ""; // allow re-picking the same file(s)
          onImportFiles(files);
        }}
      />

      {/* PDF export surface — portaled to <body> so the print stylesheet can
          show it alone (body.printing hides every other body child). Hidden on
          screen by the .print-surface rule; unmounted again on afterprint. */}
      {printNote &&
        createPortal(
          <div className="print-surface" aria-hidden="true">
            <article className="prose-eln">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(workspace.images)}>
                {printNote.text}
              </ReactMarkdown>
            </article>
          </div>,
          document.body
        )}
    </div>
  );
}
