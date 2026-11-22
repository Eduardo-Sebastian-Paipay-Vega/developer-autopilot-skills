# Validación y pruebas (MDES)

> **Regla de oro:** nunca declares que una animación funciona ni reportes métricas sin haberla ejecutado.

## 1. Validación estática (CLI, < 1 s)

```bash
# 1. Contrato de configuración
node scripts/validate-config.mjs <ruta>/mdes.config.json

# 2. Auditoría de rendimiento, tokens y accesibilidad
node scripts/audit-motion.mjs <carpeta-del-recurso>
```

Todos los `ERROR` deben quedar en 0 antes de entregar. Los `WARN` deben revisarse y justificarse si se mantienen.

## 2. Checklist de verificación en navegador real

Servir el proyecto/playground por HTTP local (p. ej. `npx serve .` o `python -m http.server 4173`), nunca abrir módulos ES con `file://`, y comprobar:

| # | Prueba | Criterio de paso |
| :---: | :--- | :--- |
| 1 | **Reproducción inicial** | Arranca limpia sin saltos ni consola con errores. |
| 2 | **Pausa y reanudación** | `pause()` detiene todas las capas; `play()` retoma sin reiniciar de golpe. |
| 3 | **Reinicio** | `restart()` vuelve al frame inicial en todas las capas sincronizadas. |
| 4 | **Velocidad** | `setSpeed(0.5)` y `setSpeed(2)` cambian la velocidad sin saltos bruscos. |
| 5 | **Colores y temas** | `setColors(...)` y `setTheme('dark' | 'brand' | 'light')` actualizan en vivo sin colores residuales hardcodeados. |
| 6 | **Tamaño y responsive** | `setSize(64)` y `setSize(320)` escalan nítidos sin recortar partes ni deformar proporción. |
| 7 | **Estados** | `idle → processing → success → error` transicionan limpios; `error` no queda en bucle infinito. |
| 8 | **Progreso** *(si aplica)* | `setProgress(0.35)` refleja 35 % real; `setProgress(null)` vuelve a indeterminado. |
| 9 | **Movimiento reducido** | Emular `prefers-reduced-motion: reduce` en DevTools → muestra frame estático comprensible. |
| 10 | **Limpieza** | `destroy()` detiene animaciones y libera observadores sin fugas. |
| 11 | **Rendimiento** | DevTools Performance sin picos de *Layout* repetidos durante el bucle. |
