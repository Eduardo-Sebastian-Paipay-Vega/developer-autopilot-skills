# Fuentes técnicas oficiales y matriz de licencias (Fase 0)

Última verificación: **2026-11-21**.

> **Distinción obligatoria:**
> - **Estándar web:** especificaciones W3C / WHATWG implementadas por los navegadores.
> - **Recomendación de ingeniería:** buenas prácticas documentadas por los autores de navegadores o frameworks.
> - **Decisión interna MDES:** convenciones propias de este sistema (niveles M1–M4, contrato JSON, tokens `--motion-*`, objetivos 60 FPS).

## Registro de fuentes abiertas

| Fuente | Tecnología | Clasificación | Capacidades clave | Limitaciones | Licencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [MDN CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations) | CSS3 `@keyframes` / `transition` | Estándar web | GPU en `transform`/`opacity`, `prefers-reduced-motion`, 0 KB JS. | Secuencias complejas dependientes de eventos requieren WAAPI/JS. | Estándar abierto (W3C) |
| [MDN SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) | SVG 1.1 / SVG 2 | Estándar web | Vectores escalables, capas `<g>`, estilos por CSS custom properties. | `rotateY`/3D dentro de SVG no es fiable entre motores; muchos nodos penalizan render. | Estándar abierto (W3C) |
| [MDN Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) | WAAPI (`getAnimations`, `Animation`) | Estándar web | `play/pause/reverse/updatePlaybackRate`, promesas `finished`, unifica CSS y JS. | Requiere JS en cliente. | Estándar abierto (W3C) |
| [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) | Canvas 2D | Estándar web | Cientos/miles de objetos y partículas con `requestAnimationFrame`. | Sin DOM interno (requiere alternativa accesible manual); requiere escalar por `devicePixelRatio`. | Estándar abierto (WHATWG) |
| [web.dev Animations Guide](https://web.dev/articles/animations-guide) | Rendimiento de renderizado | Recomendación de ingeniería | Priorizar propiedades compuestas (`transform`, `opacity`) para evitar *Layout* y *Paint*. | Guía general; el FPS real depende del dispositivo. | CC-BY 4.0 (docs) |
| [Angular Animations](https://angular.dev/guide/animations) | Angular 20.2+ / 21 | Recomendación de framework | `animate.enter` y `animate.leave` con CSS nativo; `@angular/animations` deprecado en v20.2 (remoción prevista en v23). | Solo en Angular ≥ 20.2. | MIT |
| [React Docs](https://react.dev/) | React 18/19 | Recomendación de framework | Integración mediante `useRef` + `useEffect` con limpieza en retorno. | En RSC (Next.js) requiere `'use client'` para control imperativo. | MIT |
| [Three.js Docs](https://threejs.org/docs/) | WebGL / WebGPU (opcional M4) | Biblioteca externa opcional | Escenas 3D reales, cámara, iluminación. | Peso significativo en bundle; exige justificación M4 y carga diferida. | MIT *(modelos/texturas externos tienen licencia propia)* |
| [Motion Docs](https://motion.dev/docs) | Motion (opcional) | Biblioteca externa opcional | Gestos, springs y secuencias avanzadas. | Dependencia externa; no obligatoria en el core MDES. | MIT |
