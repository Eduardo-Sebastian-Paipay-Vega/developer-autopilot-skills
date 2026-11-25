---
name: screen-spec-architect
description: Primera herramienta de la suite Gestor de Frontend (Frontend-First + SDD / White-Coding). A partir de las rutas ya definidas (`docs/arquitectura/routes-map.json`), el Plan Maestro (`RF-XX`, `CU-XX`, módulos y roles RBAC) y los tokens de diseño (`docs/diseno/design-tokens.json`), genera y mantiene la propuesta y documentación técnica completa de cada pantalla agrupada por módulo (`docs/frontend/screens-spec.json`, `00_INDICE_PANTALLAS.md` y `docs/frontend/modulos/<modulo>.md`): propósito, casos de uso, layout, componentes del stack real, campos/validaciones, estados UI (`loading`/`empty`/`error`/`responsive`), contrato DTO y criterios de aceptación listos para programar. Incluye `scripts/screens-cli.mjs` (`autopilot pantallas`). Úsala cuando se necesite documentar y proponer pantallas por ruta/módulo antes de programar el frontend.
---

# `/screen-spec-architect` — Arquitecto de Propuestas y Especificación de Pantallas (Frontend-First / SDD)

Primera pieza del **Gestor de Frontend**: convierte las **rutas, Requisitos Funcionales (`RF`), Casos de Uso (`CU`) y roles RBAC** en **especificaciones completas de pantalla por módulo** (`SCR-001`, `SCR-002`...), listas para programar el frontend primero (*Frontend-First / Spec-Driven Development*) sin improvisar componentes, campos ni estados.

> [!IMPORTANT]
> **Regla Frontend-First + SDD:**
> 1. **Ninguna pantalla se programa sin ficha `SCR-XXX`:** toda ruta de `docs/arquitectura/routes-map.json` debe tener su especificación documentada con `RF`, `CU`, roles, layout, componentes, campos, estados UI y criterios de aceptación.
> 2. **100% conectado al ecosistema del toolkit:** lee `toolkit.config.json` (stack y librería UI real), `routes-map.json` (`/routes-architect`), `plan-maestro.md` (`/crear-plan-maestro`), `design-tokens.json` (`/design-tokens-source`) y `db-schema.json` (`/db-guardian`) para no inventar rutas, colores ni campos.
> 3. **Escalabilidad limpia a Backend Real:** si una pantalla arranca en modo `FRONTEND_FIRST_STUB`, su contrato DTO y endpoints objetivo quedan explícitos para que luego `/mock-free-audit` valide su conexión 100% real al backend.
>
> Referencias (*progressive disclosure*):
> - `references/screen-sdd-template.md` — Estructura canónica de los 6 bloques de cada pantalla SDD y mapa de sinergia con el resto de skills de frontend.
> - `scripts/screens-cli.mjs` — CLI sin dependencias (`init`, `sync`, `generate`, `audit` | `iniciar`, `sincronizar`, `generar`, `auditar`).

---

## Los 4 Modos de Operación

| Modo | Cuándo usarlo | Comando CLI |
| :--- | :--- | :--- |
| **1. Iniciar especificaciones** | Primera vez: crea `docs/frontend/screens-spec.json` absorbiendo todas las rutas de `routes-map.json` y los `RF`/`CU` de `plan-maestro.md`, agrupados por módulo. | `autopilot pantallas iniciar` |
| **2. Sincronizar nuevas rutas** | Se agregaron rutas nuevas en `routes-map.json`: incorpora los nuevos `SCR-XXX` sin sobrescribir las pantallas ya documentadas. | `autopilot pantallas sincronizar` |
| **3. Generar documentación SDD** | Genera `docs/frontend/00_INDICE_PANTALLAS.md` y un documento completo por módulo en `docs/frontend/modulos/<modulo>.md`. | `autopilot pantallas generar` |
| **4. Auditar cobertura y trazabilidad** | Verifica que el 100% de las rutas tengan ficha `SCR-XXX`, `RF`/`CU`, roles RBAC, componentes, estados UI y criterios de aceptación. | `autopilot pantallas auditar --strict` |

---

## Procedimiento Obligatorio (5 pasos)

### Paso 1: Absorber las Fuentes Vivas del Proyecto (Sin Inventar)
1. Lee `toolkit.config.json` (`stack.frontend`, `stack.ui_libraries`, `stack.css_framework`, `frontend_specs`).
2. Lee `docs/arquitectura/routes-map.json` (`/routes-architect`) para obtener todas las rutas reales agrupadas por `module` y `group` (`public`, `auth`, `internal`, `terminal`, `system`).
3. Lee `docs/planeacion/plan-maestro.md` (y cualquier SDD existente) para mapear exactamente cada `RF-XX`, `CU-XX`, rol RBAC y límites Out-of-Scope.
4. Lee `docs/diseno/design-tokens.json` (`/design-tokens-source`) y `docs/bd/db-schema.json` (`/db-guardian`) si existen, para alinear paleta, tipografía y nombres reales de atributos.

### Paso 2: Inicializar / Sincronizar `docs/frontend/screens-spec.json`
Ejecuta `autopilot pantallas iniciar` (o `sincronizar` si ya existía) para construir el esqueleto completo de todas las pantallas (`SCR-001`..`SCR-N`) agrupadas por módulo.

### Paso 3: Completar la Propuesta Técnica de Cada Pantalla (6 Bloques SDD)
Para cada pantalla (`SCR-XXX`), documenta con rigor técnico (ver `references/screen-sdd-template.md`):
1. **Trazabilidad:** Ruta URL, Módulo, `RF-XX`, `CU-XX`, Roles RBAC, Estado (`SPEC` → `UI_READY` → `CONNECTED`).
2. **Propósito y Flujo UX:** objetivo operativo, flujo principal paso a paso, navegación entrante y saliente.
3. **Propuesta de Layout y Componentes (del stack real):**
   - Shell/layout (público, auth, intranet con `/enterprise-sidebar`, vista fija `/mejorar-vista-fija`, modal/drawer).
   - Secciones visuales (Header/KPIs, filtros, tabla/grilla/formulario, acciones primarias/secundarias, diálogos).
   - Referencia explícita a tokens de `design-tokens.json`.
4. **Campos, Columnas y Validaciones:** nombre, tipo, obligatoriedad, reglas de validación y origen de datos.
5. **Estados UI y Responsividad Obligatorios:**
   - `Loading / Skeleton`, `Empty (first-use / no-results)`, `Error (400/401/403/500)`, `Success` (`/system-state-screens`).
   - Adaptación móvil `<768px` (`/responsividad`), vista fija (`/mejorar-vista-fija`), resaltado de fila (`/resaltar-fila-abierta`) y columnas dinámicas (`/tabla-orden-dinamico`) cuando haya tablas densas.
6. **Contrato Frontend-First y Criterios de Aceptación:** DTO TypeScript esperado, endpoints API futuros (`routes-map.json`), `dataStage` (`FRONTEND_FIRST_STUB` | `REAL_API`) y checklist verificable de aceptación para programar.

### Paso 4: Generar los Documentos por Módulo (`generar`)
Ejecuta `autopilot pantallas generar` para emitir:
- `docs/frontend/00_INDICE_PANTALLAS.md` (mapa maestro de módulos, rutas, `RF`, `CU`, roles y avance).
- `docs/frontend/modulos/<modulo>.md` (especificación completa de cada módulo lista para SDD y programación directa).

### Paso 5: Auditar Cobertura antes de Programar (`auditar --strict`)
Ejecuta `autopilot pantallas auditar --strict` para comprobar:
- 0 rutas de `routes-map.json` sin documentación de pantalla.
- 0 pantallas internas sin `RF`/`CU` ni roles RBAC.
- 0 pantallas sin componentes, estados UI ni criterios de aceptación.
- **Compuerta:** no comenzar a codificar pantallas masivamente hasta que el usuario apruebe la propuesta documental del módulo objetivo.
