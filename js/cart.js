/* ═══════════════════════════════════════════════════════════════════════════
   ORDER BASKET  (menu page)

   Holds the order, offers pickup or delivery, suggests small plates that go
   with what is already in the basket, and hands the finished order to the
   restaurant by phone or email.

   It does NOT take payment. Card payment needs a server and a payment
   processor; see the note at the bottom of this file.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

var $  = function (s, c) { return (c || document).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

var panel = $('#cart');
if (!panel) return;

var KEY  = 'sakura.order.v1';
var S = window.SAKURA || {};
var money = function (n) { return '$' + n.toFixed(2); };

/* ── state ──────────────────────────────────────────────────────────────── */
var state = { mode: 'pickup', items: [] };
try {
  var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && Array.isArray(saved.items)) state = saved;
} catch (e) { /* corrupt or unavailable storage — start clean */ }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}
function count() {
  return state.items.reduce(function (n, it) { return n + it.qty; }, 0);
}
function subtotal() {
  return state.items.reduce(function (n, it) { return n + it.qty * it.price; }, 0);
}

function add(id, name, price) {
  var found = null;
  for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) found = state.items[i];
  if (found) found.qty++;
  else state.items.push({ id: id, name: name, price: price, qty: 1 });
  save(); render();
}
function setQty(id, qty) {
  state.items = state.items.filter(function (it) {
    if (it.id !== id) return true;
    it.qty = qty;
    return qty > 0;
  });
  save(); render();
}

/* ── upsell: small plates that round out what is already there ───────────── */
function suggestions() {
  var pool = window.SAKURA_UPSELL || [];
  if (!pool.length || !state.items.length) return [];
  var have = {};
  state.items.forEach(function (it) { have[it.id] = 1; });
  var kinds = { side: 0, sweet: 0, drink: 0 };
  pool.forEach(function (p) { if (have[p.id]) kinds[p.kind]++; });

  /* prefer a category the basket has none of — a sweet if there is no sweet,
     a drink if there is no drink — so the suggestion adds rather than repeats */
  var order = ['side', 'sweet', 'drink'].sort(function (a, b) { return kinds[a] - kinds[b]; });
  var out = [];
  order.forEach(function (kind) {
    pool.filter(function (p) { return p.kind === kind && !have[p.id]; })
        .slice(0, 2)
        .forEach(function (p) { if (out.length < 3) out.push(p); });
  });
  out = out.slice(0, 3);

  /* a drink travels better than anything else on the list, so make sure one is
     always offered rather than leaving it to the scarcity ordering */
  var hasDrink = out.some(function (p) { return p.kind === 'drink'; });
  if (!hasDrink) {
    var drink = pool.filter(function (p) { return p.kind === 'drink' && !have[p.id]; })[0];
    if (drink) { out.length = Math.min(out.length, 2); out.push(drink); }
  }
  return out;
}

/* ── render ─────────────────────────────────────────────────────────────── */
var bar = $('#cartBar'), linesEl = $('#cartLines'), emptyEl = $('#cartEmpty');
var upWrap = $('#cartUp'), upGrid = $('#cartUpGrid'), modeNote = $('#cartModeNote');

function render() {
  var n = count(), sub = subtotal();

  if (bar) bar.hidden = n === 0;
  var cc = $('#cartCount'); if (cc) cc.textContent = n;
  var ct = $('#cartTotal'); if (ct) ct.textContent = money(sub);
  var cs = $('#cartSub');   if (cs) cs.textContent = money(sub);

  linesEl.innerHTML = '';
  state.items.forEach(function (it) {
    var li = document.createElement('li');
    li.className = 'cline';
    li.innerHTML =
      '<div class="cline__main"><span class="cline__name"></span>' +
      '<span class="cline__each"></span></div>' +
      '<div class="cline__qty">' +
        '<button type="button" data-less aria-label="One fewer">&minus;</button>' +
        '<span>' + it.qty + '</span>' +
        '<button type="button" data-more aria-label="One more">+</button>' +
      '</div>' +
      '<span class="cline__sum">' + money(it.qty * it.price) + '</span>';
    li.querySelector('.cline__name').textContent = it.name;
    li.querySelector('.cline__each').textContent = money(it.price) + ' each';
    li.querySelector('[data-less]').addEventListener('click', function () { setQty(it.id, it.qty - 1); });
    li.querySelector('[data-more]').addEventListener('click', function () { setQty(it.id, it.qty + 1); });
    linesEl.appendChild(li);
  });
  if (emptyEl) emptyEl.hidden = n > 0;

  var sug = suggestions();
  if (upWrap) upWrap.hidden = sug.length === 0;
  if (upGrid) {
    upGrid.innerHTML = '';
    sug.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'upitem';
      b.setAttribute('data-cursor', 'link');
      b.innerHTML = '<span class="upitem__name"></span><span class="upitem__price">' +
                    money(+p.price) + '</span><em aria-hidden="true">+</em>';
      b.querySelector('.upitem__name').textContent = p.name;
      b.addEventListener('click', function () { add(p.id, p.name, +p.price); });
      upGrid.appendChild(b);
    });
  }

  $$('.cart__mode button').forEach(function (b) {
    b.classList.toggle('is-on', b.dataset.mode === state.mode);
    b.setAttribute('aria-pressed', b.dataset.mode === state.mode ? 'true' : 'false');
  });
  if (modeNote) {
    modeNote.textContent = state.mode === 'delivery'
      ? (S.delivery || 'Delivery hours apply') + '. We will confirm the address and time when you call.'
      : 'Collect from ' + (S.address || 'the restaurant') + '.';
  }

  var mail = $('#cartEmail');
  if (mail) mail.setAttribute('href', mailto());
}

function orderText() {
  var lines = state.items.map(function (it) {
    return it.qty + ' x ' + it.name + '  ' + money(it.qty * it.price);
  });
  return [
    (state.mode === 'delivery' ? 'DELIVERY' : 'PICKUP') + ' order',
    '',
    lines.join('\n'),
    '',
    'Subtotal: ' + money(subtotal()),
    '(tax added by the restaurant on confirmation)',
    '',
    state.mode === 'delivery'
      ? 'Delivery to: \n\nPreferred time: '
      : 'Pickup from ' + (S.address || ''),
    '',
    'Name: \nPhone: '
  ].join('\n');
}
function mailto() {
  return 'mailto:' + (S.email || '') +
    '?subject=' + encodeURIComponent('Online order — ' + (state.mode === 'delivery' ? 'delivery' : 'pickup')) +
    '&body=' + encodeURIComponent(orderText());
}

/* ── open / close ───────────────────────────────────────────────────────── */
var lastFocus = null;
function open() {
  lastFocus = document.activeElement;
  panel.hidden = false;
  panel.offsetHeight;
  panel.classList.add('is-open');
  document.documentElement.classList.add('is-locked');
  var close = $('#cartClose'); if (close) close.focus();
}
function close() {
  panel.classList.remove('is-open');
  document.documentElement.classList.remove('is-locked');
  setTimeout(function () { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 500);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
var openBtn = $('#cartOpen'); if (openBtn) openBtn.addEventListener('click', open);
var closeBtn = $('#cartClose'); if (closeBtn) closeBtn.addEventListener('click', close);
var scrim = $('#cartScrim'); if (scrim) scrim.addEventListener('click', close);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
});

$$('.cart__mode button').forEach(function (b) {
  b.addEventListener('click', function () { state.mode = b.dataset.mode; save(); render(); });
});

/* ── add buttons on every dish ──────────────────────────────────────────── */
$$('.mi__add').forEach(function (b) {
  b.addEventListener('click', function () {
    add(b.dataset.id, b.dataset.name, parseFloat(b.dataset.price));
    b.classList.add('is-added');
    setTimeout(function () { b.classList.remove('is-added'); }, 700);
  });
});

render();

/* ── Taking card payment from here ──────────────────────────────────────────
   Everything above runs in the browser, which is why it stops at handing the
   order over. To charge a card you need a server: POST the basket to an
   endpoint, have it re-price the items from data/menu.json (never trust prices
   from the browser), create a Stripe Checkout Session, and redirect to it.
   Stripe's webhook then confirms the order to the restaurant.
   ───────────────────────────────────────────────────────────────────────── */
})();
