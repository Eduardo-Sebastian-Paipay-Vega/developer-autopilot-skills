# Ingeniería CSS de animaciones (MDES)

## 1. Propiedades permitidas vs. prohibidas en `@keyframes`

| Permitidas (compositor / GPU) | Evitar en bucles (provocan layout o paint continuo) |
| :--- | :--- |
| `transform` (`translate`, `scale`, `rotate`) | `width`, `height`, `top`, `left`, `right`, `bottom` |
| `opacity` | `margin`, `padding`, `border-width`, `font-size` |
| `stroke-dashoffset` *(solo en M1/M2 con pocos trazos)* | `box-shadow`, `filter: blur()`, `filter: drop-shadow()` |

## 2. Encapsulación por recurso

Cada recurso usa una clase raíz con su prefijo (ej. `.mdes-book`, `.mdes-doc`, `.mdes-van`) y nombres de `@keyframes` prefijados (`@keyframes mdes-book-flip`) para poder convivir con cualquier otra animación en el mismo DOM sin colisiones.

## 3. Control de velocidad e intensidad

- **Duración:** derivada de `var(--motion-duration)` (p. ej. `animation: mdes-wheel calc(var(--motion-duration) * 0.5) linear infinite;`).
- **Velocidad en tiempo real:** la controla `MotionController.setSpeed()` mediante `Animation.updatePlaybackRate()` / `playbackRate`. No recalcules `animation-duration` desde JS para evitar saltos de frame.
- **Intensidad:** multiplica desplazamientos y ángulos por `var(--motion-intensity)` usando `calc()`:
  ```css
  @keyframes mdes-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(calc(-5px * var(--motion-intensity))); }
  }
  ```

## 4. Estados por atributo `data-motion-state`

Gestiona estados de forma declarativa sobre `.mdes[data-motion-state="..."]`:
- `idle`: geometría en reposo, sin bucles activos.
- `processing`: bucle principal activo.
- `success`: detiene bucle, muestra icono/badge de éxito con `--motion-accent` y `--motion-ease-emphasized`.
- `error`: sacudida corta única (`iteration-count: 1`, ≤ 400 ms) y color `--motion-danger`.
- `paused`: pausado por el controlador (`animation-play-state: paused` solo como respaldo; el controlador pausa vía WAAPI).

## 5. Uso responsable de `will-change`

- **Prohibido** aplicar `will-change: transform` de forma global o a todos los elementos.
- Solo añadirlo en un máximo de 1–2 capas pesadas si DevTools Performance demuestra re-rasterización continua.

## 6. Transiciones de entrada/salida (Angular 20.2+ y web moderna)

Para apariciones y desapariciones de contenedores en el DOM usa CSS nativo (`@starting-style`, `animate.enter`, `animate.leave` en Angular) manteniendo duraciones `--motion-dur-base` (entrada) y `--motion-dur-fast` (salida).
