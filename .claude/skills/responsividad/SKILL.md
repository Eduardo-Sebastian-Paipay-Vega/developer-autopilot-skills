---
name: responsividad
description: Adapta interfaces web y componentes complejos a pantallas móviles (<768px) preservando de forma intacta y pixel-perfect el diseño de escritorio (≥768px). Apila barras de herramientas y filtros, colapsa grillas de formulario a una sola columna, mantiene tablas anchas con desplazamiento horizontal fluido en lugar de truncar columnas, y optimiza modales y drawers. Se invoca manualmente (/responsividad) sobre el componente objetivo.
---

# Responsividad Web — Adaptación Móvil con Preservación de Escritorio

Esta skill estandariza la adaptación de interfaces de usuario a dispositivos móviles sin alterar el layout, proporciones ni comportamiento de la vista de escritorio existente.

---

## Regla Fundamental: Preservación Absoluta de Escritorio

Cualquier elemento visualizado en resoluciones de escritorio (típicamente `≥768px` o `≥1024px` según el design system del proyecto) debe mantenerse **pixel-idéntico**.
* **Encapsulamiento estricto:** Todas las modificaciones de adaptación móvil deben vivir dentro de bloques de media queries:
  ```scss
  @media (max-width: 767px) {
    /* Reglas exclusivas para vista móvil */
  }
  ```
* **Prohibición de `min-width` para parches móviles:** Nunca redefinir reglas globales con `min-width` para solucionar desbordamientos móviles, ya que altera la cascada de estilos previa.

---

## Gotchas Críticos de CSS y Layout Móvil

### 1. El bug de `flex-wrap: wrap` en contenedores verticales
* **Síntoma común:** Al convertir un contenedor horizontal (`flex-direction: row`) a vertical (`flex-direction: column`) en móviles, algunos elementos hijos se cortan o aparecen desplazados horizontalmente en una segunda columna fantasma.
* **Causa técnica:** Si el contenedor padre heredó `flex-wrap: wrap` de escritorio, en un layout de columna `wrap` no divide líneas de texto, sino que genera **columnas adicionales** cuando el contenido excede la altura.
* **Solución obligatoria:** Siempre emparejar la dirección de columna con `nowrap`:
  ```scss
  @media (max-width: 767px) {
    .contenedor-filtros {
      flex-direction: column;
      flex-wrap: nowrap !important;
      width: 100%;
    }
  }
  ```

### 2. Tablas de datos anchas vs. Pantallas móviles
* **Error frecuente:** Ocultar columnas esenciales o forzar que el texto salte de línea (`break-word`) comprimiendo la tabla a un estado ilegible.
* **Patrón correcto:** Envolver la tabla en un contenedor con `overflow-x: auto` e `inercia táctil`:
  ```scss
  .tabla-scroll {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  ```

### 3. Diálogos y Modales en pantallas angostas
* **Error frecuente:** Usar anchos fijos en píxeles (ej. `width: 600px`).
* **Patrón correcto:**
  ```scss
  @media (max-width: 767px) {
    .modal-dialogo {
      width: 95vw !important;
      max-width: 95vw !important;
      margin: 0 auto;
    }
  }
  ```

---

## Procedimiento de Implementación

### Paso 1: Diagnóstico de la pantalla
1. Identificar el contenedor principal y los puntos de desbordamiento horizontal.
2. Identificar grillas de formularios (CSS Grid o clases utilitarias de columnas) y barras de acciones/botones.
3. Evaluar si la navegación principal (Shell/Navbar/Sidebar) ya cuenta con modo menú hamburguesa o drawer para móviles.

### Paso 2: Shell y Navegación Móvil (Drawer)
Si la aplicación no cuenta con soporte móvil en su estructura base:
* Implementar botón disparador (hamburguesa) en la barra superior visible únicamente en `<768px`.
* Transformar la barra lateral (Sidebar) en un panel flotante tipo Drawer con animación fluida:
  ```scss
  @media (max-width: 767px) {
    .app-sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 1050;
      transform: translateX(-100%);
      transition: transform 0.25s ease-in-out;
      width: 280px;

      &.sidebar--abierto {
        transform: translateX(0);
      }
    }

    .shell-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1040;
    }
  }
  ```

### Paso 3: Adaptación del Contenido y Formularios
* Colapsar grillas multicolumna a una sola columna:
  ```scss
  @media (max-width: 767px) {
    .formulario-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem;
    }

    .botonera-acciones {
      flex-direction: column-reverse;
      width: 100%;

      button, .btn {
        width: 100%;
      }
    }
  }
  ```

---

## Checklist de Verificación
- [ ] La vista en pantallas amplias (`≥768px` / `1024px`) se mantiene intacta y sin regresiones visuales.
- [ ] No existe desplazamiento horizontal no deseado en el cuerpo de la página (`body` o `html`).
- [ ] Las tablas con muchas columnas permiten desplazamiento horizontal táctil y conservan su cabecera.
- [ ] Los diálogos y modales se ajustan al ancho de pantalla respetando márgenes mínimos de seguridad.
- [ ] Los botones de acción en formularios móviles son fácilmente accesibles con el pulgar.
