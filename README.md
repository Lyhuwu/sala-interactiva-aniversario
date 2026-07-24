# Sala interactiva — base completa

Esta carpeta contiene una base funcional en HTML, CSS y JavaScript vanilla para GitHub Pages.

Incluye:

- Recorrido narrativo obligatorio.
- Todos los objetos visibles en `idle`.
- Una sola pista activa a la vez.
- Repetición de la animación de atención hasta recibir clic.
- Mensaje de “este todavía no es el camino” para objetos futuros.
- Reapertura de cartas y eventos ya completados sin reiniciar ni avanzar la historia.
- Guardado del progreso en `localStorage`.
- Objetos ambientales libres.
- Animaciones ambientales ocasionales.
- Tocadiscos con estado persistente y audio iniciado solamente por clic.
- Precarga y decodificación de imágenes.
- Un único `<img>` por objeto.
- Motor central basado en `requestAnimationFrame`.
- Detección pixel-perfect por transparencia.
- Pantalla de carga.
- Modales para cartas, fotos y diálogos.
- Adaptación proporcional de una escena lógica de 1080 × 1920.

## Flujo narrativo configurado

```text
pinwis
→ pajaritos
→ calendario
→ tele
→ marco
→ pollitos
→ sobre
```

El orden se cambia una sola vez en:

```text
js/objects-config.js
```

Busca:

```js
export const STORY_ORDER = [...]
```

## Conducta de los clics

### Objeto actual

```text
evento
→ carta/foto/diálogo
→ guiando, solo la primera vez
→ regreso_idle
→ se activa el siguiente objeto
```

### Objeto ya completado

```text
evento
→ carta/foto/diálogo
→ regreso_idle
→ continúa exactamente la pista que estaba pendiente
```

No reproduce `guiando` y no modifica el progreso.

### Objeto futuro

No reproduce su evento. Muestra un mensaje y vuelve a señalar el objeto correcto.

### Objeto ambiental

Puede activarse sin pertenecer al recorrido. No avanza ni reinicia la historia.

## Convención definitiva para tus frames

Usa minúsculas, sin acentos, con guiones bajos y tres dígitos:

```text
pinwis_idle_frame_001.png
pinwis_atencion_frame_001.png
pinwis_evento_frame_001.png
pinwis_guiando_frame_001.png
pinwis_regreso_idle_frame_001.png
```

Para el segundo frame:

```text
pinwis_idle_frame_002.png
```

No uses `frame1`, `frama1`, espacios ni nombres mezclados entre mayúsculas y minúsculas.

## Carpetas de cada objeto narrativo

```text
assets/objetos/pinwis/
├── idle/
├── atencion/
├── evento/
├── guiando/
└── regreso_idle/
```

La carpeta `guiando` puede omitirse en objetos que no la necesiten, pero en la configuración debe quedar una secuencia vacía:

```js
guiando: {
  frames: [],
  durations: [],
  loop: false,
  holdLastFrame: true
}
```

## Objetos ambientales incluidos como ejemplo

```text
planta
perrito
tocadiscos
```

La planta y el perrito tienen una secuencia adicional:

```text
ambiente
```

Esa animación no es una pista. Solo da vida a la sala ocasionalmente.

El tocadiscos utiliza:

```text
idle
evento
activo
regreso_idle
```

Primer clic:

```text
evento → audio → activo en loop
```

Segundo clic:

```text
detener audio → regreso_idle → idle
```

## Qué debes reemplazar

### 1. Fondo

Reemplaza:

```text
assets/fondo/fondoestatico.png
```

Debe medir 1080 × 1920.

Las plantas que ya formen parte de ese fondo no deben declararse como objetos. La `planta` actual es solamente un ejemplo independiente y puedes eliminar su configuración si tu planta final permanece dibujada dentro del fondo.

### 2. Frames de muestra

Reemplaza los PNG dentro de:

```text
assets/objetos/
```

Todos los frames de una misma secuencia deben:

- Tener exactamente el mismo ancho y alto.
- Conservar el objeto en el mismo punto interno.
- Conservar los mismos márgenes transparentes.
- No incluir la habitación completa.
- Estar recortados a un lienzo razonable alrededor del objeto.

No necesitas usar el mismo tamaño de lienzo entre objetos distintos.

### 3. Cantidades y tiempos

Abre:

```text
js/objects-config.js
```

Cada secuencia tiene una cantidad declarada y duraciones:

```js
evento: sequence(
  numberedFrames("pinwis", "evento", "evento", 3),
  [180, 180, 420]
)
```

El `3` significa que existen:

```text
frame_001
frame_002
frame_003
```

El arreglo indica cuánto dura cada frame en milisegundos.

No repitas una imagen idéntica para hacerla durar más. Aumenta su duración.

### 4. Posiciones

En cada objeto modifica:

```js
position: {
  x: 100,
  y: 1390,
  width: 300,
  zIndex: 40
}
```

- `x`: posición horizontal dentro de 1080.
- `y`: posición vertical dentro de 1920.
- `width`: ancho mostrado.
- `zIndex`: qué objeto aparece encima cuando se superponen.

### 5. Cartas

Reemplaza:

```text
assets/interfaz/cartas/carta_pinwis.png
assets/interfaz/cartas/carta_pajaritos.png
assets/interfaz/cartas/carta_calendario.png
assets/interfaz/cartas/carta_tele.png
assets/interfaz/cartas/carta_pollitos.png
assets/interfaz/cartas/carta_sobre.png
```

La carta puede tener cualquier proporción razonable; el modal la adapta al teléfono.

### 6. Foto del marco

Reemplaza:

```text
assets/interfaz/fotos/foto_marco.png
```

### 7. Audio del tocadiscos

Reemplaza:

```text
assets/sonidos/tocadiscos_demo.wav
```

También puedes cambiar la ruta a `.mp3`, `.m4a`, `.ogg` o `.wav` en `objects-config.js`.

El audio nunca se inicia solo. Esto es necesario para que funcione en navegadores móviles.

## Archivos principales

```text
index.html
css/styles.css
js/objects-config.js
js/asset-loader.js
js/animation-engine.js
js/runtime-lock.js
js/modal-controller.js
js/effects.js
js/audio-controller.js
js/story-controller.js
js/ambient-controller.js
js/interactions.js
js/app.js
```

### `objects-config.js`

Contiene orden, posiciones, rutas, frames, duraciones, cartas y tipos de objeto.

### `asset-loader.js`

Precarga imágenes, usa `decode()` y crea máscaras alfa para los clics.

### `animation-engine.js`

Cambia el `src` del único `<img>` de cada objeto y controla todas las secuencias con `requestAnimationFrame`.

### `story-controller.js`

Controla el recorrido, progreso, objetos completados, pistas y repeticiones.

### `ambient-controller.js`

Controla planta, perrito, tocadiscos y futuros objetos libres.

### `interactions.js`

Detecta el objeto visible tocado, incluso cuando existen PNG transparentes superpuestos.

## Probar en computadora

No abras `index.html` directamente con doble clic porque los módulos JavaScript funcionan mejor desde un servidor local.

Desde la carpeta del proyecto ejecuta:

```bash
python -m http.server 8000
```

Después abre en el navegador:

```text
http://localhost:8000
```

También puedes usar Live Server en Visual Studio Code.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la raíz de tu repositorio.
2. Verifica que `index.html` esté directamente en la raíz.
3. En GitHub abre `Settings`.
4. Entra a `Pages`.
5. En `Build and deployment`, selecciona `Deploy from a branch`.
6. Selecciona la rama `main`.
7. Selecciona la carpeta `/ (root)`.
8. Guarda.

El código usa rutas relativas, por lo que funciona aunque el repositorio tenga un nombre propio.

## Reiniciar el recorrido durante las pruebas

Abre la consola del navegador y ejecuta:

```js
resetStoryProgress()
```

No existe un botón visible de reinicio en la página final.

También se expone temporalmente:

```js
salaDebug
```

para revisar el estado durante el desarrollo.

## Pruebas manuales recomendadas

1. Al cargar, todos los objetos se ven en idle.
2. Solo `pinwis` llama la atención.
3. Si no lo tocas, vuelve a llamar la atención.
4. Al tocar `sobre` antes de tiempo, aparece el aviso.
5. Al completar `pinwis`, se activa `pajaritos`.
6. Al volver a tocar `pinwis`, su carta se abre otra vez.
7. Después de cerrar esa carta antigua, `pajaritos` sigue siendo la pista.
8. Recarga la página y comprueba que conserva el progreso.
9. Toca la planta o el perrito y confirma que no cambia el paso.
10. Toca el tocadiscos dos veces y confirma que inicia y detiene el audio.
11. Deja la pestaña en segundo plano y vuelve; no debe saltar descontroladamente.
12. Prueba zonas transparentes alrededor de cada PNG.

## Antes de publicar la versión final

- Comprime tus PNG.
- Evita lienzos de 1080 × 1920 para cada objeto.
- Mantén una sola animación narrativa principal a la vez.
- Revisa el proyecto en el teléfono donde lo verá tu novia.
- Elimina recursos de muestra que ya no uses.
- Cambia los textos de prueba de las cartas.

## Modo de acomodo `?debug=1`

El proyecto ya incluye un modo visual para obtener las posiciones sin medirlas manualmente.

En GitHub Pages abre la dirección normal y agrega al final:

```text
?debug=1
```

Ejemplo:

```text
https://lyhuwu.github.io/nombre-del-repositorio/?debug=1
```

En una prueba local también funciona así:

```text
http://localhost:5500/?debug=1
```

### Qué cambia en el modo debug

- No comienza el recorrido narrativo.
- No se abren cartas ni fotografías.
- No se ejecutan pistas, eventos ni animaciones ambientales.
- Todos los objetos muestran su primer frame de `idle`.
- Puedes tocar un objeto para seleccionarlo.
- Puedes arrastrarlo directamente con el dedo o mouse.
- Puedes ajustar `x`, `y`, `width` y `zIndex` con números o botones.
- Los cambios debug se guardan en el navegador para que no se pierdan al recargar.

El objeto seleccionado aparece rodeado por una línea amarilla.

### Controles

- `X`: mueve el objeto horizontalmente.
- `Y`: mueve el objeto verticalmente.
- `Ancho`: cambia su tamaño conservando la proporción del PNG.
- `Capa`: corresponde a `zIndex`; un número mayor aparece encima.
- `Paso`: elige si los botones modifican 1, 5, 10 o 25 píxeles.
- Flechas: mueven el objeto con precisión.
- `− Ancho` y `+ Ancho`: reducen o aumentan el tamaño.
- `− Capa` y `+ Capa`: cambian qué objeto aparece encima.
- `Copiar objeto`: copia la línea del objeto seleccionado.
- `Copiar todos`: copia todas las posiciones.
- `Descargar JSON`: descarga un respaldo con todas las posiciones.
- `Restaurar objeto`: recupera los valores escritos actualmente en `objects-config.js`.
- `Restaurar todos`: elimina todas las posiciones guardadas por el modo debug.

Ejemplo de texto copiado:

```text
pinwis: position: { x: 100, y: 1390, width: 300, zIndex: 40 }
```

Después debes copiar esos números manualmente en:

```text
js/objects-config.js
```

El modo debug no puede editar por sí solo el archivo alojado en GitHub. Guarda temporalmente los cambios en `localStorage` y te entrega los valores exactos para copiarlos.

Para volver a la experiencia normal, elimina `?debug=1` de la dirección.
