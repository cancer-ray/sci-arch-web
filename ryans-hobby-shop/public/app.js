// Ryan's Hobby Shop — storefront client.
// Renders the catalog, manages a cart, posts checkout, then polls order status until the Interac
// e-Transfer is approved.

const state = {
  catalog: null,
  cart: new Map(), // id -> qty
  filter: 'all',
  pollTimer: null,
};

const $ = (sel) => document.querySelector(sel);
const money = (cents, currency = 'CAD') =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format((cents || 0) / 100);

// ---- Load catalog --------------------------------------------------------------------------------
async function loadCatalog() {
  const res = await fetch('/api/catalog');
  state.catalog = await res.json();
  $('#shop-name').textContent = state.catalog.shop.name;
  $('#shop-tagline').textContent = state.catalog.shop.tagline || '';
  $('#rail-mode').textContent =
    state.catalog && state.catalog.rail ? '' : ''; // rail label set on checkout response
  renderCatalog();
}

function productById(id) {
  return state.catalog.products.find((p) => p.id === id);
}

// ---- Render catalog ------------------------------------------------------------------------------
function renderCatalog() {
  const grid = $('#catalog');
  const items = state.catalog.products.filter(
    (p) => state.filter === 'all' || p.category === state.filter
  );
  grid.innerHTML = items
    .map((p) => {
      const inCart = state.cart.get(p.id) || 0;
      const canAdd = inCart < p.available;
      const cardMeta = p.card
        ? `${p.card.set} · ${p.card.condition}${p.card.foil ? ' · Foil' : ''}`
        : 'Handmade';
      const foilBadge = p.card && p.card.foil ? '<span class="badge foil">Foil</span>' : '';
      const catBadge = `<span class="badge">${p.category === 'magic' ? 'Magic' : 'Handmade'}</span>`;
      return `
      <article class="card">
        <img src="${p.images && p.images[0] ? p.images[0] : '/assets/clothing.svg'}" alt="${escapeHtml(p.title)}" />
        <div class="card-body">
          <div>${catBadge} ${foilBadge}</div>
          <div class="card-title">${escapeHtml(p.title)}</div>
          <div class="card-meta">${escapeHtml(cardMeta)}</div>
          <div class="card-meta">${escapeHtml(p.description || '')}</div>
          <div class="card-foot">
            <span class="price">${money(p.priceCents, p.currency)}</span>
            ${
              p.soldOut
                ? '<span class="soldout">Sold out</span>'
                : `<button class="add-btn" data-add="${p.id}" ${canAdd ? '' : 'disabled'}>
                     ${canAdd ? 'Add to cart' : 'Max in cart'}
                   </button>`
            }
          </div>
        </div>
      </article>`;
    })
    .join('');
}

// ---- Cart ----------------------------------------------------------------------------------------
function cartCount() {
  let n = 0;
  for (const q of state.cart.values()) n += q;
  return n;
}
function subtotalCents() {
  let sum = 0;
  for (const [id, qty] of state.cart) sum += productById(id).priceCents * qty;
  return sum;
}
function shippingCents() {
  return $('input[name="fulfillment"]:checked').value === 'ship' && state.cart.size > 0
    ? state.catalog.shipping.flatCents
    : 0;
}

function addToCart(id) {
  const p = productById(id);
  const cur = state.cart.get(id) || 0;
  if (cur < p.available) state.cart.set(id, cur + 1);
  syncCart();
}
function setQty(id, qty) {
  const p = productById(id);
  const clamped = Math.max(0, Math.min(qty, p.available));
  if (clamped === 0) state.cart.delete(id);
  else state.cart.set(id, clamped);
  syncCart();
}

function syncCart() {
  $('#cart-count').textContent = cartCount();
  renderCatalog();
  renderCart();
}

function renderCart() {
  const linesEl = $('#cart-lines');
  const empty = $('#cart-empty');
  if (state.cart.size === 0) {
    linesEl.innerHTML = '';
    empty.hidden = false;
  } else {
    empty.hidden = true;
    linesEl.innerHTML = [...state.cart.entries()]
      .map(([id, qty]) => {
        const p = productById(id);
        return `
        <div class="cart-line">
          <img src="${p.images && p.images[0] ? p.images[0] : '/assets/clothing.svg'}" alt="" />
          <div>
            <div class="cl-title">${escapeHtml(p.title)}</div>
            <div class="cl-meta">${money(p.priceCents, p.currency)} each</div>
          </div>
          <div class="qty">
            <button data-dec="${id}" aria-label="Decrease">−</button>
            <span>${qty}</span>
            <button data-inc="${id}" aria-label="Increase">+</button>
          </div>
        </div>`;
      })
      .join('');
  }
  const sub = subtotalCents();
  const ship = shippingCents();
  $('#sum-subtotal').textContent = money(sub);
  $('#sum-shipping').textContent = money(ship);
  $('#sum-total').textContent = money(sub + ship);
  updateCheckoutEnabled();
}

function updateCheckoutEnabled() {
  const hasItems = state.cart.size > 0;
  const hasCustomer = $('#cust-name').value.trim() && $('#cust-email').value.trim();
  $('#checkout-btn').disabled = !(hasItems && hasCustomer);
}

// ---- Drawer / steps ------------------------------------------------------------------------------
function openDrawer() {
  $('#drawer').hidden = false;
  showStep('cart');
  renderCart();
}
function closeDrawer() {
  $('#drawer').hidden = true;
  if (state.pollTimer) clearInterval(state.pollTimer);
}
function showStep(step) {
  $('#cart-view').hidden = step !== 'cart';
  $('#pending-view').hidden = step !== 'pending';
  $('#paid-view').hidden = step !== 'paid';
  $('#drawer-title').textContent =
    step === 'cart' ? 'Your cart' : step === 'pending' ? 'Almost there' : 'Order complete';
}

// ---- Checkout ------------------------------------------------------------------------------------
async function checkout() {
  const err = $('#checkout-error');
  err.hidden = true;

  const method = $('input[name="fulfillment"]:checked').value;
  const fulfillment = { method };
  if (method === 'ship') {
    fulfillment.address = {
      name: $('#ship-name').value.trim(),
      line1: $('#ship-line1').value.trim(),
      city: $('#ship-city').value.trim(),
      province: $('#ship-province').value,
      postalCode: $('#ship-postal').value.trim(),
      country: 'CA',
    };
  }

  const payload = {
    items: [...state.cart.entries()].map(([id, qty]) => ({ id, qty })),
    fulfillment,
    customer: { name: $('#cust-name').value.trim(), email: $('#cust-email').value.trim() },
  };

  $('#checkout-btn').disabled = true;
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      err.textContent = data.error || 'Checkout failed.';
      err.hidden = false;
      $('#checkout-btn').disabled = false;
      return;
    }
    $('#rail-mode').textContent = `rail: ${data.rail}`;
    $('#pending-instructions').textContent = data.customerInstructions;
    showStep('pending');
    pollOrder(data.orderId);
  } catch (e) {
    err.textContent = 'Network error. Please try again.';
    err.hidden = false;
    $('#checkout-btn').disabled = false;
  }
}

function pollOrder(orderId) {
  state.currentOrderId = orderId;
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.status === 'paid') {
        clearInterval(state.pollTimer);
        onPaid(data);
      }
    } catch {
      /* keep polling */
    }
  }, 1500);
}

function onPaid(order) {
  const method = order.fulfillment && order.fulfillment.method;
  const fulfilLine =
    method === 'pickup'
      ? 'Pickup in Toronto — Ryan will email you a time.'
      : 'Shipping within Canada — tracking to follow by email.';
  $('#paid-summary').innerHTML =
    `Order <strong>#${order.orderId}</strong> · ${money(order.totalCents, order.currency)}<br />${fulfilLine}`;
  // Refresh catalog so sold inventory updates.
  loadCatalog();
  showStep('paid');
}

async function simulateApproval() {
  if (!state.currentOrderId) return;
  $('#simulate-btn').disabled = true;
  try {
    await fetch(`/api/dev/approve/${state.currentOrderId}`, { method: 'POST' });
    // The webhook will flip the order; the poller picks it up.
  } finally {
    $('#simulate-btn').disabled = false;
  }
}

// ---- Utils ---------------------------------------------------------------------------------------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---- Events --------------------------------------------------------------------------------------
document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) return addToCart(add.dataset.add);
  const inc = e.target.closest('[data-inc]');
  if (inc) return setQty(inc.dataset.inc, (state.cart.get(inc.dataset.inc) || 0) + 1);
  const dec = e.target.closest('[data-dec]');
  if (dec) return setQty(dec.dataset.dec, (state.cart.get(dec.dataset.dec) || 0) - 1);
  const chip = e.target.closest('.chip');
  if (chip) {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.filter = chip.dataset.filter;
    renderCatalog();
  }
});

$('#cart-btn').addEventListener('click', openDrawer);
$('#drawer-close').addEventListener('click', closeDrawer);
$('#drawer-scrim').addEventListener('click', closeDrawer);
$('#done-btn').addEventListener('click', () => {
  state.cart.clear();
  syncCart();
  closeDrawer();
});
$('#checkout-btn').addEventListener('click', checkout);
$('#simulate-btn').addEventListener('click', simulateApproval);
$('#cust-name').addEventListener('input', updateCheckoutEnabled);
$('#cust-email').addEventListener('input', updateCheckoutEnabled);
document.querySelectorAll('input[name="fulfillment"]').forEach((r) =>
  r.addEventListener('change', () => {
    $('#ship-fields').hidden = $('input[name="fulfillment"]:checked').value !== 'ship';
    renderCart();
  })
);

loadCatalog();
