import { useEffect, useRef, useState } from "react";
import { Settings, Check, Sun, Moon, Zap, Bug, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ACCENTS, useTheme } from "@/context/ThemeContext";
import { NAV } from "@/constants/testIds";

const DRAFT_KEY = "sciarch_freeln_draft";

/** Consolidated settings popover: theme, accent color, lightweight mode,
 * bug report, clear local data. Self-contained (no Radix). */
export function SettingsMenu() {
  const { theme, toggle, accent, setAccent, lightweight, setLightweight } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const clearLocalData = () => {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
      toast.success("Local freeLN draft cleared.");
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error("Could not clear local data.");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        data-testid={NAV.themeToggle}
        onClick={() => setOpen((o) => !o)}
        aria-label="Settings"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] border border-border text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors"
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="printed-card absolute right-0 top-9 z-50 w-64 max-w-[85vw] p-3 text-foreground">
          <p className="eyebrow">Theme</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => theme !== "light" && toggle()}
              className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-[2px] border text-xs transition-colors ${
                theme === "light"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Sun className="h-3 w-3" /> Light
            </button>
            <button
              onClick={() => theme !== "dark" && toggle()}
              className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-[2px] border text-xs transition-colors ${
                theme === "dark"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Moon className="h-3 w-3" /> Dark
            </button>
          </div>

          <p className="eyebrow mt-4">Accent color</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a.id)}
                aria-label={a.label}
                title={a.label}
                className={`flex h-8 w-8 items-center justify-center rounded-[2px] border transition-colors ${
                  accent === a.id ? "border-foreground" : "border-border"
                }`}
                style={{ backgroundColor: a.swatch }}
              >
                {accent === a.id && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
              </button>
            ))}
          </div>

          <button
            onClick={() => setLightweight(!lightweight)}
            className="mt-4 flex w-full items-center justify-between rounded-[2px] border-t border-border pt-3 text-left text-xs text-foreground hover:bg-secondary transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-muted-foreground" /> Lightweight mode
            </span>
            <span
              className={`inline-flex h-4 w-7 items-center rounded-[2px] border border-border px-0.5 transition-colors ${
                lightweight ? "justify-end bg-primary" : "justify-start bg-transparent"
              }`}
            >
              <span className={`h-2.5 w-2.5 ${lightweight ? "bg-primary-foreground" : "bg-foreground/60"}`} />
            </span>
          </button>
          <p className="mt-1 text-[10px] text-muted-foreground">Turns off animations.</p>

          <div className="mt-4 space-y-1 border-t border-border pt-3">
            <a
              href="mailto:ryan@sci-arch.ca?subject=Bug report"
              className="-mx-1 flex items-center gap-1.5 rounded-[2px] px-1 py-1 text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <Bug className="h-3 w-3" /> Report a bug
            </a>
            <button
              onClick={clearLocalData}
              className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-1.5 rounded-[2px] px-1 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear local freeLN data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
