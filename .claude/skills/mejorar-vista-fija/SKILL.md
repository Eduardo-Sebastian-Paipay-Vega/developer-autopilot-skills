---
name: mejorar-vista-fija
description: Aplica el patrón de diseño "vista fija" a pantallas con tablas de datos extensas. Asegura que los filtros superiores, la cabecera de la tabla y la barra de paginación permanezcan siempre visibles en el viewport, permitiendo el desplazamiento vertical únicamente en el cuerpo de las filas. Se invoca manualmente (/mejorar-vista-fija).
---

# Vista Fija en Pantallas con Tablas de Datos

Esta skill estandariza la arquitectura CSS y de layout para interfaces empresariales densas, garantizando que una tabla aproveche exactamente el 100% de la altura disponible del viewport sin generar desplazamiento (scroll) vertical en toda la página.

---

## El Problema de Usabilidad

Cuando un listado tiene 50 o 100 registros y la página completa realiza scroll:
* La cabecera de la tabla desaparece de la vista al desplazarse hacia abajo, haciendo que el usuario olvide qué dato representa cada columna.
* Los filtros y buscadores superiores quedan fuera del alcance.
* El paginador queda oculto al final de un largo recorrido visual.

Con el patrón de **Vista Fija**:
1. El encabezado de la página y la barra de filtros quedan anclados arriba.
2. El paginador queda anclado abajo.
3. Únicamente el cuerpo de filas de la tabla (`tbody`) realiza scroll vertical.

---

## Cadena de CSS y Flexbox Requerida

El error clásico al implementar este patrón es colocar `height: 100%` en elementos intermedios que no tienen una altura fija definida en su contenedor padre.

### La regla de oro de la cadena de layout:
* El contenedor raíz de la vista (o `:host` en Angular / contenedor principal en React) debe establecer una altura base definida:
  ```scss
  :host, .vista-contenedor {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  ```
* **Todos los contenedores hijos intermedios** (pestañas, paneles, wrappers) deben utilizar `flex: 1` con `min-height: 0` (nunca `height: 100%`), permitiendo que el cálculo de Flexbox distribuya el espacio sin colapsar:
  ```scss
  .panel-principal, .p-tabpanel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  ```
* **El bloque superior de filtros/buscador:** Debe mantener su altura natural y no encogerse:
  ```scss
  .barra-filtros {
    flex-shrink: 0;
  }
  ```
* **El contenedor de la tabla:** Ocupa el espacio restante y habilita el scroll interno:
  ```scss
  .tabla-contenedor {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  ```

---

## Configuración en Frameworks y Librerías de UI

### En PrimeNG (`p-table`):
* Configurar `[scrollable]="true"`
* Configurar `scrollHeight="flex"` (permite que la tabla llene automáticamente el alto del contenedor padre).
* Si existen clases con `max-height` estático, sobreescribirlas a nivel local del componente:
  ```scss
  .tabla-contenedor .p-datatable-wrapper {
    max-height: none !important;
  }
  ```

### En Tablas HTML / CSS Nativas:
```scss
.tabla-fija {
  display: flex;
  flex-direction: column;
  height: 100%;

  thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: var(--fondo-cabecera);
  }

  tbody {
    flex: 1;
    overflow-y: auto;
  }
}
```

---

## Checklist de Validación Visual
- [ ] La barra de navegación superior, los filtros y la cabecera de la tabla permanecen visibles al desplazarse por los datos.
- [ ] El paginador inferior permanece anclado y visible en todo momento.
- [ ] La tabla llena el espacio vertical disponible sin dejar espacios en blanco innecesarios en pantallas grandes.
- [ ] Al redimensionar la ventana del navegador, el layout se recalcula de forma fluida y sin rotura de elementos.
