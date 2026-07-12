import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { PRICING as P } from "@/constants/testIds";
import { FreeLnBadge } from "@/components/FreeLnBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STRIPE, seatCheckoutUrl } from "@/lib/stripe";

const SUPPORT_EMAIL = "ryan@sci-arch.ca";

function TierCard({ children, testid, featured, badge, badgeVariant = "neutral", className = "" }) {
  return (
    <div
      data-testid={testid}
      className={`relative flex flex-col border border-border bg-card p-5 sm:p-6 ${
        featured ? "ring-1 ring-primary" : ""
      } ${className}`}
    >
      {badge && (
        <Badge variant={badgeVariant} className="absolute -top-[11px] left-5 sm:left-6">
          {badge}
        </Badge>
      )}
      {children}
    </div>
  );
}

function SeatStepper({ value, onChange, min = 1, max = 100, id }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center rounded-[2px] border border-border">
      <button
        type="button"
        onClick={dec}
        className="h-8 w-8 border-r border-border text-sm text-foreground/70 hover:bg-secondary hover:text-foreground"
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
        className="h-8 w-8 border-l border-border text-sm text-foreground/70 hover:bg-secondary hover:text-foreground"
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
  const [teamSeats, setTeamSeats] = useState(3);

  const openLunch = () => window.open(STRIPE.lunchUrl, "_blank", "noreferrer");
  const openSeats = () => window.open(seatCheckoutUrl(teamSeats), "_blank", "noreferrer");

  return (
    <section
      data-testid={P.section}
      className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${compact ? "py-10" : "py-14 sm:py-16"}`}
    >
      {!compact && (
        <div className="mb-8 max-w-[65ch]">
          <div className="eyebrow">§ pricing</div>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
            freeLN is free. Chip in only if it helps.
          </h2>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 text-sm leading-relaxed text-muted-foreground">
            <FreeLnBadge size="sm" />
            <span>
              is the whole notebook — free forever, no account, and it runs on your own machine. I
              build it solo. If it earns a place in your week, you can buy me lunch or back my dev
              work.
            </span>
          </p>
        </div>
      )}

      <div className="grid gap-0 border border-border md:grid-cols-3">
        {/* FREELN: free forever */}
        <TierCard
          testid={P.tierFree}
          featured
          badge="Free forever"
          badgeVariant="live"
          className="border-r-0 md:border-r border-b md:border-b-0"
        >
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            for the thesis, the write-up, the last experiment
          </div>
          <h3 className="mt-2"><FreeLnBadge size="lg" /></h3>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-serif text-4xl">$0</span>
            <span className="font-mono text-xs text-muted-foreground">free, always, no account</span>
          </div>
          <ul className="mt-6 flex-1 space-y-2.5 border-t border-border/60 pt-6 text-sm leading-relaxed text-foreground/80">
            <li>· Write, save &amp; import your own .md, in your browser</li>
            <li>· Nothing uploaded, your notes stay on your machine</li>
            <li>· Bring notes in from Word, PDF, Notion &amp; more</li>
            <li>· Full-text search &amp; PDF export</li>
            <li>· Yours to keep after you graduate</li>
          </ul>
          <div className="mt-6">
            <Button
              data-testid={P.ctaFree}
              onClick={() => navigate(workspace ? "/workspace" : "/")}
              className="w-full"
            >
              {workspace ? "Open workspace" : "Start writing, free"}
            </Button>
          </div>
        </TierCard>

        {/* BUY ME LUNCH — pay what you want, monthly */}
        <TierCard
          testid={P.tierAcademic}
          className="border-r-0 md:border-r border-b md:border-b-0"
        >
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            for the months freeLN saves you time
          </div>
          <h3 className="mt-2 font-serif text-2xl text-foreground">Buy me lunch once a month</h3>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-serif text-4xl">${STRIPE.minLunchCad}+</span>
            <span className="font-mono text-xs text-muted-foreground">
              you choose · ${STRIPE.minLunchCad} CAD min · monthly
            </span>
          </div>
          <div className="mt-1.5 font-mono text-xs text-muted-foreground">
            name your price, cancel whenever
          </div>
          <ul className="mt-6 flex-1 space-y-2.5 border-t border-border/60 pt-6 text-sm leading-relaxed text-foreground/80">
            <li>· A small monthly thank-you that keeps me building</li>
            <li>· Pay what freeLN is worth to you</li>
            <li>· No tier gates — the whole notebook stays free</li>
            <li>· Cancel from Stripe anytime, no hard feelings</li>
          </ul>
          <div className="mt-6">
            <Button
              data-testid={P.ctaAcademic}
              variant="primary"
              onClick={openLunch}
              className="w-full"
            >
              Buy me lunch
            </Button>
          </div>
        </TierCard>

        {/* SUPPORT MY DEV WORK — per seat monthly */}
        <TierCard testid={P.tierEnterprise}>
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            for labs and teams that run on freeLN
          </div>
          <h3 className="mt-2 font-serif text-2xl text-foreground">Support my dev work</h3>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-serif text-4xl">${STRIPE.seatPriceCad}</span>
            <span className="font-mono text-xs text-muted-foreground">/ seat / month · CAD</span>
          </div>
          <div className="mt-1.5 font-mono text-xs text-muted-foreground">
            a steadier way to back the work
          </div>
          <ul className="mt-6 flex-1 space-y-2.5 border-t border-border/60 pt-6 text-sm leading-relaxed text-foreground/80">
            <li>· Back freeLN on behalf of your whole team</li>
            <li>· Pick how many seats you want to sponsor</li>
            <li>· Helps me spend more days shipping features</li>
            <li>· Adjust or cancel from Stripe anytime</li>
          </ul>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                seats
              </span>
              <SeatStepper
                id={P.seatsEnterprise}
                value={teamSeats}
                min={1}
                max={100}
                onChange={setTeamSeats}
              />
            </div>
            <div className="border-t border-border pt-3 font-mono text-xs text-muted-foreground">
              Est.{" "}
              <span className="text-foreground">
                ${(teamSeats * STRIPE.seatPriceCad).toLocaleString("en-CA")}
              </span>{" "}
              CAD / month
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              You confirm the exact seat count on Stripe's checkout page.
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Button
              data-testid={P.ctaEnterprise}
              variant="primary"
              onClick={openSeats}
              className="w-full"
            >
              Support the work
            </Button>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="block w-full rounded-[2px] px-4 py-2 text-center text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              For something custom, email me → {SUPPORT_EMAIL}
            </a>
          </div>
        </TierCard>
      </div>
    </section>
  );
}
