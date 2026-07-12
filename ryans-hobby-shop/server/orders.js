// In-memory order store with best-effort JSON persistence to data/orders.json (gitignored).
// A real deployment would use a database; this keeps the reference implementation dependency-free while
// still surviving a dev restart. Orders also back the live inventory count (paid units reduce stock).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_PATH = path.join(__dirname, '..', 'data', 'orders.json');

export class OrderStore {
  constructor() {
    this.orders = new Map();
    this.byProviderRef = new Map();
    this._load();
  }

  _load() {
    if (!existsSync(ORDERS_PATH)) return;
    try {
      const arr = JSON.parse(readFileSync(ORDERS_PATH, 'utf8'));
      for (const o of arr) {
        this.orders.set(o.id, o);
        if (o.providerRef) this.byProviderRef.set(o.providerRef, o.id);
      }
    } catch {
      // Corrupt/empty file — start fresh rather than crash.
    }
  }

  _persist() {
    try {
      writeFileSync(ORDERS_PATH, JSON.stringify([...this.orders.values()], null, 2));
    } catch {
      // Persistence is best-effort; never fail a request because we couldn't write the file.
    }
  }

  create(order) {
    const id = crypto.randomBytes(4).toString('hex').toUpperCase();
    const record = { id, status: 'awaiting_payment', createdAt: new Date().toISOString(), ...order };
    this.orders.set(id, record);
    this._persist();
    return record;
  }

  get(id) {
    return this.orders.get(id) || null;
  }

  attachProviderRef(id, providerRef) {
    const order = this.orders.get(id);
    if (!order) return;
    order.providerRef = providerRef;
    this.byProviderRef.set(providerRef, id);
    this._persist();
  }

  markPaid(id) {
    const order = this.orders.get(id);
    if (!order) return null;
    if (order.status !== 'paid') {
      order.status = 'paid';
      order.paidAt = new Date().toISOString();
      this._persist();
    }
    return order;
  }

  findByProviderRef(ref) {
    const id = this.byProviderRef.get(ref);
    return id ? this.orders.get(id) : null;
  }

  // Units committed to paid orders, per product id — feeds the live inventory view.
  soldCounts() {
    const counts = new Map();
    for (const o of this.orders.values()) {
      if (o.status !== 'paid') continue;
      for (const item of o.items) {
        counts.set(item.id, (counts.get(item.id) || 0) + item.qty);
      }
    }
    return counts;
  }
}
