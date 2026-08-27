# Sakura Japanese Restaurant — motion-led site

A single-page site for Sakura Japanese Restaurant, 910 Main St, Winchester MA,
built around one motion system.
No frameworks, no CDN, no build step required — open `index.html` and it runs.

```
index.html        the main page
menu.html         GENERATED full menu — run tools/build-menu.mjs, never hand-edit
data/menu.json    every dish, price and description (edit this)
tools/build-menu.mjs  regenerates menu.html from data/menu.json
js/menu.js        menu-page search + section rail
css/style.css     tokens, tempo grid, 10 entrance variants, components
js/site.js        ← ALL real-world content lives here (address, hours, prices)
js/motion.js      the motion engine
build.mjs         optional: bundles everything into one shareable .html
```

## Where the content came from

All of it lives in **`js/site.js`**, pulled from the restaurant's own site
(sakurawinchesterma.com) and Google listing:

- **Hours** — exact, from the Location & Hours page (Mon closed; Tue–Thu to
  10:00 PM; Fri–Sat to 10:30 PM; Sun opens 12:30 PM).
- **Prices** — from the live ordering menu: 159 dishes across 23 categories,
  rolls from $5.50, entrées from $10.75, party boats $37.45–$101.45.
- **Dish names** — Sakura Special Rolls, party boats and the tile grid are all
  real items at their real prices.
- **Images** — `assets/logo.jpg` and `assets/sushi-platter.jpg` came from the
  existing site; they are the only two usable photographs it has.

### Photography

The six gallery panels are photographs from **Pexels**, whose licence allows
commercial use and modification with no attribution required. Each was
white-balanced, levelled, crop-framed on its subject, sharpened and resized
before use — see `PHOTO-CREDITS.md` for the per-file record and the processing
recipe.

They are stock photographs of sushi, not photographs of Sakura's food. To swap
in real ones later, replace the files in `assets/gallery/` at 900×1200 and
nothing else changes — the parallax, blur and hover motion come from the card,
not the image.

Two things are still **placeholder**, marked `TODO` in that file: the email
address and the Instagram handle.

**All-you-can-eat is the spine of the page**, taken from the printed order
sheet. Dining in is entirely AYCE; the online à-la-carte menu is for takeout.

| | Regular | Deluxe |
|---|---|---|
| Adults | $21.95 | $31.95 |
| Child 10–12 | $15.95 | $24.95 |
| Under 10 | $13.95 | $16.95 |

Plus $2 on all prices Friday, Saturday and Sunday including holidays. Deluxe
adds sashimi, octopus, white tuna and yellowtail with scallion, some limited to
one serving of two pieces. The order sheet's no-waste rule ($1 per uneaten
piece) and the allergy notice both appear on the page.

⚠ **One thing to confirm:** the sheet shows a LUNCH price of $13.95 alongside
two "(under 10yrs)" figures. I read $13.95 as the regular under-10 rate. If
lunch is its own separate rate, tell me and I will add a lunch row.

The table-request form is deliberately inert — it validates, then plays its
confirmation state. Wire it to your provider at the marked `TODO` in
`js/motion.js` (§17). Nothing leaves the browser as written.

No claim on the page asserts anything beyond the verified list above: there are
no invented founding dates, chef biographies, sourcing claims or made-up prices.

## The motion system

Everything is driven by **one `requestAnimationFrame` loop** in `js/motion.js`,
run in strict read-then-write order so no effect can cause layout thrash
mid-frame.

**Tempo.** The site animates on a 92bpm grid. One beat is 652ms, and every
duration is a subdivision of it (`--t-16` … `--t-1`). Sections are tagged
`data-tempo="largo | andante | allegro"`, so the page deliberately alternates
slow and quick passages instead of animating at one flat speed. Change `--bpm`
and `BPM` together to re-time the whole site.

**Easing DNA.** One family, `--ease-entrance: cubic-bezier(.16,1,.3,1)`.
Variants differ only in *which channel* they travel on — never in personality.
That is what makes ten different arrivals still feel like one hand made them.

**Liquid scroll.** Desktop takes over the wheel and damps toward a target with
`1 - exp(-rate·dt)`, so the feel is identical at 60Hz and 120Hz. The real
scrollbar and real document height are kept, so anchors, keyboard scrolling and
sticky positioning all still work; if anything moves the page by other means,
the engine detects it and adopts the new position. Touch keeps native momentum,
which is already liquid, and only reads velocity from it.

**Choreographed entrances.** A seeded dealer hands out variants so neighbouring
elements never arrive the same way, while staying identical on every reload.
Three decks: 8 block variants, 6 line-travel variants, 4 character variants.
Clip-based variants (`iris`, `bleed`) are reserved for media and are never dealt
to text, which they would crop.

**Motion blur.** Real directional blur — `feGaussianBlur` on a single axis —
driven by scroll velocity and quantised into six steps per axis. The filters are
declared once and swapped *by class*, so no filter primitive is ever rebuilt
mid-frame. A velocity-linked shear and vertical stretch give the movement mass.

**Morphing transitions.** Two kinds. The seams between sections interpolate a
path (Catmull-Rom through lerped control points) *and* their fill colour, so one
section's edge genuinely reshapes into the next one's. The hero plate is a
shared-element morph: a single object travels, rescales and reshapes from circle
to petal into the philosophy medallion — it does not cross-fade.

**Adaptive quality.** The loop samples frame times (ignoring the opening frames,
which are the heaviest of the session). Sustained performance below ~38fps sets
`data-quality="low"`, which sheds blur and thins the petals *before* frames start
dropping. Low-core touch devices start there.

## Accessibility and fallbacks

- `prefers-reduced-motion: reduce` — no smooth-scroll hijack, no splitting, no
  blur, no petals; the gallery unpins and everything is simply visible.
- No JavaScript — the `.no-js` rules keep all content visible and drop the loader.
- Real focus rings, a skip link, labelled fields, and the menu closes on Escape.
- Reveals ride the rAF loop rather than IntersectionObserver, so content cannot
  get stranded invisible if an observer never fires.

## Fonts

The type stack is deliberately dependency-free (system serif + system sans), so
there is no external request and no layout shift. To swap in a licensed display
face, self-host it and change `--display` in `css/style.css`. The line splitter
re-measures on `fonts.ready`, on `load`, and verifies its own result, so a new
font will not break the line masks.

## The menu page

`menu.html` lists all 240 dishes across 23 sections, taken from the schema.org
JSON-LD the restaurant's ordering system publishes — so the names, descriptions
and prices are the restaurant's own, not retyped.

To change a price or a dish, edit **`data/menu.json`** and re-run:

```bash
node tools/build-menu.mjs
```

The dishes are baked into the HTML rather than fetched, so the menu still reads
with JavaScript off and search engines can index it. Search and the sticky
section rail are progressive enhancement on top.

"Order online" throughout the site now points at this page. The page's own
"Checkout online" button is the one that hands off to the restaurant's live
ordering system — that part still needs their platform, since taking payment
requires a backend.

## Order basket

`js/cart.js` runs on the menu page. Every price is an add button; the basket
persists in `localStorage`, offers pickup or delivery, and suggests small plates
based on what is already in it (if the basket has sides but no sweet, it
suggests a sweet). The finished order goes out by phone or as a pre-filled
email.

**It does not take payment, and that is a deliberate stopping point.** Charging a
card needs a server: POST the basket to an endpoint, re-price every line from
`data/menu.json` (never trust prices sent by a browser), create a Stripe
Checkout Session and redirect to it, then confirm to the restaurant from
Stripe's webhook. The note at the bottom of `js/cart.js` says the same thing
next to the code.

## Running it

Any static server, e.g.:

```bash
python -m http.server 5187
```

To produce one self-contained file (for emailing or dropping on a host):

```bash
node build.mjs
```
