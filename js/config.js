/* ============================================================
   CONTENIDO POR DEFECTO
   Esto es lo que se ve cuando alguien abre la página sin un
   enlace personalizado. Para hacer una versión para otra persona
   NO hace falta tocar este archivo: abre la página con ?editar
   al final de la dirección y usa el editor.
   ============================================================ */
window.GIFT_DEFAULTS = {
  para: 'Juli',
  titulo: 'Estas flores amarillas son para ti',
  invitacion: 'Toca para que florezcan',
  boton: 'Ábreme',
  cartaEncabezado: 'Para ti',
  cartaTitulo: 'Mi casualidad más bonita',
  cartaTexto:
    'Las flores reales son hermosas, pero se marchitan. Por eso quise darte estas flores, porque al igual que lo que siento por ti, están hechas para durar toda la vida.',
  firma: 'Con cariño',
  despedida: 'Te quiero, {nombre}',
  foto: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=700',
  tema: 'amarillo',
  letra: 'clasica',
};

/* Temas de color. `petal` es el color de la flor; el resto se deriva. */
window.GIFT_THEMES = {
  amarillo: { nombre: 'Amarillo', petal: '#fce700', deep: '#f2b800', hi: '#fffb00' },
  rosa:     { nombre: 'Rosa',     petal: '#ff8fc2', deep: '#f0468f', hi: '#ffc4de' },
  blanco:   { nombre: 'Blanco',   petal: '#f6f1e4', deep: '#d9cfae', hi: '#ffffff' },
  lila:     { nombre: 'Lila',     petal: '#c3a6ff', deep: '#8a5cf0', hi: '#e2d4ff' },
  rojo:     { nombre: 'Rojo',     petal: '#ff5a5f', deep: '#c81e3a', hi: '#ff9a9a' },
  celeste:  { nombre: 'Celeste',  petal: '#8fd6ff', deep: '#3a9be0', hi: '#d1efff' },
};

/* Juegos de letra. `titulo` es la letra de las frases grandes y `mano`
   la letra manuscrita (nombre, firma, despedida). `href` es lo que se
   pide a Google Fonts; la clásica ya viene cargada en index.html. */
window.GIFT_FONTS = {
  clasica:   { nombre: 'Clásica',   titulo: "'Gloock', Georgia, serif",      peso: 400, mano: "'Homemade Apple', cursive", href: '' },
  romantica: { nombre: 'Romántica', titulo: "'Bodoni Moda', Georgia, serif", peso: 500, mano: "'Great Vibes', cursive",    href: 'family=Bodoni+Moda:wght@500&family=Great+Vibes' },
  elegante:  { nombre: 'Elegante',  titulo: "'Italiana', Georgia, serif",    peso: 400, mano: "'Parisienne', cursive",     href: 'family=Italiana&family=Parisienne' },
  original:  { nombre: 'Original',  titulo: "'Yeseva One', Georgia, serif",  peso: 400, mano: "'Dancing Script', cursive", href: 'family=Yeseva+One&family=Dancing+Script:wght@500' },
  moderna:   { nombre: 'Moderna',   titulo: "'Bricolage Grotesque', system-ui, sans-serif", peso: 600, mano: "'Caveat', cursive", href: 'family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Caveat:wght@500' },
  divertida: { nombre: 'Divertida', titulo: "'Fredoka', system-ui, sans-serif", peso: 600, mano: "'Pacifico', cursive",     href: 'family=Fredoka:wght@600&family=Pacifico' },
};

/* Campos que muestra el editor (en este orden). */
window.GIFT_FIELDS = [
  { grupo: 'Destinatario' },
  { key: 'para', label: 'Nombre de quien lo recibe', max: 24 },
  { key: 'tema', label: 'Color de las flores', type: 'tema' },
  { key: 'letra', label: 'Tipo de letra', type: 'fuente' },

  { grupo: 'Portada' },
  { key: 'titulo', label: 'Frase principal', max: 70 },
  { key: 'invitacion', label: 'Texto del primer botón', max: 40 },
  { key: 'boton', label: 'Texto del botón de la carta', max: 20 },

  { grupo: 'Carta' },
  { key: 'cartaEncabezado', label: 'Encabezado', max: 24 },
  { key: 'cartaTitulo', label: 'Título', max: 50 },
  { key: 'cartaTexto', label: 'Mensaje', type: 'area', max: 600 },
  { key: 'firma', label: 'Firma', max: 30 },
  {
    key: 'foto',
    label: 'Foto (enlace)',
    type: 'url',
    max: 400,
    ayuda: 'Pega el enlace de una imagen, o sube la foto a la carpeta fotos/ del repositorio y escribe fotos/nombre.jpg. Déjalo vacío para no mostrar foto.',
  },

  { grupo: 'Despedida' },
  { key: 'despedida', label: 'Mensaje al cerrar la carta', max: 40 },
];
