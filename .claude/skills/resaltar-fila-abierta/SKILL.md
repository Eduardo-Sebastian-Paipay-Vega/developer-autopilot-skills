---
name: resaltar-fila-abierta
description: Aplica un patrón de feedback visual en tablas de datos interactivas para resaltar la fila desde la cual se abrió un diálogo modal (edición, detalle, confirmación, etc.). La fila permanece destacada tras cerrar el modal para que el usuario no pierda el contexto de navegación en listados densos. Se invoca manualmente (/resaltar-fila-abierta).
---

# Resaltar Fila Abierta — Feedback de Contexto en Tablas de Datos

Esta skill estandariza una mejora esencial de experiencia de usuario (UX) para listados extensos: cuando un usuario interactúa con una fila específica para abrir un modal o panel lateral y luego lo cierra, la fila permanece visualmente destacada.

---

## Problema que Resuelve

En pantallas con decenas de filas de datos similares, al abrir un diálogo modal (como "Ver detalle", "Modificar" o "Adjuntos") y luego regresar a la tabla, el ojo del usuario pierde la referencia exacta de la fila que estaba examinando, obligándolo a buscarla nuevamente.

El patrón garantiza que:
1. Al pulsar una acción sobre una fila, su identificador queda registrado en un estado reactivo local.
2. La fila recibe una clase visual destacada (`.fila-recien-abierta` o similar) con un fondo suave y distintivo.
3. El estado perdura hasta que el usuario interactúe con otra fila distinta.

---

## Implementación Técnica Estandarizada

> [!NOTE]
> **Agnóstico de librería UI:** Comprueba primero en `toolkit.config.json` o `package.json` qué framework y librería de tabla usa el proyecto (Angular/PrimeNG, React/shadcn/TanStack, PrimeReact, MUI, Vue/Vuetify, etc.) y aplica este patrón con la sintaxis reactiva y tokens CSS de ese stack (o pregunta al usuario si aún no está definido).

### 1. Definición de Estilos (Design System / CSS)
Utilizar tokens del tema activo o variables de resaltado:

```scss
/* Estándar global de tabla o módulo */
.fila-recien-abierta {
  background-color: var(--color-resaltado-fondo, rgba(14, 165, 233, 0.12)) !important;
  color: var(--color-resaltado-texto, inherit);
  transition: background-color 0.2s ease-in-out;
}
```

### 2. Estado en el Componente (Lógica Reactiva)
En el componente (Angular, React, Vue, Svelte):

```typescript
// Angular con Signals
protected readonly idFilaActiva = signal<string | number | null>(null);

abrirDialogoDetalle(item: ItemTabla): void {
  // 1. Guardar el identificador único de la fila
  this.idFilaActiva.set(item.id);

  // 2. Abrir el modal o panel
  this.itemSeleccionado.set(item);
  this.mostrarModalDetalle.set(true);
}
```

### 3. Vinculación en la Plantilla HTML

```html
<tr [class.fila-recien-abierta]="fila.id === idFilaActiva()">
  <td>{{ fila.codigo }}</td>
  <td>{{ fila.nombre }}</td>
  <td>
    <button type="button" (click)="abrirDialogoDetalle(fila)">
      Ver Detalle
    </button>
  </td>
</tr>
```

### 4. Hover Predictivo de Filas
Como complemento de usabilidad, asegurar que la tabla cuente con indicador de cursor hover (`rowHover="true"` o regla CSS `:hover` en `tr`) para que el usuario perciba claramente qué fila está a punto de seleccionar antes de hacer clic.

---

## Checklist de Calidad
- [ ] La marca visual se apoya en un identificador único e inmutable (`id`, `uuid`, `codigo`), nunca en el índice de renderizado de la fila (el cual varía al ordenar o filtrar).
- [ ] El contraste de color entre el fondo resaltado y el texto cumple con los estándares de accesibilidad WCAG AA.
- [ ] El resaltado se mantiene adecuadamente al cerrar el modal y solo cambia cuando se interactúa con una fila diferente.
