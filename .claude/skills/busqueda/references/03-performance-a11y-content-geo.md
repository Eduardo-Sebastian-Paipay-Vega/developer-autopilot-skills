# Módulos 08, 09, 11–14 — Rendimiento, Accesibilidad, Internacional, Contenido y AI Search (GEO)

## Módulo 08: Web Performance (Core Web Vitals)
- Umbrales oficiales (p75 por dispositivo): **`LCP ≤ 2.5 s`** · **`INP ≤ 200 ms`** · **`CLS ≤ 0.1`**.
- **Frontend:** formatos modernos (`WebP`/`AVIF`/`SVG`), `width`/`height` explícitos, `srcset`/`sizes`, `loading="lazy"` solo fuera de pantalla (**nunca** en la imagen principal LCP), fuentes `WOFF2` + `font-display: swap`, code splitting y eliminación de tareas largas.
- **Backend:** eliminar consultas N+1, índices SQL, compresión Brotli/Gzip, caché diferenciada por tipo de recurso y CDN.

## Módulo 09: Accessibility
- `<html lang="es-PE">` (o locale real del sitio), atributos `alt` útiles, contraste WCAG 2.2 AA (en coordinación con `/design-tokens-source`), navegación completa por teclado, `<label>` en formularios y ARIA solo cuando aporte semántica real.

## Módulo 11: International SEO (`hreflang`)
- Aplicar solo cuando existan múltiples idiomas o regiones reales (`/es-pe/`, `/en-us/`).
- Exigir reciprocidad entre versiones, códigos ISO válidos, `x-default`, `canonical` coherente en cada versión y contenido realmente traducido/localizado sin redirecciones forzadas que bloqueen bots.

## Módulo 12 & 13: Content, On-Page & Off-Page Authority
- Contenido original, útil, verificable y coherente con el `title`/`H1`; jerarquía lógica de encabezados y enlaces internos con texto descriptivo.
- Off-Page: reputación verificable, perfiles oficiales y referencias legítimas; prohibidas granjas de enlaces, menciones falsas o manipulación.

## Módulo 14: AI Search Visibility (GEO / AEO)
- Optimizar comprensibilidad para motores generativos: contenido verificable, autoría explícita, fechas reales de publicación/actualización, HTML semántico limpio, entidades `Schema.org` consistentes y URLs públicas accesibles.
- `llms.txt`: opcional y complementario (convención emergente, **no** requisito oficial de Google ni sustituto del SEO técnico).
