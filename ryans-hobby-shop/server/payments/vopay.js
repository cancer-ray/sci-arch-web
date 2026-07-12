// VoPayProvider — the SAME flow as the mock, over the real Interac e-Transfer rail via VoPay.
//
// STATUS: sandbox-ready, NOT tested against live VoPay. Standing up a real VoPay sandbox requires
// business onboarding (identity, KYC/AML) that can't be scripted here — see README "Going live". This
// file exists to prove the point of the pitch: turning the mock into a live Canadian rail is an .env
// change plus filling in credentials, not a re-architecture. The storefront, routes, order logic and
// webhook handling are all identical — only this object changes.
//
// Before going live, confirm the exact endpoint paths, field names, and signature scheme against the
// current VoPay API v2 docs (https://docs.vopay.com). The shapes below follow VoPay's documented
// signature auth (SHA1 of ApiKey + SharedSecret + date) and Request Money model.

import crypto from 'node:crypto';

function utcDate() {
  // VoPay's validation key is the current UTC date, YYYY-MM-DD.
  return new Date().toISOString().slice(0, 10);
}

function vopaySignature(apiKey, sharedSecret) {
  // Signature = SHA1( ApiKey + SharedSecret + YYYY-MM-DD ). Confirm against current docs before live use.
  return crypto
    .createHash('sha1')
    .update(`${apiKey}${sharedSecret}${utcDate()}`)
    .digest('hex');
}

export class VoPayProvider {
  constructor(config) {
    this.name = 'vopay';
    this.config = config;
    const missing = ['vopayAccountId', 'vopayApiKey', 'vopaySharedSecret'].filter(
      (k) => !config[k]
    );
    if (missing.length) {
      throw new Error(
        `VoPayProvider is missing credentials: ${missing.join(', ')}. ` +
          `Set VOPAY_ACCOUNT_ID / VOPAY_API_KEY / VOPAY_SHARED_SECRET, or use PAYMENT_PROVIDER=mock.`
      );
    }
    this.base = config.vopayApiBase || 'https://earthnode-dev.vopay.com/api/v2';
    this.fetch = globalThis.fetch;
  }

  authFields() {
    return {
      AccountID: this.config.vopayAccountId,
      Key: this.config.vopayApiKey,
      Signature: vopaySignature(this.config.vopayApiKey, this.config.vopaySharedSecret),
    };
  }

  async requestMoney({ orderId, amountCents, currency, customerEmail, customerName, note }) {
    // VoPay "Request Money": we ask a customer to send an Interac e-Transfer; they approve in their bank.
    const body = {
      ...this.authFields(),
      Amount: (amountCents / 100).toFixed(2),
      Currency: currency || 'CAD',
      RecipientEmail: customerEmail,
      RecipientName: customerName,
      // Our order id round-trips so the webhook can be matched back to the order.
      ClientReferenceNumber: String(orderId),
      NotificationURL: `${this.config.publicOrigin}/api/webhooks/payment`,
      Notes: note || `Ryan's Hobby Shop order ${orderId}`,
    };

    const res = await this.fetch(`${this.base}/account/request-money`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    // VoPay returns Success: true and a TransactionID on success (field names per current docs).
    if (!res.ok || data.Success === false) {
      throw new Error(
        `VoPay request-money failed: ${data.ErrorMessage || res.status || 'unknown error'}`
      );
    }

    return {
      providerRef: String(data.TransactionID || data.ClientReferenceNumber || orderId),
      status: 'requested',
      customerInstructions:
        `Check your email (${customerEmail}) or your banking app for an Interac e-Transfer ` +
        `request from Ryan's Hobby Shop, and approve it to complete your order.`,
    };
  }

  verifyWebhook(headers, rawBody) {
    // VoPay signs notifications; validate before trusting. Confirm the exact header + scheme in the docs.
    const provided = headers['x-vopay-signature'] || headers['x-signature'];
    if (!provided) return { valid: false };

    const expected = crypto
      .createHmac('sha256', this.config.vopaySharedSecret)
      .update(rawBody)
      .digest('hex');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false };
    }

    let event;
    try {
      const parsed = JSON.parse(rawBody);
      const status = String(parsed.TransactionStatus || parsed.status || '').toLowerCase();
      event = {
        providerRef: String(parsed.TransactionID || parsed.providerRef || ''),
        orderId: parsed.ClientReferenceNumber || parsed.orderId,
        // Normalize VoPay's status vocabulary onto ours.
        status: ['successful', 'completed', 'paid'].includes(status) ? 'paid' : status,
      };
    } catch {
      return { valid: false };
    }
    return { valid: true, event };
  }
}
