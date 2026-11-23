# Módulos 15–19 — QA/CI, Analítica, Adaptadores por Framework, Cloudflare y Anti-Patrones

## Módulo 15: SEO QA & CI/CD
Estructura recomendada en el proyecto:
`tests/seo/`: `metadata.spec.ts`, `canonical.spec.ts`, `robots.spec.ts`, `sitemap.spec.ts`, `structured-data.spec.ts`, `internal-links.spec.ts`, `http-status.spec.ts`, `semantic-html.spec.ts`, `accessibility.spec.ts`, `performance.spec.ts`, `indexability.spec.ts`.
- **Bloqueantes en CI (`--strict`):** fuga de páginas privadas indexables, `canonical` roto/duplicado, `sitemap` con URLs inválidas/privadas, `JSON-LD` inválido, *soft 404*, bucles `301`.
- **Avisos no bloqueantes:** ajustes editoriales de longitud de `description` o mejoras menores.

## Módulo 16: Analytics & Monitoring
- Herramientas: Google Search Console, PageSpeed Insights, Lighthouse, GA4 (o analítica equivalente) y monitoreo de errores `404`/`5xx`.
- Indicadores: URLs indexadas vs excluidas, impresiones, clics orgánicos, CTR, errores 404, CWV reales y páginas huérfanas.

## Módulo 17: Framework Adapters
| Stack | Implementación recomendada |
| :--- | :--- |
| **Next.js (App Router)** | `generateMetadata()`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, SSR/SSG/ISR en `(landing)` y `robots: { index: false, follow: false }` en `(intranet)`/`(system)`. |
| **Angular** | Angular SSR / Prerendering, `Title` y `Meta` services, `DOCUMENT` para `canonical` y `JSON-LD`. |
| **React (SPA/Vite)** | Prerendering o migración de rutas públicas a framework SSR/SSG. |
| **Vue / Nuxt** | `useSeoMeta()`, `useHead()`, `@nuxtjs/sitemap` / `@nuxtjs/robots`, `routeRules`. |
| **Django** | `django.contrib.sitemaps`, templates con bloques SEO y middleware `X-Robots-Tag` en staging. |
| **Express / NestJS / FastAPI** | APIs públicas `/api/public/*`, códigos HTTP exactos (`404`/`410`), tabla de `301`, Brotli/Gzip y `Cache-Control`. |

## Módulo 18: Cloudflare & Infraestructura
- DNS administrado, SSL/TLS Full (Strict), Redirect Rules `301` para dominio canónico, Brotli + HTTP/2-3.
- **Regla crítica de caché:** separar estrictamente caché de estáticos/público respecto a rutas autenticadas, cookies de sesión y respuestas personalizadas.

## Módulo 19: Anti-Patrones Prohibidos
1. Mismo `<title>` o `canonical` apuntando a `/` en todo el sitio.
2. `robots.txt` usado como seguridad o bloqueando `.css`/`.js`.
3. SPA/CSR sin contenido inicial en páginas públicas críticas.
4. `loading="lazy"` en la imagen principal LCP.
5. Enlaces públicos implementados solo con `onclick`.
6. `JSON-LD` inventado o duplicado contradictorio.
7. Devolver `200 OK` en rutas inexistentes (*soft 404*).
