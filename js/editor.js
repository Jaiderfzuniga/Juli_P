/* ============================================================
   editor.js — panel para personalizar la página
   Solo aparece si la dirección termina en ?editar
   Cada cambio se ve al instante y se guarda como borrador en
   este navegador. "Copiar enlace" genera la dirección que se le
   envía a la persona: ella ve la página final, sin editor.
   ============================================================ */
(function () {
  'use strict';
  var Gift = window.Gift;
  if (!Gift || !Gift.editing) return;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  var cfg = Object.assign({}, Gift.config);

  var panel = el('aside', { class: 'editor', 'aria-label': 'Editor de la página' });
  var toggle = el('button', { class: 'editor__toggle', type: 'button', 'aria-expanded': 'true', text: 'Ocultar' });
  var head = el('header', { class: 'editor__head' }, [
    el('h2', { class: 'editor__title', text: 'Personalizar' }),
    toggle,
  ]);
  var body = el('div', { class: 'editor__body' });
  body.appendChild(el('p', {
    class: 'editor__note',
    text: 'Los cambios se ven al instante. Escribe {nombre} en cualquier texto para insertar el nombre de quien lo recibe.',
  }));

  /* ---------- Pie: enlace para compartir ---------- */
  var linkOut = el('input', { class: 'editor__link', id: 'ed-link', type: 'text', readonly: '' });
  linkOut.value = Gift.shareUrl(cfg);
  linkOut.addEventListener('focus', function () { linkOut.select(); });
  var status = el('p', { class: 'editor__status', role: 'status', 'aria-live': 'polite' });

  /* Las muestras de letra escriben el nombre de quien lo recibe. */
  function refreshSamples() {
    Array.prototype.forEach.call(panel.querySelectorAll('[data-sample]'), function (n) { n.textContent = cfg.para || 'Nombre'; });
  }

  function commit() {
    cfg = Object.assign({}, Gift.update(cfg));
    refreshSamples();
    Gift.saveDraft(cfg);
    linkOut.value = Gift.shareUrl(cfg);
    status.textContent = '';
  }

  /* ---------- Campos ---------- */
  var group = null;
  Gift.fields.forEach(function (f) {
    if (f.grupo) {
      group = el('fieldset', { class: 'editor__group' }, [el('legend', { text: f.grupo })]);
      body.appendChild(group);
      return;
    }
    var id = 'ed-' + f.key;
    var wrap = el('div', { class: 'editor__field' });
    var target = group || body;

    if (f.type === 'tema') {
      wrap.appendChild(el('span', { class: 'editor__label', id: id + '-l', text: f.label }));
      var row = el('div', { class: 'editor__swatches', role: 'radiogroup', 'aria-labelledby': id + '-l' });
      Object.keys(Gift.themes).forEach(function (name) {
        var t = Gift.themes[name];
        var b = el('button', {
          type: 'button', class: 'editor__swatch', role: 'radio',
          'aria-checked': String(cfg[f.key] === name), 'aria-label': t.nombre, title: t.nombre,
        });
        b.style.setProperty('--swatch', t.color || t.petal);
        b.addEventListener('click', function () {
          cfg[f.key] = name;
          Array.prototype.forEach.call(row.children, function (c) { c.setAttribute('aria-checked', String(c === b)); });
          commit();
        });
        row.appendChild(b);
      });
      wrap.appendChild(row);
      target.appendChild(wrap);
      return;
    }

    if (f.type === 'fuente') {
      wrap.appendChild(el('span', { class: 'editor__label', id: id + '-l', text: f.label }));
      var grid = el('div', { class: 'editor__fonts', role: 'radiogroup', 'aria-labelledby': id + '-l' });
      Object.keys(Gift.fonts).forEach(function (name) {
        var ft = Gift.fonts[name];
        Gift.loadFont(name);                       // para que cada muestra se vea con su letra
        var title = el('span', { class: 'editor__font-name', text: ft.nombre });
        title.style.fontFamily = ft.titulo;
        title.style.fontWeight = ft.peso;
        var sample = el('span', { class: 'editor__font-hand', 'data-sample': '' });
        sample.style.fontFamily = ft.mano;
        var b = el('button', {
          type: 'button', class: 'editor__font', role: 'radio',
          'aria-checked': String(cfg[f.key] === name), 'aria-label': ft.nombre,
        }, [title, sample]);
        b.addEventListener('click', function () {
          cfg[f.key] = name;
          Array.prototype.forEach.call(grid.children, function (c) { c.setAttribute('aria-checked', String(c === b)); });
          commit();
        });
        grid.appendChild(b);
      });
      wrap.appendChild(grid);
      target.appendChild(wrap);
      return;
    }

    var max = f.max || 200;
    var input = f.type === 'area'
      ? el('textarea', { id: id, rows: '5', maxlength: String(max) })
      : el('input', { id: id, type: 'text', maxlength: String(max), autocomplete: 'off', spellcheck: f.type === 'url' ? 'false' : 'true' });
    input.value = cfg[f.key] || '';
    var count = el('span', { class: 'editor__count', 'aria-hidden': 'true' });
    function refreshCount() { count.textContent = input.value.length + ' / ' + max; }
    refreshCount();
    input.addEventListener('input', function () {
      cfg[f.key] = input.value;
      refreshCount();
      commit();
    });
    wrap.appendChild(el('label', { class: 'editor__label', for: id, text: f.label }));
    wrap.appendChild(input);
    if (f.type !== 'url') wrap.appendChild(count);
    if (f.ayuda) wrap.appendChild(el('p', { class: 'editor__help', text: f.ayuda }));
    target.appendChild(wrap);
  });

  /* ---------- Acciones ---------- */
  var copyBtn = el('button', { class: 'editor__btn editor__btn--main', type: 'button', text: 'Copiar enlace' });
  var viewBtn = el('button', { class: 'editor__btn', type: 'button', text: 'Vista previa', title: 'Abre el enlace tal como lo verá quien lo recibe' });
  var replayBtn = el('button', { class: 'editor__btn', type: 'button', text: 'Repetir', title: 'Recarga la página para ver la animación desde el principio' });
  var resetBtn = el('button', { class: 'editor__btn editor__btn--quiet', type: 'button', text: 'Restablecer', title: 'Vuelve al contenido original y borra el borrador' });

  copyBtn.addEventListener('click', function () {
    var url = Gift.shareUrl(cfg);
    function ok() { status.textContent = 'Enlace copiado. Envíaselo a ' + (cfg.para || 'esa persona') + '.'; }
    function manual() {
      linkOut.focus();
      linkOut.select();
      status.textContent = 'No se pudo copiar automáticamente. Copia el enlace seleccionado.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, manual);
    else manual();
  });
  viewBtn.addEventListener('click', function () { window.open(Gift.shareUrl(cfg), '_blank', 'noopener'); });
  replayBtn.addEventListener('click', function () { Gift.saveDraft(cfg); location.reload(); });
  resetBtn.addEventListener('click', function () {
    if (!window.confirm('¿Volver al contenido original? Se borra el borrador guardado en este navegador.')) return;
    Gift.clearDraft();
    location.reload();
  });

  var foot = el('footer', { class: 'editor__foot' }, [
    el('label', { class: 'editor__label', for: 'ed-link', text: 'Enlace para enviar' }),
    linkOut,
    el('div', { class: 'editor__actions' }, [copyBtn, viewBtn, replayBtn, resetBtn]),
    status,
  ]);

  /* Botón flotante para volver a abrir el editor. Va fuera del panel
     (fijo a la pantalla) para que no se pierda al ocultarlo en el celular. */
  var fab = el('button', { class: 'editor-fab', type: 'button', 'aria-label': 'Abrir el editor', hidden: '' });
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>';
  fab.appendChild(el('span', { text: 'Editar' }));

  function setClosed(closed) {
    panel.classList.toggle('is-closed', closed);
    panel.setAttribute('aria-hidden', String(closed));
    if ('inert' in panel) panel.inert = closed;
    fab.hidden = !closed;
    toggle.setAttribute('aria-expanded', String(!closed));
    document.documentElement.classList.toggle('editor-closed', closed);
    (closed ? fab : toggle).focus({ preventScroll: true });
  }
  toggle.addEventListener('click', function () { setClosed(true); });
  fab.addEventListener('click', function () { setClosed(false); });

  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(foot);
  document.documentElement.classList.add('has-editor');
  document.body.appendChild(panel);
  document.body.appendChild(fab);
  refreshSamples();
})();
