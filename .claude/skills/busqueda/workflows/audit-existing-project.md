# Workflow: Auditoría de Proyecto Existente (Solo Lectura)

> **Regla estricta:** este flujo **NUNCA** modifica código fuente ni configuraciones productivas del proyecto.

1. **Discovery (Modo 01):**
   - Leer `toolkit.config.json`, `docs/arquitectura/routes-map.json`, `docs/diseno/design-tokens.json` y `.claude/landing-design/scope.json`.
   - Identificar stack real, estrategia de renderizado, rutas públicas vs privadas, BD, CDN y tests.
2. **Recopilación de evidencia determinista:**
   - Ejecutar `autopilot busqueda extraer --json`.
   - Si el servidor local está encendido y autorizado, ejecutar `autopilot busqueda auditar --url http://localhost:<puerto>` para comprobar respuestas HTTP reales y *soft 404*.
3. **Evaluación por módulos aplicables (7 dimensiones):**
   - Auditar únicamente los módulos pertinentes al tipo de proyecto; documentar qué módulos no aplican y por qué.
   - Asignar nivel de madurez **`L0–L3`** a cada capacidad.
4. **Clasificación de hallazgos (`templates/findings-matrix.md`):**
   - Registrar cada hallazgo con ID único (`SEO-XX-001`), severidad, ubicación verificada, evidencia real, causa raíz, solución propuesta, riesgo de regresión y criterio de aceptación.
5. **Entrega y compuerta de autorización:**
   - Separar explícitamente hallazgos **Verificados**, **No verificados** y **Bloqueados**.
   - Entregar `templates/audit-report.md` + `templates/implementation-plan.md` y **detenerse** hasta recibir autorización explícita antes de pasar a `workflows/implement-seo.md`.
