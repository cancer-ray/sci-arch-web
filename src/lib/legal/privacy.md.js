// Privacy policy content, kept as markdown so it can be revised without
// touching JSX. PIPEDA-structured (Canada); also covers GDPR/CCPA rights for
// EU/California users. NOT LEGAL ADVICE — have a lawyer review before launch.
export const PRIVACY_MD = `
_Last updated: July 2026_

## The short version

The **free student tool runs entirely in your browser.** Nothing you write or import is
ever uploaded, and we don't know it exists. This policy is mostly about **sci-arch+**, the
cloud product, where you sign in and your notebook lives on our servers.

## Who is responsible for your data

sci-arch is operated by Ryan Lee, sole proprietor, Ontario, Canada. Ryan is also the Privacy
Officer accountable for this policy. Questions or requests: **privacy@sci-arch.ca**.

## What we collect

- **Account information.** Your name, email address, and profile picture, from Google when you
  sign in (via Supabase Auth). We never see or store your Google password.
- **Notebook content** (sci-arch+ only). The entries, versions, and attachments you
  create, plus the audit trail of who changed what and when.
- **Payment information.** Billing is handled by Stripe. We store your Stripe customer ID,
  subscription plan, and seat count, never your card number.
- **Contact-sales information.** If you fill out the sales form: your name, email, organization,
  and message.
- **Server logs.** Standard web-server logs (IP address, timestamps, request paths) kept for
  security and operating the service.
- **Usage and analytics data** (sci-arch+ account holders only). Aggregate information
  about how the service is used, such as which features are opened and how often, to help us
  understand and improve the product. We do not use this for advertising and do not sell it.
- **The free student tool.** Nothing. It runs entirely client-side; no account, no upload.

## Why we collect it

To operate your account and notebook, process payment, respond to sales inquiries, secure the
service, understand and improve how the product is used, and comply with legal obligations.

## Who we share it with

We don't sell your data. It is processed by the vendors ("subprocessors") that run the service:

| Subprocessor | Purpose | Data |
|---|---|---|
| Supabase | Database, authentication, file storage | Account info, notebook content |
| Stripe | Payment processing | Billing info (not card numbers) |
| Google | Sign-in | Name, email, profile picture |
| Fly.io / Render | Backend hosting | All of the above, in transit/at rest |
| Vercel | Frontend hosting (CDN) | None of your account data, static assets only |

## Cross-border data transfer

Some of these subprocessors, including Supabase and Stripe, may process or store data in the
United States. By using the cloud product, you consent to this transfer. We select
subprocessors that maintain appropriate safeguards.

## How we protect it

Connections are encrypted in transit (TLS). Notebook data is protected by row-level security
so only members of your lab can read it. The audit trail is append-only and tamper-evident at
the database layer: even we cannot silently edit or delete it. If a breach occurs that affects
your personal information, we will notify affected account holders and the relevant authorities
as required by applicable law.

## How long we keep it

We keep account and notebook data for as long as your account is active, plus a reasonable
period after cancellation in case you want to reactivate or export. You can request deletion
at any time (see Your rights, below); note that under GMP-style record-keeping, your lab may
have its own retention obligations that apply to notebook content even after you leave.

## Your rights

You can ask us to access, correct, delete, or export your personal information, or withdraw
consent, by emailing **privacy@sci-arch.ca**. If you are in the EU, you have equivalent rights
under the GDPR. If you are a California resident, you have equivalent rights under the CCPA.
If you're not satisfied with our response, Canadian residents may complain to the
[Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca).

## Cookies and analytics

We use essential cookies to keep you signed in. For sci-arch+ account holders, we may use
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
