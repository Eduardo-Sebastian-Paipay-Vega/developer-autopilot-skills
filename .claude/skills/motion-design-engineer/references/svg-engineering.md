# Ingeniería SVG (estándar MDES)

## 1. Estructura obligatoria del `<svg>`

```html
<svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g data-part="shadow">...</g>
  <g data-part="body">...</g>
  <g data-part="accent">...</g>
</svg>
```

- **Siempre `viewBox` explícito**, sin atributos `width` ni `height` fijos en píxeles (el tamaño lo controla `.mdes` vía `--motion-width` y `--motion-aspect`).
- Coordenadas enteras o con máximo 1 decimal. Evita coordenadas tipo `143.847291`.
- Cada elemento que se anima de forma independiente va en un `<g data-part="nombre-kebab">`.
- `stroke-linecap="round"` y `stroke-linejoin="round"` para consistencia geométrica.

## 2. Colores y trazos

- **Prohibido** escribir colores hexadecimales (`#2563eb`, `#fff`) dentro del SVG o del CSS del recurso.
- Usa únicamente tokens: `fill="var(--motion-primary)"`, `stroke="var(--motion-stroke)"`, `stroke-width="var(--motion-stroke-width)"`.
- Para opacidades relativas usa `fill-opacity` / `stroke-opacity` o `opacity` en el grupo.

## 3. Presupuesto de nodos y optimización

| Nivel | Máximo orientativo de nodos SVG | Regla |
| :---: | :---: | :--- |
| M1 | ≤ 10 | Solo primitivas (`circle`, `rect`, `line`, `path` corto). |
| M2 | ≤ 40 | Composición por capas limpias. Sin trazos duplicados. |
| M3 | ≤ 120 | Reutilizar elementos con `<defs>` + `<use>` cuando se repitan. |

- Prefiere `<rect rx="6">`, `<circle>`, `<ellipse>`, `<line>` antes que `<path>` largos.
- **No** incrustes imágenes base64 (`<image href="data:image/...">`) ni `<filter>` animados (como `feGaussianBlur` dinámico, que dispara repaints costosos).
- Si necesitas `<clipPath>` o `<linearGradient>`, prefija su `id` con el `id` del recurso (ej. `id="doc-proc-clip"`) para evitar colisiones cuando haya varias animaciones en la misma página.

## 4. `transform-origin` en SVG

- `.mdes [data-part]` ya define `transform-box: fill-box; transform-origin: center;`.
- Para bisagras (lomo de libro, tapa de carpeta, barra que crece desde abajo), declara el origen relativo a la caja de la parte:
  - Lomo izquierdo: `transform-origin: left center;`
  - Base inferior: `transform-origin: center bottom;`
  - Borde izquierdo: `transform-origin: left center;`
- Evita `rotateY()` / `rotateX()` dentro de SVG: usa `scaleX(1 → -1)` o `scaleY(1 → -1)` sobre la arista correspondiente.
