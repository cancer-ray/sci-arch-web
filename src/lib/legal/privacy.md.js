// Privacy policy content, kept as markdown so it can be revised without
// touching JSX. PIPEDA-structured (Canada); also covers GDPR/CCPA rights for
// EU/California users. NOT LEGAL ADVICE — have a lawyer review before launch.
export const PRIVACY_MD = `
_Last updated: July 2026_

## The short version

freeLN runs entirely in your browser. Nothing you write or import is ever uploaded, and we
don't know it exists. The rest of this policy covers the small amount of data involved if you
create an account or set up an optional support payment.

## Who is responsible for your data

sci-arch is operated by Ryan Lee, sole proprietor, Ontario, Canada. Ryan is also the Privacy
Officer accountable for this policy. Questions or requests: **privacy@sci-arch.ca**.

## What we collect

- **Account information.** Your name, email address, and profile picture, from Google when you
  sign in (via Supabase Auth). We never see or store your Google password.
- **Notebook content.** None. freeLN keeps your entries, versions, and attachments on your
  device. They are never uploaded, and we cannot see them.
- **Payment information.** Optional support payments are handled by Stripe. We store your
  Stripe customer ID, support plan, and seat count, never your card number.
- **Contact information.** If you fill out the contact form: your name, email, organization,
  and message.
- **Server logs.** Standard web-server logs (IP address, timestamps, request paths) kept for
  security and operating the service.
- **Usage and analytics data** (signed-in account holders only). Aggregate information
  about how the service is used, such as which features are opened and how often, to help us
  understand and improve the product. We do not use this for advertising and do not sell it.
- **Without an account.** Nothing. freeLN runs entirely client-side; no account, no upload.

## Why we collect it

To operate your account, process optional support payments, reply to your messages, secure the
service, understand and improve how the product is used, and comply with legal obligations.

## Who we share it with

We don't sell your data. It is processed by the vendors ("subprocessors") that run the service:

| Subprocessor | Purpose | Data |
|---|---|---|
| Supabase | Database, authentication | Account info |
| Stripe | Payment processing | Billing info (not card numbers) |
| Google | Sign-in | Name, email, profile picture |
| Fly.io / Render | Backend hosting | All of the above, in transit/at rest |
| Vercel | Frontend hosting (CDN) | None of your account data, static assets only |

## Cross-border data transfer

Some of these subprocessors, including Supabase and Stripe, may process or store data in the
United States. By signing in or setting up a support payment, you consent to this transfer. We select
subprocessors that maintain appropriate safeguards.

## How we protect it

Connections are encrypted in transit (TLS). Your notebook never reaches our servers, so the
most sensitive thing you have stays entirely with you. The account data we do hold is limited
to what is listed above. If a breach occurs that affects your personal information, we will
notify affected account holders and the relevant authorities as required by applicable law.

## How long we keep it

We keep account data for as long as your account is active, plus a reasonable period after
cancellation in case you want to reactivate. You can request deletion at any time (see Your
rights, below). Your notebook lives on your device, so keeping, exporting, or deleting it is
in your hands; under GMP-style record-keeping, your lab may have its own retention obligations
for that content.

## Your rights

You can ask us to access, correct, delete, or export your personal information, or withdraw
consent, by emailing **privacy@sci-arch.ca**. If you are in the EU, you have equivalent rights
under the GDPR. If you are a California resident, you have equivalent rights under the CCPA.
If you're not satisfied with our response, Canadian residents may complain to the
[Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca).

## Cookies and analytics

We use essential cookies to keep you signed in. For signed-in account holders, we may use
first-party account and usage data to understand how the product is used and improve it. We do
not run third-party advertising trackers and do not sell your data. If we add third-party
analytics, we'll update this policy and ask for consent first.

## Children

sci-arch is not directed at children under 16. We don't knowingly collect their information.

## Changes to this policy

We'll update the "last updated" date above and, for material changes, notify account holders by
email.

## A note on what this policy is not

This is a plain-language founder policy, written to be honest about a small, solo-run company.
It is not a substitute for legal advice, and it may be updated as sci-arch grows.
`;
