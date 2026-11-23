# Estándar Técnico Integral de SEO & AI Search (GEO)

Referencia técnica canónica para `/busqueda`. Aplica a cualquier arquitectura web sin acoplarse a un único framework.

---

## 1. Arquitectura SEO de 6 Capas

1. **Dominio y DNS:** dominio canónico único (`https://`), redirecciones `301` directas (sin cadenas), TLS válido, CDN/Cloudflare con Brotli y HTTP/2-3.
2. **Infraestructura y Servidor:** códigos HTTP exactos (`200`, `301`, `302`, `304`, `404`, `410`, `429`, `500`, `503`), `Cache-Control` seguro (nunca cachear sesiones/privado), `Content-Type`, `X-Robots-Tag`, `HSTS`, `CSP`, `X-Content-Type-Options`.
3. **Backend y Persistencia:** fuente única de `SeoMetadata`, slugs únicos/estables, ciclo de vida de contenido (`draft` → `published` → `archived` → `deleted 404/410` | `redirected 301`), generación dinámica de sitemap, prevención estricta de *soft 404*.
4. **Frontend:** SSR/SSG/ISR/prerendering para rutas públicas, HTML semántico (`<html lang>`, landmarks, `H1` único, `<a href>`), metadatos únicos por ruta, Open Graph/Twitter Cards, optimización de imágenes (sin `loading="lazy"` en imagen LCP) y accesibilidad.
5. **Capa SEO Técnica:** `robots.txt`, `sitemap.xml` (máx. 50 000 URLs / 50 MB por archivo), `canonical` absoluto, `hreflang` recíproco (si es multilingüe), `JSON-LD` (`Schema.org`), `manifest.webmanifest` y `llms.txt` opcional.
6. **Validación, Analítica y CI/CD:** Search Console, PageSpeed/Lighthouse, GA4/analítica, pruebas automatizadas en `tests/seo/` que bloquean despliegues ante errores críticos (fuga de privacidad, canonical roto, sitemap inválido).

---

## 2. Contrato de Metadatos (`SeoMetadata`) y Modelo SQL

```ts
export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string; // ej. 'index, follow' | 'noindex, nofollow'
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  locale?: string;
  structuredData?: Record<string, unknown>;
}
```

Modelo relacional base (adaptable a Prisma/TypeORM/Django/SQL):
- `seo_metadata (id, entity_type, entity_id, status, title, description, canonical_url, robots, og_title, og_description, og_image, created_at, updated_at)` con índice único en `(entity_type, entity_id)` y restricción de unicidad en `canonical_url` para registros `published`.

---

## 3. Adaptadores Recomendados por Stack

| Stack | Implementación recomendada |
| :--- | :--- |
| **Next.js (App Router)** | `generateMetadata()`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, SSR/SSG/ISR para `(landing)` y `robots: { index: false, follow: false }` en `(intranet)`/`(system)`. |
| **Angular** | Angular SSR / Prerendering, `Title` y `Meta` services, `DOCUMENT` para `<link rel="canonical">` y `<script type="application/ld+json">`. |
| **React (SPA/Vite)** | Migrar rutas públicas a framework SSR/SSG o prerendering estático; nunca confiar visibilidad orgánica crítica a CSR sin HTML inicial. |
| **Vue / Nuxt** | `useSeoMeta()`, `useHead()`, `@nuxtjs/sitemap` / `@nuxtjs/robots`, SSR/SSG híbrido por `routeRules`. |
| **Django** | `django.contrib.sitemaps`, templates con bloques `title`/`meta`/`canonical`, middleware `X-Robots-Tag` en staging. |
| **Express / NestJS / FastAPI** | Endpoints públicos `GET /api/public/*`, códigos HTTP reales (`404`/`410`), tabla/servicio de redirecciones `301`, headers `Cache-Control` y compresión Brotli/Gzip. |
| **Cloudflare** | DNS + SSL Full (Strict), Cache Rules separando estáticos de rutas autenticadas, Redirect Rules `301` para dominio canónico, Brotli + HTTP/3. |

---

## 4. Core Web Vitals y GEO (AI Search)

- **Umbrales CWV (p75):** `LCP ≤ 2.5 s` · `INP ≤ 200 ms` · `CLS ≤ 0.1`.
- **GEO / AEO:** contenido original y verificable, autoría explícita, fechas reales de publicación/actualización, HTML semántico limpio, entidades `Schema.org` coherentes y políticas conscientes para crawlers de IA. `llms.txt` es opcional y complementario; **no** reemplaza SEO técnico tradicional.

---

## 5. Matriz de Auditoría Técnica (100 Puntos)

> Puntuación de cumplimiento de ingeniería interna (no predice rankings de Google).

| # | Pilar | Peso | Verificaciones clave |
| :---: | :--- | :---: | :--- |
| 1 | Infraestructura y servidor | **10** | Dominio canónico HTTPS, `301` sin cadenas/ciclos, compresión/CDN, headers/caché |
| 2 | Backend | **12** | Contrato `SeoMetadata`, códigos HTTP reales (cero soft-404), sitemap dinámico, redirecciones |
| 3 | Frontend | **15** | SSR/SSG en rutas públicas, HTML semántico, `title`/`description`/`canonical` únicos, enlaces `<a>`, multimedia |
| 4 | SEO técnico | **15** | `robots.txt`, `sitemap.xml`, canonicalización, `hreflang` (si aplica), `JSON-LD` válido, control de filtros |
| 5 | Rendimiento | **12** | LCP / INP / CLS, imágenes modernas sin lazy en LCP, fuentes `WOFF2`, consultas SQL/caché |
| 6 | Seguridad y privacidad | **8** | Aislamiento público vs privado/admin/login, `X-Robots-Tag: noindex` en staging, cero PII en HTML/logs |
| 7 | Contenido y semántica | **10** | Contenido original, jerarquía de encabezados, autoría/fuentes, arquitectura sin páginas huérfanas |
| 8 | Accesibilidad | **5** | `alt` descriptivo, `<html lang>`, navegación por teclado, formularios accesibles |
| 9 | Analítica | **5** | Search Console, analítica de eventos/conversiones, monitorización de errores 404/5xx |
| 10 | QA y CI/CD | **8** | Suite `tests/seo/` automatizada, gate en Pull Request/CI, auditoría post-despliegue |

**Interpretación:** `90–100` Excelente · `80–89` Bueno · `70–79` Aceptable con mejoras · `50–69` Deficiencias importantes · `< 50` Requiere intervención.

---

## 6. Errores Prohibidos (Bloqueantes en CI)

1. Páginas privadas, admin, login o APIs internas marcadas `index` o incluidas en `sitemap.xml`.
2. Usar `robots.txt` como mecanismo de seguridad o bloquear CSS/JS críticos.
3. Un mismo `<title>` o `canonical` apuntando a `/` en todas las rutas.
4. Devolver `200 OK` en rutas inexistentes (*soft 404*) o redirigir todo `404` al inicio.
5. `JSON-LD` con JSON inválido o datos inventados que no existen en la página.
6. Redirecciones `301` circulares o encadenadas.
