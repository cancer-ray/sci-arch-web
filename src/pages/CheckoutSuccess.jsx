import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CHECKOUT } from "@/constants/testIds";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CheckoutSuccess() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking"); // checking | paid | error

  // Stripe only redirects here after a successful payment; the subscription is
  // activated server-side by the Stripe webhook (customer.subscription.*).
  useEffect(() => {
    setStatus(sessionId ? "paid" : "error");
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid={CHECKOUT.successRoot}>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-[65ch] rounded-[2px] border border-border bg-card p-5 sm:p-6">
          <div className="eyebrow">§ checkout</div>

          {status === "checking" && (
            <div className="mt-4">
              <h1 className="font-serif text-3xl">Confirming your payment…</h1>
              <p
                data-testid={CHECKOUT.successStatus}
                className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Polling Stripe for status.
              </p>
            </div>
          )}

          {status === "paid" && (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <h1 className="font-serif text-3xl">Subscription active.</h1>
              </div>
              <p
                data-testid={CHECKOUT.successStatus}
                className="mt-3 text-sm text-muted-foreground"
              >
                Your prepaid seats are unlocked. A receipt was sent by Stripe.
              </p>
              <div className="mt-8">
                <Link
                  to="/dashboard"
                  data-testid={CHECKOUT.successCta}
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
                >
                  Open dashboard <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {(status === "expired" || status === "error") && (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-destructive" />
                <h1 className="font-serif text-3xl">
                  {status === "expired" ? "Session expired." : "Couldn't confirm payment."}
                </h1>
              </div>
              <p
                data-testid={CHECKOUT.successStatus}
                className="mt-3 text-sm text-muted-foreground"
              >
                {status === "expired"
                  ? "Your Stripe checkout session expired without completing. You can try again from the pricing page."
                  : "We couldn't confirm the payment status. If money was charged, we'll reconcile via webhook. Check the dashboard shortly."}
              </p>
              <div className="mt-8 flex gap-3">
                <Link
                  to="/pricing"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  Back to pricing
                </Link>
                <Link
                  to="/dashboard"
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
                >
                  Dashboard
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
