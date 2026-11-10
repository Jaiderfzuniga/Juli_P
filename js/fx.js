/* ============================================================
   fx.js — todo lo que se dibuja en canvas
     · cielo: estrellas con parallax y estrellas fugaces
     · luciérnagas que siguen el dedo o el cursor
     · pétalos que caen
     · flores nuevas que crecen donde se toca el suelo
   Expone window.GardenFX para que main.js lo dirija.
   ============================================================ */
(function () {
  'use strict';

  var scene = document.getElementById('scene');
  var stage = document.getElementById('stage');
  var skyCv = document.getElementById('sky');
  var fxCv = document.getElementById('fx');
  var sky = skyCv.getContext('2d');
  var fx = fxCv.getContext('2d');
  var reduce = window.Gift.reduce;

  var W = 0, H = 0, dpr = 1;
  var colors = { petal: '#fce700', deep: '#f2b800', hi: '#fffb00' };
  var glow = null;                 // sprite de la luciérnaga
  var stars = [], shooting = null, nextShoot = 0;
  var flies = [], petals = [], planted = [];
  var awake = false;               // false = portada, true = jardín
  var pointer = { x: 0, y: 0, on: false, nx: 0, ny: 0 };
  var par = { x: 0, y: 0 };        // parallax suavizado
  var raf = 0, last = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- Tamaño ---------- */
  function resize() {
    var r = scene.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    [skyCv, fxCv].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    sky.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedStars();
    seedFlies();
  }

  function seedStars() {
    var n = Math.round(Math.min(220, (W * H) / 5200));
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random(), y: Math.pow(Math.random(), 1.7) * 0.8,
        r: rand(0.4, 1.5), depth: rand(0.2, 1), phase: rand(0, 6.28), speed: rand(0.4, 1.6),
      });
    }
  }

  function seedFlies() {
    var want = reduce ? 10 : Math.round(Math.min(34, Math.max(16, W / 38)));
    while (flies.length < want) {
      flies.push({
        x: rand(0, W), y: rand(H * 0.25, H * 0.95), vx: 0, vy: 0,
        a: rand(0, 6.28), phase: rand(0, 6.28), blink: rand(0.6, 1.8), size: rand(10, 22),
      });
    }
    flies.length = want;
  }

  function buildGlow() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.12, colors.hi);
    grad.addColorStop(0.4, hexA(colors.petal, 0.35));
    grad.addColorStop(1, hexA(colors.petal, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    glow = c;
  }

  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ---------- Cielo ---------- */
  function drawSky(t) {
    sky.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase));
      sky.globalAlpha = tw * (awake ? 0.9 : 0.55);
      sky.fillStyle = '#eef3ff';
      sky.beginPath();
      sky.arc(s.x * W - par.x * 14 * s.depth, s.y * H - par.y * 8 * s.depth, s.r, 0, 6.2832);
      sky.fill();
    }
    sky.globalAlpha = 1;

    if (reduce || !awake) return;
    if (!shooting && t > nextShoot) {
      shooting = { x: rand(0.05, 0.7) * W, y: rand(0.02, 0.3) * H, v: rand(9, 14), len: rand(90, 160), life: 1 };
      nextShoot = t + rand(5000, 11000);
    }
    if (shooting) {
      var st = shooting;
      st.x += st.v; st.y += st.v * 0.45; st.life -= 0.022;
      if (st.life <= 0) { shooting = null; return; }
      var g = sky.createLinearGradient(st.x, st.y, st.x - st.len, st.y - st.len * 0.45);
      g.addColorStop(0, 'rgba(255,255,255,' + st.life + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      sky.strokeStyle = g; sky.lineWidth = 1.6; sky.lineCap = 'round';
      sky.beginPath(); sky.moveTo(st.x, st.y); sky.lineTo(st.x - st.len, st.y - st.len * 0.45); sky.stroke();
    }
  }

  /* ---------- Luciérnagas ---------- */
  function drawFlies(t, dt) {
    fx.globalCompositeOperation = 'lighter';
    var active = awake ? flies.length : Math.min(7, flies.length);
    for (var i = 0; i < active; i++) {
      var f = flies[i];
      f.a += rand(-0.25, 0.25);
      f.vx += Math.cos(f.a) * 0.018;
      f.vy += Math.sin(f.a) * 0.014 - 0.002;
      if (pointer.on) {
        var dx = pointer.x - f.x, dy = pointer.y - f.y, d = Math.hypot(dx, dy) || 1;
        if (d < 240 && d > 26) { f.vx += (dx / d) * 0.035; f.vy += (dy / d) * 0.035; }
      }
      f.vx *= 0.975; f.vy *= 0.975;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < -30) f.x = W + 30; else if (f.x > W + 30) f.x = -30;
      if (f.y < H * 0.08) f.vy += 0.03; else if (f.y > H + 20) f.y = H * 0.4;
      var b = Math.max(0, Math.sin(t * 0.001 * f.blink + f.phase));
      fx.globalAlpha = 0.15 + 0.85 * b;
      fx.drawImage(glow, f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
    }
    fx.globalAlpha = 1;
    fx.globalCompositeOperation = 'source-over';
  }

  /* ---------- Pétalos ---------- */
  function addPetal(x, y, vx, vy, size) {
    if (petals.length > 260) petals.shift();
    petals.push({ x: x, y: y, vx: vx, vy: vy, rot: rand(0, 6.28), vr: rand(-0.08, 0.08), flip: rand(0, 6.28), size: size || rand(6, 11), life: 1, sway: rand(0, 6.28) });
  }

  function petalPath(c, s) {
    c.beginPath();
    c.moveTo(0, -s);
    c.bezierCurveTo(s * 0.85, -s * 0.55, s * 0.6, s * 0.75, 0, s);
    c.bezierCurveTo(-s * 0.6, s * 0.75, -s * 0.85, -s * 0.55, 0, -s);
  }

  function drawPetals(t, dt) {
    for (var i = petals.length - 1; i >= 0; i--) {
      var p = petals[i];
      p.vy += 0.035 * dt; p.vx *= 0.985; p.vy = Math.min(p.vy, 2.6);
      p.sway += 0.04 * dt;
      p.x += (p.vx + Math.sin(p.sway) * 0.7) * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt; p.flip += 0.07 * dt;
      if (p.y > H * 0.82) p.life -= 0.02 * dt;
      if (p.life <= 0 || p.y > H + 30) { petals.splice(i, 1); continue; }
      fx.save();
      fx.translate(p.x, p.y); fx.rotate(p.rot); fx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.flip)));
      fx.globalAlpha = Math.min(1, p.life) * 0.95;
      fx.fillStyle = Math.cos(p.flip) > 0 ? colors.petal : colors.deep;
      petalPath(fx, p.size); fx.fill();
      fx.restore();
    }
    fx.globalAlpha = 1;
  }

  /* ---------- Flores sembradas ---------- */
  function drawPlanted(t) {
    for (var i = planted.length - 1; i >= 0; i--) {
      var f = planted[i];
      var age = t - f.born;
      var grow = Math.min(1, age / 900); grow = 1 - Math.pow(1 - grow, 3);
      var bloom = Math.max(0, Math.min(1, (age - 700) / 800)); bloom = 1 - Math.pow(1 - bloom, 3);
      var fade = f.dying ? Math.max(0, 1 - (t - f.dying) / 600) : 1;
      if (fade <= 0) { planted.splice(i, 1); continue; }
      var sway = Math.sin(t * 0.0012 + f.phase) * 5 * grow;
      var topX = f.x + f.lean * grow + sway, topY = f.y - f.h * grow;
      var midX = f.x + f.lean * 0.1, midY = f.y - f.h * 0.55 * grow;

      fx.globalAlpha = fade;
      fx.strokeStyle = '#1aaa15'; fx.lineWidth = f.w; fx.lineCap = 'round';
      fx.beginPath(); fx.moveTo(f.x, f.y); fx.quadraticCurveTo(midX, midY, topX, topY); fx.stroke();

      if (grow > 0.5) {                               // dos hojas
        var lk = (grow - 0.5) * 2;
        fx.fillStyle = '#12921a';
        [-1, 1].forEach(function (side) {
          fx.save();
          fx.translate(f.x + f.lean * 0.18, f.y - f.h * 0.38);
          fx.rotate(side * (1.05 + sway * 0.01)); fx.scale(lk, lk); fx.translate(0, -f.r * 1.1);
          petalPath(fx, f.r * 1.1); fx.restore(); fx.fill();
        });
      }
      if (bloom > 0) {                                // corola
        fx.save(); fx.translate(topX, topY); fx.rotate(sway * 0.02 + f.tilt);
        for (var k = 0; k < f.n; k++) {
          var pk = Math.max(0, Math.min(1, bloom * 1.6 - (k / f.n) * 0.6));
          fx.save(); fx.rotate((k / f.n) * 6.2832); fx.translate(0, -f.r * 0.95 * pk); fx.scale(pk, pk);
          fx.fillStyle = k % 2 ? colors.petal : colors.deep;
          petalPath(fx, f.r); fx.fill(); fx.restore();
        }
        fx.fillStyle = '#fffbe8';
        fx.beginPath(); fx.arc(0, 0, f.r * 0.42 * bloom, 0, 6.2832); fx.fill();
        fx.restore();
      }
    }
    fx.globalAlpha = 1;
  }

  /* ---------- Bucle ---------- */
  function frame(t) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(2.5, (t - last) / 16.7 || 1); last = t;
    if (!reduce) {
      par.x += (pointer.nx - par.x) * 0.05; par.y += (pointer.ny - par.y) * 0.05;
      stage.style.transform = 'translate3d(' + (-par.x * 12).toFixed(2) + 'px,' + (-par.y * 6).toFixed(2) + 'px,0)';
    }
    drawSky(t);
    fx.clearRect(0, 0, W, H);
    drawPlanted(t);
    drawFlies(t, dt);
    drawPetals(t, dt);
  }

  function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  /* ---------- Entrada ---------- */
  function local(e) {
    var r = scene.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  window.addEventListener('pointermove', function (e) {
    var p = local(e);
    pointer.x = p.x; pointer.y = p.y; pointer.on = true;
    pointer.nx = (p.x / W - 0.5) * 2; pointer.ny = (p.y / H - 0.5) * 2;
  }, { passive: true });
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') pointer.on = false; }, { passive: true });
  document.addEventListener('mouseleave', function () { pointer.on = false; pointer.nx = 0; pointer.ny = 0; });
  window.addEventListener('deviceorientation', function (e) {
    if (e.gamma == null || pointer.on) return;
    pointer.nx = Math.max(-1, Math.min(1, e.gamma / 30));
    pointer.ny = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });
  if (window.ResizeObserver) new ResizeObserver(resize).observe(scene); else window.addEventListener('resize', resize);

  /* ---------- API ---------- */
  window.GardenFX = {
    isGround: function (y) { return y > H * 0.6; },
    setColors: function (c) { colors = c; buildGlow(); },
    wake: function () { awake = true; nextShoot = performance.now() + 3500; },
    /* Las luciérnagas cercanas salen disparadas */
    scatter: function (x, y, force) {
      flies.forEach(function (f) {
        var dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy) || 1;
        if (d < 260) { var k = (1 - d / 260) * (force || 6); f.vx += (dx / d) * k; f.vy += (dy / d) * k; }
      });
    },
    /* Las luciérnagas se juntan en un punto (al abrir la portada) */
    gather: function (x, y) {
      flies.forEach(function (f, i) { if (i < 7) { f.x = x + rand(-90, 90); f.y = y + rand(-60, 60); } });
    },
    burst: function (x, y, n) {
      n = reduce ? 4 : (n || 12);
      for (var i = 0; i < n; i++) {
        var a = rand(0, 6.28), v = rand(1, 4.2);
        addPetal(x, y, Math.cos(a) * v, Math.sin(a) * v - 2);
      }
    },
    shower: function () {
      var n = reduce ? 12 : 56;
      for (var i = 0; i < n; i++) addPetal(rand(0, W), rand(-H * 0.6, -10), rand(-0.6, 0.6), rand(0.6, 1.6), rand(7, 13));
    },
    plant: function (x, y) {
      var alive = planted.filter(function (f) { return !f.dying; });
      if (alive.length >= 22) alive[0].dying = performance.now();
      var scale = Math.max(0.7, Math.min(1.25, W / 700));
      planted.push({
        x: x, y: Math.max(y, H * 0.6) + rand(0, 12), born: performance.now(),
        h: rand(70, 150) * scale, lean: rand(-26, 26), r: rand(12, 18) * scale, w: rand(3.4, 4.8),
        n: Math.random() < 0.5 ? 6 : 8, tilt: rand(0, 1), phase: rand(0, 6.28),
      });
    },
  };

  buildGlow();
  resize();
  run();
})();
