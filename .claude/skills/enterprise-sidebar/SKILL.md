---
name: enterprise-sidebar
description: Diseña, reorganiza e implementa sidebars empresariales accesibles, responsivos y gobernados por RBAC, adaptándose automáticamente a los tokens de diseño, tipografía, framework y librería UI del proyecto (Angular/PrimeNG, Next.js/shadcn/ui, React/MUI, Vue/Vuetify o Tailwind puro). Aplica arquitectura de información (máx. 2 niveles, Regla de Miller 3–7 ítems, etiquetas ≤ 22 chars), dimensiones exactas (260px expandido / 68px colapsado con Flyout Popover / Drawer móvil <768px), WCAG 2.2 AA, filtrado recursivo de permisos, persistencia sin layout shift y atajo Ctrl+B. Úsala cuando se pida crear, rediseñar o reorganizar la navegación lateral o el menú principal de un sistema.
---

# Enterprise Sidebar Architect

Diseña, depura y construye sidebars empresariales listos para producción, **adaptados a la identidad visual y stack real del proyecto** (nunca impone una librería UI ni colores ajenos).

> [!IMPORTANT]
> Esta skill usa *progressive disclosure*:
> - `references/design-tokens-geometry.md` — Dimensiones exactas (`260px`/`68px`/móvil), tipografía, iconografía, tokens semánticos WCAG 2.2 AA y transiciones CSS.
> - `references/rbac-and-config.md` — Esquema declarativo (`NavSection[]`/`NavItem`), algoritmo de filtrado recursivo RBAC, persistencia SSR-safe y adaptadores por framework.

---

## Procedimiento obligatorio (6 pasos)

### Paso 0: Detectar Stack, Librería UI y Tokens de Diseño del Proyecto
1. Lee `toolkit.config.json` (`stack.frontend`, `stack.ui_libraries`, `stack.css_framework`) o inspecciona `package.json`, `components.json`, `angular.json` / `next.config.*`.
2. Lee los tokens visuales existentes del proyecto (`globals.css`, `styles.scss`, `tailwind.config.*`, tema PrimeNG/shadcn/MUI o `landing-design-guardian`) para **heredar su tipografía, paleta primaria, bordes y modo claro/oscuro**.
3. Si existe `docs/planeacion/plan-maestro.md` o `plan.md`, lee la jerarquía oficial de módulos, rutas y roles RBAC antes de reorganizar el menú.
4. Si el proyecto aún no define framework o librería UI, **pregunta al usuario** antes de generar código.

### Paso 1: Arquitectura de Información y Reorganización de Rutas
Audita las rutas actuales y reestructúralas aplicando estas 5 reglas estrictas:
1. **Profundidad máxima de 2 niveles:** `Sección Semántica` → `Ítem Principal` → `Sub-ítem desplegable`. **Prohibido 3 niveles en el sidebar**; cualquier tercer nivel se resuelve con pestañas (`Tabs`) dentro de la vista destino.
2. **Regla de Miller (`3 a 7 ítems` por grupo semántico):** divide grupos saturados y fusiona grupos de 1 ítem si no ameritan categoría propia.
3. **Ordenamiento vertical por frecuencia operativa:**
   - **Anclaje superior (fuera de acordeones):** Dashboard / Resumen Ejecutivo.
   - **Bloque medio (de mayor a menor uso diario):** Core operativo → Operaciones/Inventario → Finanzas/Reportes → Catálogos/Directorio.
   - **Anclaje inferior (Footer fijo):** Gobernanza, Usuarios/Roles, Configuración y Perfil.
4. **Nomenclatura concisa:** máximo **22 caracteres** (1–3 palabras) orientadas a la tarea del usuario, nunca nombres técnicos de tablas o modelos de BD.
5. **Saneamiento de rutas huérfanas:** elimina del archivo de navegación toda ruta *deprecated*, inexistente o sin permiso asignado.

### Paso 2: Geometría, Tipografía, Iconografía y Contraste (`references/design-tokens-geometry.md`)
Aplica los tokens exactos adaptados a la paleta del proyecto:
- **Anchos:** `260px` expandido (`240–280px`) · `68px` colapsado (`64–72px`) · Drawer móvil `<768px` (`280px`, máx. `85vw`).
- **Alturas:** Header `64px` (`56px` móvil) · Ítem raíz `40px` (`44px` táctil móvil) · Sub-ítem `36px` (`40px` móvil).
- **Tipografía:** Group Labels `11px` (`font-semibold uppercase tracking-wider`) · Nivel 1 `14px` (`500` reposo / `600` activo) · Nivel 2 `13px` (`400` reposo / `500` activo).
- **Iconografía:** Nivel 1 `18×18px` (`stroke-width` uniforme `1.75–2px`, gap `10–12px`) · **Nivel 2 sin iconos** (usa punto `4px` o línea guía vertical `1px`).
- **Contraste WCAG 2.2 AA:** mínimo `4.5:1` en texto y `3:1` en iconos tanto en Light como en Dark mode.
- **Indicador activo no cromático:** además del fondo tintado y color primario, incluye una **barra vertical izquierda de `3px`** (`rounded-r-full`) para no depender solo del color.

### Paso 3: Comportamiento, Microinteracciones y Scroll Independiente
- **Layout Flexbox vertical de altura completa (`h-screen flex flex-col`):** `Header` (`shrink-0`), `NavBody` (`flex-1 overflow-y-auto overflow-x-hidden`), `Footer` (`shrink-0 border-t`). El scroll del sidebar nunca arrastra al contenido principal.
- **Transiciones suaves (con soporte `prefers-reduced-motion`):**
  - Ancho: `width 200ms cubic-bezier(0.2, 0, 0, 1)`.
  - Acordeón: `grid-template-rows 180ms ease-out` (sin saltos de altura).
  - Chevron: `transform 150ms ease` (`rotate-0` → `rotate-90`).
  *(Si `motion-design-engineer` está instalada, alinea curvas y tokens `--motion-ease-standard` / `--motion-dur-fast`).*
- **Sincronización con la ruta activa:** al cargar o recargar (`F5`), abre automáticamente el grupo padre que contiene la ruta activa y marca el ítem con `aria-current="page"`.
- **Persistencia sin *layout shift*:** guarda `sidebar_collapsed` en `localStorage` (SPA) o en **cookie SSR** (Next.js App Router / Nuxt) para evitar parpadeo en el primer render.
- **Modo colapsado (`68px`):**
  - Ítem simple → **Tooltip** a la derecha (`sideOffset: 8px`, delay `150ms`) con nombre y atajo.
  - Módulo con hijos → **Floating Popover / Flyout Menu** lateral con título y enlaces clicables.
- **Móvil (`< 768px`):** se renderiza como Drawer con overlay y se cierra automáticamente al seleccionar cualquier ruta.

### Paso 4: Configuración Declarativa, RBAC Recursivo y Contexto Tenant (`references/rbac-and-config.md`)
1. Separa la estructura en `navigation.config.ts` (`NavSection[]` / `NavItem`), completamente desacoplada del componente visual.
2. Implementa filtrado recursivo de `requiredPermissions`:
   - Si un ítem padre con `children` queda con `children.length === 0` tras filtrar → **ocultar el padre**.
   - Si una `NavSection` queda sin ítems visibles → **ocultar la cabecera de sección**.
3. **Badges:** permitidos **únicamente** para elementos que requieren acción inmediata (pendientes, alertas de error); prohibidos badges decorativos.
4. **Header de Tenant/Empresa (si el sistema es multiempresa):** muestra logo, razón social activa y distintivo de entorno (`QA`/`STAGING`) si no es producción.

### Paso 5: Accesibilidad (A11y) y Navegación por Teclado
- Envolver en `<aside aria-label="Navegación principal">` y `<nav>`.
- Botones de submenú: `aria-expanded="true|false"` y `aria-controls="submenu-<id>"`.
- Ruta activa: `aria-current="page"`.
- Ítems colapsados: `aria-label="<Nombre del módulo>"`.
- Teclado: `Tab`/`Shift+Tab`, `Enter`/`Space`, foco visible (`focus-visible:ring-2`) y atajo global **`Ctrl + B`** (`Cmd + B` en macOS) para alternar colapso/expansión.

### Paso 6: Control de Calidad y Verificación Real
Ejecuta `build` / `lint` / `typecheck` del proyecto (`0 errores`) y valida explícitamente los 5 criterios:
1. ¿Se llega a cualquier módulo operativo en **máximo 2 clics**?
2. ¿Recargar con **F5** mantiene abierto el acordeón correcto y resaltada la ruta activa?
3. ¿Al colapsar a **`68px`** siguen accesibles los submódulos mediante **Popover/Flyout**?
4. ¿Con un rol restringido desaparecen los ítems sin permiso **y las secciones que quedan vacías**?
5. ¿En móvil (`< 768px`) elegir una ruta cierra automáticamente el **Drawer**?

---

## Reglas inquebrantables

- Nunca 3 niveles de profundidad en el sidebar.
- Nunca iconos en ítems de Nivel 2.
- Nunca hardcodear roles/rutas de otra empresa; usar las rutas y permisos reales del proyecto activo.
- Nunca mostrar secciones vacías ni padres sin hijos visibles tras el filtrado RBAC.
- No sobrescribir archivos existentes ni hacer commits sin autorización del usuario.
