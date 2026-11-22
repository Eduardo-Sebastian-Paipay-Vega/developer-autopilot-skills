---
name: tabla-orden-dinamico
description: Configura tablas de datos complejas (como PrimeNG, AG Grid, TanStack Table o componentes de tabla nativos) con ordenamiento dinámico de columnas por usuario y ajuste de anchos con persistencia. Diagnostica la tabla, define columnas obligatorias y fijas (como identificadores o acciones), y gestiona el almacenamiento de preferencias en almacenamiento local o backend. Se invoca manualmente (/tabla-orden-dinamico).
---

# Tabla de Datos con Orden y Ancho Dinámico de Columnas

Esta skill estandariza el patrón para permitir a los usuarios reorganizar el orden de las columnas de una tabla mediante arrastre (drag-and-drop) o selectores, así como ajustar el ancho de las celdas, persistiendo sus preferencias para sesiones futuras.

---

## Principios de Diseño

1. **Columna de Acciones siempre fija:**
   * La columna que contiene los botones operativos (ver detalle, editar, eliminar) debe permanecer invariablemente anclada en su posición (habitualmente al final o al inicio).
   * No debe ser reordenable ni ocultable por el usuario.
2. **Columnas Clave u Obligatorias:**
   * Ciertas columnas esenciales (por ejemplo: Identificador, Código o Nombre Principal) pueden marcarse como no ocultables, aunque sí reordenables, para evitar que el usuario deje la tabla en un estado ininteligible.
3. **Persistencia desacoplada:**
   * La configuración del usuario se estructura como un payload serializable:
     ```json
     {
       "tabla_id": "pedidos_listado_principal",
       "columnas_visibles": ["codigo", "fecha", "cliente", "total", "acciones"],
       "anchos": {
         "codigo": "120px",
         "fecha": "100px",
         "cliente": "auto",
         "total": "110px",
         "acciones": "90px"
       }
     }
     ```
   * Si el sistema cuenta con servicio de preferencias en backend, se almacena en base de datos por usuario y clave de tabla; como mecanismo de fallback, se almacena en `localStorage`.

---

## Procedimiento de Implementación

### Paso 0: Detectar la Librería de UI Real
Inspecciona `toolkit.config.json` o `package.json` para identificar el framework y librería de tabla real del proyecto (`PrimeNG`, `PrimeReact`, `TanStack Table` / `shadcn/ui`, `AG Grid`, `MUI`, `Ant Design`, `Vuetify` o HTML nativo).
* Usa los mecanismos de reordenamiento y redimensionado nativos de la librería detectada (consulta su documentación oficial si hace falta) en lugar de asumir PrimeNG.
* Si el proyecto aún no define qué librería de tablas usar, pregunta al usuario antes de implementar y regístralo en `toolkit.config.json`.

### Paso 1: Diagnóstico de la Tabla Objetivo
Examinar la plantilla y el componente de la tabla:
* Identificar la clave única de la tabla (`tablaId`).
* Listar las columnas disponibles, clasificándolas en:
  * **Fijas/Inamovibles:** (ej. Acciones).
  * **Obligatorias:** (visibles siempre, pero reordenables).
  * **Opcionales:** (pueden ocultarse o mostrarse a demanda).
* Comprobar si el framework de UI utilizado (ej. PrimeNG `p-table`, TanStack Table, etc.) cuenta con soporte nativo para reordenamiento (`reorderableColumns`) y ajuste de tamaño (`resizableColumns`).

### Paso 2: Modelo de Definición de Columnas
Asegurar una estructura homogénea para la metadata de cada columna:

```typescript
export interface ColumnaConfig {
  campo: string;
  cabecera: string;
  visible: boolean;
  obligatoria?: boolean;
  fija?: boolean;
  anchoPorDefecto?: string;
  orden: number;
}
```

### Paso 3: Vinculación en Plantilla y Componente
1. **Recorrido dinámico de cabeceras y celdas:**
   Asegurar que tanto el `<thead>` como el `<tbody>` iteren exactamente sobre la misma lista ordenada de columnas activas:
   ```html
   <!-- Cabecera -->
   <tr>
     @for (col of columnasActivas(); track col.campo) {
       <th [style.width]="col.anchoPorDefecto">
         {{ col.cabecera }}
       </th>
     }
     <th class="col-acciones-fija">Acciones</th>
   </tr>

   <!-- Cuerpo -->
   <tr>
     @for (col of columnasActivas(); track col.campo) {
       <td>
         <!-- Renderizado del valor según el campo -->
         {{ fila[col.campo] }}
       </td>
     }
     <td class="col-acciones-fija">
       <!-- Botonera de acciones -->
     </td>
   </tr>
   ```

2. **Captura y Almacenamiento de Eventos:**
   Escuchar los eventos de reordenamiento o cambio de tamaño de columna para actualizar el estado reactivo y guardar las preferencias:
   ```typescript
   onColumnaReordenada(nuevoOrden: string[]): void {
     this.guardarPreferencias(this.tablaId, nuevoOrden);
   }
   ```

---

## Checklist de Calidad
- [ ] La columna de "Acciones" permanece fija y protegida contra reordenamiento accidental.
- [ ] Al recargar la página, el orden y los anchos de columnas personalizados por el usuario se restauran correctamente.
- [ ] Si se introduce una columna nueva en el código en una versión posterior, el cargador de preferencias la incorpora adecuadamente sin romper la vista.
- [ ] No se producen desbordamientos visuales ni saltos bruscos al arrastrar cabeceras.
