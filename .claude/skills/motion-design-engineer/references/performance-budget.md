# Presupuesto de rendimiento (MDES)

> Estos valores son **objetivos internos de ingeniería** del sistema, no garantías universales en cualquier hardware. Nunca informes métricas que no hayas medido.

## Objetivos de aceptación

| Indicador | Objetivo interno | Cómo se verifica |
| :--- | :---: | :--- |
| FPS en equipo de referencia | 60 FPS | DevTools Performance (grabación ≥ 3 s) |
| Presupuesto por frame a 60 Hz | ≤ 16,7 ms | DevTools Performance / Frame timing |
| Animaciones que disparan *Layout* por frame | 0 | `scripts/audit-motion.mjs` + DevTools Layout Shift / Rendering |
| Errores en consola | 0 | Consola del navegador en todos los estados |
| Dependencias obligatorias en core | 0 | Inspección de imports |
| Recursos sin soporte de colores vía tokens | 0 | `scripts/audit-motion.mjs` |
| Recursos sin versión de movimiento reducido | 0 | `scripts/validate-config.mjs` + prueba en DevTools |

## Reglas prácticas

1. **Solo `transform` y `opacity` en bucles** (etapa de composición del navegador, recomendación de web.dev).
2. **Pausa automática fuera de pantalla y en pestaña oculta:** `MotionController` activa `document.visibilitychange` e `IntersectionObserver` por defecto (`pauseWhenHidden: true`).
3. **Limpieza obligatoria:** llamar a `controller.destroy()` en `ngOnDestroy` / `useEffect` cleanup / `onUnmounted` / `disconnectedCallback`.
4. **Sin `will-change` masivo:** crear demasiadas capas de composición consume memoria de GPU en móviles.
5. **Canvas 2D / Three.js:** usar `requestAnimationFrame`, cancelar el ID en `destroy()`, limitar `devicePixelRatio` a `Math.min(window.devicePixelRatio, 2)` y evitar crear objetos en cada frame (GC pauses).
6. **Pruebas con throttling:** en M3 y M4, grabar también con CPU 4× slowdown en DevTools Performance para detectar cuellos de botella en dispositivos modestos.
