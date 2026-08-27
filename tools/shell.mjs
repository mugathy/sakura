/* Shared page furniture: head, nav, overlay menu and footer.
   Used by build-menu.mjs and build-pages.mjs so the navigation only has to be
   corrected in one place. index.html is hand-written and mirrors this. */

export const NAV_LINKS = [
  ['index.html#about',   'About'],
  ['menu.html',          'Menu'],
  ['index.html#menu',    'All you can eat'],
  ['location.html',      'Find us'],
  ['contact.html',       'Contact']
];

export function head(title, description) {
  return `<!doctype html>
<html lang="en" class="no-js" data-quality="high">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b0d">
<title>${title}</title>
<meta name="description" content="${description}">

<!--  GENERATED FILE — do not hand-edit. See tools/ and re-run the builder.  -->

<link rel="stylesheet" href="css/style.css">
</head>`;
}

export function nav(current) {
  const links = NAV_LINKS
    .filter(([href]) => href !== current)
    .map(([href, label]) => `    <a href="${href}" data-cursor="link">${label}</a>`)
    .join('\n');
  return `<header class="nav is-solid" id="nav">
  <a class="nav__brand" href="index.html" data-cursor="link">
    <img class="nav__logo" src="assets/logo.jpg" alt="Sakura Japanese Cuisine" width="40" height="40">
    <span class="nav__word">SAKURA</span>
  </a>
  <nav class="nav__links" aria-label="Primary">
${links}
  </nav>
  <a class="nav__cta btn btn--ghost" data-site-href="tel" href="#" data-cursor="link"><span>Call to order</span></a>
  <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="overlay">
    <i></i><i></i>
  </button>
</header>

<div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-label="Menu" hidden>
  <div class="overlay__bg"></div>
  <nav class="overlay__nav">
    <a href="index.html"><em>01</em><span>Home</span></a>
    <a href="menu.html"><em>02</em><span>Menu</span></a>
    <a href="index.html#menu"><em>03</em><span>All you can eat</span></a>
    <a href="location.html"><em>04</em><span>Find us</span></a>
    <a href="contact.html"><em>05</em><span>Contact</span></a>
  </nav>
  <div class="overlay__meta">
    <p data-site="address"></p>
    <p><a data-site-href="tel" href="#"><span data-site="phone"></span></a></p>
  </div>
</div>`;
}

export function foot() {
  return `<footer class="foot" data-section data-tempo="largo" data-bg="#0b0b0d">
  <div class="foot__cols">
    <div><h5>Visit</h5><p data-site="address"></p></div>
    <div><h5>Hours</h5><p data-site="hours"></p></div>
    <div><h5>Contact</h5><p><a data-site-href="tel" href="#" data-cursor="link"><span data-site="phone"></span></a><br><a data-site-href="mail" href="#" data-cursor="link"><span data-site="email"></span></a></p></div>
    <div><h5>Online</h5><p><a href="menu.html" data-cursor="link">Full menu</a><br><a data-site-href="checkout" href="#" target="_blank" rel="noopener" data-cursor="link">Checkout ↗</a></p></div>
  </div>
  <div class="foot__base">
    <span>© <span id="yr"></span> Sakura Japanese Restaurant, Winchester MA.</span>
    <span class="foot__kanji">桜 · 和食レストラン</span>
  </div>
</footer>`;
}

export const SCRIPTS = `<script src="js/site.js"></script>
<script src="js/motion.js"></script>`;
