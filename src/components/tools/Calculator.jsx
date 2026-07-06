import { useState } from "react";

// a*b = c*d, solve for whichever one field is left blank. Ported from
// GRIMOIRE-ELN master's Calc.tsx dilution/molarity solver.
function solveProduct(a, b, c, d) {
  const vals = [a, b, c, d];
  const known = vals.filter((x) => x != null && x !== "").length;
  if (known !== 3) return null;
  const num = (x) => (x === "" || x == null ? null : Number(x));
  const [na, nb, nc, nd] = vals.map(num);
  if (na == null && nb != null) return nb === 0 ? null : { idx: 0, val: (nc * nd) / nb };
  if (nb == null && na != null) return na === 0 ? null : { idx: 1, val: (nc * nd) / na };
  if (nc == null && nd != null) return nd === 0 ? null : { idx: 2, val: (na * nb) / nd };
  if (nd == null && nc != null) return nc === 0 ? null : { idx: 3, val: (na * nb) / nc };
  return null;
}

const fmt = (n) => (Number.isFinite(n) ? Math.round(n * 10000) / 10000 : "");

function Field({ label, value, onChange, solvedIdx, idx, unit }) {
  const solved = solvedIdx === idx;
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-1 border border-border">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className={`h-7 w-full border-none bg-transparent px-2 font-mono text-xs focus:outline-none ${
            solved ? "text-foreground" : ""
          }`}
        />
        <span className="pr-2 font-mono text-[9px] text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}

export function Calculator() {
  const [mode, setMode] = useState("dilution"); // dilution | molarity
  const [c1, setC1] = useState("");
  const [v1, setV1] = useState("");
  const [c2, setC2] = useState("");
  const [v2, setV2] = useState("");
  const [mass, setMass] = useState("");
  const [molarity, setMolarity] = useState("");
  const [volume, setVolume] = useState("");
  const [mw, setMw] = useState("");

  const dilutionResult = solveProduct(c1, v1, c2, v2);
  // mass = molarity * volume * mw  -->  treat as (mass) = (molarity*volume) * mw via two-step solve
  const molarityResult = (() => {
    const vals = [mass, molarity, volume, mw];
    const known = vals.filter((x) => x !== "" && x != null).length;
    if (known !== 3) return null;
    const [nm, nc, nv, nmw] = vals.map((x) => (x === "" ? null : Number(x)));
    if (nm == null) return { idx: 0, val: nc * nv * nmw };
    if (nc == null) return nv * nmw === 0 ? null : { idx: 1, val: nm / (nv * nmw) };
    if (nv == null) return nc * nmw === 0 ? null : { idx: 2, val: nm / (nc * nmw) };
    if (nmw == null) return nc * nv === 0 ? null : { idx: 3, val: nm / (nc * nv) };
    return null;
  })();

  const dv = (idx, val) => (dilutionResult?.idx === idx ? fmt(dilutionResult.val) : val);
  const mv = (idx, val) => (molarityResult?.idx === idx ? fmt(molarityResult.val) : val);

  return (
    <div>
      <div className="mb-3 inline-flex border border-border font-mono text-[9px] uppercase tracking-[0.15em]">
        {["dilution", "molarity"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2 py-1 transition-colors ${
              mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "dilution" ? (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">C1V1 = C2V2 — leave one field blank.</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="C1" value={dv(0, c1)} onChange={setC1} solvedIdx={dilutionResult?.idx} idx={0} unit="M" />
            <Field label="V1" value={dv(1, v1)} onChange={setV1} solvedIdx={dilutionResult?.idx} idx={1} unit="mL" />
            <Field label="C2" value={dv(2, c2)} onChange={setC2} solvedIdx={dilutionResult?.idx} idx={2} unit="M" />
            <Field label="V2" value={dv(3, v2)} onChange={setV2} solvedIdx={dilutionResult?.idx} idx={3} unit="mL" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">mass = molarity × volume × MW — leave one blank.</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Mass" value={mv(0, mass)} onChange={setMass} solvedIdx={molarityResult?.idx} idx={0} unit="g" />
            <Field label="Molarity" value={mv(1, molarity)} onChange={setMolarity} solvedIdx={molarityResult?.idx} idx={1} unit="M" />
            <Field label="Volume" value={mv(2, volume)} onChange={setVolume} solvedIdx={molarityResult?.idx} idx={2} unit="L" />
            <Field label="MW" value={mv(3, mw)} onChange={setMw} solvedIdx={molarityResult?.idx} idx={3} unit="g/mol" />
          </div>
        </div>
      )}
    </div>
  );
}
