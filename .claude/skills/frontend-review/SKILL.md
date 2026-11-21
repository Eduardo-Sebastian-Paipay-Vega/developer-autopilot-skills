---
name: frontend-review
description: Audita y refactoriza componentes frontend siguiendo estándares estrictos de arquitectura limpia, gestión de estado reactivo, accesibilidad, manejo de diálogos modales, validación de formularios y desacoplamiento con el backend. Corrige de forma directa inconsistencias técnicas y genera reportes concisos de calidad de código. Se invoca manualmente (/frontend-review [componente]).
---

# Auditoría y Revisión de Calidad Frontend (Frontend Review)

Esta skill proporciona un protocolo estructurado para auditar componentes de interfaz de usuario, garantizando legibilidad, rendimiento, accesibilidad y fidelidad a las mejores prácticas de la industria.

---

## Procedimiento de Revisión

### Paso 1: Identificación del Componente
Localizar el componente objetivo indicado por el usuario o abierto en el contexto de trabajo. Analizar sus archivos vinculados:
* Lógica y Controlador (`.ts` / `.tsx` / `.js`)
* Plantilla visual (`.html` / JSX)
* Hoja de estilos (`.scss` / `.css` / Tailwind)
* Servicios y modelos asociados (`.service.ts`, `.model.ts`)

---

## Matriz de Evaluación Técnica

### 1. Arquitectura y Nomenclatura
- [ ] **Nombres descriptivos:** Componentes con prefijo uniforme (`app-` o el del proyecto) y convención kebab-case.
- [ ] **Desacoplamiento de capas:** Separación clara entre componentes de presentación ("dumb/presentational") y componentes contenedores con lógica de negocio ("smart/containers").
- [ ] **Modelos de dominio:** Interfaces o tipos de datos sincronizados con los contratos de API del backend, manteniendo consistencia en el casing de atributos.

### 2. Gestión de Estado y Reactividad
- [ ] **OnPush / Inmutabilidad:** Activación explícita de `ChangeDetectionStrategy.OnPush` para evitar ciclos de verificación innecesarios.
- [ ] **Primitivas reactivas modernas:** Uso preferente de Signals o Stores declarativos en lugar de suscripciones manuales a observables en templates.
- [ ] **Derivación de estado:** Empleo de valores computados (`computed()`) para listas filtradas o cálculos en memoria, evitando recalculaciones en cada ciclo de render.
- [ ] **Cero fugas de memoria:** Cancelación y desuscripción garantizada en destrucción de componentes (`takeUntilDestroyed()`, `useEffect` cleanup).

### 3. Formularios y Validación de Datos
- [ ] **Tipos de entrada adecuados:** Campos numéricos con validación de rangos (`min`, `max`), fechas con selectores semánticos y correos con validación de formato.
- [ ] **Longitud máxima:** Atributos `maxlength` definidos en campos de texto para prevenir errores de truncamiento en base de datos.
- [ ] **Placeholders orientados a la acción:** Textos descriptivos de instrucción (ej. "Ingresar nombre de cliente") en lugar de datos simulados confusos.
- [ ] **Accesibilidad (A11y):** Etiquetas `<label>` asociadas correctamente a inputs mediante identificadores o directivas, y atributos `aria-label` en botones con solo icono.

### 4. Tablas y Listados de Alta Densidad
- [ ] **Vista Fija / Scroll Interno:** Tablas extensas con cabecera fija y desplazamiento vertical contenido, evitando el scroll descontrolado de página completa.
- [ ] **Desplazamiento horizontal seguro:** Contenedor envolvente con `overflow-x: auto` para proteger la visualización en pantallas reducidas.
- [ ] **Hover y Feedback:** Indicadores visuales de fila activa y fila recién consultada para preservar el contexto del usuario.

### 5. Comunicación y Manejo de Errores
- [ ] **Cero URLs en duro:** Todo consumo de endpoints centralizado en variables de entorno o servicios HTTP dedicados.
- [ ] **Manejo defensivo de errores:** Notificaciones semánticas al usuario ante fallos de conexión (Toasts / Alertas), evitando fallos silenciosos en la consola.

---

## Formato de Entrega del Reporte

El reporte de revisión debe estructurarse en dos bloques claros:

1. **Correcciones Aplicadas:** Cambios seguros realizados de inmediato (ej. corrección de tipos, accesibilidad, limpieza de código muerto).
2. **Observaciones Arquitectónicas:** Puntos de diseño que requieren confirmación del equipo antes de ser modificados (ej. reestructuración de servicios, cambio en contratos de API).
