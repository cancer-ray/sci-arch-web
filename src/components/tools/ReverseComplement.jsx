import { useMemo, useState } from "react";
import { Copy } from "lucide-react";

// IUPAC-aware complement map, ported from GRIMOIRE-ELN master's
// src/lib/seqtools/sequence.ts.
const COMP = {
  A: "T", T: "A", G: "C", C: "G",
  R: "Y", Y: "R", S: "S", W: "W", K: "M", M: "K",
  B: "V", V: "B", D: "H", H: "D", N: "N",
};
const VALID = /^[ACGTRYSWKMBDHVN]+$/;

function clean(raw) {
  return (raw || "").toUpperCase().replace(/[^A-Z]/g, "");
}
function isValid(raw) {
  const s = clean(raw);
  return s.length > 0 && VALID.test(s);
}
function reverseComplement(raw) {
  const s = clean(raw);
  let out = "";
  for (let i = s.length - 1; i >= 0; i--) out += COMP[s[i]] ?? "N";
  return out;
}
function complementOnly(raw) {
  return reverseComplement(raw).split("").reverse().join("");
}
function reverseOnly(raw) {
  return clean(raw).split("").reverse().join("");
}

export function ReverseComplement() {
  const [seq, setSeq] = useState("");
  const [mode, setMode] = useState("revcomp"); // revcomp | comp | rev
  const [copied, setCopied] = useState(false);

  const valid = seq.trim().length === 0 || isValid(seq);
  const output = useMemo(() => {
    if (!isValid(seq)) return "";
    if (mode === "comp") return complementOnly(seq);
    if (mode === "rev") return reverseOnly(seq);
    return reverseComplement(seq);
  }, [seq, mode]);

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div>
      <div className="mb-2 inline-flex border border-border font-mono text-[9px] uppercase tracking-[0.15em]">
        {[
          { id: "revcomp", label: "rev-comp" },
          { id: "comp", label: "comp" },
          { id: "rev", label: "rev" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-2 py-1 transition-colors ${
              mode === m.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <textarea
        value={seq}
        onChange={(e) => setSeq(e.target.value)}
        placeholder="ATGCATGC…"
        rows={2}
        spellCheck={false}
        className={`w-full resize-none border bg-transparent px-2 py-1.5 font-mono text-xs focus:outline-none ${
          valid ? "border-border" : "border-destructive"
        }`}
      />
      {!valid && <p className="mt-1 text-[10px] text-destructive">Not a valid IUPAC sequence.</p>}
      {output && (
        <div className="mt-2 flex items-start gap-1 border border-border bg-secondary/30 p-2">
          <span className="flex-1 break-all font-mono text-xs text-foreground">{output}</span>
          <button onClick={copy} className="flex-none text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="h-3 w-3" />
          </button>
        </div>
      )}
      {copied && <p className="mt-1 text-[10px] text-muted-foreground">Copied.</p>}
    </div>
  );
}
