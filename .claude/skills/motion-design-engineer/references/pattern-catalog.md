# Catálogo de patrones visuales (MDES)

Antes de diseñar desde cero, elige un patrón de este catálogo. Combina su geometría con los tokens `--motion-*` del proyecto.

## 1. Loading (espera y procesos)

| Patrón | Nivel | Renderer | Composición / Capas | Control |
| :--- | :---: | :--- | :--- | :--- |
| `spinner-ring` | M1 | `svg-css` | Arco parcial + pista translúcida. Rotación `linear` + trazo respirando. | Automático |
| `orbital-dots` | M1 | `svg-css` | 3–4 puntos en órbita o pulso escalonado (`stagger` 1/3 ciclo). | Automático |
| `wave-bars` | M1 | `svg-css` | 4–5 barras con `scaleY` desde base, desfase progresivo. | Automático |
| `progress-bar` | M1 | `css` | Pista + relleno con `scaleX(var(--motion-progress))` o shimmer indeterminado. | Determinado / Indeterminado |
| `document-processing` | M2 | `svg-css` | Hoja + líneas `scaleX` + barra de escaneo + insignia de estado (`processing/success/error`). | Estado real |
| `cloud-sync` | M2 | `svg-css` | Nube + 2 flechas circulares rotando + pulso de datos. | Estado real |
| `skeleton-shimmer` | M1 | `css` | Bloques de texto/tarjeta con gradiente translúcido `translateX`. | Automático |

## 2. Success (confirmación)

| Patrón | Nivel | Renderer | Composición / Capas |
| :--- | :---: | :--- | :--- |
| `check-pop` | M1 | `svg-css` | Círculo (`scale` con `--motion-ease-emphasized`) + trazo check (`stroke-dashoffset`). |
| `document-saved` | M2 | `svg-css` | Hoja entrando en bandeja/carpeta + badge check con overshoot. |
| `export-completed` | M2 | `svg-css` | Flecha descendente + archivo aterrizando + destellos suaves. |
| `sync-completed` | M2 | `svg-css` | Nube estable + check central + halo único que se disipa. |

## 3. Error y alertas

| Patrón | Nivel | Renderer | Regla obligatoria |
| :--- | :---: | :--- | :--- |
| `error-cross` | M1 | `svg-css` | Sacudida corta (≤ 400 ms, 2 oscilaciones, amplitud ≤ 4 px). **Nunca bucle infinito.** |
| `connection-lost` | M2 | `svg-css` | Nube o enchufe separado con pulso de alerta suave + color `--motion-danger`. |
| `validation-warning` | M1 | `svg-css` | Triángulo/exclamación con pop único y atención sin destellos rápidos. |
| `server-error` | M2 | `svg-css` | Torre de servidor con LED en `--motion-danger` + badge de fallo. |

## 4. Empty states (estados vacíos)

| Patrón | Nivel | Renderer | Composición |
| :--- | :---: | :--- | :--- |
| `no-records` | M2 | `svg-css` | Bandeja/carpeta abierta con flotación lenta (`--motion-intensity: 0.4`). |
| `no-results` | M2 | `svg-css` | Lupa buscando con barrido suave sobre tarjeta en blanco. |
| `no-documents` | M2 | `svg-css` | Pila de hojas punteadas con leve respiración. |
| `empty-dashboard` | M2 | `svg-css` | Ejes de gráfico con barras fantasma que emergen suavemente. |

## 5. Object animations (objetos con identidad)

| Patrón | Nivel | Capas clave |
| :--- | :---: | :--- |
| `book-opening` | M2 | Sombra, tapa trasera, bloques de páginas, 3 hojas con `scaleX(1 → -1)` en lomo, brillos, flotación. |
| `folder-opening` | M2 | Tapa trasera, documentos saliendo (`translateY`), solapa frontal con `scaleY`, sombra. |
| `vehicle-movement` | M2 | Carretera `linear`, sombra, carrocería con suspensión, ruedas rotando, luces, líneas de velocidad. |
| `package-assembly` | M3 | Base, paredes, solapas en arista, cinta adhesiva, etiqueta final. |
| `data-chart-build` | M2 | Ejes estáticos, barras `scaleY` con stagger, línea de tendencia con `stroke-dashoffset`. |
| `computer-interaction` | M2 | Monitor, cursor desplazándose, tarjetas respondiendo al clic. |

## 6. Scene animations (escenas coordinadas — M3 / M4)

| Patrón | Nivel | Escena |
| :--- | :---: | :--- |
| `logistics-flow` | M3 | Almacén + cinta transportadora + camión saliendo + señal de entrega. |
| `document-workflow` | M3 | Bandeja de entrada → revisión/escaneo → archivo/sello aprobado. |
| `network-sync` | M3 | Nodos conectados con paquetes viajando por rutas y confirmación en servidor central. |
| `isometric-warehouse` | M4 | Escena isométrica / 3D (requiere justificación escrita en `mdes.config.json`). |
