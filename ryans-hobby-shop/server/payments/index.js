// Payment-provider factory.
//
// This is the whole argument of the reference implementation: the storefront talks to ONE interface,
// and swapping the Canadian payment rail is swapping the object returned here — nothing else changes.
//
//   PAYMENT_PROVIDER=mock   -> MockCanadianRail  (runs the full Interac e-Transfer Request Money flow
//                                                 end-to-end with zero credentials)
//   PAYMENT_PROVIDER=vopay  -> VoPayProvider     (the same flow over the real Interac e-Transfer rail
//                                                 via VoPay's sandbox — a .env change, not a rewrite)
//
// Every provider implements:
//   name: string
//   async requestMoney({ orderId, amountCents, currency, customerEmail, customerName, note })
//        -> { providerRef, status: 'requested', customerInstructions }
//   verifyWebhook(headers, rawBody)
//        -> { valid: boolean, event?: { providerRef, orderId, status } }

import { MockCanadianRail } from './mock.js';
import { VoPayProvider } from './vopay.js';

export function getProvider(config, deps) {
  const which = (config.paymentProvider || 'mock').toLowerCase();
  switch (which) {
    case 'vopay':
      return new VoPayProvider(config);
    case 'mock':
      return new MockCanadianRail(config, deps);
    default:
      throw new Error(
        `Unknown PAYMENT_PROVIDER "${which}". Use "mock" (default) or "vopay".`
      );
  }
}
