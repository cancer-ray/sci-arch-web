import { useState } from "react";
import {
  Calculator as CalcIcon,
  Dna,
  Grid3x3,
  Timer,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Calculator } from "./Calculator";
import { ReverseComplement } from "./ReverseComplement";
import { PlateMarker } from "./PlateMarker";
import { QuickTimer } from "./QuickTimer";
import { HoldHint } from "@/components/ui/hold-hint";

const TOOL_TYPES = {
  calculator: { label: "Calculator", icon: CalcIcon, Component: Calculator },
  revcomp: { label: "Reverse complement", icon: Dna, Component: ReverseComplement },
  plate: { label: "Plate marker", icon: Grid3x3, Component: PlateMarker },
  timer: { label: "Quick timer", icon: Timer, Component: QuickTimer },
};

const DOCK_KEY = "sciarch_workspace_tools";

function loadDock() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DOCK_KEY) || "null");
    if (Array.isArray(saved)) return saved.filter((t) => TOOL_TYPES[t.type]);
  } catch {
    // ignore
  }
  return [];
}
function saveDock(list) {
  try {
    window.localStorage.setItem(DOCK_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/** A moveable, addable-anywhere panel of small bench widgets (calculator,
 * reverse-complement, plate/sample-ID marker, quick timers). Each active
 * tool instance is just {id, type}; state and persistence live inside the
 * individual tool components themselves, so the dock only tracks which
 * tools are on screen and in what order. */
export function ToolDock() {
  const [tools, setTools] = useState(loadDock);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Functional updates throughout: two adds/removes fired in the same tick
  // (e.g. adding several tools back to back) must not read a stale `tools`
  // closure and clobber each other.
  const update = (fn) => {
    setTools((prev) => {
      const next = fn(prev);
      saveDock(next);
      return next;
    });
  };

  const addTool = (type) => {
    update((prev) => [...prev, { id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, type }]);
    setPickerOpen(false);
  };
  const removeTool = (id) => update((prev) => prev.filter((t) => t.id !== id));
  const move = (id, dir) => {
    update((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  return (
    <aside data-testid="workspace-tool-dock">
      <div className="flex h-9 items-center justify-between border-b border-border px-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Toolbox
        </div>
        <div className="relative">
          <HoldHint
            icon={Plus}
            label="Add tool"
            description="Add a tool"
            onClick={() => setPickerOpen((o) => !o)}
            active={pickerOpen}
            size="h-6 w-6"
            aria-expanded={pickerOpen}
          />
          {pickerOpen && (
            <div className="printed-card absolute right-0 top-7 z-20 w-44 max-w-[calc(100vw-1rem)] p-1 text-foreground">
              {Object.entries(TOOL_TYPES).map(([type, def]) => {
                const Icon = def.icon;
                return (
                  <button
                    key={type}
                    onClick={() => addTool(type)}
                    className="flex w-full items-center gap-1.5 rounded-[2px] px-2 py-1.5 text-left text-xs text-foreground hover:bg-secondary transition-colors"
                  >
                    <Icon className="h-3 w-3" /> {def.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="max-h-[70vh] space-y-2 overflow-y-auto p-2">
        {tools.length === 0 && (
          <p className="p-2 text-center text-[10px] leading-relaxed text-muted-foreground">
            Add a calculator, reverse-complement tool, plate marker, or timer. Stack as many as
            you want, reorder them with the arrows.
          </p>
        )}
        {tools.map((t, i) => {
          const def = TOOL_TYPES[t.type];
          const Icon = def.icon;
          const Comp = def.Component;
          return (
            <div key={t.id} className="rounded-[2px] border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-2 py-1">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <Icon className="h-3 w-3" /> {def.label}
                </span>
                <div className="flex items-center gap-0.5">
                  <HoldHint
                    icon={ChevronUp}
                    label="Move up"
                    description="Move up"
                    onClick={() => move(t.id, -1)}
                    disabled={i === 0}
                    variant="ghost"
                    size="h-6 w-6"
                  />
                  <HoldHint
                    icon={ChevronDown}
                    label="Move down"
                    description="Move down"
                    onClick={() => move(t.id, 1)}
                    disabled={i === tools.length - 1}
                    variant="ghost"
                    size="h-6 w-6"
                  />
                  <HoldHint
                    icon={X}
                    label="Remove"
                    description="Remove"
                    onClick={() => removeTool(t.id)}
                    variant="ghost"
                    size="h-6 w-6"
                  />
                </div>
              </div>
              <div className="p-2">
                <Comp />
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
