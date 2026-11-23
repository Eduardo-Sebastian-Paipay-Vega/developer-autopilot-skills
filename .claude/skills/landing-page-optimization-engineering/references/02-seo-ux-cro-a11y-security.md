# SEO (`/busqueda`), UX/UI, CRO, Accesibilidad y Seguridad (`LP-05/06/07/08/09`)

## LP-05: SEO Técnico — Delegación Obligatoria a `/busqueda`
**No duplicar reglas SEO aquí.** Toda auditoría, configuración y validación SEO de la landing se ejecuta mediante **`/busqueda`** (`autopilot busqueda extraer|generar|auditar --strict`):
- Metadatos únicos (`title`, `description`, `canonical`), Open Graph, Twitter Cards, `robots.txt`, `sitemap.xml`, `JSON-LD` Schema.org, prevención de *soft 404*, aislamiento respecto a rutas privadas (`/routes-architect` y `.claude/landing-design/scope.json`) y cumplimiento `L0–L3` + matriz 0–100.
- Solo aplicar `hreflang` si la landing es realmente multilingüe.

## LP-06: UX/UI & Identidad Visual
- **Respeto estricto a `/landing-design-guardian` y `/design-tokens-source`:** no alterar colores, tipografía ni identidad visual sin autorización (`RULE-007`).
- Verificar jerarquía visual above-the-fold, mobile-first (`390x844`), cero scroll horizontal accidental y profundidad de navegación simple.

## LP-07: Conversión (CRO)
- Evaluar visibilidad y claridad del **CTA primario** en móvil y escritorio, número de campos estrictamente necesarios en formularios, mensajes de error claros, señales de confianza verificables (testimonios reales, sellos, políticas) y consentimiento legal si aplica.
- **Regla de honestidad (`RULE-003`):** si no hay datos históricos de `BASELINE_CONVERSION_RATE`, registrar `"Línea base comercial no disponible"` y **no** atribuir incrementos garantizados de conversión sin prueba A/B o analítica real.

## LP-08: Accesibilidad (WCAG 2.2 AA)
- Contraste mínimo `4.5:1` texto normal / `3:1` UI (verificado con `autopilot tokens auditar`), foco visible (`:focus-visible`), navegación completa por teclado, `<label>` en formularios, `alt` descriptivo (y `alt=""` en decorativas) y respeto a `prefers-reduced-motion`.

## LP-09: Seguridad y Privacidad
- HTTPS obligatorio, cabeceras `CSP`, `HSTS`, `X-Content-Type-Options`, protección anti-spam en formularios públicos, cero secretos/tokens en HTML cliente y auditoría de scripts de terceros.
