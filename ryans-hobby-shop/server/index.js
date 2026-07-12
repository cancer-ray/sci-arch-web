// Ryan's Online Hobby Shop — server.
//
// Serves the storefront and a small JSON API. The payment step goes through a pluggable Canadian rail
// (see server/payments/): the mock rail runs the full Interac e-Transfer Request Money flow with no
// credentials; PAYMENT_PROVIDER=vopay switches to the live rail with no other change.

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadCatalog, buildCatalogView, findProduct } from './catalog.js';
import { OrderStore } from './orders.js';
import { resolveFulfillment, shippingInfo } from './shipping.js';
import { getProvider } from './payments/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  port: Number(process.env.PORT || 3000),
  publicOrigin: process.env.PUBLIC_ORIGIN || `http://localhost:${process.env.PORT || 3000}`,
  webhookSecret: process.env.WEBHOOK_SECRET || 'dev-webhook-secret-change-me',
  mockApprovalDelayMs: Number(process.env.MOCK_APPROVAL_DELAY_MS ?? 6000),
  shopName: "Ryan's Hobby Shop",
  vopayApiBase: process.env.VOPAY_API_BASE,
  vopayAccountId: process.env.VOPAY_ACCOUNT_ID,
  vopayApiKey: process.env.VOPAY_API_KEY,
  vopaySharedSecret: process.env.VOPAY_SHARED_SECRET,
};

const catalog = loadCatalog();
const orders = new OrderStore();
const provider = getProvider(config, { fetch: globalThis.fetch });

const app = express();

// Capture the raw body for webhook signature verification (signatures are over exact bytes), while
// still parsing JSON for every route.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// ---- Catalog -------------------------------------------------------------------------------------
app.get('/api/catalog', (_req, res) => {
  res.json({ ...buildCatalogView(catalog, orders.soldCounts()), shipping: shippingInfo });
});

// ---- Checkout ------------------------------------------------------------------------------------
app.post('/api/checkout', async (req, res) => {
  try {
    const { items, fulfillment, customer } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }
    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    // Validate the fulfillment choice + compute shipping.
    const fulfilled = resolveFulfillment(fulfillment);
    if (!fulfilled.ok) {
      return res.status(400).json({ error: fulfilled.error });
    }

    // Validate each line against the catalog and live availability; price server-side (never trust the client).
    const sold = orders.soldCounts();
    const lines = [];
    let subtotalCents = 0;
    for (const item of items) {
      const product = findProduct(catalog, item.id);
      if (!product) {
        return res.status(400).json({ error: `Unknown item: ${item.id}` });
      }
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ error: `Invalid quantity for ${product.title}.` });
      }
      const available = product.quantity - (sold.get(product.id) || 0);
      if (qty > available) {
        return res
          .status(409)
          .json({ error: `Only ${available} of "${product.title}" left.` });
      }
      subtotalCents += product.priceCents * qty;
      lines.push({ id: product.id, title: product.title, qty, priceCents: product.priceCents });
    }

    const totalCents = subtotalCents + fulfilled.shippingCents;

    const order = orders.create({
      items: lines,
      customer: { name: customer.name, email: customer.email },
      fulfillment,
      subtotalCents,
      shippingCents: fulfilled.shippingCents,
      totalCents,
      currency: catalog.shop.currency || 'CAD',
    });

    // Ask the Canadian rail to collect the money.
    const request = await provider.requestMoney({
      orderId: order.id,
      amountCents: totalCents,
      currency: order.currency,
      customerEmail: customer.email,
      customerName: customer.name,
      note: `Order ${order.id}`,
    });
    orders.attachProviderRef(order.id, request.providerRef);

    res.status(201).json({
      orderId: order.id,
      status: order.status,
      totalCents,
      subtotalCents,
      shippingCents: fulfilled.shippingCents,
      currency: order.currency,
      rail: provider.name,
      customerInstructions: request.customerInstructions,
    });
  } catch (err) {
    console.error('[checkout] error:', err);
    res.status(500).json({ error: 'Checkout failed. Please try again.' });
  }
});

// ---- Order status (frontend polls this) ----------------------------------------------------------
app.get('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({
    orderId: order.id,
    status: order.status,
    totalCents: order.totalCents,
    currency: order.currency,
    fulfillment: order.fulfillment,
    paidAt: order.paidAt || null,
  });
});

// ---- Payment webhook (fired by the rail: mock timer, manual approve, or real VoPay) ---------------
app.post('/api/webhooks/payment', (req, res) => {
  const { valid, event } = provider.verifyWebhook(req.headers, req.rawBody || '');
  if (!valid) {
    return res.status(401).json({ error: 'invalid signature' });
  }

  // Match the event back to an order (by our id or the provider's ref) and mark it paid.
  const order =
    (event.orderId && orders.get(event.orderId)) ||
    (event.providerRef && orders.findByProviderRef(event.providerRef));
  if (!order) {
    return res.status(404).json({ error: 'unknown order' });
  }
  if (event.status === 'paid') {
    orders.markPaid(order.id);
  }
  res.json({ ok: true });
});

// ---- Dev helper: simulate the customer approving the e-Transfer in their bank app ----------------
// Only available on the mock rail; lets you narrate a live demo instead of waiting for the timer.
app.post('/api/dev/approve/:id', async (req, res) => {
  if (provider.name !== 'mock-canadian-rail') {
    return res.status(400).json({ error: 'Manual approval is only available on the mock rail.' });
  }
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  try {
    await provider.fireApprovalWebhook({ orderId: order.id, providerRef: order.providerRef });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Static storefront ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(config.port, () => {
  console.log(
    `Ryan's Hobby Shop running on ${config.publicOrigin}  (rail: ${provider.name})`
  );
});
