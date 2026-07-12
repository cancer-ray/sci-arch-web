// Loads and validates data/catalog.json. Ryan logs new inventory by editing that file (one object per
// item); this module is the single reader so the rest of the app never touches the raw JSON.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');

function validate(catalog) {
  if (!catalog || !Array.isArray(catalog.products)) {
    throw new Error('catalog.json must have a "products" array');
  }
  const ids = new Set();
  for (const p of catalog.products) {
    if (!p.id) throw new Error('every product needs an id');
    if (ids.has(p.id)) throw new Error(`duplicate product id: ${p.id}`);
    ids.add(p.id);
    if (typeof p.priceCents !== 'number' || p.priceCents < 0) {
      throw new Error(`product ${p.id} needs a non-negative integer priceCents`);
    }
    if (typeof p.quantity !== 'number' || p.quantity < 0) {
      throw new Error(`product ${p.id} needs a non-negative integer quantity`);
    }
  }
  return catalog;
}

export function loadCatalog() {
  const raw = readFileSync(CATALOG_PATH, 'utf8');
  return validate(JSON.parse(raw));
}

// A live inventory view: catalog quantities minus units already committed to paid orders.
export function buildCatalogView(catalog, soldCounts) {
  return {
    shop: catalog.shop,
    products: catalog.products.map((p) => {
      const sold = soldCounts.get(p.id) || 0;
      const available = Math.max(0, p.quantity - sold);
      return { ...p, available, soldOut: available === 0 };
    }),
  };
}

export function findProduct(catalog, id) {
  return catalog.products.find((p) => p.id === id);
}
