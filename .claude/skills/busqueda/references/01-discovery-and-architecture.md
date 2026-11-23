# Módulos 01, 07 y 10 — Discovery, Arquitectura de URLs y Seguridad/Indexabilidad

## Módulo 01: Project Discovery
Inspeccionar sin asumir:
- Lenguajes, frameworks frontend/backend, BD/ORM, estrategia de renderizado (SSR/SSG/ISR/CSR), router, CMS, CDN/hosting y CI/CD.
- Consumir fuentes existentes del toolkit antes de escanear a ciegas:
  - `toolkit.config.json` (stack, nube, rutas de artefactos).
  - `docs/arquitectura/routes-map.json` (`/routes-architect`: rutas `public`, `auth`, `internal`, `terminal`, `system`).
  - `docs/diseno/design-tokens.json` (`/design-tokens-source`: colores para `manifest.webmanifest` y OG).
  - `.claude/landing-design/scope.json` (`/landing-design-guardian`: `publicRoutes` vs `excludedRoutes`).
- Clasificar el **tipo de proyecto** (corporativo, e-commerce, SaaS, sistema empresarial privado con portal público, educativo, blog, marketplace) para marcar módulos no aplicables sin generar reportes vacíos.

## Módulo 07: URL Architecture
- Estándar: minúsculas, palabras descriptivas, guiones (`-`), sin caracteres especiales ni parámetros innecesarios, slugs únicos y estables.
- Redirecciones `301`: registro trazable, sin bucles (`A → A`) ni cadenas (`A → B → C`), nunca redirigir masivamente todo `404` al inicio, actualizar enlaces internos al destino final.
- Paginación y filtros (`?page=2`, `?categoria=...&orden=...`): decidir explícitamente qué facetas aportan valor de búsqueda (indexables con canonical propia) y cuáles se consolidan o excluyen del sitemap para evitar explosión de URLs.
- Evitar páginas huérfanas (sin enlaces internos entrantes) y usar breadcrumbs (`BreadcrumbList`).

## Módulo 10: Security, Privacy & Indexability
- Separación estricta de superficies:
  - **No indexables + autenticadas:** `/admin`, `/dashboard`, `/intranet`, `/api/private`, documentos internos y paneles con datos personales.
  - **Login / recuperación / activación:** `noindex, nofollow`.
  - **Staging / preproducción:** `X-Robots-Tag: noindex, nofollow` (y **no** bloquear simultáneamente con `robots.txt` si el rastreador debe leer el `noindex`).
- `robots.txt` controla **rastreo**, jamás seguridad ni control de acceso.
- Prohibido exponer tokens, credenciales o PII en HTML inicial, meta tags, logs o caché pública de CDN.
