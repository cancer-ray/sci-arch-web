// Fulfillment + shipping. Two options only, matching the shop's reality:
//   - pickup: free, in Toronto
//   - ship:   flat rate, anywhere in Canada (no international)

const SHIP_FLAT_CENTS = 1500; // $15 CAD flat shipping within Canada

// Canadian province/territory codes — used to reject out-of-country shipping.
const CANADA_PROVINCES = new Set([
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
]);

// Returns { ok, shippingCents, error }.
export function resolveFulfillment(fulfillment) {
  if (!fulfillment || typeof fulfillment !== 'object') {
    return { ok: false, error: 'fulfillment is required' };
  }

  if (fulfillment.method === 'pickup') {
    return { ok: true, shippingCents: 0 };
  }

  if (fulfillment.method === 'ship') {
    const addr = fulfillment.address || {};
    const province = String(addr.province || '').toUpperCase().trim();
    if (!addr.name || !addr.line1 || !addr.city || !province || !addr.postalCode) {
      return { ok: false, error: 'shipping address requires name, line1, city, province, postalCode' };
    }
    const country = String(addr.country || 'CA').toUpperCase().trim();
    if (country !== 'CA' && country !== 'CANADA') {
      return { ok: false, error: 'Sorry — we only ship within Canada right now.' };
    }
    if (!CANADA_PROVINCES.has(province)) {
      return { ok: false, error: `"${province}" is not a valid Canadian province/territory code.` };
    }
    return { ok: true, shippingCents: SHIP_FLAT_CENTS };
  }

  return { ok: false, error: 'fulfillment.method must be "pickup" or "ship"' };
}

export const shippingInfo = { flatCents: SHIP_FLAT_CENTS, provinces: [...CANADA_PROVINCES] };
