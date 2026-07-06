import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { PRICING as P, CONTACT } from "@/constants/testIds";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";
import { FreeLnBadge } from "@/components/FreeLnBadge";
import { PlusBadge } from "@/components/PlusBadge";
import { SoloLnBadge } from "@/components/SoloLnBadge";

// Planned CAD per-seat rates for sci-arch+ (soloLN/groupLN; pricing preview, not yet billed).
const RATES = {
  academic: { monthly: 15, annual: 150 },
  enterprise: { monthly: 49, annual: 490 },
};

function TierCard({ children, testid, featured, badge, className = "" }) {
  return (
    <div
      data-testid={testid}
      className={`relative flex flex-col border border-border bg-card p-6 ${
        featured ? "ring-1 ring-primary" : ""
      } ${className}`}
    >
      {badge && (
        <span className="absolute -top-[9px] left-6 bg-foreground px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-background">
          {badge}
        </span>
      )}
      {children}
    </div>
  );
}

function SeatStepper({ value, onChange, min = 1, max = 100, id }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center border border-border">
      <button
        type="button"
        onClick={dec}
        className="h-8 w-8 border-r border-border text-sm text-foreground/70 hover:bg-foreground hover:text-background"
        aria-label="Decrease seats"
      >
        −
      </button>
      <input
        data-testid={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value || "0", 10);
          if (Number.isNaN(v)) return;
          onChange(Math.max(min, Math.min(max, v)));
        }}
        className="h-8 w-14 border-none bg-transparent text-center font-mono text-sm focus:outline-none"
      />
      <button
        type="button"
        onClick={inc}
        className="h-8 w-8 border-l border-border text-sm text-foreground/70 hover:bg-foreground hover:text-background"
        aria-label="Increase seats"
      >
        +
      </button>
    </div>
  );
}

export function PricingTable({ compact = false }) {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const [cadence, setCadence] = useState("monthly"); // monthly | annual
  const [enterpriseSeats, setEnterpriseSeats] = useState(5);
  const [contactOpen, setContactOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSeats, setWaitlistSeats] = useState(1);

  const per = cadence === "annual" ? "/ seat / year" : "/ seat / month";
  const term = cadence === "annual" ? "/ year" : "/ month";

  const joinWaitlist = (seats) => {
    setWaitlistSeats(seats);
    setWaitlistOpen(true);
  };

  return (
    <section
      data-testid={P.section}
      className={`mx-auto max-w-6xl px-6 ${compact ? "py-10" : "py-24"}`}
    >
      {!compact && (
        <div className="mb-12 max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            § pricing
          </div>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
            Free today. Built for what's next.
          </h2>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 text-sm leading-relaxed text-muted-foreground">
            <FreeLnBadge size="sm" />
            <span>
              is live and free: write, save, and import your own notes, no account needed.
            </span>
            <PlusBadge size="sm" />
            <span>
              adds a cloud notebook, e-signatures, and a full audit trail: soloLN launches next
              week, groupLN launches in August. Join the waitlist below for early access.
            </span>
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex border border-border font-mono text-xs uppercase tracking-[0.2em]">
          {["monthly", "annual"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCadence(c)}
              className={`btn-lift px-4 py-2 transition-colors ${
                cadence === c ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="bg-primary px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-primary-foreground">
          2 months FREE on annual
        </span>
      </div>

      <div className="grid gap-0 border border-border md:grid-cols-3">
        {/* FREELN: live today */}
        <TierCard
          testid={P.tierFree}
          featured
          badge="Live now"
          className="border-r-0 md:border-r border-b md:border-b-0"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            finishing a thesis? writing up your last experiment?
          </div>
          <h3 className="mt-2"><FreeLnBadge size="lg" /></h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-serif text-4xl">$0</span>
            <span className="text-xs text-muted-foreground">free, always, no account</span>
          </div>
          <ul className="mt-6 flex-1 space-y-2.5 border-t border-border/60 pt-6 text-sm leading-relaxed text-foreground/80">
            <li>· Write, save &amp; import your own .md, in your browser</li>
            <li>· Nothing uploaded, your notes stay on your machine</li>
            <li>· Bring notes in from Word, PDF, Notion &amp; more</li>
            <li>· Full-text search &amp; PDF export</li>
            <li>· Yours to keep after you graduate</li>
          </ul>
          <div className="mt-6">
            <button
              data-testid={P.ctaFree}
              onClick={() => navigate(workspace ? "/workspace" : "/")}
              className="btn-lift w-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              {workspace ? "Open workspace" : "Start writing, free"}
            </button>
          </div>
        </TierCard>

        {/* SOLOLN — coming soon */}
        <TierCard
          testid={P.tierAcademic}
          badge="Coming soon"
          className="border-r-0 md:border-r border-b md:border-b-0"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            for founders &amp; individual scientists
          </div>
          <SoloLnBadge size="lg" className="mt-2" />
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-serif text-4xl">${RATES.academic[cadence]}</span>
            <span className="text-xs text-muted-foreground">{term} · CAD (planned)</span>
          </div>
          <ul className="mt-6 flex-1 space-y-2.5 border-t border-border/60 pt-6 text-sm leading-relaxed text-foreground/80">
            <li>· Everything in freeLN</li>
            <li>· Your notebook, synced to the cloud</li>
            <li>· Bring your own Claude via MCP</li>
            <li>· Versioned, audit-ready records</li>
            <li>· Reagent inventory: never run out again</li>
          </ul>
          <div className="mt-6">
            <button
              data-testid={P.ctaAcademic}
              onClick={() => joinWaitlist(1)}
              className="btn-lift w-full border border-border px-4 py-2 text-sm text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Get early access
            </button>
          </div>
        </TierCard>

        {/* GROUPLN — coming soon */}
        <TierCard testid={P.tierEnterprise} badge="Coming soon">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            GLP-compliance layer · 2 employees to enterprise
          </div>
          <PlusBadge size="sm" className="mt-2" />
          <h3 className="mt-1 font-serif text-2xl text-foreground">groupLN</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-serif text-4xl">${RATES.enterprise[cadence]}</span>
            <span className="text-xs text-muted-foreground">{per} · CAD (planned)</span>
          </div>
          <ul className="mt-6 flex-1 space-y-2.5 border-t border-border/60 pt-6 text-sm leading-relaxed text-foreground/80">
            <li>· Everything in soloLN</li>
            <li>· Inventory management, shared seats</li>
            <li>· Tracked commenting between users</li>
            <li>· Shared equipment booking</li>
            <li>· Electronic signatures, full audit trail</li>
            <li>· Part 11-aligned records</li>
          </ul>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                seats
              </span>
              <SeatStepper
                id={P.seatsEnterprise}
                value={enterpriseSeats}
                min={5}
                max={100}
                onChange={setEnterpriseSeats}
              />
            </div>
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              Est. <span className="font-mono text-foreground">${(enterpriseSeats * RATES.enterprise[cadence]).toFixed(2)}</span> CAD {term}
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <button
              data-testid={P.ctaEnterprise}
              onClick={() => joinWaitlist(enterpriseSeats)}
              className="btn-lift w-full border border-border px-4 py-2 text-sm text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Get early access
            </button>
            <button
              data-testid={CONTACT.openBtn}
              onClick={() => setContactOpen(true)}
              className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Need GLP/GMP validation? Talk to me directly →
            </button>
          </div>
        </TierCard>
      </div>

      <ContactSalesDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultSeats={enterpriseSeats}
        variant="enterprise"
      />
      <ContactSalesDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        defaultSeats={waitlistSeats}
        variant="waitlist"
      />
    </section>
  );
}
