import { Fragment, useState } from "react";

// Standard labware formats: rows (letters) x columns.
const FORMATS = {
  6: { rows: "AB", cols: 3 },
  12: { rows: "ABC", cols: 4 },
  24: { rows: "ABCD", cols: 6 },
  48: { rows: "ABCDEF", cols: 8 },
  96: { rows: "ABCDEFGH", cols: 12 },
  384: { rows: "ABCDEFGHIJKLMNOP", cols: 24 },
};

const STORAGE_KEY = "sciarch_plate_labels";

function loadAll() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveAll(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function PlateMarker() {
  const [format, setFormat] = useState("96");
  const [allLabels, setAllLabels] = useState(loadAll);
  const [activeWell, setActiveWell] = useState(null);
  const [draft, setDraft] = useState("");

  const labels = allLabels[format] || {};
  const { rows, cols } = FORMATS[format];

  const openWell = (id) => {
    setActiveWell(id);
    setDraft(labels[id] || "");
  };

  const commit = () => {
    const nextForFormat = { ...labels };
    if (draft.trim()) nextForFormat[activeWell] = draft.trim();
    else delete nextForFormat[activeWell];
    const next = { ...allLabels, [format]: nextForFormat };
    setAllLabels(next);
    saveAll(next);
    setActiveWell(null);
  };

  const clearPlate = () => {
    const next = { ...allLabels, [format]: {} };
    setAllLabels(next);
    saveAll(next);
  };

  const labeledCount = Object.keys(labels).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <select
          value={format}
          onChange={(e) => {
            setFormat(e.target.value);
            setActiveWell(null);
          }}
          className="h-7 rounded-[2px] border border-border bg-transparent px-1.5 font-mono text-[10px] uppercase hover:bg-secondary transition-colors"
        >
          {Object.keys(FORMATS).map((f) => (
            <option key={f} value={f}>
              {f}-well
            </option>
          ))}
        </select>
        <span className="font-mono text-[10px] text-muted-foreground">{labeledCount} labeled</span>
        <button
          onClick={clearPlate}
          className="rounded-[2px] px-1 font-mono text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          clear
        </button>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="inline-grid gap-[2px]"
          style={{ gridTemplateColumns: `14px repeat(${cols}, 16px)` }}
        >
          <div />
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className="text-center font-mono text-[7px] text-muted-foreground">
              {i + 1}
            </div>
          ))}
          {rows.split("").map((r) => (
            <Fragment key={r}>
              <div className="font-mono text-[7px] text-muted-foreground">{r}</div>
              {Array.from({ length: cols }, (_, i) => {
                const id = `${r}${i + 1}`;
                const has = !!labels[id];
                return (
                  <button
                    key={id}
                    title={labels[id] || id}
                    onClick={() => openWell(id)}
                    className={`h-[16px] w-[16px] rounded-full border transition-colors ${
                      has
                        ? "border-primary bg-primary"
                        : "border-border hover:bg-secondary"
                    } ${activeWell === id ? "ring-1 ring-ring ring-offset-1 ring-offset-background" : ""}`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {activeWell && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
          <span className="font-mono text-[10px] text-muted-foreground">{activeWell}</span>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="sample label"
            className="h-7 flex-1 rounded-[2px] border border-border bg-transparent px-1.5 font-mono text-xs"
          />
          <button
            onClick={commit}
            className="h-7 rounded-[2px] border border-border px-2 font-mono text-[10px] uppercase text-foreground hover:bg-secondary transition-colors"
          >
            set
          </button>
        </div>
      )}
    </div>
  );
}
