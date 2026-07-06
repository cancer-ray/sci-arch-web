import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";

export default function Contact() {
  const [salesOpen, setSalesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-24">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          § contact
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">Get in touch.</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Solo-run, so it's just Ryan reading these. Expect a real reply, not a ticket number.
        </p>

        <div className="mt-10 grid gap-0 border border-border sm:grid-cols-2">
          <div className="border-b border-border p-6 sm:border-b-0 sm:border-r">
            <Mail className="h-5 w-5 text-foreground" strokeWidth={1.4} />
            <h3 className="mt-4 font-serif text-lg text-foreground">General &amp; support</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Questions, bugs, or feedback on the product.
            </p>
            <a
              href="mailto:ryan@sci-arch.ca"
              className="mt-4 inline-block text-sm text-foreground underline underline-offset-4"
            >
              ryan@sci-arch.ca
            </a>
          </div>
          <div className="p-6">
            <ShieldCheck className="h-5 w-5 text-foreground" strokeWidth={1.4} />
            <h3 className="mt-4 font-serif text-lg text-foreground">Privacy &amp; data</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Data requests, subprocessor questions, or anything covered in our{" "}
              <a href="/privacy" className="text-foreground underline underline-offset-4">
                privacy policy
              </a>
              .
            </p>
            <a
              href="mailto:privacy@sci-arch.ca"
              className="mt-4 inline-block text-sm text-foreground underline underline-offset-4"
            >
              privacy@sci-arch.ca
            </a>
          </div>
        </div>

        <div className="mt-6 border border-border p-6">
          <h3 className="font-serif text-lg text-foreground">Lab or enterprise inquiry</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Prepaying for a team, volume seats, or need the Compliance tier (Part 11 validation
            package, SOC 2 posture)?
          </p>
          <button
            onClick={() => setSalesOpen(true)}
            className="mt-4 inline-flex h-9 items-center gap-2 bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
          >
            Contact sales →
          </button>
        </div>
      </main>
      <Footer />
      <ContactSalesDialog open={salesOpen} onOpenChange={setSalesOpen} />
    </div>
  );
}
