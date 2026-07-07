import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PricingTable } from "@/components/PricingTable";
import { FreeLnBadge } from "@/components/FreeLnBadge";
import { PlusBadge } from "@/components/PlusBadge";
import { Seo } from "@/components/Seo";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Pricing — sci-arch"
        description="freeLN is free forever. soloLN $15/mo and groupLN $49/seat/mo (early access) add synced, audit-ready, e-signable records."
        event="pricing_view"
      />
      <Nav />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="eyebrow">§ pricing</div>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            Free today. Built for what's next.
          </h1>
          <p className="mt-4 flex max-w-[65ch] flex-wrap items-baseline gap-x-1.5 text-base text-muted-foreground">
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
