# Selección de tecnología

Regla: **usa el escalón más bajo que resuelva el problema.** Subir de escalón debe justificarse por una necesidad, no por preferencia.

## Escalera de decisión

| Escalón | Renderer (`config.renderer`) | Cuándo | Cuándo NO |
| :---: | :--- | :--- | :--- |
| 1 | `css` | Transiciones de UI, botones, skeletons, spinners geométricos simples, entradas/salidas. | Cuando hace falta dibujar un objeto reconocible. |
| 2 | `svg-css` **(núcleo por defecto)** | Objetos e ilustraciones 2D: libros, carpetas, documentos, vehículos, nubes, gráficos, iconos, personajes vectoriales. | Cientos de elementos simultáneos que cambian cada frame. |
| 3 | `svg-css-waapi` | Lo anterior + secuencias controladas por eventos, timelines encadenadas, progreso real, `finished` promises. | Si un `@keyframes` con estados por atributo ya lo resuelve. |
| 4 | `canvas-2d` | Partículas, fondos generativos, cientos/miles de objetos, dibujo continuo. | Un loader o un icono. Accesibilidad: Canvas no expone estructura; requiere alternativa textual. |
| 5 | `webgl-three` (M4) | Objetos 3D reales, escenas con cámara y profundidad, productos rotatorios. | Cualquier cosa que un SVG isométrico resuelva. Nunca para un loader. |

`Motion` (motion.dev) es **opcional**: útil para gestos y secuencias avanzadas en React/Vanilla, nunca dependencia del núcleo.

## Por tipo de solicitud

| Se pide… | Tecnología | Nivel típico |
| :--- | :--- | :---: |
| Spinner, puntos, barra, check | CSS o SVG + CSS | M1 |
| Libro que pasa páginas, carpeta que se abre, documento que se genera, nube que sincroniza, gráfico que se construye | SVG + CSS (+ WAAPI si depende de estado) | M2 |
| Escritorio con documentos, camión con paquetes, flujo entre sistemas, ensamblaje | SVG + CSS + WAAPI (timeline) | M3 |
| Partículas, escena isométrica compleja, objeto 3D, cámara | Canvas 2D / Three.js | M4 |

## Matriz de capacidades

| Capacidad | CSS | SVG+CSS | WAAPI | Canvas 2D | Three.js |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Recoloreable con tokens | ✅ | ✅ | ✅ | ⚠️ (leer tokens con `getComputedStyle`) | ⚠️ (uniforms/materiales) |
| Escalable sin pérdida | ✅ | ✅ | ✅ | ⚠️ (devicePixelRatio) | ⚠️ |
| Accesible por defecto | ✅ | ✅ | ✅ | ❌ (requiere alternativa) | ❌ |
| Control play/pause/speed | vía `getAnimations()` | vía `getAnimations()` | ✅ nativo | manual (rAF) | manual (rAF) |
| Coste inicial | mínimo | mínimo | mínimo | medio | alto (≈ cientos de KB) |
| Dependencias | 0 | 0 | 0 | 0 | three (MIT) |

## Notas de compatibilidad

- `element.getAnimations({ subtree: true })` devuelve también las animaciones CSS como objetos `Animation`: por eso el `MotionController` controla `@keyframes` sin reescribirlos.
- Transformaciones 3D (`rotateY`, `perspective`) sobre elementos **dentro** de un SVG no son fiables entre navegadores. Para "giros" en SVG usa `scaleX` con origen en el eje (ver `illustration-engineering.md`). Si necesitas 3D real, aplica la transformación al contenedor HTML o sube a Three.js.
- Angular v20.2+: `@angular/animations` está deprecado (eliminación prevista en v23). Usa CSS nativo + `animate.enter` / `animate.leave`.
