# Puente con `motion-design-engineer` (MDES) y Modo Independiente

`system-state-screens` está diseñada para **jugar en equipo** con `motion-design-engineer`, sin quedar acoplada a ella.

---

## 1. Detección automática del modo

Al iniciar el Paso 2:
1. Comprueba si existe `motion-design-engineer/SKILL.md` en `.claude/skills/` o en el directorio global de skills (`~/.gemini/config/skills/` o `~/.claude/skills/`).
2. **Si existe → Modo Orquestado (MDES):**
   - Sigue las reglas de `motion-design-engineer` (`core/mdes-base.css`, `core/mdes-core.js`, `mdes.config.json`, tokens `--motion-*`).
   - Mapea los colores del tema del proyecto a `--motion-primary`, `--motion-secondary`, `--motion-accent`, `--motion-danger`, `--motion-surface`, `--motion-stroke`.
   - Valida cada animación generada con `scripts/validate-config.mjs` y `scripts/audit-motion.mjs`.
3. **Si NO existe → Modo Independiente (Autónomo):**
   - Genera ilustraciones SVG limpias inline (o componentes `<StateIllustration />`) usando `currentColor` y las variables CSS del proyecto.
   - Usa únicamente `transform` y `opacity` en `@keyframes`.
   - Incluye obligatoriamente `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`.

---

## 2. Tabla de mapeo 1:1 (Pantalla ↔ Patrón MDES)

| Pantalla / Estado | Nivel MDES | Patrón MDES recomendado | Estados MDES | Fallback independiente |
| :--- | :---: | :--- | :--- | :--- |
| **Full-page Loader** | M1 | `spinner-ring` o `progress-bar` | `processing` | Anillo SVG rotando (`linear`) o barra `scaleX`. |
| **Skeleton Screen** | M1 | `skeleton-shimmer` | `processing` | Bloques con gradiente `translateX`. |
| **Empty: Primer uso** | M2 | `no-records` / `folder-opening` | `idle` | Carpeta/documento SVG con flotación suave (`intensity: 0.4`). |
| **Empty: Sin resultados** | M2 | `no-results` | `idle` | Lupa SVG sobre tarjeta con barrido suave. |
| **Empty: Zero Inbox** | M2 | `sync-completed` / `check-pop` | `success` | Bandeja limpia con check suave. |
| **Success / Confirmación** | M2 | `document-saved` / `check-pop` | `success` | Círculo + trazo check con overshoot (`--motion-ease-emphasized`). |
| **Procesamiento 2.º plano** | M2 | `document-processing` / `cloud-sync` | `processing → success/error` | Hoja/nube con escáner o flechas en giro continuo. |
| **400 Bad Request** | M1 | `validation-warning` | `error` | Triángulo/exclamación con pop único (sin bucle). |
| **401 Unauthorized** | M2 | `lock-expired` *(objeto candado/llave)* | `error` | Candado cerrado con sacudida corta (≤ 400 ms, 1 vez). |
| **403 Forbidden** | M2 | `shield-denied` *(escudo/barrera)* | `error` | Escudo con cruz/bloqueo estático tras entrada breve. |
| **404 Not Found** | M2 | `no-results` / `compass-lost` | `idle` | Brújula o página rota con flotación lenta. |
| **429 Too Many Requests** | M1 | `clock-cooldown` *(reloj/temporizador)* | `paused` | Reloj de arena / anillo de cuenta regresiva sincronizado con `Retry-After`. |
| **500 Internal Server Error** | M2 | `server-error` | `error` | Torre de servidor con LED en `--motion-danger` (sin destello > 3 Hz). |
| **502 / 504 Gateway** | M2 | `connection-lost` | `error` | Dos nodos con enlace interrumpido y pulso lento. |
| **503 Mantenimiento** | M2 | `maintenance-gears` *(engranajes)* | `processing` | Dos engranajes acoplados girando lentamente (`linear`). |
| **Offline State** | M2 | `connection-lost` | `error` | Nube desconectada con trazo diagonal y pulso sutil. |
| **Force Update** | M2 | `app-update` *(flecha circular/paquete)* | `idle` | Dispositivo + flecha ascendente de actualización. |

---

## 3. Reglas compartidas de convivencia

- **Cero colores hardcodeados:** toda animación de pantalla hereda la identidad visual del proyecto (o del tema `light`/`dark`/`brand`).
- **Errores sin bucles ansiosos:** los estados `400`, `401`, `403`, `500` ejecutan su entrada/sacudida **una sola vez** y quedan en reposo legible.
- **Limpieza garantizada:** al salir de la pantalla de estado o error, el componente destruye su `MotionController` (`ctrl.destroy()`).
