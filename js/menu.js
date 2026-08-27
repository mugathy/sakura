/* Menu page behaviour: live search across every dish, and a section rail that
   tracks where you are. Progressive enhancement — with JS off the full menu is
   already in the markup and simply reads top to bottom. */
(function () {
'use strict';

var $  = function (s, c) { return (c || document).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

var search = $('#menuSearch');
var searchSticky = $('#menuSearchSticky');
var countEl = $('#menuCount');
var countSticky = $('#menuCountSticky');
var emptyEl = $('#menuEmpty');
var clearBtn = $('#menuClear');
if (!search) return;

var cats = $$('.mcat').map(function (sec) {
  return {
    el: sec,
    head: $('.mcat__head', sec),
    count: $('.mcat__count', sec),
    total: $$('.mi', sec).length,
    items: $$('.mi', sec).map(function (li) {
      var name = ($('.mi__name', li) || {}).textContent || '';
      var desc = ($('.mi__desc', li) || {}).textContent || '';
      return { el: li, hay: (name + ' ' + desc).toLowerCase() };
    })
  };
});
var totalDishes = cats.reduce(function (n, c) { return n + c.total; }, 0);

function plural(n) { return n === 1 ? 'dish' : 'dishes'; }

function apply(q) {
  q = q.trim().toLowerCase();
  var shown = 0;
  cats.forEach(function (c) {
    var hits = 0;
    c.items.forEach(function (it) {
      var on = !q || it.hay.indexOf(q) !== -1;
      it.el.hidden = !on;
      if (on) hits++;
    });
    c.el.hidden = hits === 0;
    if (c.count) c.count.textContent = q
      ? hits + ' of ' + c.total
      : c.total + ' ' + plural(c.total);
    shown += hits;
  });
  var summary = q
    ? shown + ' ' + plural(shown) + ' matching “' + q + '”'
    : totalDishes + ' dishes across ' + cats.length + ' sections';
  if (countEl) countEl.textContent = summary;
  if (countSticky) countSticky.textContent = summary;
  /* keep both fields showing the same query without echoing back into the one
     being typed in */
  if (search && search.value !== q && document.activeElement !== search) search.value = q;
  if (searchSticky && searchSticky.value !== q && document.activeElement !== searchSticky) searchSticky.value = q;
  if (emptyEl) emptyEl.hidden = shown !== 0;
  document.body.classList.toggle('is-searching', !!q);
}

var wait;
function bindField(el) {
  if (!el) return;
  el.addEventListener('input', function () {
    clearTimeout(wait);
    wait = setTimeout(function () { apply(el.value); }, 110);
  });
  el.addEventListener('search', function () { apply(el.value); });
}
bindField(search);
bindField(searchSticky);

/* ── search from anywhere: the rail carries its own field ─────────────────
   Opening it does not move the page, so you can filter without losing your
   place halfway down 240 dishes. */
var findBtn = $('#railFind'), findRow = $('#railSearchRow'), findClose = $('#railFindClose');
function openFind() {
  if (!findRow) return;
  findRow.hidden = false;
  findRow.offsetHeight;
  findRow.classList.add('is-on');
  if (findBtn) findBtn.setAttribute('aria-expanded', 'true');
  if (searchSticky) searchSticky.focus();
}
function closeFind(clear) {
  if (!findRow) return;
  findRow.classList.remove('is-on');
  if (findBtn) findBtn.setAttribute('aria-expanded', 'false');
  setTimeout(function () { if (!findRow.classList.contains('is-on')) findRow.hidden = true; }, 320);
  if (clear) { apply(''); }
}
if (findBtn) findBtn.addEventListener('click', function () {
  if (findRow.classList.contains('is-on')) closeFind(false); else openFind();
});
if (findClose) findClose.addEventListener('click', function () { closeFind(true); });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && findRow && findRow.classList.contains('is-on')) closeFind(true);
  /* "/" is the usual shortcut for search */
  if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); openFind(); }
});
if (clearBtn) clearBtn.addEventListener('click', function () {
  search.value = ''; apply(''); search.focus();
});
apply('');

/* rail highlight — plain rect maths on scroll, no observer needed */
var rail = $('.mrail');
if (rail) {
  var links = $$('a', rail);
  var current = -1;
  var tick = 0;
  (function loop() {
    requestAnimationFrame(loop);
    if (++tick % 6) return;
    var best = -1, bestTop = -1e9;
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].el.hidden) continue;
      var t = cats[i].el.getBoundingClientRect().top - 150;
      if (t <= 0 && t > bestTop) { bestTop = t; best = i; }
    }
    if (best === current || best < 0) return;
    current = best;
    for (var k = 0; k < links.length; k++) links[k].classList.remove('is-here');
    var id = cats[best].el.id;
    var link = rail.querySelector('a[href="#' + id + '"]');
    if (link) {
      link.classList.add('is-here');
      /* keep the active chip in view without yanking the page */
      var lr = link.getBoundingClientRect(), rr = rail.getBoundingClientRect();
      if (lr.left < rr.left + 8 || lr.right > rr.right - 8) {
        rail.scrollTo({ left: link.offsetLeft - rail.clientWidth / 2 + link.offsetWidth / 2, behavior: 'smooth' });
      }
    }
  })();
}

})();
