/* ============================================================
   main.js — dirige la experiencia
     1. Portada  → la persona toca y las flores crecen
     2. Jardín   → frase, luciérnagas, sembrar flores al tocar
     3. Carta    → sale de un sobre y se escribe palabra a palabra
     4. Despedida→ lluvia de pétalos al cerrar
   El contenido llega de window.Gift (store.js).
   ============================================================ */
(function () {
  'use strict';

  var Gift = window.Gift;
  var FX = window.GardenFX;
  var reduce = window.Gift.reduce;
  var EASE = 'cubic-bezier(.16, 1, .3, 1)';
  function $(id) { return document.getElementById(id); }

  var scene = $('scene'), hero = $('hero'), heroTitle = $('heroTitle');
  var bloomBtn = $('bloomBtn'), openBtn = $('openBtn');
  var letter = $('letter'), paper = $('paper'), paperText = $('paperText'), closeBtn = $('closeBtn');
  var envParts = Array.prototype.slice.call(document.querySelectorAll('.env'));
  var envFlap = $('envFlap'), envSeal = $('envSeal');
  var photo = $('photo'), photoImg = $('photoImg'), farewell = $('farewell');

  var bloomed = false, letterOpen = false, busy = false, tapped = false;
  var farewellTimer = 0;

  /* ---------- Pintar una configuración ---------- */
  function setWords(node, text) {
    node.textContent = '';
    var i = 0;
    String(text).split('\n').forEach(function (line, n) {
      if (n) node.appendChild(document.createElement('br'));
      line.split(/\s+/).filter(Boolean).forEach(function (w) {
        var s = document.createElement('span');
        s.className = 'word';
        s.style.setProperty('--i', i++);
        s.textContent = w;
        node.appendChild(s);
        node.appendChild(document.createTextNode(' '));
      });
    });
    return i;
  }

  function render(cfg) {
    var theme = Gift.themes[cfg.tema] || Gift.themes[Gift.defaults.tema];
    var root = document.documentElement.style;
    root.setProperty('--petal', theme.petal);
    root.setProperty('--petal-deep', theme.deep);
    root.setProperty('--petal-hi', theme.hi);
    FX.setColors(theme);

    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (n) {
      n.textContent = Gift.text(cfg, n.getAttribute('data-t'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-words]'), function (n) {
      n.dataset.count = setWords(n, Gift.text(cfg, n.getAttribute('data-words')));
    });

    if (cfg.foto) {
      if (photoImg.getAttribute('src') !== cfg.foto) photoImg.src = cfg.foto;
      photoImg.alt = 'Foto para ' + (cfg.para || 'ti');
    } else {
      photoImg.removeAttribute('src');
      photo.hidden = true;
    }
    document.title = cfg.para ? 'Flores para ' + cfg.para : 'Flores para ti';
  }

  photoImg.addEventListener('load', function () { photo.hidden = false; });
  photoImg.addEventListener('error', function () { photo.hidden = true; });

  /* ---------- 1 → 2: florecer ---------- */
  function center(elm) {
    var r = elm.getBoundingClientRect(), s = scene.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
  }

  function bloom() {
    if (bloomed) return;
    bloomed = true;
    var c = center(bloomBtn);
    FX.burst(c.x, c.y, 18);
    FX.scatter(c.x, c.y, 9);
    FX.wake();
    document.body.classList.remove('is-waiting');

    var words = Number(heroTitle.dataset.count) || 6;
    var titleAt = 2300;
    var readyAt = titleAt + words * (reduce ? 30 : 85) + 700;
    setTimeout(function () { hero.classList.add('is-in'); }, titleAt);
    setTimeout(function () {
      hero.classList.add('is-ready', 'is-static');
      if (!letterOpen && (document.activeElement === bloomBtn || document.activeElement === document.body)) {
        openBtn.focus({ preventScroll: true });
      }
    }, readyAt);
    setTimeout(function () { if (!tapped) hero.classList.add('is-hinting'); }, readyAt + 2600);
  }
  bloomBtn.addEventListener('click', bloom);

  /* ---------- 2: tocar el jardín ---------- */
  scene.addEventListener('pointerdown', function (e) {
    if (!bloomed || e.target.closest('button')) return;
    var s = scene.getBoundingClientRect();
    var x = e.clientX - s.left, y = e.clientY - s.top;
    if (FX.isGround(y)) {
      FX.plant(x, y);
      FX.burst(x, y - 12, 4);
      if (!tapped) { tapped = true; hero.classList.remove('is-hinting'); }
    } else {
      FX.burst(x, y, 12);
    }
    FX.scatter(x, y, 5);
  });

  /* ---------- 3: carta ---------- */
  function play(node, frames, opts) {
    opts.fill = 'forwards';
    return node.animate(frames, opts).finished;
  }
  function clearAnimations() {
    envParts.concat([paper, envSeal]).forEach(function (n) {
      n.getAnimations().forEach(function (a) { a.cancel(); });
    });
    envFlap.style.zIndex = '';
  }

  function openLetter() {
    if (busy || letterOpen || !bloomed) return;
    busy = true; letterOpen = true;
    clearTimeout(farewellTimer); endFarewell();
    clearAnimations();
    paper.classList.remove('is-in', 'is-static');
    letter.hidden = false;
    paper.scrollTop = 0;
    void letter.offsetWidth;
    letter.classList.add('is-open');

    var words = Number(paperText.dataset.count) || 20;
    paper.style.setProperty('--sign-delay', (words * 45 + 500) + 'ms');

    function done() {
      paper.classList.add('is-in');
      closeBtn.focus({ preventScroll: true });
      busy = false;
      // Al terminar de escribirse, el texto queda fijo (el editor puede cambiarlo sin re-animar).
      setTimeout(function () { if (letterOpen) paper.classList.add('is-static'); }, words * 45 + 2200);
    }

    if (reduce) {
      play(paper, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }).then(done);
      return;
    }

    var env = envParts[0];
    var eh = env.offsetHeight, ew = env.offsetWidth;
    var s0 = Math.min((eh - 20) / paper.offsetHeight, (ew - 36) / paper.offsetWidth);
    var inside = 'translateY(0px) scale(' + s0 + ')';
    var risen = 'translateY(' + (-eh * 0.86) + 'px) scale(' + s0 + ')';

    Promise.all(envParts.map(function (n) {
      return play(n, [{ transform: 'translateY(75vh)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 750, easing: EASE });
    })).then(function () {
      play(envSeal, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.5)', opacity: 0 }], { duration: 240, easing: 'ease-in' });
      return play(envFlap, [
        { transform: 'translateY(0) perspective(900px) rotateX(0deg)', opacity: 1 },
        { transform: 'translateY(0) perspective(900px) rotateX(180deg)', opacity: 1 },
      ], { duration: 520, delay: 120, easing: 'cubic-bezier(.5, 0, .25, 1)' });
    }).then(function () {
      envFlap.style.zIndex = '0';
      return play(paper, [{ opacity: 1, transform: inside }, { opacity: 1, transform: risen }], { duration: 600, easing: EASE });
    }).then(function () {
      envParts.forEach(function (n) {
        var from = n === envFlap ? 'translateY(0) perspective(900px) rotateX(180deg)' : 'translateY(0)';
        var to = n === envFlap ? 'translateY(70vh) perspective(900px) rotateX(180deg)' : 'translateY(70vh)';
        play(n, [{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.7, 0, .84, 0)' });
      });
      return play(paper, [{ opacity: 1, transform: risen }, { opacity: 1, transform: 'translateY(0px) scale(1)' }], { duration: 820, delay: 80, easing: EASE });
    }).then(done);
  }

  function closeLetter() {
    if (busy || !letterOpen) return;
    busy = true;
    letter.classList.remove('is-open');
    play(paper, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(26px) scale(.96)' }], {
      duration: reduce ? 150 : 300, easing: 'ease-in',
    }).then(function () {
      letter.hidden = true;
      clearAnimations();
      letterOpen = false; busy = false;
      openBtn.focus({ preventScroll: true });
      startFarewell();
    });
  }

  openBtn.addEventListener('click', openLetter);
  closeBtn.addEventListener('click', closeLetter);
  $('letterBackdrop').addEventListener('click', closeLetter);
  document.addEventListener('keydown', function (e) {
    if (!letterOpen) return;
    if (e.key === 'Escape') closeLetter();
    // El único control de la carta es "cerrar": el foco se queda dentro.
    if (e.key === 'Tab' && !e.target.closest('.editor')) { e.preventDefault(); closeBtn.focus(); }
  });

  /* La foto se inclina hacia el cursor */
  if (!reduce) {
    paper.addEventListener('pointermove', function (e) {
      var r = photo.getBoundingClientRect();
      if (!r.width) return;
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      dx = Math.max(-1, Math.min(1, dx)); dy = Math.max(-1, Math.min(1, dy));
      photo.style.transform = 'perspective(700px) rotate(-2.2deg) rotateY(' + (dx * 7).toFixed(2) + 'deg) rotateX(' + (-dy * 6).toFixed(2) + 'deg)';
    });
    paper.addEventListener('pointerleave', function () { photo.style.transform = ''; });
  }

  /* ---------- 4: despedida ---------- */
  function startFarewell() {
    if (!farewell.textContent.trim()) return;
    scene.classList.add('is-farewell');
    farewell.classList.add('is-in');
    FX.shower();
    farewellTimer = setTimeout(endFarewell, 3800);
  }
  function endFarewell() {
    scene.classList.remove('is-farewell');
    farewell.classList.remove('is-in');
  }

  /* ---------- Arranque ---------- */
  Gift.render = render;
  render(Gift.config);
  var gc = center(bloomBtn);
  FX.gather(gc.x, gc.y);
})();
