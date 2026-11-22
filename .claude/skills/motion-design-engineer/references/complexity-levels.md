# Niveles de complejidad M1–M4

El nivel fija el **presupuesto** del recurso. Elegir nivel es una decisión de producto, no estética.

| Nivel | Nombre | Uso | Presupuesto orientativo | Ejemplos |
| :---: | :--- | :--- | :--- | :--- |
| **M1** | Essential | Necesidad funcional mínima, tamaños pequeños (16–64 px), dentro de componentes. | ≤ 3 partes animadas · ≤ 2 `@keyframes` · 1 color protagonista · 0 JS obligatorio | Spinner, puntos, check, icono que rota, barra de progreso. |
| **M2** | Enhanced **(por defecto)** | Comunicar visualmente una operación. 96–320 px. | ≤ 12 partes animadas · ≤ 6 `@keyframes` · estados (`processing/success/error`) · stagger | Carpeta que se abre, documento que se genera, libro que pasa páginas, nube que sincroniza, gráfico que se construye, vehículo. |
| **M3** | Illustrative | Explicar un proceso con varios objetos coordinados. 240–640 px. | ≤ 40 partes animadas · timeline coordinada (WAAPI o delays calculados) · escena con fondo/plano medio/primer plano | Escritorio con documentos, camión transportando paquetes, flujo de datos entre sistemas, ensamblaje. |
| **M4** | Advanced | Experiencia visual especial que aporta valor medible. | Justificación escrita obligatoria (`config.justification`) · medición de FPS en equipo de referencia y en uno de gama baja · carga diferida | Objetos 3D, escenas isométricas complejas, partículas, cámara. |

## Reglas de selección

1. Empieza en **M2**. Baja a M1 si el recurso vive en un espacio pequeño o se repite muchas veces en pantalla (celdas de tabla, botones).
2. Sube a M3 solo si el usuario necesita **entender** un proceso (no solo saber que "algo está pasando").
3. M4 exige responder por escrito: ¿qué aporta que M3 no pueda?, ¿cuál es el coste de carga?, ¿cuál es la alternativa estática?
4. Un mismo concepto puede existir en varios niveles: `document-processing` M1 (icono de hoja con barra) vs M2 (hoja con líneas, escáner y estados) vs M3 (escritorio con bandeja, impresora y carpetas).
5. Nunca mezcles niveles en un mismo espacio visual: varias animaciones M2 simultáneas compiten por la atención (jerarquía).

## Señales de nivel mal elegido

| Síntoma | Corrección |
| :--- | :--- |
| El recurso distrae del contenido principal | Bajar un nivel o reducir `intensity`. |
| No se entiende qué representa sin explicación | Subir a M2/M3 o añadir etiqueta textual. |
| Caídas de FPS al mostrar varias instancias | Bajar nivel, reducir `density` o pausar fuera de viewport. |
| Archivo > 40 KB para un M1/M2 | Simplificar geometría (ver `svg-engineering.md`). |
