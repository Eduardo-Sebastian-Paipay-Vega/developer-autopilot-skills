# Módulos 02–06 — SEO Técnico, Frontend, Backend, Base de Datos y Datos Estructurados

## Módulo 02: SEO Technical
- **Dominio canónico único:** consolidar `http/https` y `www/non-www` con `301` directo hacia una sola URL oficial.
- **`robots.txt`:** permitir rutas públicas y recursos CSS/JS críticos; listar `Disallow` de zonas privadas y URL absoluta de `Sitemap:`.
- **`sitemap.xml`:** solo URLs canónicas `200 OK` publicadas; excluir borradores, privadas, `noindex`, `404`/`410` y duplicados; límite 50 000 URLs o 50 MB por archivo (usar índice de sitemaps si se supera).
- **`canonical`:** URL absoluta única por página, coherente entre frontend y backend.

## Módulo 03: SEO Frontend
- Priorizar **SSR, SSG, ISR o prerendering** en páginas públicas; reservar CSR puro para módulos privados autenticados.
- HTML semántico: `<html lang="...">`, `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`, `H1` principal coherente, navegación pública con `<a href>` reales (no solo `onclick`).
- Metadatos independientes por ruta (`title`, `description`, `canonical`, `robots`, Open Graph `og:*` y Twitter Cards con URLs absolutas).

## Módulo 04: SEO Backend
- Contrato único `SeoMetadata`: `{ title, description, canonicalUrl, robots, ogTitle?, ogDescription?, ogImage?, ogType?, locale?, structuredData? }`.
- Estados HTTP reales: `200`, `301`, `302`, `304`, `400`, `401`, `403`, `404`, `410`, `429`, `500`, `503`.
- **Prevención estricta de Soft-404:** nunca devolver `200 OK` para recursos inexistentes o páginas de error.
- Endpoints públicos consistentes (`/api/public/*`) separados de APIs privadas.

## Módulo 05: SEO Database
- Modelo conceptual `seo_metadata` con unicidad por `(entity_type, entity_id)` y restricción de `canonical_url` único en estado `published`.
- Ciclo de vida explícito de contenido: `draft` (no indexable) · `published` (en sitemap) · `archived` · `deleted` (`404`/`410`) · `redirected` (`301`).
- Validar slugs únicos, índices en columnas de lookup y ausencia de registros huérfanos.

## Módulo 06: Structured Data (`JSON-LD` / `Schema.org`)
- Tipos frecuentes: `Organization`, `LocalBusiness`, `WebSite`, `WebPage`, `Article`, `BlogPosting`, `Product`, `Service`, `BreadcrumbList`, `Person`, `Event`, `Course`, `VideoObject`.
- Reglas: JSON válido, correspondencia exacta con contenido visible, sin reseñas/precios inventados, sin entidades duplicadas contradictorias. Que un tipo exista en Schema.org no garantiza rich results en Google.
