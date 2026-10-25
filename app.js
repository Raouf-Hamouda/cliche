// Cliché: header, menu, collection filter, cart, product gallery and variants.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (RM) $$('video').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });

  /* photo tiles: the worn photos of the piece change in turn (static under reduced motion) */
  if (!RM) $$('.tile.rot').forEach(function (t, k) {
    var im = $$('img', t), i = 0; if (im.length < 2) return;
    setTimeout(function () { setInterval(function () { im[i].classList.remove('on'); i = (i + 1) % im.length; im[i].classList.add('on'); }, 4800); }, 1200 + k * 900);
  });

  /* feel: images fade in as they load, sections rise in, links prefetch on hover */
  $$('img').forEach(function (im) { if (im.complete && im.naturalWidth) im.classList.add('rdy'); else { im.addEventListener('load', function () { im.classList.add('rdy'); }); im.addEventListener('error', function () { im.classList.add('rdy'); }); } });
  if (!RM && 'IntersectionObserver' in window) {
    var rv = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    $$('.tile,.band .bc,.cell,.pc,.nrow,.nyear h3,.story,.more h2,.prow,.aitem,.mkf,.cform > *').forEach(function (e) { e.classList.add('rv'); rv.observe(e); });
  }
  var pf = {}; $$('a[href^="/"]').forEach(function (a) { a.addEventListener('pointerenter', function () { var h = a.getAttribute('href').split('#')[0]; if (!h || pf[h]) return; pf[h] = 1; var l = document.createElement('link'); l.rel = 'prefetch'; l.href = h; document.head.appendChild(l); }, { once: true }); });

  /* header: transparent over the hero, white after scroll */
  var vh = $('#vh');
  function hv() { vh.classList.toggle('solid', scrollY > 40); } addEventListener('scroll', hv, { passive: true }); hv();

  /* phone-size copies of the gallery pictures (made by build.py at 600 and 1000 px wide) */
  function ss(g) { return '';
    if (!/img\/o\/.+\.webp$/.test(g.s) || /\.w\d+\.webp$/.test(g.s) || !g.w) return '';
    var k = Math.min(1, 1500 / Math.max(g.w, g.h || g.w)), w = Math.round(g.w * k), b = g.s.slice(0, -5);
    var p = [600, 1000].filter(function (x) { return w > x + 1; }).map(function (x) { return b + '.w' + x + '.webp ' + x + 'w'; });
    return p.length ? ' srcset="' + p.join(', ') + ', ' + g.s + ' ' + w + 'w" sizes="auto, (max-width:600px) 66vw, 50vw"' : '';
  }
  /* menu and basket share one modal focus and scroll boundary. */
  var menu = $('#menu'), basket = $('#drawer'), veil = $('#veil'), burger = $('#burger'), cartbtn = $('#cartbtn');
  var activeOverlay = null, returnFocus = null, savedOverflow = '', backgroundState = [];
  var focusable = 'a[href],button,input,select,textarea,[tabindex]';
  function canFocus(el) { return !!(el && el.isConnected && !el.disabled && !el.closest('[inert],[hidden]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'); }
  function overlayStops(panel) { return $$(focusable, panel).filter(function (el) { return el.tabIndex >= 0 && canFocus(el); }); }
  function focusOverlay(panel) { var stops = overlayStops(panel); (stops[0] || panel).focus({ preventScroll: true }); }
  function releaseBackground() {
    backgroundState.forEach(function (state) { state.el.inert = state.inert; });
    backgroundState = [];
  }
  function lockBackground(panel) {
    var child = panel;
    while (child && child.parentElement && child !== document.body) {
      [].slice.call(child.parentElement.children).forEach(function (sibling) {
        if (sibling === child || sibling === veil || /^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName)) return;
        backgroundState.push({ el: sibling, inert: sibling.inert }); sibling.inert = true;
      });
      child = child.parentElement;
    }
  }
  function closedOverlay(panel) {
    panel.classList.remove('open'); panel.inert = true; panel.setAttribute('aria-hidden', 'true'); panel.removeAttribute('aria-modal');
  }
  [menu, basket].forEach(function (panel) {
    panel.setAttribute('role', 'dialog'); panel.tabIndex = -1;
    if (!panel.getAttribute('aria-label')) panel.setAttribute('aria-label', 'Navigation');
    closedOverlay(panel);
  });
  [[burger, menu], [cartbtn, basket]].forEach(function (pair) {
    pair[0].setAttribute('aria-controls', pair[1].id); pair[0].setAttribute('aria-haspopup', 'dialog'); pair[0].setAttribute('aria-expanded', 'false');
  });
  veil.setAttribute('aria-hidden', 'true');
  function setOverlay(panel, open) {
    var previous = activeOverlay, trigger = panel === menu ? burger : cartbtn;
    if (open) {
      if (previous === panel) return;
      if (!previous) { returnFocus = document.activeElement; savedOverflow = document.body.style.overflow; }
      releaseBackground(); activeOverlay = panel;
      panel.inert = false; panel.setAttribute('aria-hidden', 'false'); panel.setAttribute('aria-modal', 'true'); panel.classList.add('open');
      burger.setAttribute('aria-expanded', panel === menu ? 'true' : 'false'); cartbtn.setAttribute('aria-expanded', panel === basket ? 'true' : 'false');
      veil.classList.toggle('open', panel === basket); document.body.style.overflow = 'hidden';
      focusOverlay(panel);
      if (previous) closedOverlay(previous);
      lockBackground(panel);
    } else if (previous === panel) {
      activeOverlay = null; releaseBackground(); document.body.style.overflow = savedOverflow;
      trigger.setAttribute('aria-expanded', 'false'); veil.classList.remove('open');
      var target = returnFocus && returnFocus.matches(focusable) && canFocus(returnFocus) ? returnFocus : (canFocus(trigger) ? trigger : (canFocus(cartbtn) ? cartbtn : $('.vlogo')));
      if (target) target.focus({ preventScroll: true });
      closedOverlay(panel); returnFocus = null;
    } else closedOverlay(panel);
  }
  function mopen(o) { setOverlay(menu, o); }
  burger.onclick = function () { mopen(true); }; $('#mclose').onclick = function () { mopen(false); };
  document.addEventListener('focusin', function (e) { if (activeOverlay && !activeOverlay.contains(e.target)) focusOverlay(activeOverlay); });
  document.addEventListener('keydown', function (e) {
    if (!activeOverlay) return;
    if (e.key === 'Escape') { e.preventDefault(); setOverlay(activeOverlay, false); return; }
    if (e.key !== 'Tab') return;
    var stops = overlayStops(activeOverlay), first = stops[0], last = stops[stops.length - 1];
    if (!stops.length) { e.preventDefault(); activeOverlay.focus({ preventScroll: true }); }
    else if (!activeOverlay.contains(document.activeElement) || document.activeElement === activeOverlay) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  var menuViewport = matchMedia('(max-width:1100px)');
  function menuResize(e) { if (!e.matches && activeOverlay === menu) mopen(false); }
  if (menuViewport.addEventListener) menuViewport.addEventListener('change', menuResize);
  else menuViewport.addListener(menuResize);

  /* cart */
  var K = 'cliche_cart';
  function fmt(p) { var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.')); return (n % 1 ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : n.toLocaleString('fr-FR')) + ' €'; }
  function getCart() { try { return JSON.parse(localStorage.getItem(K)) || []; } catch (e) { return []; } }
  function setCart(c) { try { localStorage.setItem(K, JSON.stringify(c)); } catch (e) { } drawCart(); }
  function drawCart() {
    var c = getCart(), n = c.reduce(function (a, l) { return a + l.q; }, 0); $('#cc').textContent = n;
    var dc = $('#dcount'); if (dc) dc.textContent = n ? '(' + n + ')' : '';
    var L = $('#lines'), focusedLine = document.activeElement.closest('.ln'), lineIndex = $$('.ln', L).indexOf(focusedLine), actionIndex = focusedLine ? $$('button', focusedLine).indexOf(document.activeElement) : -1;
    L.innerHTML = '';
    $('#drawer').classList.toggle('empty', !c.length);
    if (!c.length) { L.innerHTML = '<div class="dempty"><p class="det">Votre panier est vide.</p><a class="vlink" href="' + new URL('joaillerie.html', document.querySelector('.vlogo').href).href + '">Découvrir la joaillerie</a></div>'; $('#tot').textContent = ''; if (activeOverlay === basket && lineIndex >= 0) focusOverlay(basket); return; }
    c.forEach(function (l, i) {
      var d = document.createElement('div'); d.className = 'ln';
      var meta = [l.label, l.metal, l.size && 'Taille ' + l.size].filter(Boolean).join(' · ');
      d.innerHTML = '<div class="lth">' + (l.img ? '<img class="rdy" src="' + l.img + '" alt="">' : '') + '</div>' +
        '<div class="lbd"><div class="lname">' + l.name + '</div><div class="lmeta">' + meta + '</div>' +
        '<div class="lact"><div class="lq"><button aria-label="Moins">−</button><span>' + l.q + '</span><button aria-label="Plus">+</button></div><button class="lrm">Retirer</button></div></div>' +
        '<div class="lpr">' + fmt(l.price * l.q) + (l.q > 1 ? '<small>' + fmt(l.price) + ' l\'unité</small>' : '') + '</div>';
      var b = $$('button', d); b[0].onclick = function () { l.q = Math.max(1, l.q - 1); setCart(c); }; b[1].onclick = function () { l.q++; setCart(c); }; b[2].onclick = function () { c.splice(i, 1); setCart(c); };
      L.appendChild(d);
    });
    $('#tot').textContent = fmt(c.reduce(function (a, l) { return a + l.q * l.price; }, 0));
    if (activeOverlay === basket && lineIndex >= 0 && actionIndex >= 0) {
      var replacement = $$('.ln', L)[Math.min(lineIndex, c.length - 1)];
      $$('button', replacement)[actionIndex].focus({ preventScroll: true });
    }
  }
  function drawer(o) { setOverlay(basket, o); }
  cartbtn.onclick = function () { drawer(true); }; $('#dclose').onclick = function () { drawer(false); };
  veil.onclick = function () { if (activeOverlay) setOverlay(activeOverlay, false); };
  $('#dcont').onclick = function () { drawer(false); };
  drawCart();

  /* size guide: by measure (mm -> sizes) or by size (size -> mm), with Annuler */
  var mmIn = $('#mm');
  if (mmIn) {
    var rows = $$('#sztab tbody tr'), res = $('#fres'), fgrid = $('#fgrid'), sys = 1, mode = 'mm', HINT = '<span>Exemple : 53 mm donne Europe 53</span>';
    function show(r, withMm) {
      rows.forEach(function (x) { x.classList.remove('hit'); }); if (!r) { res.innerHTML = HINT; return; }
      r.classList.add('hit'); var c = $$('td', r);
      res.innerHTML = (withMm ? '<b>' + r.dataset.mm + ' mm</b>' : '') + (withMm ? '<span>' : '<b>') + 'Europe ' + c[0].textContent + (withMm ? '</span>' : '</b>') + '<span>US ' + c[1].textContent + '</span><span>UK ' + (c[2].textContent === '·' ? 'n/a' : c[2].textContent) + '</span><span>Japon ' + c[3].textContent + '</span>';
      var tb = $('#sztab'); if (tb) setTimeout(function () { r.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); }, 120);
    }
    function findMm() {
      var v = parseFloat(String(mmIn.value).replace(',', '.'));
      if (isNaN(v)) { show(null); return; }
      if (v < 43.5 || v > 71.5) { rows.forEach(function (x) { x.classList.remove('hit'); }); res.innerHTML = '<span>Cette mesure est hors du tableau (44 à 71 mm)</span>'; return; }
      show(rows.reduce(function (a, b) { return Math.abs(+b.dataset.mm - v) < Math.abs(+a.dataset.mm - v) ? b : a; }), false);
    }
    function fillSizes() {
      var seen = {}, html = '';
      rows.forEach(function (r) { var t = $$('td', r)[sys - 1].textContent; if (t && t !== '·' && !seen[t]) { seen[t] = 1; html += '<button type="button" role="radio" aria-checked="false" data-mm="' + r.dataset.mm + '">' + t + '</button>'; } });
      fgrid.innerHTML = html;
      $$('button', fgrid).forEach(function (b) { b.onclick = function () { $$('button', fgrid).forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); show(rows.filter(function (r) { return r.dataset.mm === b.dataset.mm; })[0], true); }; });
    }
    function setMode(m) {
      mode = m; $$('.fmode button[data-m]').forEach(function (b) { b.classList.toggle('on', b.dataset.m === m); });
      $('#fp-mm').classList.toggle('on', m === 'mm'); $('#fp-size').classList.toggle('on', m === 'size'); show(null);
      if (m === 'size') fillSizes();
    }
    mmIn.addEventListener('input', findMm);
    function step(d) { var v = parseFloat(String(mmIn.value).replace(',', '.')); mmIn.value = isNaN(v) ? 53 : Math.max(44, Math.min(71, v + d)); findMm(); mmIn.focus(); }
    $('#mmdn').onclick = function () { step(-0.5); }; $('#mmup').onclick = function () { step(0.5); };
    $$('.fmode button[data-m]').forEach(function (b) { b.onclick = function () { setMode(b.dataset.m); }; });
    $$('#fsys button').forEach(function (b) { b.onclick = function () { sys = +b.dataset.s; $$('#fsys button').forEach(function (x) { x.classList.toggle('on', x === b); }); fillSizes(); show(null); }; });
    $('#fcancel').onclick = function () { mmIn.value = ''; $$('button', fgrid).forEach(function (x) { x.classList.remove('on'); }); show(null); setMode('mm'); window.scrollTo({ top: $('.sg').offsetTop - 96, behavior: RM ? 'auto' : 'smooth' }); mmIn.focus(); };
  }

  /* collection filter */
  var grid = $('#grid');
  if (grid && $('#filt')) {
    function filt(t) { $$('#filt a').forEach(function (a) { a.classList.toggle('on', a.dataset.t === t); }); $$('.cell', grid).forEach(function (c) { c.classList.toggle('hide', !!t && c.dataset.type !== t); }); }
    $$('#filt a').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); filt(a.dataset.t); }; });
    var qt = new URLSearchParams(location.search).get('t'); if (qt) filt(qt);
  }

  /* product: enamel and metal are variants of one piece */
  var pdp = $('#pdp'); if (!pdp) return;
  /* Tall purchase panels must scroll far enough for their final controls to fit. */
  var purchasePanel = $('.pin', pdp), stickyFrame = 0, stickyTop = '';
  function updateProductSticky() {
    stickyFrame = 0;
    if (!purchasePanel) return;
    var top = Math.floor(Math.min(vh.getBoundingClientRect().height, innerHeight - purchasePanel.getBoundingClientRect().height - 24)) + 'px';
    if (top !== stickyTop) { purchasePanel.style.setProperty('--product-sticky-top', top); stickyTop = top; }
  }
  function scheduleProductSticky() { if (!stickyFrame) stickyFrame = requestAnimationFrame(updateProductSticky); }
  addEventListener('resize', scheduleProductSticky, { passive: true });
  if (purchasePanel && 'ResizeObserver' in window) {
    var purchaseResize = new ResizeObserver(scheduleProductSticky);
    purchaseResize.observe(purchasePanel); purchaseResize.observe(vh);
  }
  scheduleProductSticky();
  var P = JSON.parse($('#pd').textContent), sizes = $('#sizes'), chosen = '', szg = $('#szg'), q = new URLSearchParams(location.search);
  var v = P.variants.filter(function (x) { return x.tone === q.get('c') && x.metal === (q.get('m') || x.metal); })[0] || P.variants[0];
  function find(t, m) { return P.variants.filter(function (x) { return x.tone === t && x.metal === m; })[0] || P.variants.filter(function (x) { return x.tone === t; })[0] || P.variants.filter(function (x) { return x.metal === m; })[0] || P.variants[0]; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var first = true;
  function paint(vv) {
    var gal = $('#gal'), price = $('#price'); $('#add').setAttribute('data-price', fmt(vv.price));
    var drowsEl = $('#drows'), tok = (paint.tok = (paint.tok || 0) + 1);
    if (!first && !RM) price.classList.add('swap');
    setTimeout(function () { price.textContent = fmt(vv.price); price.classList.remove('swap'); }, first || RM ? 0 : 160);
    var en = $('#enname'); if (en) en.textContent = (function () { var b = $('#ens button[data-t="' + vv.tone + '"]'); return b ? b.dataset.l : ''; })();
    var story = [], mat = [], make = [];
    vv.desc.forEach(function (l, i) { if (/^(Matières|Dimensions)/i.test(l)) mat.push(l); else if (/^(Conçue|Autres couleurs|Contactez)/i.test(l)) make.push(l); else story.push(l); });
    function sec(t, arr, open) { return arr.length ? '<details' + (open ? ' open' : '') + '><summary>' + t + '</summary><div class="accb">' + arr.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div></details>' : ''; }
    var pl = $('#plede'); if (pl) pl.textContent = story[0] || '';
    $('#desc').innerHTML = sec('Description', story.slice(1), true) + sec('Matières et dimensions', mat, false) + sec('Fabrication', make, false);
    vv.gal.forEach(function (g) { var im = new Image(); im.src = g.s; });
    /* swap only once the new hero image is decoded and the old one has faded out: a crossfade, never a blank frame */
    function whenReady(go) {
      if (first || RM) { go(); return; }
      var pre = new Image(); pre.src = vv.gal[0].s;
      (pre.decode ? pre.decode() : Promise.resolve()).catch(function () {}).then(function () {
        if (tok !== paint.tok) return;
        /* a still copy of the current pictures lies on top, the new ones go in underneath, the copy dissolves: no white frame */
        [gal, drowsEl].forEach(function (el) {
          if (!el || !el.offsetHeight) return;
          var par = el.parentElement; if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
          var gh = el.cloneNode(true); gh.removeAttribute('id'); gh.className += ' ghost'; gh.setAttribute('aria-hidden', 'true');
          gh.style.cssText = 'position:absolute;left:' + el.offsetLeft + 'px;top:' + el.offsetTop + 'px;width:' + el.offsetWidth + 'px;margin:0;pointer-events:none;z-index:2;background:#fff';
          par.appendChild(gh);
          if (el === gal) gh.scrollLeft = gal.scrollLeft;
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            var a = gh.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
            a.onfinish = function () { gh.remove(); };
          }); });
        });
        go();
      });
    }
    whenReady(function () {
      var hero = vv.gal[0], rest = vv.gal.slice(1), photos = rest.filter(function (g) { return g.k !== 'pack'; }), packs = rest.filter(function (g) { return g.k === 'pack'; });
      var seq = [hero].concat(photos, packs), html = '';
      seq.forEach(function (g, i) {
        var cls = 'g ' + (g.k === 'pack' ? 'pack ' : 'ph ') + (i === 0 ? 'hero1 ' : '') + (g.k !== 'pack' && g.w && g.w < 1500 ? 'fit ' : '') + (g.k === 'pack' && g.w >= 1500 ? 'hq ' : '');
        var ar = g.w && g.h ? Math.max(g.w / g.h, .85).toFixed(3) : 1;
        html += '<div class="' + cls + '" style="--ar:' + ar + '"><img' + ss(g) + ' src="' + g.s + '" alt="' + esc(P.name) + '"' + (i > 1 ? ' loading="lazy"' : '') + '></div>';
      });
      gal.innerHTML = html;
      if (packs.length % 2 === 1) { var pk = hero.k === 'pack' ? hero : packs[0]; var f = document.createElement('div'); f.className = 'g fill'; f.style.background = (vv.color || '#dddddd') + '2b'; f.innerHTML = '<img class="rdy" src="' + pk.s + '" alt="">'; gal.appendChild(f); }
      (function () {
        var rowsEl = $('#drows'); if (!rowsEl) return;
        var all = [hero].concat(photos, packs), pk = all.filter(function (g) { return g.k === 'pack'; }), ph = all.filter(function (g) { return g.k !== 'pack'; });
        var order = hero.k === 'pack' ? [pk, ph] : [ph, pk], h = '';
        function packRow(a) { return '<div class="rp">' + a.map(function (g) { return '<figure class="cp' + (g.w >= 1500 ? ' hq' : '') + (g === hero ? ' is-hero' : '') + '"><img class="rdy"' + ss(g) + ' src="' + g.s + '" alt="' + esc(P.name) + '"></figure>'; }).join('') + '</div>'; }
        function photoRow(a) { return '<div class="rf' + (a.length === 1 ? ' one' : '') + '">' + a.map(function (g) { var ar = g.w && g.h ? g.w / g.h : 1; return '<figure' + (g === hero ? ' class="is-hero"' : '') + ' style="flex:' + ar.toFixed(3) + ' 1 0"><img class="rdy" loading="lazy"' + ss(g) + ' src="' + g.s + '" alt="' + esc(P.name) + '"></figure>'; }).join('') + '</div>'; }
        order.forEach(function (list, gi) { var isPack = list === pk; for (var q2 = 0; q2 < list.length; q2 += 2) h += (isPack ? packRow : photoRow)(list.slice(q2, q2 + 2)); });
        rowsEl.innerHTML = h;
      })();
      var dots = $('#gdots'); if (dots) { var n = $$('.g:not(.fill)', gal).length; dots.innerHTML = new Array(n + 1).join('<i></i>'); var di = $$('i', dots); if (di[0]) di[0].classList.add('on'); gal.scrollLeft = 0;
        gal.onscroll = function () { var k = Math.round(gal.scrollLeft / Math.max(1, gal.clientWidth)); di.forEach(function (x, a) { x.classList.toggle('on', a === k); }); }; }
      $$('img', gal).forEach(function (im) { if (im.complete) im.classList.add('rdy'); else im.addEventListener('load', function () { im.classList.add('rdy'); }); });
    });
    var has = vv.sizeflag && vv.sizes.length; szg.style.display = has ? '' : 'none';
    chosen = '';
    if (has) {
      var num = /^\d/.test(vv.sizes[0]); $('.sel-label', szg).textContent = num ? 'Taille' : 'Option'; sizes.className = 'sizes' + (num ? '' : ' txt');
      sizes.innerHTML = vv.sizes.map(function (s) { return '<button type="button" role="radio" aria-checked="false">' + s + '</button>'; }).join('');
      $$('button', sizes).forEach(function (b) { b.onclick = function () { chosen = b.textContent; $$('button', sizes).forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); sizes.classList.remove('need'); szg.classList.remove('need'); $('#selval').textContent = chosen; flash(''); bar(); setTimeout(function () { selOpen(false); }, 260); }; });
    }
    $('#selval').textContent = ''; $('#baprix').textContent = fmt(vv.price); var bi = $('#barre img'); if (bi) bi.src = vv.gal[0].s; bar();
    $$('#ens button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === vv.tone); b.classList.toggle('off', !P.variants.some(function (x) { return x.tone === b.dataset.t && x.metal === vv.metal; })); });
    $$('#mts button').forEach(function (b) { b.classList.toggle('on', b.dataset.m === vv.metal); b.classList.toggle('off', !P.variants.some(function (x) { return x.metal === b.dataset.m && x.tone === vv.tone; })); });
    var u = new URL(location); if (P.tones.length > 1) u.searchParams.set('c', vv.tone); if (P.metals.length > 1) u.searchParams.set('m', vv.metal); history.replaceState(null, '', u);
  }
  function slide(el, open, done) {
    if (el._a) el._a.cancel();
    if (RM || !el.animate) { done && done(); return; }
    var cs = getComputedStyle(el), full = { height: el.scrollHeight + 'px', paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, opacity: 1 }, none = { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 };
    el.style.overflow = 'hidden';
    el._a = el.animate(open ? [none, full] : [full, none], { duration: open ? 480 : 420, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    el._a.onfinish = function () { var a = el._a; el._a = null; done && done(); a.cancel(); el.style.overflow = ''; };
  }
  function selOpen(o, still) {
    var c = $('#selcorps'); if (o === szg.classList.contains('open')) return;
    szg.classList.toggle('open', o); $('#seltete').setAttribute('aria-expanded', o);
    if (o) { c.hidden = false; if (!still) slide(c, true); } else if (still) c.hidden = true; else slide(c, false, function () { c.hidden = true; });
  }
  $('#desc').addEventListener('click', function (e) {
    var sm = e.target.closest('summary'); if (!sm) return;
    var d = sm.parentElement, b = $('.accb', d); e.preventDefault();
    if (!d.open) { d.open = true; slide(b, true); } else { d.classList.add('closing'); slide(b, false, function () { d.open = false; d.classList.remove('closing'); }); }
  });
  $('#seltete').onclick = function () { selOpen(!szg.classList.contains('open')); };
  function flash(h, err) { var f = $('#flash'); f.innerHTML = h; f.classList.toggle('err', !!err); f.classList.toggle('on', !!h); }
  function bar() { var on = $('#ens button.on'), b = $('#baopts'); if (!b) return; b.textContent = [on ? on.dataset.l : '', P.metals.length > 1 ? (v.metal === 'argent' ? 'Argent 925' : 'Or 750') : '', chosen && 'Taille ' + chosen].filter(Boolean).join(' · '); }
  paint(v); first = false;
  /* decode every colour's first picture ahead of time, so a tap on a phone swaps at once instead of waiting on the network */
  var warm = []; (window.requestIdleCallback || setTimeout)(function () { P.variants.forEach(function (x) { var im = new Image(); im.src = x.gal[0].s; if (im.decode) im.decode().catch(function () {}); warm.push(im); }); });
  if (v.sizeflag && v.sizes.length) selOpen(true, true);
  $$('#ens button').forEach(function (b) { b.onclick = function () { v = find(b.dataset.t, v.metal); paint(v); }; });
  $$('#mts button').forEach(function (b) { b.onclick = function () { v = find(v.tone, b.dataset.m); paint(v); }; });
  $('#add').onclick = function () {
    var has = v.sizeflag && v.sizes.length;
    if (has && !chosen) { selOpen(true); szg.classList.add('need'); sizes.classList.remove('need'); void sizes.offsetWidth; sizes.classList.add('need'); szg.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); flash($('.sel-label', szg).textContent + '\u00a0: à choisir avant d’ajouter au panier.', true); return false; }
    var on = $('#ens button.on'), label = on ? (on.dataset.l || on.textContent) : '', metal = P.metals.length > 1 ? (v.metal === 'argent' ? 'Argent 925' : 'Or 750') : '';
    var k = [P.id, v.tone, v.metal, chosen].join('|'), c = getCart(), l = c.filter(function (x) { return x.k === k; })[0];
    if (l) l.q++; else c.push({ k: k, name: P.name, label: label, metal: metal, size: has ? chosen : '', price: parseFloat(v.price.replace(',', '.')), img: new URL(v.gal[0].s, location.href).href, q: 1 });
    setCart(c); var cc = $('#cc'); cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump');
    var ab = $('#add'), t0 = ab.textContent; ab.textContent = 'Ajouté'; ab.classList.add('done'); setTimeout(function () { ab.textContent = t0; ab.classList.remove('done'); }, 1300);
    flash('Ajouté au panier.<button type="button" id="voirp">Voir le panier</button>'); $('#voirp').onclick = function () { drawer(true); };
    return true;
  };
  $('#pay').onclick = function () { if ($('#add').onclick() !== false) setTimeout(function () { drawer(true); }, RM ? 0 : 250); };
  /* the buy bar takes over once the buy card has scrolled away (as on Alaya) */
  var barre = $('#barre'), ab = $('.achat-boutons');
  if (barre && ab && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { var e = es[0], on = !e.isIntersecting && e.boundingClientRect.top < 0; barre.classList.toggle('on', on); barre.setAttribute('aria-hidden', !on); $('#baadd').tabIndex = on ? 0 : -1; }).observe(ab);
    $('#baadd').onclick = function () { $('#add').onclick(); };
  }
})();

/* product photos: click opens the picture full screen; click again zooms in and follows the pointer; Escape, the cross or a click outside the picture closes */
(function () {
  var pdp = document.getElementById('pdp'); if (!pdp) return;
  var box = document.createElement('div'); box.className = 'lbx'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Photo');
  box.innerHTML = '<button type="button" class="lbx-x" aria-label="Fermer"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>';
  document.body.appendChild(box);
  var im = document.createElement('img'), last = null; im.className = 'rdy';
  function open(src, alt) { last = document.activeElement; if (!im.parentNode) box.appendChild(im); im.src = src; im.alt = alt || ''; box.classList.remove('zoom'); box.classList.add('on'); document.body.style.overflow = 'hidden'; box.querySelector('.lbx-x').focus(); }
  function close() { box.classList.remove('on', 'zoom'); document.body.style.overflow = ''; if (last) last.focus(); }
  pdp.addEventListener('click', function (e) {
    var t = e.target.closest('#gal img, #drows img'); if (!t || t.closest('.g.fill')) return;
    e.preventDefault(); open(t.currentSrc || t.src, t.alt);
  });
  box.addEventListener('click', function (e) {
    if (e.target === im) { box.classList.toggle('zoom'); move(e); } else close();
  });
  function move(e) { if (!box.classList.contains('zoom')) return; var r = im.getBoundingClientRect(); im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; }
  box.addEventListener('mousemove', move);
  /* phone: once zoomed, drag with a finger to travel across the picture */
  var ox = 50, oy = 50, tx, ty;
  function setO() { ox = Math.max(0, Math.min(100, ox)); oy = Math.max(0, Math.min(100, oy)); im.style.transformOrigin = ox + '% ' + oy + '%'; }
  box.addEventListener('touchstart', function (e) { var t = e.touches[0]; tx = t.clientX; ty = t.clientY; var m = /([\d.]+)% ([\d.]+)%/.exec(im.style.transformOrigin); if (m) { ox = +m[1]; oy = +m[2]; } }, { passive: true });
  box.addEventListener('touchmove', function (e) {
    if (!box.classList.contains('zoom') || e.touches.length > 1) return;
    e.preventDefault(); var t = e.touches[0];
    /* scale 2.4 about the origin: moving the origin by d shifts the picture by -1.4 d */
    ox -= (t.clientX - tx) / (1.4 * im.offsetWidth) * 100; oy -= (t.clientY - ty) / (1.4 * im.offsetHeight) * 100;
    tx = t.clientX; ty = t.clientY; setO();
  }, { passive: false });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('on')) close(); });
})();
