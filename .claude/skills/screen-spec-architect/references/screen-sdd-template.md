# Plantilla Canónica de Especificación de Pantalla (SDD / Frontend-First)

Esta plantilla define el estándar exacto que debe cumplir cada pantalla (`SCR-XXX`) en `docs/frontend/screens-spec.json` y `docs/frontend/modulos/<modulo>.md` para permitir programación directa (*White-Coding / Spec-Driven Development*) sin ambigüedades.

---

## 1. Los 6 Bloques Obligatorios por Pantalla (`SCR-XXX`)

```markdown
### SCR-001 — [Nombre de la Pantalla] (`[Ruta URL]`)

1. **Trazabilidad y Acceso**
   - **Módulo:** `[modulo]` · **Grupo:** `public | auth | internal | terminal | system`
   - **Requisitos Funcionales (RF):** `RF-01`, `RF-02`
   - **Casos de Uso (CU):** `CU-SEG-01`
   - **Roles RBAC permitidos:** `publico` o lista cerrada del Plan Maestro
   - **Estado actual:** `SPEC | UI_READY | CONNECTED` · **Capa de datos:** `FRONTEND_FIRST_STUB | REAL_API`

2. **Propósito y Flujo de Usuario**
   - **Qué resuelve:** [1–2 líneas concretas orientadas al usuario]
   - **Flujo principal:** 1) Entrada → 2) Acción/Filtro/Formulario → 3) Confirmación/Feedback → 4) Navegación destino
   - **Navegación:** Viene desde `[ruta]` · Redirige a `[ruta]`

3. **Propuesta de Layout y Componentes (Stack Real)**
   - **Layout:** [Auth Card | IntranetShell + Sidebar | Vista Fija con Tabla | Landing Público]
   - **Zonas visuales:** Header + Breadcrumbs · KPIs/Resumen · Barra de filtros · Cuerpo principal (Tabla/Cards/Form) · Modales/Drawers
   - **Componentes UI:** [Adaptados a `toolkit.config.json → stack.ui_libraries`: ej. shadcn/ui `Card/Table/Dialog/Form` o PrimeNG `p-table/p-dialog`]
   - **Tokens visuales:** Hereda `docs/diseno/design-tokens.json` (cero hex hardcoded)

4. **Campos / Columnas y Validaciones**
   | Campo / Columna | Tipo | Obligatorio | Validación / Formato | Origen |
   | :--- | :---: | :---: | :--- | :--- |
   | `email` | string | Sí | Email válido, máx 255 | `usuarios.email` |

5. **Estados UI y Comportamiento Responsivo**
   - **Loading:** Skeleton replicando geometría real (`/system-state-screens`)
   - **Empty:** Variante `first-use` (CTA crear) y `no-results` (CTA limpiar filtros)
   - **Error:** `400/401/403/500` con `traceId` y acción de recuperación
   - **Móvil (`<768px`):** Filtros apilados, formularios 1 columna, tabla con scroll horizontal (`/responsividad`)

6. **Contrato Frontend-First y Criterios de Aceptación**
   - **Endpoints previstos:** `GET /api/v1/...`, `POST /api/v1/...` (de `routes-map.json`)
   - **Criterios de aceptación (SDD):**
     - [ ] Renderiza con los tokens de `design-tokens.json` y pasa WCAG 2.2 AA.
     - [ ] Valida todos los campos obligatorios antes de enviar.
     - [ ] Maneja estados Loading, Empty, Error y Success sin pantallas en blanco.
     - [ ] Funciona correctamente en móvil (`390px`) y escritorio (`1440px`).
```

---

## 2. Sinergia con las Demás Skills del Toolkit (Gestor de Frontend)

| Necesidad al pasar de Spec a Código | Skill que se activa en conjunto |
| :--- | :--- |
| Paleta, tipografía, HSL, contraste WCAG | `/design-tokens-source` (`docs/diseno/design-tokens.json`) |
| Rutas oficiales y contratos API | `/routes-architect` (`docs/arquitectura/routes-map.json`) |
| Menú lateral, RBAC y navegación | `/enterprise-sidebar` |
| Loaders, Skeletons, Empty y Errores 4xx/5xx | `/system-state-screens` + `/motion-design-engineer` |
| Tablas densas (scroll interno, columnas, fila activa) | `/mejorar-vista-fija` + `/tabla-orden-dinamico` + `/resaltar-fila-abierta` |
| Adaptación móvil sin romper escritorio | `/responsividad` |
| Estándares y revisión de código UI | `/frontend-standards` + `/frontend-review` |
| Transición de Frontend-First Stub a Backend Real | `/mock-free-audit` + `/db-guardian` |
| Registro de cambios grandes | `/change-governance` (`CHG-XXXX`) |
