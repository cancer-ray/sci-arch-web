// MockCanadianRail — a faithful simulation of the Interac e-Transfer "Request Money" flow.
//
// It runs the ENTIRE flow with zero credentials so the demo link works today:
//   1. requestMoney() records the request and returns human instructions, exactly as if the customer
//      had just received an Interac Request Money email / banking-app notification.
//   2. After MOCK_APPROVAL_DELAY_MS it POSTs a REAL HMAC-signed payload to our own /api/webhooks/payment
//      endpoint — simulating the customer approving the request in their bank app and the rail notifying
//      us. The signature is genuine (same scheme verifyWebhook checks), so the security pattern the pitch
//      relies on is demonstrated, not faked.
//   3. verifyWebhook() validates that HMAC.
//
// The ONLY thing not real here is the money movement. Swap in VoPayProvider and steps 1–3 become live
// Interac e-Transfer calls with no change to the storefront, the routes, or the order logic.

import crypto from 'node:crypto';

function sign(secret, rawBody) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

export class MockCanadianRail {
  constructor(config, deps = {}) {
    this.name = 'mock-canadian-rail';
    this.config = config;
    // `fetch` is injected so this is testable and explicit; Node 20+ has global fetch.
    this.fetch = deps.fetch || globalThis.fetch;
  }

  async requestMoney({ orderId, amountCents, currency, customerEmail, customerName, note }) {
    const providerRef = `MOCK-${orderId}`;
    const dollars = (amountCents / 100).toFixed(2);

    // Simulate the rail asynchronously notifying us that the customer approved the request.
    // In production this callback originates from the payment rail, not from us.
    const delay = Number(this.config.mockApprovalDelayMs ?? 6000);
    if (delay >= 0) {
      setTimeout(() => {
        this.fireApprovalWebhook({ orderId, providerRef }).catch((err) => {
          // A demo webhook failing should never crash the process.
          console.error('[mock-rail] simulated webhook failed:', err.message);
        });
      }, delay).unref?.();
    }

    return {
      providerRef,
      status: 'requested',
      customerInstructions:
        `Open your banking app and approve the Interac e-Transfer Request Money for ` +
        `$${dollars} ${currency} from "${this.config.shopName || "Ryan's Hobby Shop"}" ` +
        `(sent to ${customerEmail}). ${note ? note + ' ' : ''}` +
        `This demo auto-approves in ~${Math.round(delay / 1000)}s, or use the “I approved it” button.`,
    };
  }

  // Builds and sends the signed webhook to our own server, mimicking the rail's callback.
  async fireApprovalWebhook({ orderId, providerRef }) {
    const payload = {
      provider: this.name,
      providerRef,
      orderId,
      status: 'paid',
      // A real rail includes its own event id / timestamp; we include a nonce so each webhook differs.
      eventId: crypto.randomUUID(),
    };
    const rawBody = JSON.stringify(payload);
    const signature = sign(this.config.webhookSecret, rawBody);
    const url = `${this.config.publicOrigin}/api/webhooks/payment`;

    const res = await this.fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': signature,
        'x-provider': this.name,
      },
      body: rawBody,
    });
    if (!res.ok) {
      throw new Error(`webhook POST -> ${res.status}`);
    }
  }

  verifyWebhook(headers, rawBody) {
    const provided = headers['x-signature'];
    if (!provided) return { valid: false };

    const expected = sign(this.config.webhookSecret, rawBody);
    // Constant-time compare to avoid leaking the secret via timing.
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false };
    }

    let event;
    try {
      const parsed = JSON.parse(rawBody);
      event = {
        providerRef: parsed.providerRef,
        orderId: parsed.orderId,
        status: parsed.status,
      };
    } catch {
      return { valid: false };
    }
    return { valid: true, event };
  }
}
