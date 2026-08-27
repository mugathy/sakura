/* Generate location.html and contact.html.
   Re-run after editing:  node tools/build-pages.mjs                         */
import fs from 'node:fs';
import path from 'node:path';
import { head, nav, foot, SCRIPTS } from './shell.mjs';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')));

/* Every real-world value below comes from js/site.js at runtime via
   [data-site] / [data-site-href], so nothing here can drift out of date. */

const hero = (eyebrow, title, lead) => `
<section class="mhero" data-section data-tempo="largo" data-bg="#0b0b0d">
  <div class="mhero__inner">
    <p class="hero__eyebrow" data-anim data-split="chars" data-chars="lift">${eyebrow}</p>
    <h1 class="mhero__title" data-anim data-split="chars" data-chars="lift">${title}</h1>
    <p class="lead lead--light" data-anim data-split="lines">${lead}</p>
  </div>
</section>

<div class="seam" data-seam data-from="#0b0b0d" data-to="#f4efe6" aria-hidden="true">
  <svg viewBox="0 0 1440 140" preserveAspectRatio="none"><path/></svg>
</div>`;

/* ── Find us ─────────────────────────────────────────────────────────────── */
const location = `${head('Find us — Sakura Japanese Restaurant, Winchester MA',
  'Sakura Japanese Restaurant, 910 Main St, Winchester MA. Opening hours, delivery times, parking and directions.')}
<body class="menupage">
<a class="skip" href="#main">Skip to content</a>
<div class="cursor" id="cursor" aria-hidden="true"><i></i><b></b></div>
${nav('location.html')}

<main id="main">
${hero('ご来店 — FIND US', 'VISIT', 'We are on Main Street in Winchester. Eat in for all-you-can-eat, collect an order, or have it brought to you.')}

<section class="pagebody" data-section data-tempo="andante" data-bg="#f4efe6">
  <div class="pcols">
    <div class="pcol" data-anim>
      <h2 class="pcol__h">The restaurant</h2>
      <dl class="info info--light">
        <div><dt>Address</dt><dd data-site="address"></dd></div>
        <div><dt>Telephone</dt><dd><a data-site-href="tel" href="#" data-cursor="link"><span data-site="phone"></span></a></dd></div>
        <div><dt>Email</dt><dd><a data-site-href="mail" href="#" data-cursor="link"><span data-site="email"></span></a></dd></div>
        <div><dt>Directions</dt><dd><a data-site-href="map" href="#" target="_blank" rel="noopener" data-cursor="link">Open in Maps ↗</a></dd></div>
      </dl>
      <div class="pcta">
        <a class="btn btn--solid" data-site-href="tel" href="#" data-cursor="link"><span>Call the restaurant</span></a>
        <a class="btn btn--ghost" href="menu.html" data-cursor="link"><span>See the menu</span></a>
      </div>
    </div>

    <div class="pcol" data-anim>
      <h2 class="pcol__h">Opening hours</h2>
      <p class="phours" data-site="hours"></p>
      <p class="pnote"><b data-site="delivery"></b><br>Kitchen orders are taken until closing; the sushi bar stops a little earlier on busy nights, so call ahead if you are cutting it fine.</p>
      <h2 class="pcol__h pcol__h--sub">Dining in</h2>
      <p class="pnote">Dining in is all-you-can-eat from the order sheet — <a href="index.html#menu" data-cursor="link">see the buffet pricing</a>. The à la carte list on <a href="menu.html" data-cursor="link">the menu page</a> is what we cook for takeout and delivery.</p>
    </div>
  </div>

  <div class="pmap" data-anim="veil">
    <a data-site-href="map" href="#" target="_blank" rel="noopener" data-cursor="card">
      <span class="pmap__pin" aria-hidden="true">◉</span>
      <span class="pmap__text"><b data-site="address"></b><em>Open in Maps ↗</em></span>
    </a>
  </div>
</section>

${foot()}
</main>
${SCRIPTS}
</body>
</html>
`;

/* ── Contact ─────────────────────────────────────────────────────────────── */
const contact = `${head('Contact — Sakura Japanese Restaurant, Winchester MA',
  'Call, email or send a table request to Sakura Japanese Restaurant in Winchester, MA.')}
<body class="menupage">
<a class="skip" href="#main">Skip to content</a>
<div class="cursor" id="cursor" aria-hidden="true"><i></i><b></b></div>
${nav('contact.html')}

<main id="main">
${hero('お問い合わせ — CONTACT', 'CONTACT', 'The fastest way to reach us is the phone — someone at the counter will pick up. For a table, a large party or anything that needs arranging, send the form and we will call you back.')}

<section class="pagebody" data-section data-tempo="andante" data-bg="#f4efe6">
  <div class="pcols pcols--form">
    <div class="pcol" data-anim>
      <h2 class="pcol__h">Reach us</h2>
      <dl class="info info--light">
        <div><dt>Telephone</dt><dd><a data-site-href="tel" href="#" data-cursor="link"><span data-site="phone"></span></a></dd></div>
        <div><dt>Email</dt><dd><a data-site-href="mail" href="#" data-cursor="link"><span data-site="email"></span></a></dd></div>
        <div><dt>Address</dt><dd data-site="address"></dd></div>
        <div><dt>Hours</dt><dd data-site="hours"></dd></div>
      </dl>
      <p class="pnote">Ordering food? <a href="menu.html" data-cursor="link">The menu</a> takes your order and hands it to us by phone or email.</p>
    </div>

    <form class="form form--light" id="resForm" data-anim="veil" novalidate>
      <div class="form__row">
        <label class="field"><span>Name</span><input type="text" name="name" required autocomplete="name" placeholder=" "><i></i></label>
        <label class="field"><span>Guests</span>
          <select name="guests"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option>10</option><option value="12+">12 or more</option></select><i></i>
        </label>
      </div>
      <div class="form__row">
        <label class="field"><span>Date</span><input type="date" name="date" required><i></i></label>
        <label class="field"><span>Time</span><input type="time" name="time" value="19:00" required><i></i>
          <em class="field__hint" id="timeHint"></em>
        </label>
      </div>
      <label class="field"><span>Email</span><input type="email" name="email" required autocomplete="email" placeholder=" "><i></i></label>
      <label class="field"><span>Anything we should know?</span><textarea name="notes" rows="3" placeholder=" "></textarea><i></i></label>
      <button class="btn btn--solid btn--wide" type="submit" data-cursor="link"><span>Send it</span></button>
      <p class="form__fine">We reply within one business day. <span data-site="bookingNote"></span></p>

      <div class="form__done" aria-live="polite">
        <div class="form__done-mark">✓</div>
        <h4>Message received</h4>
        <p>We will come back to you shortly. If it is for tonight, please give us a call instead.</p>
      </div>
    </form>
  </div>
</section>

${foot()}
</main>
${SCRIPTS}
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'location.html'), location);
fs.writeFileSync(path.join(root, 'contact.html'), contact);
console.log('wrote location.html and contact.html');
