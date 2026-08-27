/* ═══════════════════════════════════════════════════════════════════════
   SAKURA JAPANESE RESTAURANT — SITE DATA
   The only file you need to edit for content. Values flow into the page via
   [data-site="key"] (text) and [data-site-href="tel|mail|map|web|order|
   location|contact|yelp"].

   Sources: the restaurant's own site (sakurawinchesterma.com) for hours and
   à-la-carte prices, the printed All-You-Can-Eat order sheet for buffet
   pricing, and the Google listing for the rating.

   ⚠ Two things are still unconfirmed, marked TODO: the email address and the
   Instagram handle. See also the LUNCH note on the buffet prices below.
   ═══════════════════════════════════════════════════════════════════════ */
window.SAKURA = {
  name:    'Sakura Japanese Restaurant',

  /* ── contact ──────────────────────────────────────────────────────── */
  address: '910 Main St, Winchester, MA 01890',
  phone:   '(781) 721-4608',
  web:     'https://www.sakurawinchesterma.com',
  webLabel:'sakurawinchesterma.com',
  order:   'menu.html',                            // our own menu page
  checkout:'https://www.sakurawinchesterma.com/order',  // the live ordering system
  location:'https://www.sakurawinchesterma.com/locationinfo',
  contact: 'https://www.sakurawinchesterma.com/contact',
  yelp:    'https://www.yelp.com/biz/sakura-japanese-restaurant-winchester',
  map:     'https://www.google.com/maps/search/?api=1&query=Sakura+Japanese+Restaurant+910+Main+St+Winchester+MA+01890',

  /* exact hours, from the Location & Hours page */
  hours:   'Mon  Closed\nTue – Thu  11:30 AM – 10:00 PM\nFri – Sat  11:30 AM – 10:30 PM\nSun  12:30 PM – 10:00 PM',

  /* ── ALL-YOU-CAN-EAT, from the printed order sheet ────────────────────
     TODO the sheet also shows a LUNCH price of $13.95 — confirm whether that
     is a separate lunch rate or the under-10 rate, and add a lunch row here
     if it is its own price. */
  ayceAdult:      '$21.95',
  ayceChild:      '$15.95',
  ayceUnder10:    '$13.95',
  deluxeAdult:    '$31.95',
  deluxeChild:    '$24.95',
  deluxeUnder10:  '$16.95',
  ayceSurcharge:  '+$2 on all prices Friday, Saturday and Sunday, including holidays.',
  deluxeLimit:    'Some items: 1 serving, 2 pcs',
  wastePolicy:    'Please don’t waste food — uneaten items are charged $1 per piece.',

  /* à-la-carte anchors, from the online ordering menu */
  price:        '$20–50 per person',
  priceKitchen: 'Entrées from $10.75',
  priceBoat:    '$37.45 – $101.45',
  delivery:     'Delivery 6:00 – 10:00 PM',

  /* ── from the Google listing ──────────────────────────────────────── */
  rating:  '4.1',
  reviews: '399 Google reviews',

  /* ── TODO confirm with the restaurant ─────────────────────────────── */
  email:   'info@sakurawinchesterma.com',        // TODO real address
  ig:      'https://instagram.com/',             // TODO real handle

  /* ── fine print ───────────────────────────────────────────────────── */
  allergyNote: 'Please tell your server before ordering if anyone in your party has a food allergy.',
  bookingNote: 'This form is a table request, not a confirmed booking — for tonight, please call.'
};

/* ── binding (no need to touch below) ────────────────────────────────── */
(function bind(S) {
  var d = document;
  d.querySelectorAll('[data-site]').forEach(function (el) {
    var v = S[el.getAttribute('data-site')];
    if (v == null) return;
    el.textContent = '';
    String(v).split('\n').forEach(function (line, i) {
      if (i) el.appendChild(d.createElement('br'));
      el.appendChild(d.createTextNode(line));
    });
  });

  var hrefs = {
    tel:      'tel:' + String(S.phone).replace(/[^\d+]/g, ''),
    mail:     'mailto:' + S.email,
    map:      S.map,
    ig:       S.ig,
    web:      S.web,
    order:    S.order,
    checkout: S.checkout,
    location: S.location,
    contact:  S.contact,
    yelp:     S.yelp
  };
  d.querySelectorAll('[data-site-href]').forEach(function (el) {
    var h = hrefs[el.getAttribute('data-site-href')];
    if (h) el.setAttribute('href', h);
  });

  var yr = d.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})(window.SAKURA);
