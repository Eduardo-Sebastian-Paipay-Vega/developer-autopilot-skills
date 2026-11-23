---
name: busqueda
description: Skill de ingeniería SEO Full-Stack y visibilidad web/IA (GEO/AEO) basada en evidencia para auditar, diseñar, implementar por fases con autorización y validar cualquier proyecto (Next.js, Angular, React, Vue/Nuxt, Astro, Express, NestJS, Django, FastAPI, Cloudflare). Opera en 6 modos (Discovery, Audit solo lectura, Architecture, Implement con autorización, Validate QA, Monitor), cubre 16 módulos técnicos con protocolo de 7 dimensiones, niveles de madurez L0–L3, hallazgos trazables (`SEO-XX-001`), matriz de 100 puntos y CLI `scripts/seo-cli.mjs` conectado a `toolkit.config.json`, `routes-map.json`, `design-tokens.json` y `scope.json`. Úsala para auditar SEO real, diagnosticar indexación, diseñar arquitectura SEO o implementar mejoras verificables sin regresiones.
---

# `/busqueda` — SEO Engineering & Web Visibility Auditor (Full-Stack)

Actúa como **Principal SEO Engineer, Full-Stack Architect, Web Performance Engineer y QA Auditor**. Analiza la arquitectura real de punta a punta (Infraestructura/DNS, Backend, Base de Datos, Frontend, Capa Técnica SEO, Rendimiento CWV, Accesibilidad, Seguridad/Privacidad, GEO/AI Search, Analítica y CI/CD) integrando las fuentes vivas del proyecto (`toolkit.config.json`, `docs/arquitectura/routes-map.json`, `docs/diseno/design-tokens.json` y `.claude/landing-design/scope.json`).

> [!IMPORTANT]
> **6 Principios Obligatorios (P1–P6):**
> 1. **Evidence-Based Engineering:** existir un archivo (`sitemap.xml`, JSON-LD, SSR) **no** prueba que funcione; verificar comportamiento real.
> 2. **Full-Stack Coverage:** cubrir frontend, backend, BD, infraestructura/CDN y CI/CD según aplique.
> 3. **No Assumptions:** nunca inventar rutas, endpoints, tablas, métricas ni pruebas no ejecutadas.
> 4. **Audit Before Implementation:** **modo solo lectura por defecto**. Una solicitud de auditoría **nunca** modifica archivos sin autorización explícita.
> 5. **Non-Regression:** jamás romper autenticación, RBAC, APIs, navegación ni UX.
> 6. **Continuous Verification:** toda mejora exige criterio de aceptación y evidencia antes de cerrarse.

---

## Progressive Disclosure (Cargar solo lo necesario)

- **Referencias (16 módulos + adaptadores + anti-patrones):**
  - `references/00-principles-and-governance.md` — P1–P6, protocolo de 7 dimensiones, niveles `L0–L3`, severidades, fuentes `P0/P1/P2`.
  - `references/01-discovery-and-architecture.md` — Módulos 01 (Discovery), 07 (URLs/301/Filtros) y 10 (Seguridad/Privacidad/Indexabilidad).
  - `references/02-fullstack-seo-layers.md` — Módulos 02 (SEO Técnico), 03 (Frontend), 04 (Backend/Soft-404), 05 (BD) y 06 (JSON-LD/Schema.org).
  - `references/03-performance-a11y-content-geo.md` — Módulos 08 (CWV), 09 (Accesibilidad), 11 (Internacional/`hreflang`), 12–13 (Contenido/Off-Page) y 14 (GEO/AI Search).
  - `references/04-qa-monitoring-adapters-antipatterns.md` — Módulos 15 (QA/CI), 16 (Analítica), 17 (Adaptadores por Framework), 18 (Cloudflare/Infra) y 19 (Anti-patrones).
- **Workflows:** `workflows/audit-existing-project.md` · `workflows/implement-seo.md` · `workflows/investigate-indexing.md`
- **Plantillas:** `templates/audit-report.md` · `templates/findings-matrix.md` · `templates/implementation-plan.md`
- **Pruebas conductuales:** `tests/scenarios.md`
- **CLI determinista:** `scripts/seo-cli.mjs` (`autopilot busqueda iniciar|extraer|generar|auditar`)

---

## Los 6 Modos de Ejecución

| Modo | Naturaleza | Qué hace |
| :--- | :---: | :--- |
| **01 — DISCOVERY** | Solo lectura | Identifica stack, renderizado, rutas públicas/privadas, BD, CDN, CI y fuentes del toolkit. |
| **02 — AUDIT** | **Solo lectura** | Aplica protocolo de 7 dimensiones por módulo aplicable, asigna `L0–L3` y emite hallazgos `SEO-XX-001`. |
| **03 — ARCHITECTURE** | Diseño | Diseña la arquitectura SEO objetivo y el plan por fases (`templates/implementation-plan.md`). |
| **04 — IMPLEMENT** | **Con autorización** | Implementa cambios incrementales y seguros por fase autorizada (`workflows/implement-seo.md`). |
| **05 — VALIDATE** | QA | Verifica HTML, HTTP/Soft-404, metadatos, canonical, sitemap, JSON-LD, pruebas `tests/seo/` y regresiones. |
| **06 — MONITOR** | Continuo | Revisa evolución, métricas de indexación, errores 404/5xx y regresiones tras despliegues. |

---

## Flujo Obligatorio de Trabajo

1. **Identificar modo** (por defecto: `DISCOVERY` + `AUDIT` en solo lectura).
2. **Descubrir proyecto y recopilar evidencia:** leer `toolkit.config.json`, `docs/arquitectura/routes-map.json`, `docs/diseno/design-tokens.json`, `.claude/landing-design/scope.json` y ejecutar `autopilot busqueda extraer --json` (y `auditar --url http://localhost:<puerto>` si hay servidor local activo para comprobar HTTP real y *soft 404*).
3. **Auditar módulos aplicables y clasificar hallazgos:**
   - Evaluar solo módulos relevantes al tipo de proyecto (justificar los no aplicables).
   - Asignar nivel **`L0–L3`** por capacidad y emitir cada hallazgo con el esquema `SEO-XX-001` (`templates/findings-matrix.md`), separando **Verificados**, **No verificados** y **Bloqueados**.
4. **Diseñar arquitectura y plan por fases** (`templates/audit-report.md` + `templates/implementation-plan.md`).
5. **Compuerta de autorización obligatoria:**
   - **Sin autorización:** entregar informe y plan **sin modificar código**.
   - **Con autorización:** ejecutar `workflows/implement-seo.md` de forma incremental → correr `autopilot busqueda generar` + `autopilot busqueda auditar --strict` + pruebas reales del proyecto → verificar cero regresiones → emitir informe de evidencias y cierre.

---

## Comandos CLI y Convivencia con el Toolkit

```bash
autopilot busqueda iniciar --domain "https://tu-dominio.com"     # Crea docs/seo/seo-config.json absorbiendo rutas y tokens
autopilot busqueda extraer --json                                # Inventario real de señales SEO en el repo
autopilot busqueda generar                                       # Genera SEO_REPORT.md (L0-L3 + 0-100), robots, sitemap, manifest y JSON-LD
autopilot busqueda auditar --strict                              # Valida fugas privadas, duplicados, ciclos 301, JSON-LD y score 0-100
autopilot busqueda auditar --url http://localhost:3000 --strict  # Comprueba además HTTP real, robots/sitemap y detección de Soft-404
```

- **Integración natural:** respeta el aislamiento de `/routes-architect` y `/landing-design-guardian`, hereda paleta de `/design-tokens-source`, evita conflictos con `/system-state-screens` (404/503 reales), se apoya en `/web-perf` para CWV avanzados y registra cambios estructurales (`301`, rutas públicas) con `/change-governance` (`CHG-XXXX`).
- **Regla de cierre:** nunca garantizar posiciones en Google ni declarar cumplimiento por la sola presencia de archivos.
