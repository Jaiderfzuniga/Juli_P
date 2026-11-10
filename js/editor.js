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
  var toggle = el('button', { class: 'editor__toggle', type: 'button', 'aria-expanded': 'true', text: 'Ocultar editor' });
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

  function commit() {
    cfg = Object.assign({}, Gift.update(cfg));
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
  var replayBtn = el('button', { class: 'editor__btn', type: 'button', text: 'Repetir animación' });
  var resetBtn = el('button', { class: 'editor__btn editor__btn--quiet', type: 'button', text: 'Restablecer textos' });

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

  toggle.addEventListener('click', function () {
    var closed = panel.classList.toggle('is-closed');
    toggle.textContent = closed ? 'Editar' : 'Ocultar editor';
    toggle.setAttribute('aria-expanded', String(!closed));
    document.documentElement.classList.toggle('editor-closed', closed);
  });

  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(foot);
  document.documentElement.classList.add('has-editor');
  document.body.appendChild(panel);
})();
