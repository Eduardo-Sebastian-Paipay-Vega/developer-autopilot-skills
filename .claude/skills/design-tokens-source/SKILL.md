---
name: design-tokens-source
description: Fuente única de verdad para crear, extraer, editar, auditar y propagar todos los tokens de identidad visual de un proyecto (colores de marca, neutros, estados, tokens HSL shadcn/ui, paleta del portal público/landing, tipografía, espaciado, radios, sombras, tema Prime/MUI, layout/sidebar, movimiento MDES y foco/accesibilidad WCAG 2.2 AA). Evita hex sueltos y desincronización entre landing, sistema interno, animaciones y librería UI. Incluye el CLI `scripts/tokens-cli.mjs` (`init`, `extract`, `generate`, `audit`). Úsala cuando se necesite inventariar el diseño actual, crear una identidad nueva o cambiar colores/tipografías en todo el sistema de forma controlada.
---

# Design Tokens Source — Fuente Única de Identidad Visual

Centraliza, audita y propaga **toda la identidad visual** del proyecto — tanto del **portal público (landing)** como del **sistema interno (intranet/dashboard)**, librerías UI, sidebar y animaciones MDES — desde una **única fuente de verdad (`design-tokens.json`)**.

> [!IMPORTANT]
> **Regla de fuente única:** ninguna otra skill (`enterprise-sidebar`, `system-state-screens`, `motion-design-engineer`, `frontend-standards`) debe inventar colores ni tipografías si existe `design-tokens.json` o `docs/diseno/DESIGN_TOKENS.md`. Todas consumen sus tokens.
>
> Referencias (*progressive disclosure*):
> - `references/token-architecture.md` — Las 15 secciones canónicas del inventario visual, mapeo Landing ↔ Sistema Interno, conversión Hex→HSL (shadcn/ui), puente con MDES/Sidebar/Prime y checklist WCAG 2.2 AA.
> - `scripts/tokens-cli.mjs` — CLI sin dependencias (`init`, `extract`, `generate`, `audit`).

---

## Los 4 Modos de Operación

| Modo | Cuándo usarlo | Comando CLI |
| :--- | :--- | :--- |
| **1. Extraer e inventariar** | El proyecto ya tiene CSS/Tailwind/temas y quieres documentar la realidad exacta + detectar anomalías. | `node .claude/skills/design-tokens-source/scripts/tokens-cli.mjs extract` |
| **2. Crear desde cero** | Proyecto nuevo: definir paleta de marca, neutros, tipografías y generar `design-tokens.json`. | `node .claude/skills/design-tokens-source/scripts/tokens-cli.mjs init` |
| **3. Editar y propagar** | Cambió un color, radio o fuente: editar `design-tokens.json` y regenerar CSS + MD sincronizados. | `node .claude/skills/design-tokens-source/scripts/tokens-cli.mjs generate` |
| **4. Auditar contraste y fugas** | Verificar WCAG 2.2 AA (contraste real), variables duplicadas y hex hardcodeados en componentes. | `node .claude/skills/design-tokens-source/scripts/tokens-cli.mjs audit --strict` |

*(También disponible globalmente desde cualquier proyecto vía `autopilot tokens <init|extract|generate|audit>`).*

---

## Procedimiento obligatorio (5 pasos)

### Paso 1: Detectar el punto de partida
1. Comprueba si ya existe `design-tokens.json` en la raíz del proyecto (o en `docs/diseno/design-tokens.json`).
2. Si **no existe** y el proyecto ya tiene código frontend (`globals.css`, `styles.scss`, `tailwind.config.*`, temas Prime/MUI, `mdes-base.css`, `layout.tsx`), ejecuta `extract` para leer los tokens reales del código fuente sin inventar nada.
3. Si es un **proyecto nuevo**, ejecuta `init` y pide al usuario los datos base de marca (color primario, secundario, acento, superficie/fondo, fuentes de texto/títulos, si soporta modo oscuro o solo claro, y si el portal público usa una variante de acento distinta a la intranet).

### Paso 2: Consolidar la Fuente Única (`design-tokens.json`)
Estructura todos los tokens en `design-tokens.json` cubriendo:
- **Identidad de marca:** primario, oscuro, profundo, claro/foco, acento, superficie y variantes de portal público (`landing`) vs. sistema interno (`app`).
- **Paletas:** neutros/grises, acentos, enlaces, utilidades de estado (`success`, `error`, `warning`, `info`) y escalas de dominio específicas del negocio (si aplican).
- **Tipografía:** familias (sans, heading, display/landing, mono), pesos y escalas responsivas.
- **Geometría:** radios (`--radius`, botones, tarjetas), sombras, contenedores y breakpoints.
- **Movimiento y accesibilidad:** curvas, duraciones, foco global (`outline`, `outline-offset`) y tema `brand` para `motion-design-engineer` (`--motion-*`).

### Paso 3: Generar artefactos sincronizados (`generate`)
Ejecuta `generate` para producir a partir de `design-tokens.json`:
1. **`design-tokens.generated.css`:**
   - Variables base en `:root` (Light + Dark si `colorSchemes` incluye `dark`).
   - Bloque semántico **HSL automático** para `shadcn/ui` / Tailwind (`--primary`, `--secondary`, `--accent`, `--destructive`, `--border`, `--ring`, `--radius`) sin duplicaciones conflictivas.
   - Bloque de portal público (`.landing-page` / `.bbd-page` si el proyecto define overrides públicos aislados).
   - Puente automático `[data-motion-theme="brand"]` para `motion-design-engineer` y `--sidebar-*` para `enterprise-sidebar`.
2. **`docs/diseno/DESIGN_TOKENS.md`:** inventario completo y legible en Markdown con las 15 secciones (ver `references/token-architecture.md`) y fecha de extracción/actualización.

### Paso 4: Auditar contraste WCAG 2.2 AA y anomalías (`audit`)
Ejecuta `audit` para detectar automáticamente:
- **Contraste insuficiente:** ratio calculado con luminancia relativa W3C (`< 4.5:1` en texto normal o `< 3:1` en elementos gráficos/foco).
- **Variables CSS duplicadas** en `:root` (ej. un bloque hex sobrescrito silenciosamente por un bloque HSL).
- **Valores hex sueltos hardcodeados** en componentes (`text-[#...]`, `bg-[#...]`, `border-[#...]`) que deberían usar tokens semánticos.
- **Desalineación MDES / Librería UI:** alertar si `motion-design-engineer` sigue usando azul por defecto en vez de `data-motion-theme="brand"`.

### Paso 5: Gobernanza y convivencia con otras skills
- Si el proyecto usa `landing-design-guardian`, respeta el aislamiento de `scope.json`: los overrides del portal público viven en su contenedor (ej. `.landing-page` / `.bbd-page`) y nunca rompen el sistema interno.
- Si un cambio de identidad afecta múltiples módulos (`C2–C3`), regístralo con `/change-governance` (`CHG-XXXX`) y actualiza `docs/CHANGELOG_INTERNO.md`.
- No sobrescribas archivos de tema del proyecto ni hagas commits sin autorización explícita.
