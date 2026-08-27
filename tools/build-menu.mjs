/* Generate menu.html from data/menu.json.
   The dishes are baked into the markup rather than fetched, so the menu is
   readable with JavaScript off and indexable by search engines. Re-run this
   after editing data/menu.json:  node tools/build-menu.mjs                  */
import fs from 'node:fs';
import path from 'node:path';
import { nav as shellNav, head as shellHead } from './shell.mjs';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'menu.json'), 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* a Japanese label per section, for the same bilingual texture as the main page */
const JP = {
  'appetizers-for-the-kitchen': '前菜', 'appetizers-from-the-sushi-bar': '前菜',
  'soup': '汁物', 'salad': 'サラダ', 'udon': 'うどん', 'tempura-fried': '天ぷら',
  'katsu-cutlet': 'かつ', 'fried-rice': '炒飯', 'house-entree': '定食',
  'teriyaki-entrees': '照り焼き', 'hibachi-entrees': '鉄板焼き',
  'nigiri-cooked': '握り', 'nigiri-uncooked': '握り',
  'rolls-uncooked': '巻物', 'rolls-cooked': '巻物',
  'sakura-special-rolls': '特別巻き', 'party-boat': '舟盛り',
  'lunch-roll-combination': '昼', 'lunch-box': '弁当',
  'lunch-sushi-and-sashimi': '昼', 'hibachi-lunch': '昼',
  'dessert': '甘味', 'beverages': '飲み物'
};

const sections = data.map(sec => ({ ...sec, id: slug(sec.title), jp: JP[slug(sec.title)] || '' }));
const totalDishes = sections.reduce((n, s) => n + s.items.length, 0);


/* "Goes well with" pool — small plates, sweets and drinks pulled from the real
   menu. Suggestions are filtered against what is already in the basket. */
const UPSELL_FROM = {
  'Soup': 'side', 'Salad': 'side',
  'Appetizers for the Kitchen': 'side', 'Appetizers from the Sushi Bar': 'side',
  'Dessert': 'sweet', 'Beverages': 'drink'
};
const upsell = [];
for (const sec of sections) {
  const kind = UPSELL_FROM[sec.title];
  if (!kind) continue;
  for (const it of sec.items.slice(0, 6)) {
    const pr = it.prices[0];
    if (!pr) continue;
    /* nothing frozen: this is the takeout and delivery menu, and ice cream
       will not survive the trip. Cheesecake and fried banana travel fine. */
    if (/ice cream/i.test(it.name)) continue;
    upsell.push({
      id: slug(sec.title) + '-' + (it.n || it.name) + '-0',
      name: it.name, price: pr.p, kind
    });
  }
}

const rail = sections.map(s =>
  `      <a href="#${s.id}" data-cursor="link"><span>${esc(s.title)}</span><em>${s.items.length}</em></a>`
).join('\n');

const body = sections.map(s => {
  const rows = s.items.map((it, i0) => {
    const prices = it.prices.map((pr, pi) => {
      const id = s.id + '-' + (it.n || i0) + (pr.label ? '-' + slug(pr.label) : '') + '-' + pi;
      const label = [it.name, pr.label].filter(Boolean).join(' — ');
      return `<button class="mi__add" type="button" data-cursor="link"
              data-id="${esc(id)}" data-name="${esc(label)}" data-price="${esc(pr.p)}"
              aria-label="Add ${esc(label)} to your order, $${esc(pr.p)}">`
           + (pr.label ? `<i>${esc(pr.label)}</i>` : '')
           + `<span>$${esc(pr.p)}</span><em aria-hidden="true">+</em></button>`;
    }).join('');
    return `        <li class="mi"${it.d ? '' : ' data-nodesc'}>
          <div class="mi__main">
            <h3 class="mi__name">${it.n ? `<span class="mi__no">${esc(it.n)}</span>` : ''}${esc(it.name)}</h3>
            ${it.d ? `<p class="mi__desc">${esc(it.d)}</p>` : ''}
          </div>
          <div class="mi__prices">${prices}</div>
        </li>`;
  }).join('\n');

  return `    <section class="mcat" id="${s.id}" data-section data-tempo="andante" data-bg="#f4efe6">
      <header class="mcat__head" data-anim>
        <h2>${esc(s.title)}${s.jp ? ` <em>${s.jp}</em>` : ''}</h2>
        <span class="mcat__count">${s.items.length} ${s.items.length === 1 ? 'dish' : 'dishes'}</span>
      </header>
      <ul class="mlist">
${rows}
      </ul>
    </section>`;
}).join('\n\n');

const html = `${shellHead(
  'Menu — Sakura Japanese Restaurant, Winchester MA',
  `The full Sakura menu: ${totalDishes} dishes across ${sections.length} sections — sushi, rolls, nigiri, hibachi, teriyaki, udon, lunch boxes and party boats. Takeout and delivery in Winchester, MA.`,
  'menu.html')}
<body class="menupage">

<a class="skip" href="#menuMain">Skip to the menu</a>

<div class="cursor" id="cursor" aria-hidden="true"><i></i><b></b></div>

${shellNav('menu.html')}

<main id="menuMain">

<section class="mhero" data-section data-tempo="largo" data-bg="#0b0b0d">
  <div class="mhero__inner">
    <p class="hero__eyebrow" data-anim data-split="chars" data-chars="lift">お品書き — THE FULL MENU</p>
    <h1 class="mhero__title" data-anim data-split="chars" data-chars="lift">MENU</h1>
    <p class="lead lead--light" data-anim data-split="lines">${totalDishes} dishes across ${sections.length} sections. Dine in and it is all-you-can-eat from the order sheet; this list is what we cook to order for takeout and delivery.</p>
    <div class="mhero__actions" data-anim data-stagger>
      <a class="btn btn--solid" data-site-href="tel" href="#" data-cursor="link"><span>Call to order</span></a>
      <a class="btn btn--ghost" data-site-href="checkout" href="#" target="_blank" rel="noopener" data-cursor="link"><span>Checkout online</span></a>
    </div>
  </div>
</section>

<div class="seam" data-seam data-from="#0b0b0d" data-to="#f4efe6" aria-hidden="true">
  <svg viewBox="0 0 1440 140" preserveAspectRatio="none"><path/></svg>
</div>

<div class="mtools">
  <label class="msearch">
    <span class="sr-only">Search the menu</span>
    <input type="search" id="menuSearch" placeholder="Search 240 dishes — tuna, tempura, udon…" autocomplete="off">
    <i aria-hidden="true">⌕</i>
  </label>
  <p class="mtools__count" id="menuCount" aria-live="polite"></p>
</div>

<div class="mrailwrap">
  <button class="mrail__find" type="button" id="railFind" aria-expanded="false"
          aria-controls="railSearchRow" aria-label="Search the menu" data-cursor="link">
    <span aria-hidden="true">⌕</span><em>Search</em>
  </button>
  <nav class="mrail" aria-label="Menu sections">
${rail}
  </nav>
</div>

<div class="mfind" id="railSearchRow" hidden>
  <label class="msearch msearch--sticky">
    <span class="sr-only">Search the menu</span>
    <input type="search" id="menuSearchSticky" placeholder="Search 240 dishes…" autocomplete="off">
    <i aria-hidden="true">⌕</i>
  </label>
  <p class="mfind__count" id="menuCountSticky"></p>
  <button class="mfind__close" type="button" id="railFindClose" aria-label="Close search">&#10005;</button>
</div>

<div class="mbody">
${body}
</div>

<p class="mempty" id="menuEmpty" hidden>Nothing matches that. <button type="button" id="menuClear">Clear the search</button></p>

<section class="mfoot" data-section data-tempo="andante" data-bg="#0b0b0d">
  <div class="mfoot__grid">
    <div>
      <h2 class="h2 h2--light" data-anim data-split="lines">Hungry now?</h2>
      <p class="lead lead--light" data-anim data-split="lines">Call the restaurant and we will have it ready, or finish your order through our online checkout.</p>
      <div class="mhero__actions" data-anim data-stagger>
        <a class="btn btn--solid" data-site-href="tel" href="#" data-cursor="link"><span data-site="phone"></span></a>
        <a class="btn btn--ghost" data-site-href="checkout" href="#" target="_blank" rel="noopener" data-cursor="link"><span>Checkout online</span></a>
      </div>
    </div>
    <dl class="info" data-anim data-stagger>
      <div><dt>Address</dt><dd data-site="address"></dd></div>
      <div><dt>Hours</dt><dd data-site="hours"></dd></div>
      <div><dt>Delivery</dt><dd data-site="delivery"></dd></div>
    </dl>
  </div>
  <p class="note note--light">Prices are for takeout and delivery. Dine-in is all-you-can-eat — see <a href="index.html#menu" data-cursor="link">the buffet pricing</a>. <span data-site="allergyNote"></span></p>
</section>


<div class="cartbar" id="cartBar" hidden>
  <button class="cartbar__btn" type="button" id="cartOpen" data-cursor="link">
    <span class="cartbar__count" id="cartCount">0</span>
    <span class="cartbar__label">Your order</span>
    <span class="cartbar__total" id="cartTotal">$0.00</span>
  </button>
</div>

<aside class="cart" id="cart" hidden aria-label="Your order">
  <div class="cart__scrim" id="cartScrim"></div>
  <div class="cart__panel" role="dialog" aria-modal="true" aria-labelledby="cartHeading">
    <header class="cart__head">
      <h2 id="cartHeading">Your order</h2>
      <button class="cart__close" type="button" id="cartClose" aria-label="Close your order">&#10005;</button>
    </header>

    <div class="cart__mode" role="group" aria-label="How would you like it?">
      <button type="button" class="is-on" data-mode="pickup">Pickup</button>
      <button type="button" data-mode="delivery">Delivery</button>
    </div>
    <p class="cart__modenote" id="cartModeNote"></p>

    <ul class="cart__lines" id="cartLines"></ul>
    <p class="cart__empty" id="cartEmpty">Nothing here yet. Add something from the menu.</p>

    <section class="cart__up" id="cartUp" hidden>
      <h3>Goes well with</h3>
      <div class="cart__upgrid" id="cartUpGrid"></div>
    </section>

    <div class="cart__sum">
      <div class="cart__row"><span>Subtotal</span><b id="cartSub">$0.00</b></div>
      <p class="cart__fine">Tax is added when the restaurant confirms your order. Prices are for takeout and delivery.</p>
    </div>

    <div class="cart__actions">
      <a class="btn btn--solid btn--wide" id="cartCall" data-site-href="tel" href="#" data-cursor="link"><span>Call to order</span></a>
      <a class="btn btn--ghost btn--wide" id="cartEmail" href="#" data-cursor="link"><span>Email this order</span></a>
      <a class="btn btn--ghost btn--wide" data-site-href="checkout" href="#" target="_blank" rel="noopener" data-cursor="link"><span>Pay online instead</span></a>
    </div>
    <p class="cart__fine cart__fine--last">Calling reads your basket straight to the restaurant — it stays on this screen while you talk.</p>
  </div>
</aside>

<script>window.SAKURA_UPSELL = ${JSON.stringify(upsell)};</script>

</main>

<script src="js/site.js"></script>
<script src="js/motion.js"></script>
<script src="js/menu.js"></script>
<script src="js/cart.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'menu.html'), html);
console.log('menu.html written —', sections.length, 'sections,', totalDishes, 'dishes');
