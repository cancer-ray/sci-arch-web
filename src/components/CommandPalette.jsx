import * as React from "react";
import { Command } from "cmdk";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

/**
 * CommandPalette — Cmd/Ctrl-K palette built on cmdk.
 *
 * Props:
 *   open          : bool — dialog visibility (owned by Workspace)
 *   onOpenChange  : (bool) => void — called on close (Esc / scrim / select)
 *   notes         : [{ path, name, text }]
 *   activePath    : string — path of the currently open note
 *   onSelectNote  : (path) => void
 *   actions       : [{ id, label, hint, run, group }]
 *
 * The global Cmd+K listener lives in the Workspace, not here.
 */

/** Case-insensitive subsequence ("fuzzy") match. Empty query matches all. */
function fuzzyMatch(query, target) {
  const q = query.toLowerCase();
  const t = (target || "").toLowerCase();
  if (!q) return true;
  let i = 0;
  for (let j = 0; j < t.length && i < q.length; j++) {
    if (t[j] === q[i]) i++;
  }
  return i === q.length;
}

/** One-line snippet around the first case-insensitive occurrence of query. */
function makeSnippet(text, query, before = 28, after = 56) {
  const idx = (text || "").toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - before);
  const end = Math.min(text.length, idx + query.length + after);
  return {
    pre: (start > 0 ? "…" : "") + text.slice(start, idx).replace(/\s+/g, " "),
    match: text.slice(idx, idx + query.length),
    post:
      text.slice(idx + query.length, end).replace(/\s+/g, " ") +
      (end < text.length ? "…" : ""),
  };
}

const itemClass = cn(
  "flex min-w-0 cursor-pointer items-center gap-2 px-3 py-2 text-sm font-sans text-foreground",
  "border-l-2 border-l-transparent rounded-[2px]",
  "data-[selected=true]:bg-[hsl(var(--primary)/0.1)] data-[selected=true]:text-primary data-[selected=true]:border-l-primary"
);

const groupClass = cn(
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1",
  "[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium",
  "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em]",
  "[&_[cmdk-group-heading]]:text-muted-foreground"
);

function CommandPalette({
  open,
  onOpenChange,
  notes = [],
  activePath,
  onSelectNote,
  actions = [],
}) {
  const [query, setQuery] = React.useState("");

  // Reset the query whenever the palette is (re)opened.
  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const pickNote = React.useCallback(
    (path) => {
      onSelectNote(path);
      close();
    },
    [onSelectNote, close]
  );

  const visibleActions = React.useMemo(
    () => actions.filter((a) => fuzzyMatch(query, a.label)),
    [actions, query]
  );

  const visibleNotes = React.useMemo(
    () => notes.filter((n) => fuzzyMatch(query, n.name)),
    [notes, query]
  );

  // Full-text hits: up to 8 notes whose TEXT contains the query, with snippet.
  const textHits = React.useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const hits = [];
    for (const n of notes) {
      const snippet = makeSnippet(n.text || "", q);
      if (snippet) {
        hits.push({ ...n, snippet });
        if (hits.length >= 8) break;
      }
    }
    return hits;
  }, [notes, query]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      shouldFilter={false}
      overlayClassName="fixed inset-0 z-50 bg-black/40"
      contentClassName={cn(
        "fixed left-1/2 top-[16vh] z-50 -translate-x-1/2",
        "w-[560px] max-w-[calc(100vw-2rem)]",
        "printed-card bg-popover text-foreground overflow-hidden"
      )}
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Search notes and actions…"
        className={cn(
          "h-11 w-full border-b border-border bg-transparent px-3",
          "font-mono text-sm text-foreground placeholder:text-muted-foreground",
          "outline-none focus:outline-none"
        )}
      />

      <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain py-1">
        <Command.Empty className="px-3 py-6 text-center font-mono text-sm text-muted-foreground">
          No matches
        </Command.Empty>

        {visibleActions.length > 0 && (
          <Command.Group heading="Actions" className={groupClass}>
            {visibleActions.map((action) => (
              <Command.Item
                key={action.id}
                value={`action-${action.id}`}
                onSelect={() => {
                  action.run();
                  close();
                }}
                className={itemClass}
              >
                <span className="truncate">{action.label}</span>
                {action.hint ? <Kbd className="ml-auto shrink-0">{action.hint}</Kbd> : null}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {visibleNotes.length > 0 && (
          <Command.Group heading="Notes" className={groupClass}>
            {visibleNotes.map((note) => (
              <Command.Item
                key={note.path}
                value={`note-${note.path}`}
                onSelect={() => pickNote(note.path)}
                className={itemClass}
              >
                <span className="truncate">{note.name}</span>
                {note.path === activePath ? (
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                    current
                  </span>
                ) : null}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {textHits.length > 0 && (
          <Command.Group heading="Search" className={groupClass}>
            {textHits.map((hit) => (
              <Command.Item
                key={`search-${hit.path}`}
                value={`search-${hit.path}`}
                onSelect={() => pickNote(hit.path)}
                className={cn(itemClass, "flex-col items-start gap-0.5")}
              >
                <span className="truncate font-medium">{hit.name}</span>
                <span className="w-full truncate font-mono text-xs text-muted-foreground">
                  {hit.snippet.pre}
                  <span className="text-primary">{hit.snippet.match}</span>
                  {hit.snippet.post}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}

export default CommandPalette;
