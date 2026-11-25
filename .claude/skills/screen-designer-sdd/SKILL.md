---
name: screen-designer-sdd
description: Herramienta #2 del Gestor de Frontend (Frontend-First + SDD). Diseñador detallado de pantallas y componentes UI basado en el Estándar UI-STD-001 y la Guía Maestra de Arquitectura UI. A partir de `docs/frontend/screens-spec.json` (`/screen-spec-architect`), `routes-map.json`, `plan-maestro.md`, `design-tokens.json`, `db-schema.json` y la librería UI real del proyecto (`PrimeReact`, `shadcn/ui + Radix`, `PrimeNG`, `MUI`, `Vuetify`, `Ant Design`, `Tailwind`), genera documentación específica por cada pantalla en 3 niveles (`00_relacional.md`, `#frontend` → `01_frontend.md`, `#backend` → `02_backend.md`, `#integraciones` → `03_integraciones.md`), diseña cada componente (`CMP-XXX`) con sus props, 6 estados de input, 5 estados de datos, métricas Base-8/WCAG/Nielsen y comprueba documentalmente que cada componente cumple su RF/CU antes de programar. Incluye `scripts/screen-designer-cli.mjs` (`autopilot disenar`).
---

# `/screen-designer-sdd` — Diseñador Detallado por Pantalla y Componentes UI (`#frontend`, `#backend`, `#integraciones`)

Herramienta #2 del **Gestor de Frontend**: toma cada pantalla definida por `/screen-spec-architect` (`SCR-001`, `SCR-002`...) y produce su **paquete documental completo por pantalla** (`docs/frontend/pantallas/<slug>/`), comenzando por **`00_relacional.md` + `01_frontend.md` (`#frontend`)** para desarrollo *Frontend-First*, estrictamente alineado a la **librería UI real del proyecto** y auditado documentalmente contra `RF` y `CU`.

> [!IMPORTANT]
> **Reglas Inquebrantables de Ingeniería UI (`UI-STD-001`):**
> 1. **100% basado en información relacional real:** cada pantalla y cada componente (`CMP-XXX`) debe trazar explícitamente a un `RF-XX`, `CU-XX`, rol RBAC y entidad de datos real (`screens-spec.json`, `routes-map.json`, `plan-maestro.md`, `db-schema.json`). Prohibido inventar funcionalidades fuera de alcance.
> 2. **Alineación estricta con la librería UI instalada:** leer `toolkit.config.json → stack.ui_libraries` y `references/ui-library-mapping.md` (`PrimeReact`, `shadcn/ui`, `PrimeNG`, `MUI`, `Vuetify`, `Ant Design`). **Nunca** diseñar componentes de PrimeNG en un proyecto PrimeReact o shadcn/ui.
> 3. **Comprobación documental obligatoria al final:** ninguna pantalla pasa a código hasta ejecutar `autopilot disenar verificar --strict` y comprobar que **cada componente cumple documentalmente su función, RF, 5 estados de datos, responsive y WCAG 2.2 AA**.
>
> Referencias (*progressive disclosure*):
> - `references/ui-std-001-metrics-and-rules.md` — 10 principios, 8 capas, 16 tipologías, retícula Base-8, densidad, reglas estrictas de componentes, 6 estados de input, 5 estados UI, validación `onBlur`, métricas Nielsen/WCAG/UX, checklist 16.1–16.6 y puntuación 0–100.
> - `references/ui-library-mapping.md` — Equivalencia exacta de componentes canónicos hacia `PrimeReact`, `shadcn/ui + Radix`, `PrimeNG`, `MUI` y `Vuetify`.
> - `scripts/screen-designer-cli.mjs` — CLI sin dependencias (`generate`, `verify` | `generar`, `verificar`).

---

## Estructura Generada por Cada Pantalla

```text
docs/frontend/pantallas/<slug-pantalla>/      # ej. login/, intranet-usuarios/
├── 00_relacional.md                          # Trazabilidad pura: SCR-XXX, Ruta, Módulo, RF, CU, Actores, RBAC, Entidades BD, Endpoints
├── 01_frontend.md                            # Nivel #frontend (UI-STD-001): Tipología, Grid 8pt, Densidad, Inventario CMP-XXX alineado a la librería UI, Ficha detallada por componente, 5 UI States, Validación, Checklist 16.1–16.6 y Score 0–100
├── 02_backend.md                             # Nivel #backend (cuando se active): Contratos API, DTOs, permisos servidor, códigos HTTP
└── 03_integraciones.md                       # Nivel #integraciones (cuando se active): WebSockets, storage, auth/Turnstile, eventos
```

---

## Los 3 Niveles de Activación

| Nivel / Tag | Alcance | Comando CLI |
| :--- | :--- | :--- |
| **`#frontend`** *(por defecto / Frontend-First)* | Genera y detalla `00_relacional.md` + `01_frontend.md` por pantalla con inventario `CMP-XXX` alineado a la librería UI real y auditoría documental. | `autopilot disenar generar --level frontend` |
| **`#backend`** | Agrega `02_backend.md` con contratos REST/DTO, validaciones servidor, reglas RBAC y códigos HTTP por pantalla. | `autopilot disenar generar --level backend` |
| **`#integraciones`** | Agrega `03_integraciones.md` con WebSockets, R2/Storage, Turnstile, colas, notificaciones y analítica por pantalla. | `autopilot disenar generar --level integraciones` |

*(Usa `--screen <SCR-001|slug>` para trabajar una pantalla específica como `login`, o sin `--screen` para toda la aplicación.)*

---

## Procedimiento Obligatorio (5 pasos)

### Paso 1: Cargar Contexto Relacional y Librería UI Real
1. Lee `toolkit.config.json` (`stack.frontend`, `stack.ui_libraries`, `stack.css_framework`).
2. Lee `docs/frontend/screens-spec.json` (`/screen-spec-architect`), `docs/arquitectura/routes-map.json`, `docs/planeacion/plan-maestro.md`, `docs/diseno/design-tokens.json` y `docs/bd/db-schema.json` (si existe).
3. Consulta `references/ui-library-mapping.md` para fijar el catálogo exacto de componentes permitidos (ej. `PrimeReact`: `DataTable`, `InputText`, `Password`, `Dropdown`, `Dialog`, `Sidebar`, `Toast`, `Skeleton`, `Button`).

### Paso 2: Generar la Estructura Base por Pantalla (`generar`)
Ejecuta:
```bash
autopilot disenar generar --level frontend
```
(o `--screen login` para diseñar una pantalla concreta primero). Esto crea `00_relacional.md` y `01_frontend.md` sin sobrescribir archivos existentes.

### Paso 3: Diseñar `00_relacional.md` (Verdad Relacional Pura)
Verifica que contenga exclusivamente datos reales y trazables del proyecto:
- `SCR-XXX`, Ruta URL, Módulo, Grupo, Actores y Roles RBAC cerrados.
- Tabla de `RF-XX` y `CU-XX` que resuelve esta pantalla (y qué queda **Out-of-Scope**).
- Entidades/tablas de BD involucradas (`db-schema.json`) y endpoints previstos (`routes-map.json`).
- Navegación entrante/saliente y dependencias con otras pantallas.

### Paso 4: Diseñar `01_frontend.md` (Ingeniería UI-STD-001 + Librería Real)
Aplicando `references/ui-std-001-metrics-and-rules.md` y `references/ui-library-mapping.md`, especifica:
1. **Tipología, Densidad y Retícula:** arquetipo de pantalla (Auth, Dashboard, Data Grid, Detail 360°, Form/Wizard/Drawer, Settings, Split View, System State), escala Base-8 (`4/8/16/24/32/48px`), rejilla `12/8/4` columnas y modo de densidad (`Compacta`, `Estándar`, `Confortable`).
2. **Inventario de Componentes (`CMP-001`..`CMP-N`):** tabla con ID, componente canónico, **componente exacto de la librería UI del proyecto**, variante, RF/CU que satisface y obligatoriedad.
3. **Ficha Técnica Detallada por Componente (`CMP-XXX`):** propósito, `RF`/`CU` trazado, componente real de plantilla, `inputs`/`props`, `outputs`/`events`, los **6 estados de entrada** (`Default/Hover/Focus/Disabled/ReadOnly/Error`) o **5 estados de datos** (`Ideal/Loading/Empty/Error/Partial-Overflow`), comportamiento responsive (`Desktop/Tablet/Mobile`), accesibilidad WCAG 2.2 AA (teclado, foco, contraste, hit-area `44px`) y criterios de aceptación.
4. **Reglas de Validación, UX Writing y Resiliencia:** validación `onBlur` + re-validación `onChange` tras error, preservación de datos ante fallo de red, `isDirty` Unsaved Changes Guard, bloqueo `isLoading` anti-double-submit, botones específicos (máx. 1 primario por vista/modal) y Toast de error persistente (`durationMs: null`).
5. **Checklist de Auditoría (16.1–16.6) y Puntuación 0–100** (8 dimensiones + bloqueos críticos).

### Paso 5: Verificación Documental Obligatoria (`verificar --strict`)
Antes de cerrar o pasar a programar la pantalla, ejecuta:
```bash
autopilot disenar verificar --strict
```
Comprueba que:
- Toda pantalla tiene `00_relacional.md` y `01_frontend.md`.
- Cada `RF-XX` declarado en `00_relacional.md` está trazado y resuelto en `01_frontend.md` por componentes `CMP-XXX`.
- La documentación referencia explícitamente la librería UI real del proyecto, los estados obligatorios (`Loading`, `Empty`, `Error`), responsive y WCAG 2.2 AA.
- **No modifiques código productivo en esta fase** hasta que el usuario apruebe los `.md` de diseño de la pantalla.
