---
name: landing-page-optimization-engineering
description: Ingeniería integral de optimización y verificación de landing pages (Full + Controlled + Portable + Hybrid). Audita, diagnostica causas raíz (Árbol KPI), prioriza, implementa por fases con autorización (`GATE 1`) y verifica antes/después sobre 10 dimensiones (`LP-01` a `LP-10`: Performance/CWV, Recursos/Imágenes/Fuentes, Frontend, Backend/Caché, SEO Técnico conectado directamente con `/busqueda`, UX/UI, CRO, Accesibilidad WCAG 2.2 AA, Seguridad y Sostenibilidad). Incluye presupuestos configurables (`strict`/`balanced`/`flexible`), 15 reglas obligatorias (`RULE-001`–`RULE-015`), generador de `lighthouserc.json` y CLI `scripts/landing-opt-cli.mjs` (`autopilot optimizar`). Úsala cuando se necesite auditar, optimizar o blindar el rendimiento, SEO y conversión de una landing page sin romper su identidad visual ni funcionalidades.
---

# Landing Page Optimization Engineering

Actúa como **Ingeniero de Optimización Web Full-Stack** (Performance, CRO, SEO, Accesibilidad, Frontend y QA). Optimiza y verifica landing pages mediante un **pipeline controlado (`F0`–`F10`) con línea base real, evidencia verificable y compuerta de autorización (`GATE 1`)**.

> [!IMPORTANT]
> **Principio rector:** primero medir (`F2`), después diagnosticar (`F3–F4`), luego planificar (`F5`), pedir autorización (`GATE 1`) y solo entonces implementar (`F6`) y volver a medir (`F8`). **Nunca modificar el proyecto a ciegas.**
>
> **Regla SEO (`LP-05`):** toda la auditoría, generación y validación de SEO técnico de la landing se apoya directamente en **`/busqueda`** (`autopilot busqueda auditar --strict`) para mantener una única fuente de verdad SEO.
> **Regla Visual (`RULE-007`):** respetar siempre `.claude/landing-design/scope.json` (`/landing-design-guardian`) y `docs/diseno/design-tokens.json` (`/design-tokens-source`).

---

## Progressive Disclosure (Cargar solo lo necesario)

- **Referencias:**
  - `references/00-rules-budgets-and-scoring.md` — Las 15 reglas (`RULE-001`–`RULE-015`), Árbol KPI, presupuestos, puntuación multidimensional independiente y fuentes oficiales.
  - `references/01-performance-assets-and-frontend.md` — `LP-01/02/03/04/10`: AVIF/WebP/SVGO, `fetchpriority="high"` vs `loading="lazy"`, WOFF2 subsetting, Critical CSS, Zero-JS, aislamiento de terceros, Edge Caching/Brotli y Lighthouse CI.
  - `references/02-seo-ux-cro-a11y-security.md` — `LP-05` (puente con `/busqueda`), `LP-06` UX/UI, `LP-07` CRO honesto, `LP-08` WCAG 2.2 AA y `LP-09` Seguridad.
- **Presets de Presupuesto (`config/`):** `config/strict.json` · `config/balanced.json` *(defecto)* · `config/flexible.json`
- **Workflows:** `workflows/audit-and-blueprint.md` (`F0–F5` + `GATE 1`) · `workflows/implement-and-verify.md` (`F6–F10`)
- **Plantillas:** `templates/optimization-blueprint.md` · `templates/final-handover-report.md`
- **CLI determinista:** `scripts/landing-opt-cli.mjs` (`autopilot optimizar iniciar|auditar-activos|linea-base|comparar|generar-lhci`)

---

## Pipeline de Trabajo (`F0`–`F10` + `GATE 1`)

1. **`F0` Context Discovery + `F1` Architecture Discovery:** leer `toolkit.config.json`, `.claude/landing-design/scope.json`, `docs/arquitectura/routes-map.json`, `docs/diseno/design-tokens.json` y `docs/seo/seo-config.json`; identificar ruta(s) de landing, objetivo de conversión, componentes compartidos y preset de presupuesto (`strict` | `balanced` | `flexible`).
2. **`F2` Baseline Measurement:** ejecutar `autopilot optimizar linea-base` para congelar `docs/optimizacion/baseline.json` y registrar métricas reales disponibles (separando laboratorio vs campo/CrUX, sin inventar cifras).
3. **`F3` Comprehensive Audit + `F4` Root Cause Analysis (Híbrido):**
   - Evaluar solo las dimensiones aplicables de `LP-01` a `LP-10`.
   - Ejecutar `autopilot optimizar auditar-activos --json` (imágenes sobredimensionadas, PNG/JPG sin WebP/AVIF, `loading="lazy"` en Hero, `<img>` sin dimensiones, fuentes sin WOFF2, scripts de terceros en `<head>`).
   - Ejecutar **`/busqueda`** (`autopilot busqueda auditar --json`) para el pilar **`LP-05 (SEO técnico)`**.
   - Ejecutar `autopilot tokens auditar --json` para contraste **WCAG 2.2 AA (`LP-08`)** cuando exista `design-tokens.json`.
   - Aplicar el **Árbol KPI** (conversión → UX → CWV → causa raíz técnica).
4. **`F5` Optimization Blueprint + `GATE 1` (Autorización obligatoria):**
   - Entregar hallazgos estructurados (`LP-PERF-001`, etc.), puntuaciones independientes por dimensión y plan priorizado `P0–P3` con `TEST_PLAN` y `ROLLBACK_PLAN`.
   - **Detenerse aquí** hasta recibir autorización explícita para implementar.
5. **`F6` Controlled Implementation → `F7` QA → `F8` Re-measurement → `F9` Final Validation → `F10` Handover:**
   - Implementar por bloques aprobados sin romper identidad visual ni funcionalidades.
   - Ejecutar `autopilot optimizar comparar` contra `baseline.json` (`RULE-011`) y `autopilot busqueda auditar --strict`.
   - Opcionalmente generar `docs/optimizacion/lighthouserc.generated.json` (`autopilot optimizar generar-lhci`) para blindar el CI/CD.

---

## Reglas Inquebrantables (Resumen `RULE-001`–`RULE-015`)
- Auditar antes de modificar (`RULE-001`) · Identificar stack real (`RULE-002`) · Nunca inventar métricas ni tasas de conversión (`RULE-003`) · Pedir autorización antes de modificar o desplegar (`RULE-004`, `RULE-013`) · No sacrificar accesibilidad, identidad visual ni funcionalidades por puntaje (`RULE-006`, `RULE-007`, `RULE-014`) · Comparar antes y después con evidencia (`RULE-008`, `RULE-011`).

## Comandos CLI Rápidos
```bash
autopilot optimizar iniciar --preset balanced     # Crea docs/optimizacion/landing-opt.config.json
autopilot optimizar auditar-activos --strict      # Escanea imágenes, fuentes, lazy en Hero, img sin width/height y scripts en <head>
autopilot optimizar linea-base                    # Congela docs/optimizacion/baseline.json (F2)
autopilot optimizar comparar                      # Compara estado actual vs baseline.json (F8 antes/después)
autopilot optimizar generar-lhci                  # Genera lighthouserc.generated.json para CI/CD según preset
```
