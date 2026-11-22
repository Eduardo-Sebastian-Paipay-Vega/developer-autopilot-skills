---
name: motion-design-engineer
description: Motion Design Engineering System (MDES). Diseña y genera animaciones, ilustraciones animadas y escenas visuales ORIGINALES mediante código (SVG + CSS + JavaScript / Web Animations API; Canvas 2D y Three.js solo si se justifica), sin depender de GIF, Lottie de pago ni ilustraciones comerciales. Cubre loaders, estados de éxito/error/vacío, objetos animados (libros, documentos, carpetas, vehículos, cajas, nubes, gráficos) y escenas de procesos. Aplica un contrato de configuración común (colores, velocidad, tamaño, estados, progreso), niveles de complejidad M1-M4, presupuestos de rendimiento y accesibilidad (prefers-reduced-motion). Úsala cuando se pida crear, animar, ilustrar, mejorar o integrar cualquier animación o ilustración en una interfaz (Angular, React, Next.js, Vue, Vanilla o Web Components).
---

# Motion Design Engineer (MDES)

Generas recursos visuales animados con **ingeniería**, no improvisación: cada animación sale de un patrón, usa primitivas y tokens compartidos, respeta un contrato de configuración y se valida antes de entregarse.

> [!IMPORTANT]
> Esta skill usa *progressive disclosure*. Este archivo es el procedimiento. El conocimiento detallado vive en `references/`. Lee **solo** las referencias que la tarea necesite (indicadas en cada paso).

## Recursos de la skill

| Recurso | Uso |
| :--- | :--- |
| `core/mdes-base.css` | Tokens (`--motion-*`), temas, base SVG y reducción de movimiento. Obligatorio en todo recurso. |
| `core/mdes-core.js` | `MotionController` (play, pause, restart, reverse, setSpeed, setColors, setTheme, setSize, setProgress, setState, destroy) y `validateConfig`. Sin dependencias. |
| `schema/mdes.config.schema.json` | Contrato de configuración validable (JSON Schema draft-07). |
| `templates/new-animation/` | Andamio para crear un recurso nuevo (copiar y renombrar). |
| `examples/` | Implementaciones de referencia M1/M2 + playground de QA. |
| `scripts/validate-config.mjs` | Valida `mdes.config.json` contra el contrato. |
| `scripts/audit-motion.mjs` | Auditoría estática: propiedades que provocan layout, colores fuera de tokens, accesibilidad, will-change. |

## Procedimiento obligatorio (12 pasos)

### 1. Interpretar la solicitud
Extrae: **qué comunica** la animación (espera, éxito, error, vacío, proceso, decoración), **dónde vive** (botón, tarjeta, pantalla completa, landing), **quién la controla** (automática o estado real de una operación) y **restricciones** (framework, marca, tamaño, rendimiento).
Si falta información que cambie el resultado (p. ej. si el progreso es real o indeterminado), pregunta antes de generar.

### 2. Clasificar la necesidad → patrón del catálogo
Busca el patrón más cercano en `references/pattern-catalog.md` (loading, success, error, empty, object, scene). Reutiliza su composición y capas; no inventes la estructura desde cero.

### 3. Elegir nivel de complejidad (`references/complexity-levels.md`)
- **M2 es el nivel por defecto.**
- M1 para elementos pequeños o funcionales (dentro de botones, inputs, celdas).
- M3 solo si la operación necesita una explicación visual (escena con varios objetos).
- M4 (3D, partículas, cámara) **requiere justificación explícita** escrita en la entrega.

### 4. Elegir tecnología (`references/technology-selection.md`)
Orden de preferencia: **CSS → SVG + CSS → SVG + CSS + WAAPI → Canvas 2D → Three.js**. Sube de escalón solo si el anterior no puede resolverlo. Canvas y Three.js son extensiones, nunca dependencias por defecto.

### 5. Definir la composición (`references/illustration-engineering.md`)
Escribe la tabla de capas antes de dibujar: capa → elemento → movimiento. Cada parte móvil es un `<g data-part="...">` independiente con su `transform-origin`. Define el **frame estático representativo**: la geometría sin animar debe comunicar el mensaje por sí sola (es el fallback de movimiento reducido).

### 6. Construir los elementos (`references/svg-engineering.md`)
- `viewBox` fijo y coordenadas enteras; dimensiones vía CSS, nunca vía atributos fijos.
- Colores **solo** con `var(--motion-*)` (incluido `currentColor`). Cero hex dentro de reglas de la ilustración.
- Mínimo de nodos: formas simples > paths complejos. Sin imágenes rasterizadas embebidas.

### 7. Animar (`references/motion-principles.md`, `references/css-engineering.md`)
- Solo `transform` y `opacity` en bucles. Nunca `width`, `height`, `top`, `left`, `margin` animados de forma continua.
- Duraciones y curvas desde los tokens (`--motion-ease-*`, escala de duraciones). No uses el mismo valor para todo: aplica jerarquía, stagger, anticipación y follow-through.
- Velocidad mediante `playbackRate` (controlador), no reescribiendo duraciones en caliente.

### 8. Aplicar el contrato de parámetros (`references/configuration-schema.md`)
Crea `mdes.config.json` del recurso. Todo recurso debe poder cambiar **colores, velocidad, tamaño, tema y estado** sin tocar su estructura.

### 9. Honestidad de estado
Si la animación representa una operación real: usa `setState()` / `setProgress()` conectados al estado real. **Prohibido** simular progreso determinado (p. ej. llegar al 100 %) cuando la operación no lo reporta: usa modo indeterminado.

### 10. Validar rendimiento (`references/performance-budget.md`)
Ejecuta `node scripts/audit-motion.mjs <carpeta>` y corrige todo hallazgo `ERROR`. Objetivo interno: 60 FPS en el equipo de referencia, 0 layouts por frame, 0 errores de consola. No inventes métricas: si no mediste, dilo.

### 11. Validar accesibilidad (`references/accessibility.md`)
- `prefers-reduced-motion` resuelto (heredado de `mdes-base.css` + `behavior.reducedMotion`).
- Decorativa → `aria-hidden="true"`. Informativa → `role="status"`/`role="progressbar"` + `aria-label`.
- Sin destellos > 3 por segundo. El estado se entiende sin movimiento (texto o forma).

### 12. Exportar, verificar en navegador y documentar (`references/testing-validation.md`, `references/framework-adapters.md`)
1. `node scripts/validate-config.mjs <ruta>/mdes.config.json`.
2. Abrir el recurso en un navegador real (servidor local, no `file://`) y comprobar: reproducción, pausa, reinicio, velocidad, colores, tema, tamaño, estados y movimiento reducido. **No declares que funciona sin haberlo ejecutado.**
3. Integrar con el adaptador del framework del proyecto (Angular, React, Next.js, Vue, Vanilla, Web Component).
4. Entregar: archivos, tabla de capas, nivel elegido y por qué, parámetros soportados y resultado de las validaciones.

## Reglas inquebrantables

- No GIF como formato por defecto. No recursos premium ni dependencias obligatorias innecesarias.
- No escenas complejas para necesidades simples (respeta el nivel elegido).
- No modificar lógica de negocio para encajar una animación.
- No sobrescribir archivos existentes ni hacer commits sin autorización del usuario.
- No declarar pruebas o métricas que no se ejecutaron.
- En Angular moderno (v20.2+): CSS nativo + `animate.enter` / `animate.leave`. No introducir `@angular/animations` (deprecado).
- Si el proyecto tiene un guardián visual (p. ej. `landing-design-guardian`), la paleta del proyecto manda: mapea sus colores a los tokens `--motion-*`, no al revés.

## Formato de entrega

```markdown
**Recurso:** <id> — <nombre>    **Nivel:** M2 (motivo)    **Renderer:** svg-css
**Capas:** tabla capa → elemento → movimiento
**Archivos:** <rutas>
**Parámetros soportados:** colores, speed, size, theme, state[, progress]
**Validación:** validate-config ✅ | audit-motion ✅ (n avisos) | navegador: <qué se probó y dónde>
**Integración:** snippet del adaptador
```
