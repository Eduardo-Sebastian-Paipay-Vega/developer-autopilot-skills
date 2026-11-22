# Ingeniería de ilustración (objetos y escenas)

Una ilustración animada **no es un icono que se mueve**: es una composición de capas con roles, trayectorias y estados.

## 1. Proceso de composición

1. **Silueta**: reconocible en 1 segundo a 48 px. Si no se reconoce, la geometría es demasiado detallada o la pose es ambigua.
2. **Descomposición en partes**: una parte por cada cosa que se mueve de forma distinta.
3. **Tabla de capas** (obligatoria antes de dibujar).
4. **Frame estático representativo**: la geometría sin animación debe contar la historia (es el fallback de movimiento reducido).
5. **Coreografía**: protagonista → secundarios → ambiente, con desfases.

## 2. Plantillas de capas de referencia

### Libro que pasa páginas (M2)
| Capa | Elemento | Movimiento |
| :---: | :--- | :--- |
| 1 | Sombra | Escala X + opacidad sincronizadas con la flotación |
| 2 | Tapa trasera | Estática (ancla visual) |
| 3 | Bloque de páginas izq./der. | Estático, líneas de texto |
| 4 | Hojas que giran (×3) | `scaleX(1 → −1)` con origen en el lomo, stagger 1/3 de ciclo |
| 5 | Brillos | Aparición/desaparición escalonada |
| 6 | Grupo completo | Flotación vertical leve |

### Vehículo en movimiento (M2)
| Capa | Elemento | Movimiento |
| :---: | :--- | :--- |
| 1 | Carretera / líneas | Desplazamiento horizontal infinito (`linear`) |
| 2 | Sombra | Escala X leve con el rebote |
| 3 | Carrocería | Rebote vertical corto (suspensión) |
| 4 | Ruedas | Rotación continua (`linear`), origen en su centro |
| 5 | Luces | Pulso de opacidad |
| 6 | Líneas de velocidad | Entrada/salida con opacidad y translateX |

### Documento que se procesa (M2, con estados)
| Capa | Elemento | Movimiento |
| :---: | :--- | :--- |
| 1 | Hoja + esquina doblada | Estática |
| 2 | Líneas de texto | `scaleX(0 → 1)` origen izquierdo, stagger |
| 3 | Barra de escaneo | `translateY` de arriba abajo |
| 4 | Insignia de estado | Engranaje rota (processing) → check/cruz pop (success/error) |
| 5 | Barra de progreso | Indeterminada (shimmer) o determinada (`scaleX(var(--motion-progress))`) |

### Caja que se ensambla (M3, patrón)
Base → paredes laterales (`scaleY` desde la base) → solapas (`scaleY(−1 → 1)` con origen en la arista) → cinta (`scaleX` desde el centro) → etiqueta (pop).

## 3. Técnicas clave en SVG

| Necesidad | Técnica |
| :--- | :--- |
| Girar algo "en 3D" (página, tapa, solapa) | `scaleX`/`scaleY` de 1 a −1 con `transform-origin` en la arista. Fiable en todos los navegadores. |
| Rotar sobre su propio centro | `transform-box: fill-box; transform-origin: center;` (ya incluido en `[data-part]`). |
| Rotar alrededor de otro punto | `transform-origin` en coordenadas del viewBox con `transform-box: view-box`. |
| "Dibujar" un trazo | `stroke-dasharray` + `stroke-dashoffset` (pinta, no compone: úsalo en M1/M2 con pocos trazos). |
| Revelar sin animar tamaño | `scaleX/scaleY` desde un origen, o `clip-path` estático + elemento que se traslada. |
| Brillo/destello | Opacidad + escala de un elemento pequeño; nunca filtros animados. |
| Profundidad sin 3D | Escala + opacidad + desplazamiento más lento en capas lejanas (parallax). |

## 4. Estilo visual coherente

- Una familia de formas: esquinas redondeadas (`rx` 4–8 en 240 px), trazos con `stroke-linecap="round"`.
- Paleta de 3–4 tokens por ilustración: primario (protagonista), secundario (estructura), acento (acción/éxito), superficie (papel/fondos).
- Sombras planas (elipse con `--motion-shadow`), no `filter: drop-shadow` animado.
- Grosor de trazo único por ilustración (`--motion-stroke-width`).

## 5. Anti-patrones

- Dibujar con cientos de paths exportados de una herramienta sin limpiar.
- Animar el grupo completo cuando solo una parte debería moverse.
- Todo se mueve a la vez y con la misma curva (sin jerarquía).
- El frame estático muestra un estado intermedio sin sentido (p. ej. página a medio girar).
