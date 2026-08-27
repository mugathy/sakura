/* ═══════════════════════════════════════════════════════════════════════════
   SAKURA — motion engine
   ───────────────────────────────────────────────────────────────────────────
   One requestAnimationFrame loop drives everything, in strict read→write
   order, so nothing in this file can cause layout thrash mid-frame.

     TEMPO      bpm grid; every duration is a subdivision of one beat
     SCROLL     lerped virtual scroll (desktop) / native momentum (touch)
     REVEAL     10 entrance variants sharing one easing DNA
     SPLIT      line + character splitting with masked arrivals
     BLUR       velocity-driven directional motion blur, quantised
     SEAM       path + colour morphing between sections
     PIN        horizontal gallery with drag
     QUALITY    live fps sampling; drops effects before it drops frames
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

var doc = document, html = doc.documentElement, win = window;
html.classList.remove('no-js');

var REDUCED = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
var COARSE  = win.matchMedia('(pointer: coarse)').matches;
var HOVER   = win.matchMedia('(hover: hover)').matches;

/* ── maths ─────────────────────────────────────────────────────────────── */
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
/* frame-rate independent damping — the reason this feels the same at 60/120Hz */
function damp(a, b, rate, dt) { return lerp(a, b, 1 - Math.exp(-rate * dt / 1000)); }
function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hexRGB(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mixRGB(a, b, t) {
  return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
}
var $  = function (s, c) { return (c || doc).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

/* ══ 1. TEMPO ══════════════════════════════════════════════════════════════
   92bpm. Sections alternate largo / allegro / andante so the page breathes
   in and out instead of animating at one flat speed. Durations are always
   beat subdivisions, which is what makes unrelated elements feel in time. */
var BPM = 92, BEAT = 60000 / BPM;
var TEMPO = {
  largo:   { dur: BEAT * 2.0,  stagger: BEAT * 0.26, ch: BEAT * 0.055 },
  andante: { dur: BEAT * 1.5,  stagger: BEAT * 0.17, ch: BEAT * 0.038 },
  allegro: { dur: BEAT * 0.75, stagger: BEAT * 0.10, ch: BEAT * 0.024 }
};
function tempoOf(el) {
  var s = el.closest('[data-tempo]');
  return TEMPO[s && s.dataset.tempo] || TEMPO.andante;
}

/* ══ 2. rAF CORE ══════════════════════════════════════════════════════════ */
var readers = [], writers = [], last = performance.now(), running = true;
function onFrame(read, write) { if (read) readers.push(read); if (write) writers.push(write); }
function tick(now) {
  var dt = Math.min(now - last, 50); last = now;           /* clamp tab-switch spikes */
  var i;
  for (i = 0; i < readers.length; i++) readers[i](dt, now);
  for (i = 0; i < writers.length; i++) writers[i](dt, now);
  quality(dt);
  if (running) requestAnimationFrame(tick);
}

/* ── adaptive quality: sample frames, shed effects before we shed fps ───── */
var qSamples = [], qDecided = false;
if (COARSE && (navigator.hardwareConcurrency || 8) <= 4) html.dataset.quality = 'low';
function quality(dt) {
  if (qDecided) return;
  qSamples.push(dt);
  if (qSamples.length < 140) return;
  qDecided = true;
  /* Ignore the opening frames — page load and the first entrance run are the
     heaviest moment of the session and would bias every device toward 'low'. */
  var sorted = qSamples.slice(40).sort(function (a, b) { return a - b; });
  var median = sorted[Math.floor(sorted.length / 2)];
  if (median > 26) html.dataset.quality = 'low';    /* ~38fps sustained */
  qSamples = null;
}

/* ══ 3. SMOOTH SCROLL ══════════════════════════════════════════════════════
   Desktop: we own the wheel and lerp toward a target, keeping the real
   scrollbar and real document height (so sticky, anchors, a11y all work).
   Touch: native momentum is already liquid — we only read it. */
var SS = {
  on: !REDUCED && !COARSE,
  target: win.scrollY, current: win.scrollY, prev: win.scrollY,
  vel: 0, max: 0, locked: false, applied: -1
};
if (SS.on) html.classList.add('lenis');

function measureMax() { SS.max = Math.max(0, doc.body.scrollHeight - win.innerHeight); }
measureMax();

if (SS.on) {
  win.addEventListener('wheel', function (e) {
    if (SS.locked || e.ctrlKey) return;
    if (e.target.closest('[data-native-scroll]')) return;
    e.preventDefault();
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 18;              /* lines  */
    else if (e.deltaMode === 2) d *= win.innerHeight; /* pages */
    SS.target = clamp(SS.target + d, 0, SS.max);
  }, { passive: false });
}

onFrame(function (dt) {
  measureMaxThrottled(dt);
  if (SS.locked) { SS.vel = 0; return; }

  if (SS.on) {
    /* someone moved us by other means (scrollbar drag, keyboard, hash) — adopt it */
    if (SS.applied >= 0 && Math.abs(win.scrollY - SS.applied) > 2) {
      SS.current = SS.target = win.scrollY;
    }
    SS.target = clamp(SS.target, 0, SS.max);
    SS.current = damp(SS.current, SS.target, 9.5, dt);
    if (Math.abs(SS.target - SS.current) < .06) SS.current = SS.target;
    SS.applied = Math.round(SS.current * 100) / 100;
    win.scrollTo(0, SS.current);
  } else {
    SS.current = SS.target = win.scrollY;
  }
  SS.vel = (SS.current - SS.prev) * (16.667 / dt);   /* px per 60fps-frame */
  SS.prev = SS.current;
});

var measureAcc = 0;
function measureMaxThrottled(dt) { measureAcc += dt; if (measureAcc > 400) { measureAcc = 0; measureMax(); } }
win.addEventListener('resize', function () { measureMax(); SS.target = clamp(SS.target, 0, SS.max); });

function scrollToY(y) {
  y = clamp(y, 0, SS.max);
  if (SS.on) SS.target = y;
  else win.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
}
function scrollBy(d) {
  if (SS.on) SS.target = clamp(SS.target + d, 0, SS.max);
  else win.scrollBy(0, d);
}

/* anchor links glide instead of jumping */
$$('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var t = doc.getElementById(id.slice(1));
    if (!t) return;
    e.preventDefault();
    closeOverlay();
    scrollToY(t.getBoundingClientRect().top + win.scrollY - (id === '#top' ? 0 : 10));
  });
});

/* ══ 4. TEXT SPLITTING ════════════════════════════════════════════════════ */
function splitChars(el, step) {
  var text = el.textContent;
  el.textContent = '';
  /* marks that the text now lives in per-character spans, so the element can
     hand its gradient over to them (see .is-split in the stylesheet) */
  el.classList.add('is-split');
  var frag = doc.createDocumentFragment(), i, n = 0;
  for (i = 0; i < text.length; i++) {
    var s = doc.createElement('span');
    s.className = 'ch';
    s.textContent = text[i];
    s.style.setProperty('--delay', Math.round(n * step) + 'ms');
    if (text[i] !== ' ') n++;
    frag.appendChild(s);
  }
  el.appendChild(frag);
}

/* Only plain text (optionally broken by <br>) can be line-split — anything
   with real child elements would be shredded by the word-wrapping pass. */
function canSplit(el) {
  /* Decided once, on the pristine element — after a split the children are
     line spans, so re-inspecting the live DOM would always say no. */
  if (el._splittable === undefined) {
    el._splittable = true;
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i].tagName !== 'BR') { el._splittable = false; break; }
    }
  }
  return el._splittable;
}

/* A rebuilt line must occupy exactly one row. If font metrics shifted between
   the measuring pass and paint, a line can re-wrap — so we check the result and
   measure again rather than trusting that metrics were settled. */
function splitLines(el, step, pass) {
  var built = buildLines(el, step);
  if (didWrap(el, built) && (pass || 0) < 3) return splitLines(el, step, (pass || 0) + 1);
  return built;
}

/* The inner element is block-level, so it always reports a single client rect —
   a re-wrap only shows up as extra height. */
function didWrap(el, inners) {
  var cs = getComputedStyle(el);
  var lh = parseFloat(cs.lineHeight);
  if (!isFinite(lh)) lh = parseFloat(cs.fontSize) * 1.4;
  for (var i = 0; i < inners.length; i++) {
    if (inners[i].offsetHeight > lh * 1.55) return true;
  }
  return false;
}

function buildLines(el, step) {
  if (!el._srcHTML) el._srcHTML = el.innerHTML;
  el.innerHTML = el._srcHTML;
  /* 1. atomise into word spans, keeping <br> as hard breaks.
     The separating space stays OUTSIDE the span: a trailing space inside an
     inline-block collapses at its own line-box end, which would measure the
     words as if they had no gaps and overfill every line. */
  var parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map(function (p, pi) {
    var words = p.trim().split(/\s+/).filter(Boolean).map(function (w) {
      return '<span class="w">' + w + '</span>';
    }).join(' ');
    return words + (pi < parts.length - 1 ? '<span class="w brk"></span>' : '');
  }).join('');
  /* 2. group by measured vertical position (read phase — one pass) */
  var words = $$('.w', el), lines = [], cur = null, top = null;
  words.forEach(function (w) {
    if (w.classList.contains('brk')) { cur = null; top = null; return; }
    var t = w.offsetTop;
    if (cur === null || Math.abs(t - top) > 3) { cur = []; lines.push(cur); top = t; }
    cur.push(w);
  });
  /* 3. rebuild as masked lines */
  var out = doc.createDocumentFragment();
  lines.forEach(function (ws, li) {
    var line = doc.createElement('span'); line.className = 'line';
    var inner = doc.createElement('i');
    inner.style.setProperty('--delay', Math.round(li * step) + 'ms');
    inner.appendChild(doc.createTextNode(ws.map(function (w) { return w.textContent; }).join(' ')));
    line.appendChild(inner); out.appendChild(line);
  });
  el.innerHTML = '';
  el.appendChild(out);
  return $$('.line>i', el);
}

var splitEls = $$('[data-split]');
function doSplit() {
  splitEls.forEach(function (el) {
    var t = tempoOf(el);
    if (!canSplit(el)) { el.removeAttribute('data-split'); el.removeAttribute('data-lines'); el.dataset.anim = 'rise'; return; }
    if (el.dataset.split === 'chars') { if (!el._chSplit) { splitChars(el, t.ch); el._chSplit = 1; } }
    else splitLines(el, t.stagger * 0.62);
  });
}
if (!REDUCED) {
  /* Measure line breaks only once the real font metrics are in, otherwise the
     grouping is computed against fallback metrics and the rebuilt lines rewrap. */
  doSplit();
  var reflow = function () {
    splitEls.forEach(function (el) {
      if (el.dataset.split !== 'lines' || !canSplit(el)) return;
      if (!didWrap(el, $$('.line>i', el))) return;
      var wasIn = el.classList.contains('is-in');
      splitLines(el, tempoOf(el).stagger * 0.62);
      if (wasIn) { el.offsetHeight; el.classList.add('is-in'); }
    });
  };
  requestAnimationFrame(function () { requestAnimationFrame(reflow); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(reflow);
  win.addEventListener('load', reflow);
}

/* re-split lines on width change only (height changes on mobile = URL bar) */
var lastW = win.innerWidth, reWait;
win.addEventListener('resize', function () {
  if (win.innerWidth === lastW || REDUCED) return;
  lastW = win.innerWidth;
  clearTimeout(reWait);
  reWait = setTimeout(function () {
    splitEls.forEach(function (el) {
      if (el.dataset.split === 'chars') return;
      var wasIn = el.classList.contains('is-in');
      splitLines(el, tempoOf(el).stagger * 0.62);
      if (wasIn) { el.offsetHeight; el.classList.add('is-in'); }
    });
  }, 220);
});

/* ══ 5. ENTRANCE CHOREOGRAPHY ═════════════════════════════════════════════
   A seeded dealer hands out variants so neighbours never arrive the same
   way — but the deal is deterministic, so the page choreographs itself
   identically on every reload. */
/* Block variants. iris/bleed clip their own corners, so they are reserved for
   media and assigned by hand in the markup — never dealt to a text block. */
var DECK_BLOCK = ['rise', 'settle', 'drift-l', 'drift-r', 'veil', 'wipe-x', 'unfurl', 'expand'];
/* A split headline arrives by the way its LINES travel, so it gets its own deck. */
var DECK_LINE  = ['up', 'tilt-l', 'tilt-r', 'stretch', 'fan', 'glide'];
/* No blur-based entrances. Both 'bloom' (characters) and 'focus' (blocks)
   scaled up out of a blur, which reads as a page still loading rather than as
   something arriving. 'expand' replaced 'focus'; nothing replaced 'bloom'. */
var DECK_CHAR  = ['drop', 'lift'];   /* no scale-based arrivals */

var rnd = mulberry32(0x5A9C1A);
function dealer(deck) {
  var pile = [], lastOut = '';
  return function () {
    if (!pile.length) {
      pile = deck.slice();
      for (var i = pile.length - 1; i > 0; i--) {        /* Fisher–Yates */
        var j = Math.floor(rnd() * (i + 1)), t = pile[i]; pile[i] = pile[j]; pile[j] = t;
      }
      /* never let a reshuffle repeat the card we just played */
      if (pile[pile.length - 1] === lastOut && pile.length > 1) pile.push(pile.shift());
    }
    lastOut = pile.pop();
    return lastOut;
  };
}
var deal = dealer(DECK_BLOCK), dealLine = dealer(DECK_LINE), dealChar = dealer(DECK_CHAR);

var animEls = $$('[data-anim]');
animEls.forEach(function (el) {
  var t = tempoOf(el);
  if (el.hasAttribute('data-split')) {
    /* the wrapper stays put; the lines or characters do the arriving */
    if (!el.dataset.anim) el.dataset.anim = 'none';
    /* an authored data-chars / data-lines wins — the deck only fills blanks */
    if (el.dataset.split === 'chars') {
      if (!el.dataset.chars) el.dataset.chars = dealChar();
    } else if (!el.dataset.lines) {
      el.dataset.lines = dealLine();
    }
  } else if (!el.dataset.anim) {
    el.dataset.anim = el.hasAttribute('data-stagger') ? 'none' : deal();
  }
  el.style.setProperty('--dur', Math.round(t.dur) + 'ms');
});

/* staggered groups: children arrive on consecutive off-beats */
$$('[data-stagger]').forEach(function (g) {
  var t = tempoOf(g), kids = Array.prototype.slice.call(g.children);
  kids.forEach(function (k, i) {
    k.style.transitionDelay = Math.round(i * t.stagger) + 'ms';
    k.style.transitionDuration = Math.round(t.dur) + 'ms';
    k.style.transitionTimingFunction = 'var(--ease-entrance)';
    k.style.transitionProperty = 'opacity,transform';
    k.style.opacity = '0';
    k.style.transform = 'translate3d(0,' + (26 + i * 4) + 'px,0)';
  });
  g._kids = kids;
});

function arrive(el) {
  el.classList.add('is-in');
  if (el._kids) el._kids.forEach(function (k) { k.style.opacity = '1'; k.style.transform = 'none'; });
  var t = tempoOf(el);
  setTimeout(function () {
    el.classList.add('is-done');
    if (el._kids) el._kids.forEach(function (k) {
      k.style.transition = ''; k.style.transitionProperty = ''; k.style.transitionDelay = '';
      k.style.transitionDuration = ''; k.style.transitionTimingFunction = '';
      k.style.transform = ''; k.style.opacity = '';
    });
    $$('.ch,.line>i', el).forEach(function (n) { n.style.willChange = 'auto'; });
  }, t.dur + t.stagger * 6 + 160);
}

if (REDUCED) {
  animEls.forEach(function (el) {
    el.classList.add('is-in', 'is-done');
    if (el._kids) el._kids.forEach(function (k) { k.style.opacity = '1'; k.style.transform = 'none'; });
  });
} else {
  /* Reveals ride the same rAF loop as everything else rather than an
     IntersectionObserver. One scroll source of truth means the choreography
     can never desync from the scroll position, and elements leave the queue
     the moment they land, so the cost falls to zero as the page is read. */
  var queue = animEls.slice(), qTick = 0;
  onFrame(null, function () {
    if (!queue.length) return;
    if (++qTick % 3) return;                       /* ~20Hz is plenty for arrivals */
    var vh = win.innerHeight, trigger = vh * 0.92;
    for (var i = queue.length - 1; i >= 0; i--) {
      var el = queue[i], r = el.getBoundingClientRect();
      /* Anything that has reached OR PASSED the trigger line arrives. Requiring
         it to still be on screen meant a fast flick or an anchor jump could
         skip an element entirely and leave it invisible for good. */
      if (r.top < trigger) { arrive(el); queue.splice(i, 1); }
    }
  });
}

/* ══ 6. MOTION BLUR ═══════════════════════════════════════════════════════
   Real directional blur (SVG feGaussianBlur on one axis) driven by the
   scroll velocity, quantised to 6 steps so the filter itself never changes
   mid-frame — only the class does. Plus a shear + stretch so movement
   reads as having mass. */
var BLUR_STEPS = [7, 15, 27, 43, 66, 95];
var blurEls = $$('[data-blur]').map(function (el) {
  return { el: el, axis: el.dataset.blur === 'x' ? 'x' : 'y', level: 0, local: 0 };
});
onFrame(null, function () {
  if (REDUCED) return;
  var low = html.dataset.quality === 'low';
  for (var i = 0; i < blurEls.length; i++) {
    var b = blurEls[i];
    var v = b.axis === 'x' ? b.local : SS.vel;
    var a = Math.abs(v), lv = 0;
    if (!low) { for (var s = 0; s < BLUR_STEPS.length; s++) if (a > BLUR_STEPS[s]) lv = s + 1; }
    if (lv !== b.level) {
      if (b.level) b.el.classList.remove('mb-' + b.axis + '-' + b.level);
      if (lv) b.el.classList.add('mb-' + b.axis + '-' + lv);
      b.level = lv;
    }
    if (b.axis === 'y') {
      b.el.style.setProperty('--shear', clamp(SS.vel * 0.010, -2.6, 2.6).toFixed(3) + 'deg');
      b.el.style.setProperty('--stretch', (1 + clamp(Math.abs(SS.vel) * 0.00075, 0, 0.055)).toFixed(4));
    }
  }
});

/* ══ 7. PARALLAX ══════════════════════════════════════════════════════════ */
var paraEls = $$('[data-speed]').map(function (el) {
  return { el: el, speed: parseFloat(el.dataset.speed) || 0, y: 0, base: '' };
});
onFrame(null, function (dt) {
  if (REDUCED) return;
  var vh = win.innerHeight;
  for (var i = 0; i < paraEls.length; i++) {
    var p = paraEls[i], r = p.el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) continue;
    var mid = r.top + r.height / 2 - vh / 2;
    var target = -mid * p.speed;
    p.y = damp(p.y, target, 12, dt);
    p.el.style.setProperty('--py', p.y.toFixed(2) + 'px');
  }
});

/* ══ 8. SEAM MORPHING ═════════════════════════════════════════════════════
   Two point-sets, one path. We lerp the numbers and rebuild the `d` with a
   Catmull-Rom→bezier pass, so the divider genuinely reshapes (and its fill
   crossfades into the next section's colour) instead of just sliding. */
var SEAM_A = [140, 96, 66, 52, 58, 78, 100, 118, 130];   /* calm    */
var SEAM_B = [96, 46, 22, 40, 78, 44, 16, 52, 92];       /* crested */
function seamPath(ys) {
  var n = ys.length, step = 1440 / (n - 1), d = 'M0,' + ys[0].toFixed(1), i;
  for (i = 0; i < n - 1; i++) {
    var x0 = i * step, x1 = (i + 1) * step;
    var y0 = ys[i], y1 = ys[i + 1];
    var cx = (x0 + x1) / 2;
    d += ' C' + cx.toFixed(1) + ',' + y0.toFixed(1) + ' ' + cx.toFixed(1) + ',' + y1.toFixed(1) + ' ' + x1.toFixed(1) + ',' + y1.toFixed(1);
  }
  return d + ' L1440,140 L0,140 Z';
}
var seams = $$('[data-seam]').map(function (el) {
  var from = hexRGB(el.dataset.from), to = hexRGB(el.dataset.to);
  el.style.background = el.dataset.from;
  return { el: el, path: $('path', el), from: from, to: to, ys: SEAM_A.slice(), last: '' };
});
onFrame(null, function (dt) {
  var vh = win.innerHeight;
  for (var i = 0; i < seams.length; i++) {
    var s = seams[i], r = s.el.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    var t = easeInOut(p);
    /* shape peaks mid-transit then settles — a crest that passes through */
    var crest = Math.sin(t * Math.PI);
    for (var k = 0; k < s.ys.length; k++) {
      var goal = lerp(SEAM_A[k], SEAM_B[k], crest);
      s.ys[k] = REDUCED ? goal : damp(s.ys[k], goal, 6, dt);
    }
    var d = seamPath(s.ys);
    if (d !== s.last) { s.path.setAttribute('d', d); s.last = d; }
    s.path.setAttribute('fill', mixRGB(s.from, s.to, clamp(t * 1.35 - .12, 0, 1)));
  }
});

/* ══ 9. (removed) ═════════════════════════════════════════════════════════
   There was a shared-element morph here that flew a ghost of the hero plate
   down into the philosophy medallion. It travelled straight across the hero
   headline on the way, which read as a glitch rather than a transition, so it
   is gone. Both elements now simply hold their own photograph and the
   medallion arrives with an ordinary entrance. */

/* ══ 10. MARQUEE ══════════════════════════════════════════════════════════ */
var marquee = $('#marquee');
if (marquee) {
  var mTrack = $('.marquee__track', marquee);
  var html0 = mTrack.innerHTML;
  var reps = Math.max(3, Math.ceil((win.innerWidth * 2) / Math.max(mTrack.scrollWidth, 400)) + 1);
  for (var mi = 1; mi < reps; mi++) mTrack.insertAdjacentHTML('beforeend', html0);
  var mUnit = mTrack.scrollWidth / reps, mOff = 0, mVel = 0;
  var mBlur = blurEls.filter(function (b) { return b.el === marquee; })[0];

  win.addEventListener('resize', function () { mUnit = mTrack.scrollWidth / reps; });
  onFrame(null, function (dt) {
    if (REDUCED) return;
    var boost = clamp(SS.vel * 0.55, -34, 34);
    mVel = damp(mVel, 0.9 + boost, 7, dt);         /* base drift + scroll coupling */
    mOff -= mVel * (dt / 16.667);
    if (mUnit > 0) { while (mOff <= -mUnit) mOff += mUnit; while (mOff > 0) mOff -= mUnit; }
    mTrack.style.transform = 'translate3d(' + mOff.toFixed(2) + 'px,0,0)';
    if (mBlur) mBlur.local = mVel * 1.6;
  });
}

/* ══ 11. PINNED HORIZONTAL GALLERY ════════════════════════════════════════ */
var gal = $('#gallery'), galTrack = $('#galTrack'), galBar = $('#galBar');
if (gal && galTrack) {
  var galRange = 0, galBlur = blurEls.filter(function (b) { return b.el === galTrack; })[0];
  var galX = 0;

  function galMeasure() {
    if (REDUCED) { gal.style.height = ''; return; }
    galRange = Math.max(0, galTrack.scrollWidth - win.innerWidth);
    gal.style.height = (win.innerHeight + galRange * 1.05) + 'px';
  }
  galMeasure();
  win.addEventListener('resize', galMeasure);
  win.addEventListener('load', galMeasure);

  onFrame(null, function (dt) {
    if (REDUCED || !galRange) return;
    var r = gal.getBoundingClientRect();
    if (r.bottom < 0 || r.top > win.innerHeight) return;
    var p = clamp(-r.top / (r.height - win.innerHeight), 0, 1);
    var goal = -p * galRange;
    var prev = galX;
    galX = damp(galX, goal, 14, dt);
    galTrack.style.transform = 'translate3d(' + galX.toFixed(2) + 'px,0,0)';
    if (galBar) galBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (galBlur) galBlur.local = (galX - prev) * (16.667 / dt);
  });

  /* drag → converts horizontal intent into scroll, so momentum stays unified */
  var dragging = false, dragX = 0, pid = null;
  galTrack.addEventListener('pointerdown', function (e) {
    if (REDUCED || !galRange) return;
    dragging = true; dragX = e.clientX; pid = e.pointerId;
    galTrack.classList.add('is-drag');
  });
  galTrack.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - dragX; dragX = e.clientX;
    var ratio = (gal.getBoundingClientRect().height - win.innerHeight) / galRange;
    scrollBy(-dx * ratio);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    galTrack.addEventListener(ev, function () { dragging = false; galTrack.classList.remove('is-drag'); });
  });
}

/* ══ 12. CRAFT — sticky media reacts to the step in view ═══════════════════ */
var craftCap = $('#craftCap'), capWrap = $('.craft__cap');
var craftSteps = $$('.craft__step'), craftShots = $$('.craft__shot');
if (craftCap && craftSteps.length) {
  var craftCur = -1, cTick = 0;
  onFrame(null, function () {
    if (++cTick % 4) return;
    var mid = win.innerHeight / 2, best = -1, bestD = 1e9;
    for (var i = 0; i < craftSteps.length; i++) {
      var r = craftSteps[i].getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0 || best === craftCur || bestD > win.innerHeight * 0.75) return;
    craftCur = best;
    var kanji = craftSteps[craftCur].dataset.craft;
    /* the photograph cross-fades on its own timing; the kanji flicks out and
       back so the two changes read as one gesture rather than two */
    for (var k = 0; k < craftShots.length; k++) {
      craftShots[k].classList.toggle('is-on', craftShots[k].dataset.craftImg === kanji);
    }
    capWrap.classList.add('is-swap');
    setTimeout(function () {
      craftCap.textContent = kanji;
      capWrap.classList.remove('is-swap');
    }, 190);
  });
}

/* ══ 13. NAV ══════════════════════════════════════════════════════════════ */
var nav = $('#nav');
var sections = $$('[data-bg]').map(function (el) { return { el: el, light: hexRGB(el.dataset.bg)[0] > 140 }; });
var navHidden = false, navSolid = false, navLight = false;
onFrame(null, function () {
  if (!nav) return;
  var y = SS.current;
  /* The bar is STATEFUL: it changes only on a decisive direction, and idling
     does not bring it back. Recomputing `hide` from velocity each frame meant
     that stopping mid-page dropped velocity to zero and the bar reappeared —
     it has to stay gone until you actually scroll up. */
  var hide = navHidden;
  if (overlayOpen || y < 80) hide = false;
  else if (SS.vel > 1.5) hide = true;
  else if (SS.vel < -1.5) hide = false;
  if (hide !== navHidden) { nav.classList.toggle('is-hidden', hide); navHidden = hide; }
  var solid = y > 90;
  if (solid !== navSolid) { nav.classList.toggle('is-solid', solid); navSolid = solid; }
  var light = false;
  for (var i = 0; i < sections.length; i++) {
    var r = sections[i].el.getBoundingClientRect();
    if (r.top <= 54 && r.bottom > 54) { light = sections[i].light; break; }
  }
  if (light !== navLight) { nav.classList.toggle('is-onlight', light); navLight = light; }
});

/* ══ 14. OVERLAY MENU ═════════════════════════════════════════════════════ */
var burger = $('#burger'), overlay = $('#overlay'), overlayBg = $('.overlay__bg'), overlayOpen = false;
function openOverlay() {
  if (!overlay || overlayOpen) return;
  var r = burger.getBoundingClientRect();
  overlayBg.style.left = (r.left + r.width / 2) + 'px';
  overlayBg.style.top = (r.top + r.height / 2) + 'px';
  overlay.hidden = false;
  overlay.offsetHeight;                                   /* commit before transition */
  overlay.classList.add('is-open');
  burger.classList.add('is-open');
  if (nav) nav.classList.add('is-menu');
  burger.setAttribute('aria-expanded', 'true');
  burger.setAttribute('aria-label', 'Close menu');
  html.classList.add('is-locked');
  SS.locked = true; overlayOpen = true;
}
function closeOverlay() {
  if (!overlay || !overlayOpen) return;
  overlay.classList.remove('is-open');
  burger.classList.remove('is-open');
  if (nav) nav.classList.remove('is-menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Open menu');
  html.classList.remove('is-locked');
  SS.locked = false; overlayOpen = false;
  SS.target = SS.current = win.scrollY;
  setTimeout(function () { if (!overlayOpen) overlay.hidden = true; }, 900);
}
if (burger) burger.addEventListener('click', function () { overlayOpen ? closeOverlay() : openOverlay(); });
doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOverlay(); });

/* ══ 15. CURSOR ═══════════════════════════════════════════════════════════ */
var cur = $('#cursor');
if (cur && HOVER && !COARSE && !REDUCED) {
  var dot = $('i', cur), ring = $('b', cur);
  var mx = win.innerWidth / 2, my = win.innerHeight / 2;
  var dx = mx, dy = my, rx = mx, ry = my, shown = false;
  win.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!shown) { shown = true; cur.style.opacity = '1'; }
    var t = e.target.closest('[data-cursor]');
    cur.classList.toggle('is-link', !!t && t.dataset.cursor === 'link');
    cur.classList.toggle('is-card', !!t && t.dataset.cursor === 'card');
  });
  cur.style.opacity = '0';
  cur.style.transition = 'opacity 300ms ease';
  onFrame(null, function (dt) {
    dx = damp(dx, mx, 34, dt); dy = damp(dy, my, 34, dt);   /* dot: quick    */
    rx = damp(rx, mx, 13, dt); ry = damp(ry, my, 13, dt);   /* ring: trailing */
    dot.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
    ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
  });
} else if (cur) { cur.style.display = 'none'; }

/* ══ 16. PETALS ═══════════════════════════════════════════════════════════ */
var cvs = $('#petals');
if (cvs && !REDUCED) {
  var ctx = cvs.getContext('2d'), dpr = Math.min(win.devicePixelRatio || 1, 2);
  var pw = 0, ph = 0, petals = [], visible = true;
  function petalResize() {
    var r = cvs.getBoundingClientRect();
    pw = r.width; ph = r.height;
    cvs.width = Math.round(pw * dpr); cvs.height = Math.round(ph * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seed() {
    var n = html.dataset.quality === 'low' ? 8 : (win.innerWidth < 760 ? 12 : 22);
    petals = [];
    for (var i = 0; i < n; i++) petals.push({
      x: Math.random() * pw, y: Math.random() * ph,
      s: 5 + Math.random() * 7, r: Math.random() * Math.PI * 2,
      vr: (Math.random() - .5) * .018, vy: .16 + Math.random() * .42,
      sway: .5 + Math.random() * 1.3, ph: Math.random() * 6.28,
      flip: Math.random() * 6.28, vf: .012 + Math.random() * .022,
      a: .22 + Math.random() * .34
    });
  }
  petalResize(); seed();
  win.addEventListener('resize', function () { petalResize(); seed(); });
  onFrame(null, function () {
    var r = cvs.getBoundingClientRect();
    visible = r.bottom > 0 && r.top < win.innerHeight;
  });

  var pt = 0;
  onFrame(null, function (dt) {
    if (!visible || !pw) return;
    pt += dt / 1000;
    ctx.clearRect(0, 0, pw, ph);
    var drift = clamp(SS.vel * 0.22, -9, 9);          /* scroll pushes the petals */
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.y += (p.vy + drift * 0.5) * (dt / 16.667);
      p.x += Math.sin(pt * p.sway + p.ph) * .35;
      p.r += p.vr;
      p.flip += p.vf * (dt / 16.667);
      if (p.y > ph + 20) { p.y = -20; p.x = Math.random() * pw; }
      if (p.y < -40) { p.y = ph + 10; }
      var turn = Math.cos(p.flip);                    /* petals turn edge-on as they fall */
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.scale(turn, 1);
      ctx.globalAlpha = p.a * (0.35 + 0.65 * Math.abs(turn));
      ctx.fillStyle = i % 3 ? '#f6c9d1' : '#fbe3e7';
      var s2 = p.s;
      ctx.beginPath();                                 /* a petal, notched at the tip */
      ctx.moveTo(0, -s2);
      ctx.bezierCurveTo(s2 * .95, -s2 * .55, s2 * .8, s2 * .55, 0, s2);
      ctx.bezierCurveTo(-s2 * .8, s2 * .55, -s2 * .95, -s2 * .55, 0, -s2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  });
}

/* ══ 16b. SPECIAL ROLL CARDS — one open at a time ═════════════════════════ */
var rollCards = $$('.rc');
rollCards.forEach(function (card) {
  card.addEventListener('click', function () {
    var open = card.getAttribute('aria-expanded') === 'true';
    for (var i = 0; i < rollCards.length; i++) rollCards[i].setAttribute('aria-expanded', 'false');
    card.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
});

/* ══ 16c. ROLL CAROUSEL ═══════════════════════════════════════════════════
   Five rolls in view, stepping one card along on the tempo grid and looping
   through all twenty-three. The list is cloned once so the wrap happens on a
   duplicate and can be reset invisibly at the seam. */
var rollCar = $('#rollCar'), rollTrack = $('#rollTrack');
if (rollCar && rollTrack) {
  var originals = $$('.rcard', rollTrack);
  var COUNT = originals.length;
  originals.forEach(function (c) {
    var clone = c.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
    rollTrack.appendChild(clone);
  });

  var STEP_MS = BEAT * 5;                     /* ~3.3s — five beats a card */
  var rIndex = 0, rHeld = 0, rElapsed = 0, rSeen = true;
  var rBar = $('.rollcar__bar i', rollCar), rCount = $('#rollCount');

  function stepPx() {
    var first = originals[0];
    if (!first) return 0;
    var gap = parseFloat(getComputedStyle(rollTrack).gap) || 0;
    return first.getBoundingClientRect().width + gap;
  }
  function perView() {
    var v = getComputedStyle(rollCar).getPropertyValue('--per');
    return Math.max(1, parseInt(v, 10) || 5);
  }
  function paint(instant) {
    rollTrack.classList.toggle('is-instant', !!instant);
    rollTrack.style.transform = 'translate3d(' + (-rIndex * stepPx()).toFixed(2) + 'px,0,0)';
    if (instant) { rollTrack.offsetHeight; rollTrack.classList.remove('is-instant'); }
    if (rCount) {
      var per = perView();
      var a = (rIndex % COUNT) + 1;
      var b = ((rIndex + per - 1) % COUNT) + 1;
      rCount.textContent = a + ' – ' + b + ' of ' + COUNT;
    }
  }
  function go(delta, viaUser) {
    rIndex += delta;
    rElapsed = 0;
    if (viaUser) rHeld = 1400;
    if (rIndex >= COUNT) { rIndex -= COUNT; paint(true); return; }
    if (rIndex < 0) { rIndex += COUNT; paint(true); return; }
    paint(false);
  }

  $$('.rollcar__nav button', rollCar).forEach(function (b) {
    b.addEventListener('click', function () { go(+b.dataset.dir, true); });
  });
  ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) {
    rollCar.addEventListener(ev, function () { rHeld = 1e9; }, { passive: true });
  });
  ['mouseleave', 'focusout', 'touchend'].forEach(function (ev) {
    rollCar.addEventListener(ev, function () { rHeld = 700; }, { passive: true });
  });

  var rsx = null;
  rollCar.addEventListener('touchstart', function (e) { rsx = e.touches[0].clientX; }, { passive: true });
  rollCar.addEventListener('touchend', function (e) {
    if (rsx === null) return;
    var dx = e.changedTouches[0].clientX - rsx;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1, true);
    rsx = null;
  }, { passive: true });

  win.addEventListener('resize', function () { paint(true); });
  paint(true);

  onFrame(null, function (dt) {
    var r = rollCar.getBoundingClientRect();
    rSeen = r.bottom > 0 && r.top < win.innerHeight;
    if (REDUCED || !rSeen) { if (rBar) rBar.style.transform = 'scaleX(0)'; return; }
    if (rHeld > 0) { rHeld -= dt; return; }
    rElapsed += dt;
    if (rBar) rBar.style.transform = 'scaleX(' + Math.min(1, rElapsed / STEP_MS).toFixed(3) + ')';
    if (rElapsed >= STEP_MS) go(1);
  });
}

/* ══ 17. FORM ═════════════════════════════════════════════════════════════ */
var form = $('#resForm');
if (form) {
  var dateEl = form.querySelector('input[name="date"]');
  if (dateEl) {
    var d = new Date(); d.setDate(d.getDate() + 1);
    dateEl.min = new Date().toISOString().slice(0, 10);
    dateEl.value = d.toISOString().slice(0, 10);
  }
  /* Any time the restaurant is actually open. Hours differ by day, so the time
     field is bounded from the date rather than offering four fixed slots. */
  var HOURS = [                      /* 0 = Sunday */
    { open: '12:30', close: '22:00' },
    null,                            /* Monday, closed */
    { open: '11:30', close: '22:00' },
    { open: '11:30', close: '22:00' },
    { open: '11:30', close: '22:00' },
    { open: '11:30', close: '22:30' },
    { open: '11:30', close: '22:30' }
  ];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var timeEl = form.querySelector('input[name="time"]');
  var hintEl = $('#timeHint');

  function pretty(t) {
    var h = +t.slice(0, 2), m = t.slice(3);
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ap;
  }
  function windowFor() {
    if (!dateEl || !dateEl.value) return null;
    var parts = dateEl.value.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return { day: d.getDay(), hrs: HOURS[d.getDay()] };
  }
  function syncHours() {
    var w = windowFor();
    if (!w || !timeEl) return;
    if (!w.hrs) {
      timeEl.removeAttribute('min'); timeEl.removeAttribute('max');
      timeEl.setCustomValidity('We are closed on Mondays — please pick another day.');
      if (hintEl) { hintEl.textContent = 'Closed Mondays'; hintEl.dataset.bad = '1'; }
      return;
    }
    timeEl.min = w.hrs.open;
    timeEl.max = w.hrs.close;
    var t = timeEl.value;
    var bad = t && (t < w.hrs.open || t > w.hrs.close);
    timeEl.setCustomValidity(bad
      ? 'We are open ' + pretty(w.hrs.open) + ' to ' + pretty(w.hrs.close) + ' on ' + DAYS[w.day] + '.'
      : '');
    if (hintEl) {
      hintEl.textContent = DAYS[w.day] + ': ' + pretty(w.hrs.open) + ' – ' + pretty(w.hrs.close);
      if (bad) hintEl.dataset.bad = '1'; else delete hintEl.dataset.bad;
    }
  }
  if (dateEl) dateEl.addEventListener('change', syncHours);
  if (timeEl) timeEl.addEventListener('input', syncHours);
  syncHours();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    syncHours();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    /* TODO wire to your booking provider (Resy / SevenRooms / Tock / email API).
       Nothing leaves the browser as written. */
    form.classList.add('is-sent');
  });
}

/* ══ 18. LOADER ═══════════════════════════════════════════════════════════ */
var loader = $('#loader'), lFill = $('#loaderFill'), lNum = $('#loaderNum');
if (loader) {
  if (REDUCED) { loader.remove(); }
  else {
    var pct = 0, done = false, loaded = false;
    win.addEventListener('load', function () { loaded = true; });
    var lStart = performance.now();
    (function count(now) {
      var elapsed = (now || performance.now()) - lStart;
      var ceiling = loaded ? 100 : Math.min(92, elapsed / 11);
      pct = Math.min(ceiling, pct + Math.max(.6, (ceiling - pct) * .06));
      lFill.style.width = pct + '%';
      lNum.textContent = String(Math.floor(pct)).padStart(2, '0');
      if (pct < 99.4) requestAnimationFrame(count);
      else if (!done) { done = true; finish(); }
    })();
    function finish() {
      loader.classList.add('is-out');
      setTimeout(function () {
        loader.classList.add('is-gone');
        setTimeout(function () { loader.remove(); }, 400);
      }, BEAT * 2);
    }
    /* safety: never trap the page behind the loader */
    setTimeout(function () { if (!done) { done = true; finish(); } }, 4500);
  }
}

/* ══ GO ═══════════════════════════════════════════════════════════════════ */
requestAnimationFrame(tick);
doc.addEventListener('visibilitychange', function () { last = performance.now(); });

})();
