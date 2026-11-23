# Plan de Implementación SEO por Fases (Requiere Autorización)

> Ningún cambio de código se ejecutará hasta recibir confirmación explícita sobre las fases aprobadas.

| Fase | Objetivo | Hallazgos (`ID`) | Archivos afectados | Riesgo de regresión | Criterio de aceptación |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **Fase 1** | Bloqueantes de seguridad/indexabilidad y soft-404 | `SEO-SEC-*`, `SEO-BE-*` | ... | Bajo / Medio | `autopilot busqueda auditar --strict` sin errores críticos |
| **Fase 2** | Metadatos únicos, canonical, sitemap, robots y JSON-LD | `SEO-FE-*`, `SEO-TECH-*` | ... | Bajo | HTML inicial + JSON-LD válidos y sin duplicados |
| **Fase 3** | Rendimiento CWV, accesibilidad, GEO y suite `tests/seo/` | `SEO-PERF-*`, `SEO-QA-*` | ... | Bajo | Pruebas SEO pasando en local y CI |
