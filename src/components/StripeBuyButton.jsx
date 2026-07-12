import { useEffect } from "react";
import { STRIPE } from "@/lib/stripe";

/**
 * Renders Stripe's hosted "Buy Button" web component. Stripe's buy-button.js
 * script is injected on mount (once, globally) rather than in index.html, so it
 * only loads on pages that actually use the button. The <stripe-buy-button>
 * element sits in the DOM immediately and upgrades itself once the script loads
 * — this is Stripe's documented usage, and it degrades gracefully if the script
 * is slow to arrive.
 *
 * The button's colors, label, and size are configured in the Stripe dashboard,
 * not here — the `className` wrapper only positions the element on the page.
 */
const SCRIPT_SRC = "https://js.stripe.com/v3/buy-button.js";

export function StripeBuyButton({ className = "" }) {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className={className}>
      <stripe-buy-button
        buy-button-id={STRIPE.buyButtonId}
        publishable-key={STRIPE.publishableKey}
      />
    </div>
  );
}
