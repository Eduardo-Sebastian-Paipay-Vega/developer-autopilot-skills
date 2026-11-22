# Tokens de Geometría, Tipografía, Color y Animación (Enterprise Sidebar)

> Todos los valores de color deben mapearse a los tokens CSS/Tailwind del proyecto activo. Los hex mostrados son referencia de contraste WCAG 2.2 AA cuando el proyecto aún no define tokens propios.

## 1. Dimensiones y Layout Tokens

| Parámetro | Expandido (Desktop) | Colapsado (Mini-Sidebar) | Drawer Móvil (`< 768px`) |
| :--- | :--- | :--- | :--- |
| **Ancho (`width`)** | `260px` *(rango `240–280px`)* | `68px` *(rango `64–72px`)* | `280px` *(máx. `85vw`)* |
| **Altura Header** | `64px` (`h-16`) | `64px` (`h-16`) | `56px` (`h-14`) |
| **Altura Ítem Nivel 1** | `38–40px` (`h-10`) | `40px` (`h-10`, centrado) | `44px` (`h-11`, táctil) |
| **Altura Sub-ítem Nivel 2** | `34–36px` (`h-9`) | Oculto *(Popover lateral)* | `40px` (`h-10`) |
| **Padding horizontal contenedor** | `12px` (`px-3`) | `12px` (`px-3`) | `12px` (`px-3`) |
| **Padding interno ítem** | `10px 12px` (`py-2.5 px-3`) | `10px` (`p-2.5`) | `12px` (`p-3`) |
| **Indentación sub-ítems** | `36px` (`pl-9`) | N/A | `36px` (`pl-9`) |
| **Gap entre ítems** | `2–4px` (`space-y-0.5` / `1`) | `4px` (`space-y-1`) | `4px` (`space-y-1`) |
| **Separación entre secciones** | `20–24px` (`mt-5` / `mt-6`) | `16px` (`mt-4` + divisor) | `20px` (`mt-5`) |
| **Radio de borde** | `6–8px` (`rounded-md`/`lg`) | `8px` (`rounded-lg`) | `8px` (`rounded-lg`) |

## 2. Tipografía e Iconografía

| Elemento | Tamaño | Peso | Reglas |
| :--- | :--- | :--- | :--- |
| **Cabecera de sección** | `11px` (`0.6875rem`) | `600` (`semibold`) | `uppercase`, `letter-spacing: 0.06em` (`tracking-wider`). |
| **Ítem Nivel 1** | `14px` (`0.875rem`) | `500` reposo / `600` activo | Máx. `22` caracteres (`truncate` + tooltip si desborda). |
| **Ítem Nivel 2** | `13px` (`0.8125rem`) | `400` reposo / `500` activo | **Sin iconos.** Indicador minimalista: punto `4px` o línea guía `1px`. |
| **Icono Nivel 1** | `18px × 18px` | Trazo `1.75–2px` uniforme | Gap icono-texto: `10–12px` (`gap-2.5` / `gap-3`). |

## 3. Tokens Semánticos de Color (WCAG 2.2 AA: `≥ 4.5:1` texto, `≥ 3:1` iconos)

```css
:root {
  --sidebar-bg: #f8fafc;
  --sidebar-border: #e2e8f0;
  --sidebar-text: #475569;
  --sidebar-icon: #64748b;
  --sidebar-hover-bg: #f1f5f9;
  --sidebar-hover-text: #0f172a;
  --sidebar-active-bg: color-mix(in srgb, var(--primary, #1d4ed8) 10%, transparent);
  --sidebar-active-text: var(--primary, #1d4ed8);
  --sidebar-active-bar: var(--primary, #1d4ed8);
}

.dark, [data-theme="dark"] {
  --sidebar-bg: #09090b;
  --sidebar-border: #1e293b;
  --sidebar-text: #94a3b8;
  --sidebar-icon: #94a3b8;
  --sidebar-hover-bg: #1e293b;
  --sidebar-hover-text: #f8fafc;
  --sidebar-active-bg: color-mix(in srgb, var(--primary, #60a5fa) 14%, transparent);
  --sidebar-active-text: var(--primary, #60a5fa);
  --sidebar-active-bar: var(--primary, #60a5fa);
}
```

### Estados visuales por ítem
- **Active:** `--sidebar-active-bg` + `--sidebar-active-text` + barra vertical izquierda (`width: 3px; height: 20px; border-radius: 0 9999px 9999px 0`).
- **Parent Active:** texto en `--sidebar-hover-text` + `font-weight: 600`, **sin** fondo completo para no competir con el sub-ítem activo.
- **Disabled:** `opacity: 0.45; cursor: not-allowed;` sin hover.

## 4. Transiciones y Reducción de Movimiento

```css
.sidebar-shell {
  transition: width 200ms cubic-bezier(0.2, 0, 0, 1);
}
.sidebar-submenu {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 180ms ease-out;
}
.sidebar-submenu[data-open="true"] {
  grid-template-rows: 1fr;
}
.sidebar-submenu > div { overflow: hidden; }
.sidebar-chevron { transition: transform 150ms ease; }
.sidebar-chevron[data-open="true"] { transform: rotate(90deg); }

@media (prefers-reduced-motion: reduce) {
  .sidebar-shell, .sidebar-submenu, .sidebar-chevron {
    transition: none !important;
  }
}
```
