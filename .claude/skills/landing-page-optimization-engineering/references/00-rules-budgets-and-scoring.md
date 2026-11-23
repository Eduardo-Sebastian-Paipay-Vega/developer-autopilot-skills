# Reglas, Presupuestos, Árbol KPI y Puntuación Multidimensional

## 1. Las 15 Reglas Obligatorias (`RULE-001` a `RULE-015`)
- **RULE-001:** Auditar antes de modificar.
- **RULE-002:** Identificar el stack real (nunca asumir Next.js, Node o librerías sin verificar).
- **RULE-003:** No inventar métricas ni tasas de conversión cuando no existe línea base histórica.
- **RULE-004:** No modificar funcionalidades sin autorización explícita (`GATE 1`).
- **RULE-005:** No introducir dependencias innecesarias.
- **RULE-006:** No sacrificar accesibilidad por rendimiento.
- **RULE-007:** No alterar la identidad visual (`landing-design-guardian` / `design-tokens-source`) sin autorización.
- **RULE-008:** Verificar todos los cambios con pruebas reales.
- **RULE-009:** Registrar todos los archivos modificados.
- **RULE-010:** Mantener trazabilidad (`LP-XXX-001` → `TASK_ID` → prueba de aceptación).
- **RULE-011:** Comparar estado antes y después bajo condiciones comparables (`baseline` vs `compare`).
- **RULE-012:** Documentar limitaciones (ej. falta de CrUX, entorno solo local).
- **RULE-013:** No desplegar sin autorización.
- **RULE-014:** No eliminar funcionalidades reales solo para inflar puntuaciones de Lighthouse.
- **RULE-015:** Detenerse ante riesgos no contemplados y consultar al usuario.

## 2. Árbol de Descomposición (KPI Tree)
Priorizar siempre de negocio → síntoma UX → cuello de botella CWV → causa raíz técnica:
`Meta de conversión (CR / CAC)` → `Rebote / fricción móvil` → `LCP / INP / CLS` → `Hero sin AVIF/WebP + fuentes bloqueantes + scripts de terceros en <head>`.

## 3. Presupuestos de Rendimiento (`config/*.json`)
- **3 niveles:** `strict` (páginas ligeras), `balanced` (por defecto), `flexible` (multimedia/mapas interactivos).
- Cada presupuesto registra unidad, ámbito de medición, condición y justificación. Son objetivos internos configurables, **no** exigencias universales.

## 4. Sistema de Puntuación Multidimensional (100% — Reportado por Separado)
| Dimensión | Peso | Nota |
| :--- | :---: | :--- |
| Performance (`LP-01/02`) | **20%** | CWV, transferencia, imágenes, fuentes |
| SEO técnico (`LP-05`) | **15%** | **Delegado y auditado con `/busqueda`** |
| UX/UI (`LP-06`) | **15%** | Jerarquía, navegación, responsive móvil |
| Conversión CRO (`LP-07`) | **15%** | CTA, formularios, embudo, señales de confianza |
| Accesibilidad (`LP-08`) | **10%** | WCAG 2.2 AA, contraste, teclado |
| Frontend & Arquitectura (`LP-03`) | **10%** | HTML, CSS crítico, JS, DOM |
| Backend & Infraestructura (`LP-04`) | **5%** | SSR/SSG/ISR, caché, Brotli/HTTP2-3 |
| Seguridad (`LP-09`) | **5%** | HTTPS, CSP, privacidad, dependencias |
| Sostenibilidad (`LP-10`) | **5%** | Peso transferido y eficiencia de recursos |

> **Regla de transparencia:** reportar siempre las puntuaciones independientes; un 95% técnico jamás debe ocultar un 40% en CRO o accesibilidad.

## 5. Precisiones sobre Fuentes Oficiales
- **Google Core Web Vitals (`web.dev`):** son parte de los sistemas de posicionamiento, pero alcanzar 100/100 no garantiza posición #1. Lighthouse es medición de **laboratorio** y no sustituye a **CrUX** (campo).
- **Google Ads Quality Score:** evalúa experiencia de landing junto con relevancia del anuncio y CTR esperado (no afirmar mecánicamente que cualquier landing lenta sube el CPC).
- **Estándares de referencia:** W3C WCAG 2.2, W3C Resource Timing, IETF RFC 9113 (HTTP/2), RFC 9114 (HTTP/3), RFC 7932 (Brotli) y AOMedia (AVIF).
