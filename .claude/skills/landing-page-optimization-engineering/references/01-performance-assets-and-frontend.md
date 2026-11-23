# Capas de Rendimiento, Activos, Frontend, Backend y Sostenibilidad (`LP-01/02/03/04/10`)

## Capa 1: Activos Visuales y Multimedia (60%–75% del peso típico)
- **Jerarquía de formatos:** `AVIF` primario → `WebP` fallback universal → `SVG` minificado (SVGO) para iconos y logotipos.
- **Above-the-fold (Hero / LCP):**
  - **Prohibido `loading="lazy"`** en la imagen principal LCP.
  - Usar `fetchpriority="high"`, `decoding="sync"` y `width`/`height` explícitos para evitar CLS.
  - Precargar (`<link rel="preload" as="image">`) solo si el navegador no la descubre de inmediato en HTML.
- **Below-the-fold:** `loading="lazy"` y `decoding="async"` + cortes responsivos (`srcset` + `sizes`: `480w`, `768w`, `1280w`, `1920w`).
- **Detección obligatoria:** imágenes > `HERO_IMAGE_BUDGET_KB`, PNG/JPG sin variante moderna, duplicados, assets sin usar y videos sin `poster`.

## Capa 2: Entrega de Red, Backend y Protocolos (`TTFB`)
- **Renderizado:** priorizar SSG/ISR/SSR para landings públicas; cachear en Edge (Cloudflare/CDN) para mantener `TTFB ≤ 200–800 ms` sin cachear respuestas autenticadas.
- **Compresión:** Brotli (nivel 11 en build estático) / Gzip + HTTP/2 (RFC 9113) / HTTP/3 (RFC 9114).
- **Resource Hints:** `preconnect` solo para 1–2 orígenes críticos; `dns-prefetch` para secundarios.

## Capa 3: Renderizado Crítico (CSS y Tipografía)
- **Critical CSS:** minimizar CSS bloqueante en el primer pantallazo.
- **Fuentes:** formato `WOFF2`, subsetting a alfabeto latino/requerido (`unicode-range`), `font-display: swap`, precargar solo la fuente principal de cuerpo/hero (máximo 1–2 archivos).

## Capa 4: Ejecución de JavaScript (`INP` y `TBT`)
- **Zero-JS por defecto en secciones estáticas** (Server Components / Islands / HTML puro).
- **Aislamiento de scripts de terceros:** GTM, píxeles y widgets de chat deben diferirse tras interacción (`onScroll`/`onPointerMove`) o ejecutarse en Web Worker (ej. Partytown), nunca bloqueando `<head>`.

## Gobernanza Continua: Lighthouse CI + RUM
- Usar `autopilot optimizar generar-lhci` para crear `lighthouserc.generated.json` alineado al preset (`strict`/`balanced`/`flexible`) y bloquear regresiones en PRs según política configurable.
- Complementar laboratorio con **RUM** (CrUX, Cloudflare Web Analytics, Vercel Speed Insights o Sentry) en dispositivos móviles reales.
