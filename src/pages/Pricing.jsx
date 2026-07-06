import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PricingTable } from "@/components/PricingTable";
import { FreeLnBadge } from "@/components/FreeLnBadge";
import { PlusBadge } from "@/components/PlusBadge";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            § pricing
          </div>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            Free today. Built for what's next.
          </h1>
          <p className="mt-4 flex max-w-2xl flex-wrap items-baseline gap-x-1.5 text-base text-muted-foreground">
            <FreeLnBadge />
            <span>is live and free: write, save, and import your own notes, no account needed.</span>
            <PlusBadge />
            <span>
              adds a cloud notebook, e-signatures, and a full audit trail: soloLN launches next
              week, groupLN launches in August. Join the waitlist for early access.
            </span>
          </p>
        </div>
      </section>
      <PricingTable compact />
      <Footer />
    </div>
  );
}
