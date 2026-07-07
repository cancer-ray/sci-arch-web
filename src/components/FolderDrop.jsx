import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { FolderOpen, HardDrive, FileText } from "lucide-react";
import { readFolder, rememberNotebook, filesFromDrop, DEFAULT_STRUCTURE } from "@/lib/folder";
import { LANDING, WORKSPACE } from "@/constants/testIds";

// Individually-pickable text formats. Setting `accept` makes the OS file dialog
// default to showing .md files instead of only offering folders.
const MD_ACCEPT = ".md,.markdown,.txt,text/markdown,text/plain";

/**
 * Reusable file / folder picker + drop zone.
 * Emits `onLoaded(workspace)` where `workspace` is the object from readFolder().
 * Primary action opens a .md file picker (multi-select); a secondary control
 * still lets people pick a whole notebook folder, and drag-drop handles both.
 */
export function FolderDrop({ onLoaded, testid, variant = "primary" }) {
  const fileRef = useRef(null);
  const folderRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (fileList) => {
      if (!fileList?.length) return;
      setBusy(true);
      try {
        const ws = await readFolder(fileList);
        if (ws) {
          rememberNotebook(ws.rootName);
          if (ws.skipped?.length) {
            toast.warning(
              `Skipped ${ws.skipped.length} file${ws.skipped.length === 1 ? "" : "s"} over the size limit (5 MB / note, 25 MB / image).`
            );
          }
          onLoaded?.(ws);
        }
      } finally {
        setBusy(false);
      }
    },
    [onLoaded]
  );

  const onChange = (e) => handleFiles(e.target.files);

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // handled here — don't also bubble to a page-level dropzone
    setDragging(false);
    const files = await filesFromDrop(e.dataTransfer);
    handleFiles(files);
  };

  // Both hidden inputs, shared across variants.
  const inputs = (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={MD_ACCEPT}
        multiple
        className="hidden"
        onChange={onChange}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={onChange}
      />
    </>
  );

  const openFiles = () => fileRef.current?.click();
  const openFolder = () => folderRef.current?.click();

  if (variant === "compact") {
    return (
      <>
        <button
          data-testid={testid || WORKSPACE.openFolderBtn}
          onClick={openFiles}
          disabled={busy}
          className="inline-flex h-8 items-center gap-2 border border-border px-3 text-xs tracking-tight text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          {busy ? "Reading…" : "Open .md files"}
        </button>
        {inputs}
      </>
    );
  }

  if (variant === "sidebar") {
    return (
      <div
        data-testid={testid || LANDING.heroDropzone}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border border-dashed border-border p-3 text-center transition-colors ${
          dragging ? "bg-secondary/50 border-primary" : ""
        }`}
      >
        <HardDrive className="mx-auto h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          Drop .md files or a folder. They open on this device — nothing is sent anywhere.
        </p>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <button
            onClick={openFiles}
            disabled={busy}
            className="inline-flex h-7 items-center gap-1.5 border border-border px-2 text-[10px] text-foreground hover:bg-foreground hover:text-background disabled:opacity-50 transition-colors"
          >
            <FileText className="h-3 w-3" />
            {busy ? "Reading…" : "Open .md files"}
          </button>
          <button
            onClick={openFolder}
            disabled={busy}
            className="inline-flex h-7 items-center gap-1.5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <FolderOpen className="h-3 w-3" />
            folder
          </button>
        </div>
        {inputs}
      </div>
    );
  }

  return (
    <div
      data-testid={testid || LANDING.heroDropzone}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative border border-dashed border-border p-6 transition-colors ${
        dragging ? "bg-secondary/50 border-primary" : "bg-background/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 flex-none place-items-center border border-border text-foreground">
          <HardDrive className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg text-foreground">
            Open your .md files, or a whole notebook folder
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick individual <span className="font-mono">.md</span> files, or drag &amp; drop a
            folder. Images are auto-linked. Files open on your device — nothing is uploaded.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={openFiles}
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {busy ? "Reading…" : "Open .md files"}
            </button>
            <button
              onClick={openFolder}
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 border border-border px-4 text-sm text-foreground hover:bg-foreground hover:text-background disabled:opacity-50 transition-colors"
            >
              <FolderOpen className="h-4 w-4" />
              or a folder
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              or drag &amp; drop
            </span>
          </div>
          <ul className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10px] text-muted-foreground">
            {DEFAULT_STRUCTURE.map((s) => (
              <li key={s} className="border border-border px-1.5 py-0.5">
                <FileText className="mr-1 inline h-2.5 w-2.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {inputs}
    </div>
  );
}
