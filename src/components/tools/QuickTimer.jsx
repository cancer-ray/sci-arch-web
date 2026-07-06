import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, X, Plus } from "lucide-react";

const TIMERS_KEY = "sciarch_quick_timers";
const PRESETS = [
  { label: "PCR", minutes: 30 },
  { label: "Incubate", minutes: 60 },
  { label: "Gel", minutes: 45 },
  { label: "+10m", minutes: 10 },
];

// WebAudio chime, ported from GRIMOIRE-ELN master's LabTimers.tsx — no
// asset file needed, just four sine tones.
function playChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      osc.connect(gain).connect(ctx.destination);
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
      osc.start(start);
      osc.stop(start + 1.5);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch {
    // Audio not available (e.g. no user gesture yet) — fail silently.
  }
}

function loadTimers() {
  try {
    return JSON.parse(window.localStorage.getItem(TIMERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveTimers(timers) {
  try {
    window.localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
  } catch {
    // ignore
  }
}
function remainingOf(t) {
  if (t.endsAt == null) return t.remainingMs;
  return Math.max(0, t.endsAt - Date.now());
}
function fmt(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function QuickTimer() {
  const [timers, setTimers] = useState(loadTimers);
  const [, forceTick] = useState(0);
  const [name, setName] = useState("");
  const [mins, setMins] = useState(10);
  const firedRef = useRef(new Set());

  useEffect(() => {
    const iv = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    saveTimers(timers);
  }, [timers]);

  useEffect(() => {
    timers.forEach((t) => {
      if (t.endsAt != null && remainingOf(t) === 0 && !firedRef.current.has(t.id)) {
        firedRef.current.add(t.id);
        playChime();
        if (window.Notification && Notification.permission === "granted") {
          new Notification(`${t.name} done`);
        }
      }
    });
  }, [timers]);

  const addTimer = (label, minutes) => {
    const totalMs = minutes * 60_000;
    setTimers((ts) => [
      ...ts,
      { id: `t${Date.now()}`, name: label, totalMs, endsAt: Date.now() + totalMs, remainingMs: totalMs, fired: false },
    ]);
  };

  const toggle = (id) =>
    setTimers((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        if (t.endsAt != null) {
          return { ...t, endsAt: null, remainingMs: remainingOf(t) };
        }
        return { ...t, endsAt: Date.now() + t.remainingMs };
      })
    );

  const reset = (id) =>
    setTimers((ts) => ts.map((t) => (t.id === id ? { ...t, endsAt: null, remainingMs: t.totalMs } : t)));

  const remove = (id) => setTimers((ts) => ts.filter((t) => t.id !== id));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => addTimer(p.label, p.minutes)}
            className="border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="name"
          className="h-7 w-20 border border-border bg-transparent px-1.5 font-mono text-xs focus:outline-none"
        />
        <input
          type="number"
          min={1}
          value={mins}
          onChange={(e) => setMins(Number(e.target.value) || 1)}
          className="h-7 w-14 border border-border bg-transparent px-1.5 font-mono text-xs focus:outline-none"
        />
        <span className="text-[10px] text-muted-foreground">min</span>
        <button
          onClick={() => {
            addTimer(name.trim() || "Timer", mins);
            setName("");
          }}
          className="ml-auto inline-flex h-7 w-7 items-center justify-center border border-border text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {timers.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {timers.map((t) => {
            const remaining = remainingOf(t);
            const done = remaining === 0;
            const running = t.endsAt != null;
            return (
              <li
                key={t.id}
                className={`flex items-center justify-between border px-2 py-1.5 ${
                  done ? "border-emerald-600/60" : "border-border"
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-xs text-foreground">{t.name}</div>
                  <div
                    className={`font-mono text-sm ${done ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}
                  >
                    {fmt(remaining)}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-1">
                  <button onClick={() => toggle(t.id)} className="text-muted-foreground hover:text-foreground">
                    {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                  <button onClick={() => reset(t.id)} className="text-muted-foreground hover:text-foreground">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
