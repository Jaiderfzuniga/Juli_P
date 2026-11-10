/* ============================================================
   store.js — de dónde sale el contenido de la página
   Orden de prioridad:
     1. Enlace personalizado  (#d=... en la dirección)
     2. Borrador del editor   (solo en modo ?editar)
     3. js/config.js          (contenido por defecto)
   Todo el texto se escribe en la página con textContent, nunca
   como HTML, así un enlace no puede inyectar código.
   ============================================================ */
(function () {
  'use strict';

  var DEFAULTS = window.GIFT_DEFAULTS || {};
  var THEMES = window.GIFT_THEMES || {};
  var FIELDS = (window.GIFT_FIELDS || []).filter(function (f) { return f.key; });
  var DRAFT_KEY = 'regalo-borrador:' + location.pathname;

  function encode(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj));
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decode(text) {
    var b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  /* Solo se aceptan enlaces http(s) o rutas relativas del propio sitio. */
  function safeUrl(value) {
    var v = String(value || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[a-z][a-z0-9+.-]*:/i.test(v) || v.indexOf('//') === 0) return '';
    return v;
  }

  /* Se queda solo con las claves conocidas, como texto y con largo máximo. */
  function sanitize(raw) {
    var out = {};
    if (!raw || typeof raw !== 'object') return out;
    FIELDS.forEach(function (f) {
      if (!(f.key in raw)) return;
      var v = raw[f.key];
      if (typeof v !== 'string') return;
      v = v.slice(0, f.max || 200);
      if (f.type === 'tema') { if (!THEMES[v]) return; }
      if (f.type === 'url') v = safeUrl(v);
      out[f.key] = v;
    });
    return out;
  }

  function readHash() {
    var m = location.hash.match(/(?:^#|&)d=([\w-]+)/);
    if (!m) return null;
    try { return sanitize(decode(m[1])); } catch (e) { return null; }
  }

  function readDraft() {
    try { return sanitize(JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')); }
    catch (e) { return null; }
  }

  function saveDraft(cfg) {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(diff(cfg))); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* idem */ }
  }

  /* Solo lo que cambia respecto al contenido por defecto: enlaces más cortos. */
  function diff(cfg) {
    var d = {};
    FIELDS.forEach(function (f) {
      if (cfg[f.key] !== DEFAULTS[f.key]) d[f.key] = cfg[f.key];
    });
    return d;
  }

  function merge(extra) {
    var cfg = {};
    FIELDS.forEach(function (f) { cfg[f.key] = DEFAULTS[f.key] || ''; });
    Object.keys(extra || {}).forEach(function (k) { cfg[k] = extra[k]; });
    return cfg;
  }

  function shareUrl(cfg) {
    var d = diff(cfg);
    var base = location.origin + location.pathname;
    if (location.protocol === 'file:') base = location.href.split(/[?#]/)[0];
    return Object.keys(d).length ? base + '#d=' + encode(d) : base;
  }

  /* {nombre} dentro de cualquier texto se cambia por el destinatario. */
  function text(cfg, key) {
    return String(cfg[key] || '').replace(/\{nombre\}/gi, cfg.para || '');
  }

  var editing = /[?&]editar\b/.test(location.search);

  /* Si el dispositivo pide "reducir movimiento" se suavizan los efectos.
     Añadir ?animar a la dirección fuerza la versión completa. */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !/[?&]animar\b/.test(location.search);
  if (reduce) document.documentElement.classList.add('reduce');

  var fromLink = readHash();
  var initial = merge(fromLink || (editing ? readDraft() : null));

  window.Gift = {
    config: initial,
    editing: editing,
    reduce: reduce,
    defaults: DEFAULTS,
    themes: THEMES,
    fields: window.GIFT_FIELDS || [],
    merge: merge,
    sanitize: sanitize,
    shareUrl: shareUrl,
    saveDraft: saveDraft,
    clearDraft: clearDraft,
    text: text,
    /* La escena registra aquí cómo pintar una configuración. */
    render: function () {},
    update: function (cfg) {
      this.config = merge(sanitize(cfg));
      this.render(this.config);
      return this.config;
    },
  };
})();
