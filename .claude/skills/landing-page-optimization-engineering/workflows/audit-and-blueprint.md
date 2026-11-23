# Workflow: Auditoría Integral y Blueprint (`F0–F5` + `GATE 1`, Solo Lectura)

> **Regla estricta (`RULE-001` y `RULE-004`):** este flujo **no modifica** el código de la landing. Termina en `GATE 1` esperando autorización explícita.

1. **F0. Context Discovery:**
   - Leer `toolkit.config.json`, `.claude/landing-design/scope.json`, `docs/arquitectura/routes-map.json`, `docs/diseno/design-tokens.json` y `docs/seo/seo-config.json`.
   - Confirmar ruta de landing (`LANDING_ROUTE`), objetivo de conversión, restricciones y nivel de presupuesto (`strict` | `balanced` | `flexible`).
2. **F1. Architecture Discovery:**
   - Mapear componentes propios vs compartidos con el sistema interno (para evitar regresiones en dashboard/intranet).
   - Inventariar activos (imágenes, fuentes, videos, scripts de terceros, CSS, JS).
3. **F2. Baseline Measurement:**
   - Ejecutar `autopilot optimizar linea-base` para congelar la foto inicial (`docs/optimizacion/baseline.json`).
   - Registrar métricas disponibles separando laboratorio (Lighthouse/DevTools) y campo (CrUX/RUM si existen); documentar qué no se pudo medir sin inventar cifras.
4. **F3. Comprehensive Audit (ejecución híbrida por dimensiones aplicables `LP-01` a `LP-10`):**
   - Ejecutar `autopilot optimizar auditar-activos --json` (imágenes pesadas, formatos legacy, lazy en Hero, fuentes, scripts bloqueantes).
   - **Para `LP-05 (SEO técnico)`:** ejecutar `/busqueda` (`autopilot busqueda auditar --json`) sin duplicar reglas.
   - **Para `LP-08 (Contraste/WCAG)`:** ejecutar `autopilot tokens auditar --json` si existe `design-tokens.json`.
   - Emitir cada hallazgo en formato estructurado (`LP-PERF-001`, `LP-CRO-001`, etc.).
5. **F4. Root Cause Analysis (Árbol KPI):**
   - Trazar cada síntoma (LCP alto, rebote móvil, baja conversión) hasta su causa raíz técnica real (archivos, dependencias y origen FE/BE/CDN).
6. **F5. Optimization Blueprint:**
   - Rellenar `templates/optimization-blueprint.md` priorizando `P0` → `P1` → `P2` → `P3` con `TEST_PLAN` y `ROLLBACK_PLAN`.
7. **GATE 1 — Autorización Humana:**
   - Presentar informe de línea base, puntuaciones independientes por dimensión y blueprint. **Detenerse** hasta que el usuario apruebe explícitamente qué tareas o fases implementar.
