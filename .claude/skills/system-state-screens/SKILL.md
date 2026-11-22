---
name: system-state-screens
description: Diseña, genera y cablea automáticamente todas las pantallas de estado del sistema, transición, error, excepción y bloqueo (Carga Global, Skeleton Screen, Empty States en sus 3 variantes, Éxito/Confirmación, Procesamiento en Segundo Plano, HTTP 400/401/403/404/429/500/502/503/504, Offline State y Force Update), incluyendo sus rutas, interceptores HTTP, Error Boundaries y condicionales reales según el framework del proyecto (Next.js, Angular, React, Vue/Nuxt). Se coordina con `motion-design-engineer` (MDES) para generar las animaciones de presencia originales, pero también funciona de forma 100 % independiente con fallbacks SVG/CSS limpios. Úsala cuando se pida crear pantallas de error, estados vacíos, loaders, skeletons, mantenimiento, modo offline o estandarizar las pantallas de sistema de una aplicación.
---

# System State & Error Screens Generator

Genera e integra de punta a punta el conjunto completo de **pantallas reactivas del sistema** (estados de transición, vacíos, éxito, segundo plano, errores HTTP 4xx/5xx, conectividad y actualización forzada), dejando cableadas sus **rutas, interceptores, Error Boundaries y condicionales de renderizado**.

> [!IMPORTANT]
> Esta skill usa *progressive disclosure*. Lee solo las referencias que la tarea requiera:
> - `references/screens-catalog.md` — Especificación UX, copy, CTAs, ARIA y nivel visual de las 15 pantallas.
> - `references/framework-routing-wiring.md` — Cableado real de rutas, interceptores HTTP, Error Boundaries y guards para Next.js, Angular, React y Vue/Nuxt.
> - `references/mdes-bridge.md` — Orquestación con `motion-design-engineer` (MDES) y modo independiente (fallback).

---

## Catálogo cubierto (15 pantallas / estados)

### A. Estados del Sistema y Transición (System & UI States)
1. **Carga Global (`Full-page Loader`)** — Bloqueo de interfaz en operaciones críticas (spinner o barra de progreso honesta).
2. **Skeleton Screen** — Esqueleto animado que replica la geometría del contenido real (tarjetas, tablas, detalle).
3. **Empty State** *(3 subtipos obligatorios)*:
   - **Primer uso (`first-use`)**: invitación + CTA principal para crear el primer registro.
   - **Sin resultados (`no-results`)**: aviso de filtros sin coincidencias + CTA "Limpiar filtros".
   - **Bandeja limpia (`zero-inbox`)**: confirmación positiva de tareas al día.
4. **Confirmación / Éxito (`Success State`)** — Confirmación explícita tras acción crítica + resumen / código de recibo + siguiente acción.
5. **Procesamiento en Segundo Plano (`Background Processing`)** — Tarea pesada en cola (exportación masiva, reporte, importación CSV) que permite seguir navegando y avisa al concluir.

### B. Errores, Excepciones y Bloqueos (Error & Edge Cases)
* **Cliente (4xx):**
  6. **400 Bad Request** — Parámetros inválidos o datos corruptos.
  7. **401 Unauthorized** — No autenticado / token expirado → CTA a login conservando `returnUrl`.
  8. **403 Forbidden** — Autenticado pero sin permisos/rol → CTA volver o solicitar acceso.
  9. **404 Not Found** — Ruta o registro inexistente → CTA volver al inicio / atrás.
  10. **429 Too Many Requests** — Rate limiting → cuenta regresiva (`Retry-After`) + reintentar.
* **Servidor, Red y Versión (5xx / Conectividad):**
  11. **500 Internal Server Error** — Fallo inesperado de backend/BD → ID de referencia/soporte + reintentar.
  12. **502 / 504 Bad Gateway / Gateway Timeout** — Tiempo agotado o microservicio caído → reintentar con backoff.
  13. **503 Mantenimiento** — Fuera de línea programado o sobrecarga controlada → ventana estimada + comprobar estado.
  14. **Sin Conexión (`Offline State`)** — Detección reactiva `online`/`offline` (banner persistente o pantalla completa + modo lectura caché si el proyecto lo soporta).
  15. **Actualización Requerida (`Force Update`)** — Bloqueo por versión obsoleta de app/navegador → CTA actualizar/recargar.

---

## Procedimiento obligatorio (7 pasos)

### Paso 0: Detectar Stack, Librería UI y Reglas del Proyecto (nunca asumir)
1. Lee `toolkit.config.json` (`stack.frontend`, `stack.ui_libraries`, `stack.css_framework`) o inspecciona `package.json`, `components.json`, `angular.json` o `next.config.*`.
2. **Fuente única de diseño:** lee primero `docs/diseno/design-tokens.json` (o `toolkit.config.json → design.tokens_file`) y `docs/diseno/design-tokens.generated.css` (que ya define `[data-motion-theme="brand"]` y `--utility-*`). Comprueba además `docs/planeacion/plan.md`, `AGENTS.md` o `.claude/landing-design/`: **hereda siempre los tokens de color, tipografía y librería UI del proyecto sin inventar hex sueltos**.
3. **Fuente única de rutas (`routes-architect`):** si existe `docs/arquitectura/routes-map.json` (o `toolkit.config.json → routes.map_file`), alinea las rutas de error (`/400`, `/401`, `/403`, `/404`, `/429`, `/500`, `/502`, `/503`, `/504`, `/offline`), headers (`X-Request-Id`, `X-Min-App-Version`) y sobre HTTP con dicho contrato. Si el proyecto aún no define framework o librería UI, **pregunta al usuario** antes de generar archivos.

### Paso 1: Confirmar alcance de generación
Por defecto, cuando el usuario pide generar las pantallas del sistema, cubre **los 2 grupos completos (las 15 pantallas + cableado)**, salvo que el usuario pida un subconjunto concreto (p. ej. "solo errores 4xx/5xx" o "solo Empty States y Skeletons").
Pregunta solo si hay ambigüedad real sobre:
- Si el proyecto soporta modo lectura offline (caché/IndexedDB) o solo banner de reconexión.
- Si existe un endpoint de versión (`/api/version` o header `X-Min-App-Version`) para `Force Update`.

### Paso 2: Enlazar animaciones de presencia (`motion-design-engineer` o modo independiente)
Consulta `references/mdes-bridge.md`:
- **Si `motion-design-engineer` está instalada** (`.claude/skills/motion-design-engineer/SKILL.md` o `~/.gemini/config/skills/motion-design-engineer/SKILL.md`):
  1. Orquesta/aplica el contrato MDES: mapea la paleta del proyecto a `--motion-primary`, `--motion-secondary`, `--motion-accent`, `--motion-danger`, `--motion-surface`, `--motion-stroke`.
  2. Usa **M1** para `Full-page Loader`, `Skeleton`, `400/401/403/429` y **M2** para `Empty States`, `Success`, `Background Processing`, `404`, `500/502/504`, `503 Mantenimiento`, `Offline` y `Force Update`.
  3. Valida los recursos generados con `validate-config.mjs` y `audit-motion.mjs`.
- **Si `motion-design-engineer` NO está disponible (modo independiente):**
  1. Genera ilustraciones SVG limpias y ligeras con `currentColor` / variables CSS del proyecto y animaciones CSS puras (`transform` y `opacity` únicamente), con `@media (prefers-reduced-motion: reduce)` obligatorio.
  2. Nunca uses GIF, Lottie de pago ni imágenes externas rotas.

### Paso 3: Construir la base compartida de componentes reutilizables
Crea una carpeta dedicada de estados del sistema siguiendo la arquitectura del proyecto (ej. `src/shared/system-states/` o `components/system-states/`):
- `SystemStateLayout` (shell accesible y responsivo reutilizable: ilustración/animación, badge de código si aplica, título claro, descripción breve en lenguaje humano, detalle técnico colapsable/ID de incidente solo en 5xx, y botonera de CTAs).
- `FullPageLoader` (bloqueo con `aria-busy="true"`, trap de foco para evitar clics dobles, y progreso honesto: indeterminado si la API no reporta porcentaje real).
- `SkeletonScreen` (variantes `table`, `cards`, `detail`, `form`).
- `EmptyState` (prop `variant: 'first-use' | 'no-results' | 'zero-inbox'`).
- `SuccessState` (props `summary`, `receiptCode`, `primaryAction`, `secondaryAction`).
- `BackgroundProcessingState` (props `jobName`, `estimatedNote`, `onContinueWorking`).
- `ErrorScreen` (props `code: 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503 | 504`, `retryAfterSeconds?`, `traceId?`, `onRetry?`).
- `OfflineIndicator` (banner persistente + modo pantalla completa opcional con listener `online`/`offline`).
- `ForceUpdateScreen` (bloqueo no descartable con versión actual vs. requerida y CTA de actualización).

### Paso 4: Cablear TODAS las rutas, interceptores, Error Boundaries y condicionales
Consulta `references/framework-routing-wiring.md` y conecta **todo el cableado real** del framework detectado (nunca dejes componentes huérfanos sin conectar):
1. **Rutas físicas:** catch-all `404`, rutas explícitas `/401`, `/403`, `/500`, `/mantenimiento` (503), `/offline` (si aplica) y archivos especiales del framework (`not-found.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx` en Next.js; `error.vue` en Nuxt; rutas wildcard en Angular/React Router).
2. **Interceptor HTTP / Cliente API:** mapeo centralizado de códigos:
   - `401` → limpiar sesión/intentar refresh → redirigir a login / `/401` guardando `returnUrl`.
   - `403` → mostrar estado `403` sin cerrar sesión.
   - `429` → leer header `Retry-After` y activar estado/bloqueo con cuenta regresiva.
   - `503` → activar pantalla de mantenimiento.
   - `500 / 502 / 504` → capturar `traceId` / `requestId` si viene del backend y exponer reintento.
   - Error de red sin respuesta → delegar en `OfflineIndicator`.
3. **Error Boundary global:** captura excepciones de renderizado en tiempo de ejecución y muestra `500` con botón de recarga segura.
4. **Condicionales de conectividad y versión:** montar `OfflineIndicator` y `ForceUpdateGate` en el layout raíz de la app.

### Paso 5: Accesibilidad, Responsividad y Seguridad
- Errores bloqueantes: `role="alert"` y foco inicial en el contenedor principal.
- Carga y segundo plano: `role="status"` + `aria-live="polite"`.
- Progreso real: `role="progressbar"` con `aria-valuenow` (nunca fingir 100 % si no terminó).
- **Seguridad:** nunca exponer stack traces, consultas SQL ni secretos del servidor en pantallas de error en producción; mostrar únicamente un mensaje humano + `traceId` para soporte.
- **Responsividad:** toda pantalla debe verse limpia en móvil (`< 768px`) y escritorio (`≥ 768px`) sin desbordamiento horizontal.

### Paso 6: Verificar compilación y comportamiento real
1. Ejecutar `build` / `typecheck` / `lint` del proyecto (`0 errores`).
2. Si se usó `motion-design-engineer`, ejecutar `validate-config.mjs` y `audit-motion.mjs`.
3. Entregar una tabla resumen con todas las rutas creadas, componentes generados, interceptores conectados y cómo probar cada estado (p. ej. simulando 401/403/404/429/500/503/offline).

---

## Reglas inquebrantables

- **Nunca entregues solo pantallas sueltas sin cablear** sus rutas, Error Boundary, interceptor HTTP y condicionales de renderizado.
- **Honestidad de progreso:** si un proceso no reporta porcentaje real, el loader DEBE ser indeterminado.
- **Error 403 no cierra sesión:** el usuario sí está autenticado; solo carece de permiso para ese recurso.
- **Error 429 respeta `Retry-After`:** deshabilita el botón de reintentar mientras corre la cuenta regresiva.
- **Offline real:** escuchar eventos `window` (`online` / `offline`) y fallos de red; nunca asumir que `navigator.onLine` basta por sí solo.
- **Cero secretos en pantalla:** nunca mostrar stack traces ni errores crudos de BD al usuario final.
- **Sin commits ni sobrescritura destructiva** sin autorización del usuario.
