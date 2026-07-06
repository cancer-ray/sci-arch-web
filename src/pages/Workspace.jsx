import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  FolderTree,
  Search,
  Lock,
  X,
  PlusCircle,
  Download,
  PenLine,
  Loader2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Table as TableIcon,
  Code,
  Bot,
  Wrench,
  UploadCloud,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FolderDrop } from "@/components/FolderDrop";
import { ToolDock } from "@/components/tools/ToolDock";
import { useWorkspace } from "@/context/WorkspaceContext";
import { resolveImageSrc, readFolder, rememberNotebook, filesFromDrop } from "@/lib/folder";
import { WORKSPACE } from "@/constants/testIds";

// Wrap the current selection in `before`/`after` (e.g. bold, italic, inline code).
function wrapSelection(el, before, after = before) {
  const { selectionStart: start, selectionEnd: end, value } = el;
  const selected = value.slice(start, end);
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  return { newValue, newStart: start + before.length, newEnd: start + before.length + selected.length };
}

// Prefix every line touched by the selection (e.g. heading, bullet, numbered list).
function prefixLines(el, prefix) {
  const { selectionStart: start, selectionEnd: end, value } = el;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = value.indexOf("\n", end);
  if (lineEnd === -1) lineEnd = value.length;
  const block = value.slice(lineStart, lineEnd);
  const prefixed = block.split("\n").map((l) => prefix + l).join("\n");
  const newValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  return { newValue, newStart: lineStart, newEnd: lineStart + prefixed.length };
}

// Insert a block at the cursor when nothing is selected (link template, table).
function insertAtCursor(el, text) {
  const { selectionStart: start, value } = el;
  const newValue = value.slice(0, start) + text + value.slice(start);
  return { newValue, newStart: start, newEnd: start + text.length };
}

const mdComponents = (images) => ({
  h1: (props) => <h1 className="mt-2 font-serif text-3xl text-foreground" {...props} />,
  h2: (props) => (
    <h2 className="mt-6 border-b border-border pb-1 font-serif text-2xl text-foreground" {...props} />
  ),
  h3: (props) => <h3 className="mt-5 font-serif text-xl text-foreground" {...props} />,
  p: (props) => <p className="mt-3 text-sm leading-relaxed text-foreground/85" {...props} />,
  li: (props) => <li className="ml-5 mt-1 list-disc text-sm text-foreground/85" {...props} />,
  code: ({ inline, ...p }) =>
    inline ? (
      <code className="border border-border bg-secondary/50 px-1 font-mono text-[12px]" {...p} />
    ) : (
      <code className="block overflow-x-auto border border-border bg-secondary/40 p-3 font-mono text-[12px]" {...p} />
    ),
  table: (props) => <table className="my-4 w-full border-collapse font-mono text-[11px]" {...props} />,
  th: (props) => <th className="border-b border-border px-2 py-1 text-left font-medium" {...props} />,
  td: (props) => <td className="border-b border-border/50 px-2 py-1 text-foreground/85" {...props} />,
  img: ({ src, alt }) => (
    <img className="my-4 max-w-full border border-border" src={resolveImageSrc(src, images)} alt={alt || ""} />
  ),
  a: (props) => <a className="text-primary underline underline-offset-2" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-3 border-l-2 border-border pl-3 text-sm italic text-muted-foreground" {...props} />
  ),
});

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
    downloadNote,
  } = useWorkspace();
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pageDragging, setPageDragging] = useState(false);
  const dragDepth = useRef(0);
  const navigate = useNavigate();
  const textareaRef = useRef(null);

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

  const applyFormat = (fn) => {
    const el = textareaRef.current;
    if (!el || !active) return;
    const { newValue, newStart, newEnd } = fn(el);
    updateNote(active.path, newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    });
  };

  const toolbar = [
    { icon: Bold, label: "Bold", action: (el) => wrapSelection(el, "**") },
    { icon: Italic, label: "Italic", action: (el) => wrapSelection(el, "*") },
    { icon: Heading1, label: "Heading", action: (el) => prefixLines(el, "# ") },
    { icon: Heading2, label: "Subheading", action: (el) => prefixLines(el, "## ") },
    { icon: List, label: "Bullet list", action: (el) => prefixLines(el, "- ") },
    { icon: ListOrdered, label: "Numbered list", action: (el) => prefixLines(el, "1. ") },
    {
      icon: LinkIcon,
      label: "Link",
      action: (el) =>
        el.selectionStart === el.selectionEnd
          ? insertAtCursor(el, "[link text](https://)")
          : wrapSelection(el, "[", "](https://)"),
    },
    {
      icon: TableIcon,
      label: "Table",
      action: (el) => insertAtCursor(el, "\n| Header | Header |\n|---|---|\n| Cell | Cell |\n"),
    },
    { icon: Code, label: "Code", action: (el) => wrapSelection(el, "`") },
  ];

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

  const closeNotebook = () => {
    clear();
  };

  if (!workspace) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-background text-foreground"
        data-testid={WORKSPACE.root}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-background text-foreground"
      data-testid={WORKSPACE.root}
      onDragEnter={onPageDragEnter}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
      }}
      onDragLeave={onPageDragLeave}
      onDrop={onPageDrop}
    >
      <Nav />

      {/* Full-page drop feedback — appears only while dragging files over the
          page, so the sidebar dropzone stays visually small but the whole page
          is functionally a drop target. */}
      {pageDragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
          <div className="m-4 flex h-[calc(100%-2rem)] w-[calc(100%-2rem)] flex-col items-center justify-center border-2 border-dashed border-primary">
            <UploadCloud className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <p className="mt-3 font-serif text-lg text-foreground">Drop to load your notebook</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              .md files or a folder · nothing leaves your machine
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Header */}
        <div
          data-testid={WORKSPACE.breadcrumb}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              § notebook
            </div>
            <h1 className="mt-1 flex items-baseline gap-2 font-serif text-2xl">
              <FolderTree className="h-4 w-4 text-primary" />
              {workspace.rootName}
              <span className="font-mono text-xs text-muted-foreground">
                · {workspace.markdown.length} entries
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              aria-pressed={sidebarOpen}
              title={sidebarOpen ? "Hide the files panel" : "Show the files panel"}
              className={`btn-lift inline-flex h-8 items-center gap-2 border px-3 text-xs transition-colors ${
                sidebarOpen
                  ? "border-border text-foreground/70 hover:bg-foreground hover:text-background"
                  : "border-primary bg-primary text-primary-foreground"
              }`}
            >
              <PanelLeft className="h-3.5 w-3.5" />
              Files
            </button>
            <button
              onClick={() => setToolsOpen((o) => !o)}
              aria-pressed={toolsOpen}
              className={`btn-lift inline-flex h-8 items-center gap-2 border px-3 text-xs transition-colors ${
                toolsOpen
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground/70 hover:bg-foreground hover:text-background"
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              Tools
            </button>
            <button
              data-testid={WORKSPACE.newNoteBtn}
              onClick={() => createNote("untitled")}
              className="btn-lift inline-flex h-8 items-center gap-2 border border-border px-3 text-xs text-foreground/70 hover:bg-foreground hover:text-background transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-primary" />
              New note
            </button>
            <button
              data-testid={WORKSPACE.gmpLockBtn}
              disabled
              title="sci-arch+"
              className="inline-flex h-8 items-center gap-2 border border-border px-3 text-xs text-muted-foreground/60 cursor-not-allowed"
            >
              <Lock className="h-3.5 w-3.5" />
              Sign &amp; lock
            </button>
            <button
              onClick={closeNotebook}
              className="btn-lift inline-flex h-8 items-center gap-2 border border-border px-3 text-xs text-foreground/70 hover:bg-foreground hover:text-background transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>
        </div>

        {/* Body — three columns on desktop (files · editor · tools); stacks to a
            single column on mobile so nothing is squeezed into a sliver. */}
        <div className="mt-4 grid grid-cols-1 border border-border md:grid-cols-12">
          {/* Sidebar — collapsible so the editor can reclaim the space (useful
              when the tools dock is also open). */}
          <aside
            className={`${
              sidebarOpen
                ? "border-b border-border md:col-span-3 md:border-b-0 md:border-r"
                : "hidden"
            }`}
            data-testid={WORKSPACE.fileTree}
          >
            <div className="flex items-center gap-1.5 border-b border-border p-2">
              <div className="flex flex-1 items-center gap-1.5 border border-border px-2 focus-within:border-primary">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                  data-testid={WORKSPACE.searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="search…"
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
            <ul className="max-h-[70vh] overflow-y-auto p-1.5">
              {filtered.map((m, i) => (
                <li key={m.path}>
                  <button
                    data-testid={
                      m.path === activePath ? WORKSPACE.activeFile : WORKSPACE.fileItem(i)
                    }
                    onClick={() => setActivePath(m.path)}
                    className={`flex w-full items-center gap-1.5 truncate border-l-2 px-2 py-1 text-left font-mono text-[11px] transition-colors ${
                      m.path === activePath
                        ? "border-primary bg-foreground text-background"
                        : "border-transparent text-foreground/75 hover:bg-secondary"
                    }`}
                  >
                    <FileText className="h-3 w-3 flex-none" />
                    <span className="truncate">{m.path.replace(workspace.rootName + "/", "")}</span>
                  </button>
                </li>
              ))}
              {!filtered.length && (
                <li className="p-3 font-mono text-[10px] text-muted-foreground">no matches</li>
              )}
            </ul>
            <div className="border-t border-border p-2">
              <FolderDrop onLoaded={setWorkspace} testid={WORKSPACE.dropzone} variant="sidebar" />
            </div>
          </aside>

          {/* Editor / preview */}
          {/* Editor width flexes with the two side panels: it reclaims the
              columns freed when Files and/or Tools are collapsed. On mobile,
              opening Tools swaps the editor out for the tool dock (below)
              instead of stacking both. */}
          <main
            data-testid={WORKSPACE.markdownPreview}
            className={`min-h-[70vh] overflow-y-auto ${toolsOpen ? "hidden md:block" : ""} ${
              { 12: "md:col-span-12", 9: "md:col-span-9", 6: "md:col-span-6" }[
                12 - (sidebarOpen ? 3 : 0) - (toolsOpen ? 3 : 0)
              ]
            }`}
          >
            {!active ? (
              <div className="grid h-full place-items-center p-8 text-muted-foreground">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em]">no file selected</p>
              </div>
            ) : active.editable ? (
              <div className="grid h-full grid-cols-1 md:grid-cols-2">
                <div className="border-b border-border md:border-b-0 md:border-r">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
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
                        className="border-b border-foreground bg-transparent font-mono text-[10px] uppercase tracking-[0.25em] text-foreground focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={startRename}
                        title="Rename"
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        {active.name} <PenLine className="h-2.5 w-2.5" />
                      </button>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      editing · autosaved
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
                    {toolbar.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        title={t.label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormat(t.action)}
                        className="inline-flex h-7 w-7 items-center justify-center text-foreground/70 hover:bg-secondary hover:text-primary transition-colors"
                      >
                        <t.icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={textareaRef}
                    data-testid={WORKSPACE.editorPane}
                    value={active.text}
                    onChange={(e) => updateNote(active.path, e.target.value)}
                    spellCheck={false}
                    className="h-[calc(70vh-2.25rem)] w-full resize-none border-none bg-transparent p-4 font-mono text-[12px] leading-relaxed text-foreground/90 focus:outline-none"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    <span>preview</span>
                    <button
                      data-testid={WORKSPACE.downloadNoteBtn}
                      onClick={() => downloadNote(active.path)}
                      className="inline-flex items-center gap-1 border border-border px-2 py-1 text-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      <Download className="h-3 w-3 text-primary" /> download .md
                    </button>
                  </div>
                  <article className="prose-eln">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(workspace.images)}>
                      {active.text}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>
            ) : (
              <article className="prose-eln p-8">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  <span>{active.path}</span>
                  <span>markdown · read-only</span>
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(workspace.images)}>
                  {active.text}
                </ReactMarkdown>
              </article>
            )}
          </main>

          {toolsOpen && <ToolDock />}
        </div>

        {/* Audit history — rows are live: they reflect real actions taken on the
            active note (create, rename, edit). The AI row is a clearly-marked
            preview since freeLN has no AI features of its own. */}
        <div className="mt-4 border border-border">
          <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-primary" />
              audit history · {active?.name || "untitled.md"}
            </span>
            <span>local mode · nothing uploaded</span>
          </div>
          <ul className="divide-y divide-border">
            {(active?.history || [{ label: "created entry" }]).map((h, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-foreground/85">{h.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  human · you
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between px-4 py-2 text-sm opacity-50">
              <span className="text-foreground/85">drafted procedure</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <Bot className="h-3 w-3" /> ai-assisted · claude
                <Lock className="ml-1 h-2.5 w-2.5" /> sci-arch+ preview
              </span>
            </li>
            <li className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-muted-foreground">not yet signed</span>
              <button
                onClick={() => navigate("/pricing")}
                title="sci-arch+"
                className="btn-lift inline-flex items-center gap-1 border border-border px-2 py-1 text-[10px] text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                see plans
              </button>
            </li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
}
