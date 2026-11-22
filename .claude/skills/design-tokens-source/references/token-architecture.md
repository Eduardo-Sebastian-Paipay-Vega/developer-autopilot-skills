# Arquitectura del Inventario Maestro de Tokens (15 Secciones Canónicas)

Todo documento `docs/diseno/DESIGN_TOKENS.md` generado por esta skill mantiene una estructura completa y homogénea para que tanto humanos como agentes de IA consulten una sola verdad:

## Las 15 secciones del inventario maestro

1. **Identidad de marca:** roles principales (primario, oscuro, profundo, foco/selección, acento, superficie, fondo `<body>` y `::selection`).
2. **Paleta base (`:root`):** marca, escala de grises, acentos, enlaces (`link`, `hover`, `on-dark`) y utilidades de estado (`success`, `error`, `warning`, `info`).
3. **Tokens semánticos (HSL / `shadcn/ui`):** conversión exacta Hex → `H S% L%` sin bloques duplicados conflictivos.
4. **Paleta del portal público / landing:** overrides aislados bajo clase contenedora (ej. `.landing-page` / `.bbd-page`) para no contaminar la intranet.
5. **Escalas de dominio:** colores semánticos específicos del negocio (estados de órdenes, calificaciones, prioridades, niveles de riesgo).
6. **Tipografía:** familias (`--font-sans`, `--font-heading`, `--font-display`, `--font-mono`), método de carga y escala display responsiva.
7. **Espaciado, contenedores y breakpoints:** anchos máximos de contenedor, paddings responsivos y breakpoints.
8. **Radios, bordes y sombras:** `--radius` base, radios por componente y niveles de elevación (`shadow-card`, `shadow-elevated`).
9. **Tema de librería UI:** mapeo explícito hacia PrimeNG / PrimeReact / Angular Material / MUI / Vuetify según el stack detectado en `toolkit.config.json`.
10. **Layout e Intranet:** tokens del sidebar (`--sidebar-bg`, `--sidebar-active-*`, `260px`/`68px`, transiciones) y cabeceras.
11. **Degradados y héroes:** composición exacta de gradientes aprobados para banners y tarjetas destacadas.
12. **Movimiento y animación (MDES):** curvas, duraciones y mapeo `[data-motion-theme="brand"]` (`--motion-primary`, `--motion-secondary`, `--motion-accent`, `--motion-danger`, `--motion-surface`, `--motion-stroke`).
13. **Componentes con estilo propio:** botones especiales, píldoras, enlaces animados y reglas de `content-visibility`.
14. **Foco y accesibilidad:** anillo de foco global (`outline`, `outline-offset`), variantes sobre fondos oscuros, `@media (hover: hover) and (pointer: fine)` y `prefers-reduced-motion`.
15. **Observaciones y anomalías conocidas:** tokens duplicados, alias heredados, hex sueltos pendientes de migrar y activos de marca (favicon, logos).

---

## Reglas de higiene de tokens

- **Un solo formato por token semántico:** si Tailwind/shadcn consume `hsl(var(--primary))`, **nunca** declarar `--primary: #4F000B` en el mismo `:root`; usar exclusivamente `352 100% 15%`.
- **Contraste WCAG 2.2 AA verificado matemáticamente:**
  - Texto normal (`< 18pt`): ratio mínimo **`4.5:1`**.
  - Texto grande (`≥ 18pt` o `14pt bold`) e iconos/bordes de control: ratio mínimo **`3.0:1`**.
- **Puente automático con el resto del toolkit:**
  - `motion-design-engineer` → lee `--motion-*` del bloque `[data-motion-theme="brand"]`.
  - `enterprise-sidebar` → lee `--sidebar-*` derivados del primario y superficie.
  - `system-state-screens` → usa `--utility-success`, `--utility-error`, `--utility-warning`, `--utility-info` y `brand`.
  - `landing-design-guardian` → compara el diseño medido del portal contra la sección 4 (paleta pública).
