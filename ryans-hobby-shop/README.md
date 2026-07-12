# Ryan's Online Hobby Shop — Canadian-rail payment reference implementation

A small, real storefront that collects payment over a **Canadian account-to-account rail
(Interac e‑Transfer "Request Money")** instead of a card network — **no card, no interchange fee.**

It sells Ryan's personal Magic collection (logged batch‑by‑batch) plus handmade goods (masks, clothing),
with **pickup in Toronto** or **shipping within Canada**. Prices in CAD.

This exists to be the clickable demo attached to the pitch in
[`../scratchpad/interac-pitch.md`](../scratchpad/interac-pitch.md) — the argument that Canada should let
accredited third parties collect money over a native rail the way US developers already can. The demo is
the easy 5% of that; the hard 95% the pitch asks for is **accreditation**.

---

## The point: one interface, swappable rail

The storefront talks to a single payment interface. Switching the underlying Canadian rail is a `.env`
change, not a rewrite:

| `PAYMENT_PROVIDER` | Provider | What it does |
| --- | --- | --- |
| `mock` (default) | `MockCanadianRail` | Runs the **full** Interac e‑Transfer Request Money flow end‑to‑end with **zero credentials**, including a **real HMAC‑signed webhook** the server verifies. |
| `vopay` | `VoPayProvider` | The **same flow over the live Interac e‑Transfer rail** via VoPay's sandbox. Sandbox‑ready; fill in credentials. |

The interface every provider implements (`server/payments/`):

```js
name
async requestMoney({ orderId, amountCents, currency, customerEmail, customerName, note })
  // -> { providerRef, status: 'requested', customerInstructions }
verifyWebhook(headers, rawBody)
  // -> { valid, event: { providerRef, orderId, status } }
```

### Honest disclosure (read this before demoing)

- **The default `mock` rail simulates the money movement.** Everything else is real: the checkout, the
  order lifecycle, the webhook, and the HMAC signature verification (the mock signs with the same secret
  the server checks, so the security pattern is demonstrated, not faked). What it does **not** do is move
  actual dollars.
- **`VoPayProvider` is sandbox‑ready but has not been tested against live VoPay.** Standing up a real
  sandbox requires business onboarding (identity, KYC/AML) that can't be scripted. Before going live,
  confirm the exact endpoints, field names, and signature scheme against the current
  [VoPay API v2 docs](https://docs.vopay.com).

Don't tell anyone the mock is moving real money. The value of the demo is that the *integration surface*
is real and tiny — which is exactly the pitch.

---

## Run it

Requires Node 20+.

```bash
cd ryans-hobby-shop
npm install
cp .env.example .env      # optional; sensible defaults work out of the box
npm start                 # -> http://localhost:3000
```

Then:

1. Add a Magic card and a handmade item to the cart.
2. Choose **Pickup in Toronto** (free) or **Ship within Canada** ($15 flat; try a non‑Canada address to
   see it rejected).
3. Enter a name + email and click **Request Interac e‑Transfer**.
4. Watch the order flip to **paid** automatically (~6s, the simulated "customer approved in their bank
   app" webhook), or click **"I approved it in my bank app"** to trigger it immediately for a narrated demo.

### API surface

| Method + path | Purpose |
| --- | --- |
| `GET /api/catalog` | Products + live availability + shipping info |
| `POST /api/checkout` | Validate cart, price server‑side, create order, call `requestMoney` |
| `GET /api/orders/:id` | Order status (frontend polls this) |
| `POST /api/webhooks/payment` | Rail callback; HMAC‑verified, marks order paid |
| `POST /api/dev/approve/:id` | Mock rail only — simulate the customer approving the e‑Transfer |

---

## Logging inventory batch‑by‑batch

Edit [`data/catalog.json`](data/catalog.json) and add one object per item. Magic items carry an optional
`card` block; handmade items omit it.

```jsonc
{
  "id": "mtg-2026-08-a-001",      // unique
  "category": "magic",            // "magic" | "handmade"
  "title": "Serra Angel",
  "description": "…",
  "priceCents": 3500,             // integer cents, CAD
  "quantity": 1,                  // stock; paid orders decrement availability
  "batch": "2026-08-A",           // your own batch label
  "images": ["/assets/card.svg"],
  "card": { "set": "8th Edition", "condition": "NM", "foil": true, "rarity": "Rare" }
}
```

Restart the server to pick up catalog changes.

---

## Going live on the real rail

1. Onboard with an Interac e‑Transfer aggregator (e.g. VoPay or Paysafe) and get **sandbox** credentials.
2. Set in `.env`:
   ```
   PAYMENT_PROVIDER=vopay
   PUBLIC_ORIGIN=https://your-public-host      # must be reachable by the rail for webhooks
   VOPAY_API_BASE=…  VOPAY_ACCOUNT_ID=…  VOPAY_API_KEY=…  VOPAY_SHARED_SECRET=…
   ```
3. Verify `requestMoney` params, the request‑money endpoint, and the webhook signature scheme against the
   current VoPay docs (`server/payments/vopay.js` has TODO‑style notes at each point to confirm).
4. Nothing else changes — same storefront, routes, order logic, and webhook handler.

> Moving other people's money in Canada also requires registering as a Payment Service Provider with the
> **Bank of Canada** under the Retail Payments Activities Act. That — not the code — is the real work, and
> it's precisely what the pitch asks to streamline for Canadian builders.

---

## Extracting this into its own repository

The parent repo has no workspaces, so this folder is fully self‑contained (its own `package.json`, no
shared lockfile). To lift it out:

```bash
# from the repo root
cp -r ryans-hobby-shop /path/to/ryans-hobby-shop
cd /path/to/ryans-hobby-shop
git init && git add . && git commit -m "Ryan's Hobby Shop — Canadian-rail storefront"
# create the empty GitHub repo, then:
git remote add origin git@github.com:<you>/ryans-hobby-shop.git
git push -u origin main
```

Nothing references the parent project, so no rewiring is needed.

---

## Project layout

```
ryans-hobby-shop/
  server/
    index.js            # Express app: static + JSON API + webhook
    catalog.js          # load/validate catalog.json, live availability
    orders.js           # order store (in-memory + JSON persistence)
    shipping.js         # Toronto pickup (free) / Canada flat rate; rejects non-Canada
    payments/
      index.js          # getProvider() factory
      mock.js           # MockCanadianRail — full flow, no creds, signed self-webhook
      vopay.js          # VoPayProvider — real Request Money shape, sandbox-ready
  public/               # storefront (vanilla HTML/CSS/JS) + placeholder SVG art
  data/catalog.json     # inventory — edit to log batches
```
