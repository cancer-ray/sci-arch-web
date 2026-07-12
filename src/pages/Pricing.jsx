import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PricingTable } from "@/components/PricingTable";
import { FreeLnBadge } from "@/components/FreeLnBadge";
import { Seo } from "@/components/Seo";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Pricing — sci-arch"
        description="freeLN is free forever, no account, local-first. If it helps, buy me lunch (pay what you want, $15 CAD min, monthly) or back my dev work at $50 CAD per seat per month."
        event="pricing_view"
      />
      <Nav />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="eyebrow">§ pricing</div>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            freeLN is free. If it helps, you can chip in.
          </h1>
          <p className="mt-4 flex max-w-[65ch] flex-wrap items-baseline gap-x-1.5 text-base text-muted-foreground">
            <FreeLnBadge />
            <span>
              is the whole notebook — free forever, no account, and it runs on your own machine. I
              build it solo. If it earns a place in your week, buy me lunch or back my dev work.
            </span>
          </p>
        </div>
      </section>
      <PricingTable compact />
      <Footer />
    </div>
  );
}
