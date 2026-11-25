# Estándar UI-STD-001 & Guía Maestra de Arquitectura UI (Métricas y Reglas)

Síntesis operativa de `estandar_ingenieria_pantallas_componentes.md` (`UI-STD-001`) y `gu_a_maestra_de_arquitectura_ui_componentes_y_par_metros_de_sistema.md`.

---

## 1. Principios Rectores y Capas de Pantalla
- **10 Principios:** Propósito antes que decoración · Jerarquía antes que densidad · Consistencia · Accesibilidad desde el diseño · Responsive por comportamiento (reorganizar, no solo achicar) · Estados completos · Datos confiables · Rendimiento medible · Reutilización con límites · Trazabilidad a rutas/RF/CU/RBAC/pruebas.
- **8 Capas:** Aplicación (Shell/Sidebar/Topbar) → Página (Título/Breadcrumb) → Sección → Componente → Elemento → Estado → Comportamiento → Datos.
- **16 Tipologías:** Acceso/Auth · Dashboard Ejecutivo · Listado/Data Grid · Detalle 360° · Creación · Edición · Formulario Extenso · Proceso/Wizard (>15 campos) · Configuración · Reportes/Analítica · Calendario · Kanban · Monitoreo · Gestión Documental · Administración Usuarios/RBAC · Estados Vacío/Error/Mantenimiento.

---

## 2. Retícula Base-8, Rejilla Responsiva y Densidad
- **Escala Base-8:** `4px (0.25rem)` · `8px (0.5rem)` · `16px (1rem)` · `24px (1.5rem)` · `32px (2rem)` · `48px (3rem)`.
- **Grid Responsivo:** Desktop `≥1280px` (12 cols, gutter `24px`) · Tablet `768–1279px` (8 cols, gutter `16px`) · Mobile `<768px` (4 cols, gutter `16px`).
- **Densidad:** Compacta (filas `32–36px`, inputs `32px`) · Estándar (filas `44–48px`, inputs `40px`) · Confortable/Táctil (filas `56px+`, inputs `48px`). En móvil, fuente de inputs `≥16px` para evitar zoom automático en iOS Safari.

---

## 3. Reglas Estrictas de Selección y Parámetros de Componentes
- **Botones:** máximo **1 Primario** por vista o modal; `isLoading` obligatorio para prevenir *double-submit*; `ariaLabel` obligatorio en Icon Buttons; verbos específicos ("Eliminar Cliente", nunca "Sí/Aceptar"); alineados a la **derecha** en Modales/Drawers y a la **izquierda** en formularios de página completa.
- **Selección binaria/única:**
  - `Checkbox`: múltiple independiente (soporta `indeterminate`).
  - `Radio Button`: excluyente de **2 a 5 opciones** visibles.
  - `Select`: **5 a 15 opciones** · `Combobox/Autocomplete`: **>15 opciones** · `Virtualizado`: **>500 opciones**.
  - `Switch`: efecto **inmediato** sin botón Guardar.
- **Data Table (Enterprise):** cabecera fija (`stickyHeader`), texto/fechas a la **izquierda**, números/moneda a la **derecha** con `tabular-nums`, acciones a la **derecha** (`sticky right`), paginación explícita (evitar *Infinite Scroll* en tablas administrativas), `Bulk Action Bar` al seleccionar `≥1` fila.
- **Feedback:**
  - `Skeleton`: carga inicial de página/tabla/perfil.
  - `Spinner`: acción puntual iniciada por clic.
  - `Progress Bar`: procesos `>5s` o con avance porcentual.
  - `Toast`: `4000–5000ms` para éxito/info; **`durationMs: null` (persistente) para Error**.
- **Modales y Drawers:** `sm 400px` / `md 560px` / `lg 760px` / `xl 960px`, `max-height: 85–90vh`, `trapFocus: true`, `closeOnEsc: true`, y **`closeOnOverlayClick: false` en modales con formularios**.
- **KPI Card:** soportar `invertTrendColors` cuando subir es negativo (ej. tasa de errores). **Donut/Pie:** máx. **5 segmentos**.

---

## 4. Estados Obligatorios, Validación y Métricas
- **6 Estados de Input:** `Default` · `Hover` · `Focus` (anillo `2–3px`) · `Disabled` · `Read-Only` · `Error` (icono + texto asociado, nunca solo color).
- **5 Estados de Datos (*The 5 UI States*):** `Ideal` · `Loading` · `Empty` (`first-use` vs `no-results`) · `Error` (amigable + `traceId` + Reintentar) · `Partial / Overflow` (`ellipsis` + `Tooltip` / paginación).
- **Validación de Formularios:** validar en `onBlur` la primera vez y re-validar en `onChange` **solo** tras error; preservar siempre lo escrito ante fallo de red; `Unsaved Changes Guard` si `isDirty === true`; confirmación activa escribiendo recurso/`ELIMINAR` en borrados irreversibles.
- **Métricas Cuantitativas:**
  - Nielsen: `≤100ms` instantáneo · `100–1000ms` fluido · `>1s` Skeleton/Spinner obligatorio · `>10s` Progress Bar / Background Job.
  - Web Vitals: `CLS < 0.1` · `INP < 200ms`.
  - WCAG 2.2 AA: contraste `4.5:1` texto normal / `3.0:1` grande y bordes · Hit-area `44x44px` táctil / `24x24px` escritorio · 100% operable por teclado (`Tab/Enter/Space/Esc`).
  - Eficiencia UX: `Click Depth ≤ 3` para flujos core · si un campo supera `15%` de error de formulario, rediseñar etiqueta/máscara.

---

## 5. Evaluación 0–100 y Bloqueos Críticos (Sección 17 UI-STD-001)
| Dimensión | Peso |
| :--- | :---: |
| Cumplimiento funcional (`RF`/`CU`) | **20** |
| Usabilidad y flujo | **15** |
| Jerarquía y composición | **15** |
| Accesibilidad (WCAG 2.2 AA) | **15** |
| Consistencia de componentes (librería UI) | **10** |
| Responsive (Desktop/Tablet/Mobile) | **10** |
| Rendimiento percibido y web | **10** |
| Documentación y mantenibilidad | **5** |
| **Total** | **100** |

**Bloqueos absolutos (sin importar puntaje):** acceso no autorizado, operaciones críticas incorrectas, pérdida de datos, formularios incompletables, barreras de teclado en tareas esenciales.
