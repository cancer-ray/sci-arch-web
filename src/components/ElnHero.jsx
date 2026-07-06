import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FolderTree,
  GitBranch,
  Beaker,
  ShieldCheck,
  Bot,
  Bold,
  Italic,
  Heading1,
  List,
  Link as LinkIcon,
  ScrollText,
  Receipt,
} from "lucide-react";
import LiquidGlass from "liquid-glass-react";
import { LANDING } from "@/constants/testIds";

/**
 * Cinematic hero mock: a looping 4-scene sequence, each with its own caption
 * and visual, showing what sci-arch actually does. Pure CSS/Framer Motion,
 * no video/gradients, flat editorial frame throughout.
 */

const DRAFT_SCRIPT = [
  { t: "# SOP-04: ", d: 30 },
  { t: "Pd-Catalyzed Coupling\n\n", d: 25 },
  { t: "**Author:** Claude (drafted)  ", d: 15 },
  { t: "**Reviewer:** R. Ford\n\n", d: 20 },
  { t: "## Objective\n", d: 30 },
  { t: "Standard Suzuki coupling for aryl halides.\n\n", d: 15 },
  { t: "## Reagents\n", d: 30 },
  { t: "| Reagent | Qty |\n|---|---|\n", d: 15 },
  { t: "| Pd(PPh₃)₄ | 15 mg |\n", d: 18 },
  { t: "| K₂CO₃ | 210 mg |\n", d: 18 },
];

const EMBED_SNIPPET =
  "## Results\n![absorbance-kinetics](./figures/aunp-abs.png)\n\nPeak shift observed\nat 620 nm.";

const BARS = [18, 32, 54, 68, 48, 28, 14];

function useTypewriter(script, resetKey) {
  const full = useMemo(() => script.map((s) => s.t).join(""), [script]);
  const [text, setText] = useState("");

  useEffect(() => {
    let cancelled = false;
    let acc = "";
    setText("");
    (async () => {
      for (const seg of script) {
        if (cancelled) return;
        for (const ch of seg.t) {
          if (cancelled) return;
          acc += ch;
          setText(acc);
          await new Promise((r) => setTimeout(r, seg.d));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return { text, full };
}

// Minimal markdown -> JSX renderer (headings, bold, tables, paragraphs).
function renderMarkdown(md) {
  const blocks = md.split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split("\n").filter(Boolean);

    if (lines.length >= 2 && lines[0].includes("|") && /^\s*\|?\s*[-:]+/.test(lines[1])) {
      const rows = lines.map((l) => l.split("|").map((c) => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === "") && !(idx === arr.length - 1 && c === "")));
      const [head, , ...body] = rows;
      return (
        <table key={i} className="mb-2 w-full border-collapse text-[10px] font-mono">
          <thead>
            <tr>
              {head.map((h, j) => (
                <th key={j} className="border-b border-border px-1.5 py-1 text-left font-medium text-foreground/80">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, j) => (
              <tr key={j}>
                {r.map((c, k) => (
                  <td key={k} className="border-b border-border/50 px-1.5 py-1 text-foreground/70">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (lines[0]?.startsWith("# ")) {
      return (
        <h4 key={i} className="mb-1 font-serif text-sm font-medium text-foreground">
          {lines[0].slice(2)}
        </h4>
      );
    }
    if (lines[0]?.startsWith("## ")) {
      return (
        <h5 key={i} className="mb-1 mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          {lines[0].slice(3)}
        </h5>
      );
    }
    return (
      <p key={i} className="mb-1.5 text-[11px] leading-relaxed text-foreground/80">
        {block.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith("**") ? (
            <strong key={j} className="font-medium text-foreground">{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    );
  });
}

const FILES = [
  { name: "exp-401-hydrogenation.md", active: false },
  { name: "sop-04-coupling.md", active: true },
  { name: "exp-403-reduction.md", active: false },
  { name: "inventory-2026-Q4.md", active: false },
];

const SCENES = [
  {
    id: "draft",
    n: "01",
    title: "Draft a protocol.",
    sub: "Claude writes it, in your voice.",
    status: "ai-assisted · claude drafting",
    duration: 4400,
  },
  {
    id: "sign",
    n: "02",
    title: "Sign & approve.",
    sub: "Only a human locks the record.",
    status: "awaiting signature",
    duration: 4000,
  },
  {
    id: "inventory",
    n: "03",
    title: "Auto-log inventory.",
    sub: "Claude updates stock as you work.",
    status: "claude: logging inventory",
    duration: 4200,
  },
  {
    id: "embed",
    n: "04",
    title: "Embed data.",
    sub: "Plots and figures, inline.",
    status: "embedding figure",
    duration: 3800,
  },
];

function Sidebar({ active }) {
  const [qty, setQty] = useState(2.4);
  useEffect(() => {
    if (!active) {
      setQty(2.4);
      return;
    }
    const t = setTimeout(() => setQty(2.385), 1400);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className="col-span-3 border-r border-border bg-secondary/20 p-2">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <FolderTree className="h-3 w-3" /> notebook
      </div>
      <ul className="space-y-0.5">
        {FILES.map((f) => (
          <li
            key={f.name}
            className={`flex items-center gap-1.5 truncate px-1.5 py-1 text-[10px] ${
              f.active ? "bg-foreground text-background" : "text-foreground/70"
            }`}
          >
            <FileText className="h-3 w-3 flex-none" />
            <span className="font-mono">{f.name}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-border pt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        inventory
      </div>
      <div className="mt-1 space-y-0.5 font-mono text-[10px] text-foreground/60">
        <div className="flex items-center justify-between">
          <span>Pd(PPh₃)₄</span>
          <span className={`inline-flex items-center gap-1 ${qty < 2.4 ? "text-foreground" : ""}`}>
            {qty.toFixed(3)} g
            {qty < 2.4 && <Bot className="h-2.5 w-2.5" />}
          </span>
        </div>
        <div className="flex justify-between"><span>K₂CO₃</span><span>210 mg</span></div>
        <div className="flex justify-between"><span>Toluene</span><span>1.1 L</span></div>
      </div>
    </div>
  );
}

function DraftScene({ resetKey }) {
  const { text } = useTypewriter(DRAFT_SCRIPT, resetKey);
  return (
    <div className="col-span-9 grid grid-cols-9">
      <div className="col-span-5 border-r border-border">
        <div className="border-b border-border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          editor · markdown
        </div>
        <div className="flex items-center gap-2 border-b border-border px-2 py-1 text-foreground/50">
          <Bold className="h-2.5 w-2.5" />
          <Italic className="h-2.5 w-2.5" />
          <Heading1 className="h-2.5 w-2.5" />
          <List className="h-2.5 w-2.5" />
          <LinkIcon className="h-2.5 w-2.5" />
        </div>
        <pre className="h-[280px] overflow-hidden whitespace-pre-wrap p-3 font-mono text-[10px] leading-[1.55] text-foreground/85">
          {text}
          <span className="eln-cursor" />
        </pre>
      </div>
      <div className="col-span-4">
        <div className="border-b border-border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          preview · rendered
        </div>
        <div className="h-[280px] overflow-hidden p-3">{renderMarkdown(text)}</div>
      </div>
    </div>
  );
}

const AUDIT_ROWS = [
  { key: "created", label: "created entry", who: "human · you", delay: 200 },
  {
    key: "drafted",
    label: "drafted procedure",
    who: "ai-assisted · claude",
    icon: Bot,
    delay: 700,
  },
  { key: "saved", label: "saved new version", who: "human · you", delay: 1300 },
];

function AuditHistory({ locked }) {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    setVisible([]);
    const timers = AUDIT_ROWS.map((row) =>
      setTimeout(() => setVisible((v) => [...v, row.key]), row.delay)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="col-span-5 border-r border-border">
      <div className="flex items-center gap-1.5 border-b border-border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <ScrollText className="h-3 w-3" /> audit history · sop-04-coupling.md
      </div>
      <ul className="divide-y divide-border">
        <AnimatePresence>
          {AUDIT_ROWS.filter((r) => visible.includes(r.key)).map((row) => (
            <motion.li
              key={row.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-3 py-2 text-[11px]"
            >
              <span className="text-foreground/85">{row.label}</span>
              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                {row.icon && <row.icon className="h-2.5 w-2.5" />}
                {row.who}
              </span>
            </motion.li>
          ))}
          {locked && (
            <motion.li
              key="signed"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-3 py-2 text-[11px]"
            >
              <span className="text-emerald-700 dark:text-emerald-400">signed &amp; locked</span>
              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-2.5 w-2.5" /> human · you
              </span>
            </motion.li>
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function SignScene({ resetKey }) {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    setLocked(false);
    const t = setTimeout(() => setLocked(true), 1900);
    return () => clearTimeout(t);
  }, [resetKey]);

  return (
    <div className="col-span-9 grid h-[340px] grid-cols-9">
      <AuditHistory key={resetKey} locked={locked} />
      <div className="col-span-4 flex items-center justify-center p-6">
        <LiquidGlass
          cornerRadius={2}
          displacementScale={40}
          blurAmount={0.08}
          saturation={110}
          aberrationIntensity={1}
          elasticity={0.1}
          overLight
          padding="16px"
          className="relative z-10 w-full max-w-[240px] border border-border bg-background"
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            sign &amp; lock
          </div>
          <div className="mt-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">signer</span>
              <span className="text-foreground">Dr. R. Ford</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">meaning</span>
              <span className="text-foreground">Approver</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="flex-none text-muted-foreground">reason</span>
              <span className="text-right text-foreground">reviewed &amp; approved</span>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {!locked ? (
              <motion.div
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-center justify-center gap-1.5 border border-dashed border-border px-2 py-1.5 text-[10px] text-muted-foreground"
              >
                <span className="marching-ants inline-block h-1.5 w-1.5" />
                awaiting signature
              </motion.div>
            ) : (
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: -2 }}
                className="mt-3 flex items-center justify-center gap-1.5 border border-emerald-600/60 px-2 py-1.5 text-[10px] text-emerald-700 dark:border-emerald-500/60 dark:text-emerald-400"
              >
                <ShieldCheck className="h-3 w-3" />
                signed &amp; locked
              </motion.div>
            )}
          </AnimatePresence>
        </LiquidGlass>
      </div>
    </div>
  );
}

const RECEIPTS = ["receipt-2401.pdf", "receipt-2402.pdf"];

function InventoryScene({ resetKey }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => setStep(3), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [resetKey]);

  return (
    <div className="col-span-9 h-[340px] space-y-3 p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        claude · connected via mcp
      </div>
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="ml-auto max-w-[80%] border border-border bg-secondary/30 px-3 py-2 text-[11px] text-foreground/85"
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5 border border-dashed border-border bg-background/60 p-1.5">
              {RECEIPTS.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground"
                >
                  <Receipt className="h-2.5 w-2.5 flex-none" /> {r}
                </span>
              ))}
            </div>
            update the inventory with these receipts
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[85%] border border-border px-3 py-2 text-[11px] text-foreground/85"
          >
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              <Bot className="h-3 w-3" /> claude
            </span>
            <p className="mt-1">itemizing …</p>
            <AnimatePresence>
              {step >= 3 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-foreground/70"
                >
                  3 items logged from 2 receipts. Inventory updated, flagged ai-assisted in the
                  audit trail.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmbedScene() {
  return (
    <div className="col-span-9 grid h-[340px] grid-cols-9">
      <div className="col-span-5 border-r border-border p-3 font-mono text-[10px] leading-[1.6] whitespace-pre-wrap text-foreground/85">
        {EMBED_SNIPPET}
      </div>
      <div className="col-span-4 p-3">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          figures/aunp-abs.png
        </div>
        <svg viewBox="0 0 160 90" className="h-[100px] w-full overflow-visible">
          <line x1="8" y1="80" x2="152" y2="80" stroke="currentColor" strokeOpacity="0.25" />
          {BARS.map((h, i) => (
            <motion.rect
              key={i}
              x={14 + i * 20}
              width="12"
              y={80 - h}
              height={h}
              className="fill-foreground/70"
              style={{ originY: 1, transformBox: "fill-box" }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.09, duration: 0.4, ease: "easeOut" }}
            />
          ))}
        </svg>
        <p className="mt-2 text-[10px] text-muted-foreground">embedded inline · absorbance vs wavelength</p>
      </div>
    </div>
  );
}

export function ElnHero() {
  const [idx, setIdx] = useState(0);
  const scene = SCENES[idx];

  useEffect(() => {
    const t = setTimeout(() => setIdx((i) => (i + 1) % SCENES.length), scene.duration);
    return () => clearTimeout(t);
  }, [idx, scene.duration]);

  return (
    <div
      data-testid={LANDING.elnMock}
      className="relative w-full overflow-hidden border border-border bg-background"
    >
      {/* Chrome */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-foreground/25"></span>
          <span className="h-2 w-2 rounded-full bg-foreground/25"></span>
          <span className="h-2 w-2 rounded-full bg-foreground/25"></span>
        </div>
        <div className="font-mono text-[10px] tracking-tight text-muted-foreground">
          sci-arch.ca/notebook/lab-r-ford
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <GitBranch className="h-3 w-3" />
          main
        </div>
      </div>

      {/* Caption strip — the cinematic "lower third" for the current scene */}
      <div className="border-b border-border px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-baseline gap-3"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              {scene.n} / 04
            </span>
            <span className="font-serif text-base text-foreground">{scene.title}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{scene.sub}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-12">
        <Sidebar active={scene.id === "inventory"} />
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="col-span-9 grid grid-cols-9"
          >
            {scene.id === "draft" && <DraftScene resetKey={idx} />}
            {scene.id === "sign" && <SignScene resetKey={idx} />}
            {scene.id === "inventory" && <InventoryScene resetKey={idx} />}
            {scene.id === "embed" && <EmbedScene />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer status strip + scene progress */}
      <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Beaker className="h-3 w-3" /> sop-04
          </span>
          <span className="flex items-center gap-1 text-foreground/70">
            <ShieldCheck className="h-3 w-3" /> part 11-aligned
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={scene.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {scene.status}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1.5">
          {SCENES.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 w-1.5 ${i === idx ? "bg-foreground" : "bg-foreground/25"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
