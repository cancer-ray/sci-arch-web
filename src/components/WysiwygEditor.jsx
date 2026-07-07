import { useCallback, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Table as TableIcon,
  Code,
  Quote,
} from "lucide-react";
import { mdComponents } from "@/lib/markdown";
import { WORKSPACE } from "@/constants/testIds";

/**
 * Directly-editable ("WYSIWYG") preview for a freeLN note. You type into the
 * rendered document; formatting shows live and is serialized straight back to
 * markdown, which stays the source of truth on disk / in the workspace.
 *
 * How it stays in sync without fighting the caret:
 *  - MD → HTML for the initial paint reuses the SAME react-markdown renderer as
 *    the Split preview (`mdComponents`), via react-dom/server, so the look is
 *    identical across view modes.
 *  - HTML → MD on every edit uses Turndown (+ GFM tables/strikethrough/tasks).
 *  - A `lastEmittedRef` guard means we only re-seed the DOM when the incoming
 *    markdown differs from what we last produced (mount, note switch, or an edit
 *    made in another pane). Our own keystrokes never trigger a re-seed, so the
 *    cursor stays put.
 *
 * Formatting buttons use `document.execCommand`. It's deprecated but remains the
 * only broadly-supported way to do rich-text editing without pulling in a heavy
 * editor framework — a deliberate trade for freeLN's dependency-light footprint.
 */

function makeTurndown(images) {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
  });
  td.use(gfm);

  // Reverse-map resolved Blob URLs back to the note's original relative image
  // path, so exported markdown keeps `![](assets/x.png)` and never a throwaway
  // blob: URL that dies with the tab.
  const urlToPath = {};
  for (const [key, url] of Object.entries(images || {})) {
    // Prefer a path-like key (has a slash) over the bare filename alias.
    if (!urlToPath[url] || (key.includes("/") && !urlToPath[url].includes("/"))) {
      urlToPath[url] = key;
    }
  }
  td.addRule("localImage", {
    filter: "img",
    replacement: (_content, node) => {
      const src = node.getAttribute("src") || "";
      const alt = node.getAttribute("alt") || "";
      return `![${alt}](${urlToPath[src] || src})`;
    },
  });
  return td;
}

export function WysiwygEditor({ markdown, images, onChange }) {
  const editorRef = useRef(null);
  const lastEmittedRef = useRef(null);
  const turndownRef = useRef(null);
  const debounceRef = useRef(null);

  if (!turndownRef.current) turndownRef.current = makeTurndown(images);
  // Rebuild the Turndown image map if the image set changes (new folder loaded).
  useEffect(() => {
    turndownRef.current = makeTurndown(images);
  }, [images]);

  const mdToHtml = useCallback(
    (md) =>
      renderToStaticMarkup(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(images)}>
          {md || ""}
        </ReactMarkdown>
      ),
    [images]
  );

  // Seed / re-seed the editable DOM only on *external* markdown changes.
  useEffect(() => {
    if (markdown === lastEmittedRef.current) return;
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = mdToHtml(markdown);
    lastEmittedRef.current = markdown;
  }, [markdown, mdToHtml]);

  const serialize = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const md = turndownRef.current.turndown(el.innerHTML).replace(/\n{3,}/g, "\n\n");
    lastEmittedRef.current = md; // set BEFORE onChange so the prop echo is a no-op
    onChange?.(md);
  }, [onChange]);

  const onInput = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(serialize, 150);
  }, [serialize]);

  useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), []);

  // Run an execCommand against the current selection, then serialize immediately.
  const exec = useCallback(
    (command, value = null) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      try {
        document.execCommand(command, false, value);
      } catch {
        /* execCommand unsupported — ignore */
      }
      serialize();
    },
    [serialize]
  );

  const insertHTML = useCallback((html) => exec("insertHTML", html), [exec]);

  const addLink = useCallback(() => {
    // eslint-disable-next-line no-alert
    const url = window.prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  }, [exec]);

  const tools = [
    { icon: Bold, label: "Bold", run: () => exec("bold") },
    { icon: Italic, label: "Italic", run: () => exec("italic") },
    { icon: Heading1, label: "Heading", run: () => exec("formatBlock", "h1") },
    { icon: Heading2, label: "Subheading", run: () => exec("formatBlock", "h2") },
    { icon: List, label: "Bullet list", run: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", run: () => exec("insertOrderedList") },
    { icon: Quote, label: "Quote", run: () => exec("formatBlock", "blockquote") },
    { icon: LinkIcon, label: "Link", run: addLink },
    { icon: Code, label: "Code", run: () => insertHTML("<code>code</code>") },
    {
      icon: TableIcon,
      label: "Table",
      run: () =>
        insertHTML(
          "<table><thead><tr><th>Header</th><th>Header</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p><br/></p>"
        ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
            className="inline-flex h-7 w-7 items-center justify-center text-foreground/70 hover:bg-secondary hover:text-primary transition-colors"
          >
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          editing preview
        </span>
      </div>
      <div
        ref={editorRef}
        data-testid={WORKSPACE.wysiwygPane}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onInput={onInput}
        onBlur={serialize}
        className="wysiwyg-surface min-h-0 flex-1 overflow-y-auto p-4 focus:outline-none md:p-6"
      />
    </div>
  );
}
