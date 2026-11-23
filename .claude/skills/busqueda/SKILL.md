---
name: busqueda
description: Estándar técnico integral de SEO y búsqueda con IA (GEO/AEO) a nivel de ingeniería de software para cualquier proyecto web (Next.js, Angular, React, Vue/Nuxt, Astro, Express, NestJS, Django, FastAPI, Cloudflare). Opera a partir de toda la información real del proyecto (`toolkit.config.json`, `routes-map.json`, `design-tokens.json`, `scope.json`, frontend y backend) para configurar, generar y auditar arquitectura SEO, metadatos únicos, canonical, robots.txt, sitemap.xml, JSON-LD Schema.org, Open Graph, manifest.webmanifest, redirecciones 301, prevención de soft-404, aislamiento público/privado, Core Web Vitals y matriz de auditoría de 100 puntos. Incluye el CLI `scripts/seo-cli.mjs` (`init`, `extract`, `generate`, `audit`). Úsala cuando se necesite implementar, estructurar o auditar SEO técnico y visibilidad web/IA de punta a punta.
---

# `/busqueda` — Estándar Técnico Integral de SEO & AI Search (GEO)

Implementa y audita el **SEO como ingeniería de software transversal** (Infraestructura/DNS, Backend/APIs/BD, Frontend/SSR/HTML semántico, Capa técnica `robots.txt`/`sitemap.xml`/`JSON-LD`/`canonical`/`OG`, Rendimiento CWV, Seguridad/Aislamiento y QA/CI), leyendo automáticamente la información viva del proyecto (`toolkit.config.json`, `docs/arquitectura/routes-map.json`, `docs/diseno/design-tokens.json` y `.claude/landing-design/scope.json`).

> [!IMPORTANT]
> **Regla de fuente única y separación de capas:**
> - **Nunca** indexar rutas privadas, dashboards, login, APIs internas ni entornos de staging (`noindex, nofollow` + autenticación real; `robots.txt` controla rastreo, no seguridad).
> - **Nunca** inventar reseñas, calificaciones o entidades en `JSON-LD` que no coincidan con el contenido visible.
> - **Nunca** devolver `200 OK` en páginas inexistentes o vacías (*soft 404*).
>
> Referencias (*progressive disclosure*):
> - `references/seo-engineering-standard.md` — Arquitectura de 6 capas, contratos `SeoMetadata`/BD, adaptadores por framework, Core Web Vitals, GEO/AI Search, pruebas Playwright/CI y matriz de 100 puntos.
> - `scripts/seo-cli.mjs` — CLI sin dependencias (`init`, `extract`, `generate`, `audit` / `iniciar`, `extraer`, `generar`, `auditar`).

---

## Los 5 Modos de Operación

| Modo | Cuándo usarlo | Comando CLI |
| :--- | :--- | :--- |
| **1. Iniciar configuración SEO** | Crea `docs/seo/seo-config.json` absorbiendo automáticamente rutas públicas/privadas de `routes-map.json` + `scope.json` y colores de marca de `design-tokens.json`. | `node .claude/skills/busqueda/scripts/seo-cli.mjs init` |
| **2. Extraer realidad del repo** | Escanea frontend, backend y `public/` para inventariar `robots.txt`, `sitemap`, `manifest`, metadatos, `canonical`, `JSON-LD`, `<html lang>`, `loading="lazy"` y headers. | `node .claude/skills/busqueda/scripts/seo-cli.mjs extract` |
| **3. Implementar por capas** | Implementar metadatos dinámicos/estáticos, SSR/SSG, `sitemap`, `robots`, `JSON-LD`, `301`, headers y pruebas SEO adaptados al stack real (`Next.js`, `Angular`, `Django`, `Express`, etc.). | *(Flujo guiado por agente según `references/seo-engineering-standard.md`)* |
| **4. Generar artefactos SEO** | Genera `docs/seo/SEO_REPORT.md` (con matriz de 100 pts), `robots.generated.txt`, `sitemap.generated.xml`, `manifest.generated.webmanifest` y `organization.schema.jsonld`. | `node .claude/skills/busqueda/scripts/seo-cli.mjs generate` |
| **5. Auditar cumplimiento (0–100)** | Valida duplicados de `title`/`canonical`, fuga de rutas privadas al sitemap, ciclos en redirecciones `301`, JSON-LD inválido y calcula la puntuación técnica 0–100. | `node .claude/skills/busqueda/scripts/seo-cli.mjs audit --strict` |

*(También disponible globalmente desde cualquier proyecto vía `autopilot busqueda <iniciar|extraer|generar|auditar>` o `autopilot seo`).*

---

## Procedimiento obligatorio (5 pasos)

### Paso 0: Absorber el Contexto Real del Proyecto (Conexión Natural)
Antes de tocar código o proponer configuraciones, lee:
1. `toolkit.config.json` (`project`, `stack.frontend`, `stack.backend`, `cloud`, `design`, `routes`, `seo`).
2. `docs/arquitectura/routes-map.json` (`/routes-architect`): separa automáticamente qué rutas son **`public`** (indexables) y cuáles son **`auth`/`internal`/`terminal`/`system`** (`noindex` + protegidas).
3. `docs/diseno/design-tokens.json` (`/design-tokens-source`): hereda `brand.primary`, `brand.surface` y tipografía para `manifest.webmanifest` y tarjetas Open Graph.
4. `.claude/landing-design/scope.json` (`/landing-design-guardian`): valida `publicRoutes` vs `excludedRoutes`.
5. Clasifica el **tipo de proyecto** (corporativo, e-commerce, SaaS, sistema empresarial privado con portal público, portal educativo, blog, marketplace) para priorizar las capas correctas sin sobreingeniería.

### Paso 1: Configurar Dominio Canónico, Infraestructura y Seguridad de Indexación
- Define un único dominio canónico (`https://...`) con redirección `301` directa (sin cadenas ni bucles) desde variantes secundarias (`http`, `www`/non-`www`).
- Asegura `X-Robots-Tag: noindex, nofollow` en staging/preproducción sin bloquearlo en `robots.txt` (el rastreador necesita leer el `noindex`).
- Verifica `Cache-Control` diferenciado: nunca cachear públicamente respuestas privadas o personalizadas (Cloudflare/CDN).

### Paso 2: Capa Backend y Gestión de Contenido / Rutas
- Define una única fuente de metadatos (`SeoMetadata`: `title`, `description`, `canonicalUrl`, `robots`, `ogTitle`, `ogDescription`, `ogImage`, `structuredData`, `locale`).
- Diferencia estados de contenido: `draft` (no indexable), `published` (en sitemap), `archived`, `deleted` (`404` o `410` real, cero *soft 404*) y `redirected` (`301` registrado sin bucles).
- Genera el `sitemap.xml` dinámicamente solo con URLs canónicas publicadas (límite 50 000 URLs / 50 MB por archivo).

### Paso 3: Capa Frontend, HTML Semántico, Datos Estructurados y GEO
- Prioriza **SSR / SSG / ISR / prerendering** para rutas públicas; reserva CSR puro para módulos privados autenticados.
- Garantiza HTML semántico (`<html lang="...">`, `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`, `H1` único y coherente, enlaces reales `<a href>` nunca solo `onclick`).
- Configura metadatos únicos por ruta, `canonical` absoluto, Open Graph / Twitter Cards y `JSON-LD` (`Organization`, `WebSite`, `BreadcrumbList`, `Article`, `Product`, `Service`, `Course`, etc.) coherente con el contenido visible.
- Optimiza multimedia y Core Web Vitals (`LCP ≤ 2.5s`, `INP ≤ 200ms`, `CLS ≤ 0.1`): dimensiones explícitas, `WebP`/`AVIF`, **sin `loading="lazy"` en la imagen principal LCP**, fuentes `WOFF2` + `font-display: swap`.
- Aplica buenas prácticas **GEO / AI Search**: contenido verificable, autoría clara, fechas reales, entidades consistentes y (opcionalmente) `llms.txt` sin reemplazar el SEO técnico tradicional.

### Paso 4: Generar Artefactos y Pruebas Automatizadas (`generate` + `audit`)
1. Ejecuta `autopilot busqueda generar` para materializar `docs/seo/SEO_REPORT.md` y los artefactos base (`robots.generated.txt`, `sitemap.generated.xml`, `manifest.generated.webmanifest`, `organization.schema.jsonld`).
2. Ejecuta `autopilot busqueda auditar --strict` para comprobar:
   - Cero fugas de rutas privadas/admin/login al `sitemap` o con `index`.
   - Cero `title` o `canonicalUrl` duplicados entre páginas públicas.
   - Cero redirecciones circulares o encadenadas.
   - Sintaxis JSON-LD válida y puntuación técnica 0–100 desglosada en los 10 pilares.
3. Propón/integra pruebas SEO automatizadas en `tests/seo/` (Playwright/Vitest/Jest) y gate en CI/CD.

### Paso 5: Gobernanza y Convivencia
- Si la optimización modifica URLs públicas, estructura de rutas o añade redirecciones `301`, sincroniza `/routes-architect` y registra el cambio con `/change-governance` (`CHG-XXXX`).
- Para auditoría profunda de Core Web Vitals en producción/staging, apóyate también en la skill `/web-perf` si está disponible.
- Nunca hagas commits ni sobrescribas archivos productivos (`public/robots.txt`, `layout.tsx`, etc.) sin confirmación explícita del usuario.
