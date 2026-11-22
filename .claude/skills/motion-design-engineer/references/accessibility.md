# Accesibilidad en animaciones (MDES)

## 1. Reducción de movimiento (`prefers-reduced-motion`)

Todo recurso debe contemplar `prefers-reduced-motion: reduce` en dos capas:
1. **CSS sin JS (`mdes-base.css`):** detiene animaciones y transiciones automáticamente dejando el **frame estático representativo**.
2. **Controlador JS (`behavior.reducedMotion`):**
   - `static` *(predeterminado)*: congela en el frame representativo.
   - `minimal`: reduce `--motion-intensity` a `0.15` (movimiento muy sutil, sin desplazamientos amplios).
   - `off`: solo cuando el movimiento es estrictamente esencial para comprender el contenido; requiere justificación.

## 2. Semántica ARIA

| Tipo de recurso | Atributos obligatorios |
| :--- | :--- |
| **Decorativo** (`accessibility.decorative: true`) | `aria-hidden="true"` en `.mdes`. No debe robar foco ni anunciarse a lectores de pantalla. |
| **Informativo / Ilustración** (`decorative: false`) | `role="img"` + `aria-label="..."` en `.mdes`; `aria-hidden="true"` en el `<svg>` interno. |
| **Estado de operación** (`loading` / `processing`) | `role="status"` + elemento `.mdes-sr-only[data-motion-live]` que actualiza texto con `accessibility.stateLabels`. |
| **Progreso real** (`progressMode: "determinate"`) | `role="progressbar"` + `aria-valuemin="0"` + `aria-valuemax="100"` + `aria-valuenow`. |

## 3. Seguridad visual y comprensión sin movimiento

- **Cero destellos peligrosos:** nunca parpadear más de 3 veces por segundo (WCAG 2.3.1 Three Flashes).
- **No depender solo del movimiento ni solo del color:** los estados (`processing`, `success`, `error`) deben diferenciarse también por **forma** (engranaje, check, cruz) y **texto accesible**.
- **Contraste:** los trazos y símbolos significativos deben mantener contraste ≥ 3:1 contra su fondo (WCAG 1.4.11 Non-text Contrast), tanto en tema claro como oscuro.
- **Control de reproducción:** en escenas M3/M4 que duren > 5 segundos en bucle y acompañen lectura de texto, ofrecer control de pausa/reproducción (`controller.pause()` / `play()`).
