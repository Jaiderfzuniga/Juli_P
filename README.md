# Flores para ti

Una página-regalo: de noche crecen unas flores, las luciérnagas siguen tu dedo
y una carta sale de un sobre. Una misma página sirve para muchas personas: cada
una recibe su propio enlace con su nombre, sus textos, su foto y su color.

## Cómo se vive

1. **Portada** con el nombre de quien lo recibe. Al tocar el botón, las flores crecen.
2. **Jardín**: la frase aparece palabra por palabra. Tocar el suelo siembra flores nuevas;
   tocar el cielo suelta pétalos. Las luciérnagas siguen el cursor (o el giro del celular).
3. **Carta**: sale de un sobre, con foto tipo polaroid que se inclina hacia el cursor,
   el mensaje se escribe palabra por palabra y la firma se dibuja al final.
4. **Despedida** al cerrar la carta, con lluvia de pétalos.

## Hacer una versión para otra persona

No hace falta tocar código.

1. Abre la página con `?editar` al final de la dirección, por ejemplo
   `https://TU-USUARIO.github.io/Juli_P/?editar`
2. Cambia nombre, color de las flores, tipo de letra (seis juegos), frases, mensaje,
   firma, foto y despedida.
   Todo se ve al instante. Escribe `{nombre}` en cualquier texto y se reemplaza por el nombre.
3. Pulsa **Copiar enlace** y envíaselo. Esa persona ve la página final, sin editor.

El contenido viaja dentro del propio enlace (después de `#d=`), así que no se guarda en
ningún servidor y cada enlace es independiente. El borrador del editor se guarda solo en
tu navegador.

**Fotos**: pega el enlace de una imagen, o sube la foto a la carpeta `fotos/` de este
repositorio y escribe `fotos/nombre.jpg`.

## Cambiar el contenido por defecto

Lo que se ve sin enlace personalizado está en [`js/config.js`](js/config.js), junto con
los colores disponibles y los campos del editor.

## Estructura

```
index.html        estructura de la página
css/flowers.css   dibujo de las flores (CSS puro, colores por tema)
css/app.css       portada, carta y despedida
css/editor.css    panel de edición
js/config.js      contenido por defecto, temas y campos del editor
js/store.js       lee el enlace personalizado y lo valida
js/fx.js          canvas: estrellas, luciérnagas, pétalos y flores sembradas
js/main.js        dirige las cuatro escenas
js/editor.js      panel de edición (solo con ?editar)
```

## Probar en tu PC

```bash
python -m http.server 8000
```

Y abre http://localhost:8000. Si tu equipo tiene activado "reducir movimiento", la
página suaviza las animaciones; añade `?animar` a la dirección para ver la versión completa.

## Publicar

En GitHub: **Settings → Pages → Deploy from a branch → main / (root)**.
