// Stripe surfaces for sci-arch. Publishable key is browser-safe. The Payment Link
// URLs are filled in once the Stripe objects exist (created out-of-band); until then
// they are PLACEHOLDERS and clearly marked so the wiring is complete and testable.
export const STRIPE = {
  publishableKey:
    "pk_live_51ToxqlHoPZ7iTGGV007Zkf6EV0GGyy9VWPaPSdBSz47HHJ6PHXEIrnBYwNjDmbnXNNZRvxAbMbpkuyBnr3G7uLYR00BINWH9sX",
  // "Buy me lunch" — pay-what-you-want, monthly, min $15 CAD. TODO: real Stripe Payment Link.
  lunchUrl: "https://buy.stripe.com/PLACEHOLDER_LUNCH",
  // "Support my dev work" — $50 CAD / seat / month, adjustable quantity. TODO: real Payment Link.
  seatUrl: "https://buy.stripe.com/PLACEHOLDER_SEAT",
  // Existing fixed hosted Buy Button (used by StripeBuyButton as the About-page "buy me lunch" widget).
  buyButtonId: "buy_btn_1Ts9fhHoPZ7iTGGV3gz3tVJB",
  minLunchCad: 15,
  seatPriceCad: 50,
};
// Stripe Payment Links can't prefill quantity from the URL, so the buyer sets the
// seat count on Stripe's own checkout page (the link has adjustable quantity turned
// on). The on-page seat stepper is an estimate. We still pass the chosen count as
// client_reference_id — a real Payment Link param — so it reaches the Stripe
// dashboard and webhook for reconciliation, without pretending to fix the charge.
export const seatCheckoutUrl = (seats) => {
  const n = Math.max(1, parseInt(seats, 10) || 1);
  return `${STRIPE.seatUrl}?client_reference_id=seats-${n}`;
};
