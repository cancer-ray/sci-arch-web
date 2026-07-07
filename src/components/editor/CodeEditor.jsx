import React, { useMemo, useRef, useEffect, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import {
  markdown,
  markdownLanguage,
  markdownKeymap,
} from "@codemirror/lang-markdown";
import { EditorView, keymap } from "@codemirror/view";
import { EditorSelection, Prec } from "@codemirror/state";
import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

/**
 * CodeEditor — CodeMirror 6 markdown source editor.
 *
 * Props:
 *   value          {string}   controlled document text
 *   onChange       {(nextValue: string) => void}
 *   onSave         {() => void}            invoked on Mod-s (browser save suppressed)
 *   onInsertImage  {(file: File) => void}  optional; called when an image is pasted/dropped
 *   theme          {'light'|'dark'}        default 'light'
 *   images         {Array}                 attachment metadata (reserved; not rendered here)
 *   className      {string}
 *   autoFocus      {boolean}
 */

/* ---------------------------------------------------------------- helpers */

/** Toggle-wrap each selection range with `marker` (e.g. "**" or "*").
 *  Removes the markers if the range is already wrapped — inside the
 *  selection or immediately around it — so repeated invocations never stack. */
function toggleWrapWith(marker) {
  return (view) => {
    const len = marker.length;
    view.dispatch(
      view.state.changeByRange((range) => {
        const { from, to } = range;
        const doc = view.state.doc;
        const text = view.state.sliceDoc(from, to);

        // Case 1: markers are inside the selection ("**text**" selected)
        if (
          text.length >= len * 2 &&
          text.startsWith(marker) &&
          text.endsWith(marker) &&
          // avoid treating "*" or "**" alone as wrapped
          !(text === marker || text === marker + marker)
        ) {
          return {
            changes: { from, to, insert: text.slice(len, text.length - len) },
            range: EditorSelection.range(from, to - 2 * len),
          };
        }

        // Case 2: markers sit just outside the selection (text selected, **outside**)
        const before = view.state.sliceDoc(Math.max(0, from - len), from);
        const after = view.state.sliceDoc(to, Math.min(doc.length, to + len));
        if (before === marker && after === marker) {
          return {
            changes: [
              { from: from - len, to: from },
              { from: to, to: to + len },
            ],
            range: EditorSelection.range(from - len, to - len),
          };
        }

        // Case 3: wrap
        return {
          changes: [
            { from, insert: marker },
            { from: to, insert: marker },
          ],
          range: EditorSelection.range(from + len, to + len),
        };
      })
    );
    return true;
  };
}

/** Mod-k: turn selection into [sel](url) with "url" selected for overtype,
 *  or insert []() at the cursor with the caret between the brackets. */
function insertLink(view) {
  view.dispatch(
    view.state.changeByRange((range) => {
      const { from, to } = range;
      if (from === to) {
        return {
          changes: { from, insert: "[]()" },
          range: EditorSelection.cursor(from + 1),
        };
      }
      const text = view.state.sliceDoc(from, to);
      const insert = `[${text}](url)`;
      const urlStart = from + 1 + text.length + 2; // past "[", text, "]("
      return {
        changes: { from, to, insert },
        range: EditorSelection.range(urlStart, urlStart + 3), // select "url"
      };
    })
  );
  return true;
}

/** Pull the first image File out of a DataTransfer/clipboardData, if any. */
function firstImageFile(dataTransfer) {
  if (!dataTransfer) return null;
  const items = dataTransfer.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }
  const files = dataTransfer.files;
  if (files) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].type && files[i].type.startsWith("image/")) return files[i];
    }
  }
  return null;
}

/* ------------------------------------------------------------- component */

// Base look: 14px IBM Plex Mono, comfortable line-height, transparent
// background so the editor inherits the pane/card it sits on.
const baseTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    height: "100%",
    backgroundColor: "transparent",
  },
  ".cm-scroller": {
    fontFamily:
      "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    lineHeight: "1.7",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "12px 0",
    caretColor: "hsl(var(--foreground, 222 15% 15%))",
  },
  ".cm-line": {
    padding: "0 12px",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "hsl(var(--foreground, 222 15% 15%))",
  },
  "&.cm-editor .cm-selectionBackground, &.cm-editor.cm-focused .cm-selectionBackground":
    {
      backgroundColor: "hsl(var(--primary, 222 60% 40%) / 0.18)",
    },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
});

// Keep one-dark legible but let it sit on the surrounding dark pane.
const darkTransparent = EditorView.theme(
  {
    "&": { backgroundColor: "transparent" },
    ".cm-gutters": { backgroundColor: "transparent" },
  },
  { dark: true }
);

function CodeEditor({
  value,
  onChange,
  onSave,
  onInsertImage,
  theme = "light",
  images, // reserved for future use (image reference autocomplete etc.)
  className,
  autoFocus = false,
}) {
  // Keep latest callbacks in refs so the memoized extensions never go stale.
  const onSaveRef = useRef(onSave);
  const onInsertImageRef = useRef(onInsertImage);
  useEffect(() => {
    onSaveRef.current = onSave;
    onInsertImageRef.current = onInsertImage;
  });

  const extensions = useMemo(() => {
    const shortcuts = Prec.highest(
      keymap.of([
        { key: "Mod-b", run: toggleWrapWith("**") },
        { key: "Mod-i", run: toggleWrapWith("*") },
        // Mod-k is reserved app-wide for the command palette; the editor link
        // shortcut lives on Mod-Shift-k so it doesn't fire the palette too.
        { key: "Mod-Shift-k", run: insertLink },
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            if (typeof onSaveRef.current === "function") onSaveRef.current();
            return true; // always handled: never let the browser save dialog open
          },
        },
      ])
    );

    const handleImageTransfer = (dataTransfer, event) => {
      // No image handler wired: never consume the event, so mixed image+text
      // clipboards keep their text and normal paste/drop still works.
      if (typeof onInsertImageRef.current !== "function") return false;
      const file = firstImageFile(dataTransfer);
      if (file) {
        event.preventDefault();
        onInsertImageRef.current(file);
        return true; // consumed
      }
      return false; // let default text paste/drop proceed
    };

    const domHandlers = EditorView.domEventHandlers({
      paste: (event) => handleImageTransfer(event.clipboardData, event),
      drop: (event) => handleImageTransfer(event.dataTransfer, event),
    });

    return [
      shortcuts,
      markdown({ base: markdownLanguage }),
      // Enter continues "- " / "1. " / "> " lists, Backspace deletes markup,
      // Tab indents; fall back to the standard editing keymaps.
      keymap.of([...markdownKeymap, indentWithTab, ...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      baseTheme,
      domHandlers,
      ...(theme === "dark" ? [darkTransparent] : []),
    ];
  }, [theme]);

  const handleChange = useCallback(
    (nextValue) => {
      if (typeof onChange === "function") onChange(nextValue);
    },
    [onChange]
  );

  return (
    <div
      className={["h-full min-h-0", className].filter(Boolean).join(" ")}
      data-testid="code-editor"
    >
      <CodeMirror
        value={value ?? ""}
        onChange={handleChange}
        height="100%"
        style={{ height: "100%" }}
        theme={theme === "dark" ? oneDark : "light"}
        autoFocus={autoFocus}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          // history/keymaps come from basicSetup defaults; our Prec.highest
          // keymap above still wins for the custom shortcuts.
        }}
        extensions={extensions}
        indentWithTab={false /* handled by our explicit indentWithTab binding */}
      />
    </div>
  );
}

export default CodeEditor;
