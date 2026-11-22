# Configuración Declarativa, Filtrado RBAC y Adaptadores por Framework

## 1. Contrato de Datos (`navigation.config.ts`)

Desacopla siempre la definición de rutas del componente visual:

```ts
export interface NavBadge {
  type: 'count' | 'dot' | 'status';
  value?: number | string;
  variant: 'info' | 'warning' | 'danger';
}

export interface NavItem {
  id: string;
  label: string;                  // Máx. 22 caracteres (1–3 palabras)
  icon?: string;                  // Solo Nivel 1 (nunca en Nivel 2)
  route?: string;
  requiredPermissions: string[];  // [] = visible para cualquier autenticado
  badge?: NavBadge;               // Solo acciones pendientes / alertas reales
  children?: Omit<NavItem, 'icon' | 'children'>[];
}

export interface NavSection {
  id: string;
  title: string;                  // Cabecera 11px uppercase (vacío para anclaje superior Dashboard)
  items: NavItem[];
}
```

## 2. Algoritmo de Filtrado Recursivo RBAC (Regla de Limpieza Automática)

```ts
export function filterNavSections(
  sections: NavSection[],
  userPermissions: ReadonlySet<string>,
  hasAllPermissions = false
): NavSection[] {
  const canAccess = (required: string[]) =>
    hasAllPermissions || required.length === 0 || required.some((p) => userPermissions.has(p));

  return sections
    .map((section) => {
      const items = section.items
        .map((item) => {
          if (!canAccess(item.requiredPermissions)) return null;
          if (item.children) {
            const visibleChildren = item.children.filter((child) => canAccess(child.requiredPermissions));
            // Si el padre tiene sub-ítems pero ninguno es accesible, ocultar el padre
            if (visibleChildren.length === 0) return null;
            return { ...item, children: visibleChildren };
          }
          return item;
        })
        .filter((x): x is NavItem => x !== null);

      return items.length > 0 ? { ...section, items } : null;
    })
    .filter((s): s is NavSection => s !== null);
}
```

## 3. Persistencia de Estado y Atajo Global (`Ctrl + B`)

- **SPA (Angular / React Vite / Vue):** leer/escribir `localStorage.getItem('sidebar_collapsed') === 'true'`.
- **SSR (Next.js App Router / Nuxt):** leer la cookie `sidebar_collapsed` en el Server Component / middleware para renderizar el ancho inicial (`260px` o `68px`) sin *layout shift* en la hidratación.
- **Atajo de teclado:** escuchar `keydown` global:
  ```ts
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    toggleCollapsed();
  }
  ```

## 4. Notas por Framework y Librería UI

| Stack del proyecto | Piezas recomendadas |
| :--- | :--- |
| **Angular 20/21 + PrimeNG + Tailwind** | Standalone + `signal()` para `collapsed` y `openGroups`, `Router` (`NavigationEnd`) para auto-abrir el grupo activo, `pTooltip` + `p-popover` en modo colapsado (`68px`), `p-drawer` (o `<aside>` fixed con overlay) en `<768px`. |
| **Next.js App Router + shadcn/ui** | Cookie SSR para estado inicial, `usePathname()` para auto-abrir grupo activo, `@radix-ui/react-tooltip` + `@radix-ui/react-popover` en modo colapsado, `Sheet` en móvil. |
| **React + MUI / PrimeReact** | `useLocation()` para ruta activa, `Tooltip` + `Popover`/`OverlayPanel` en modo colapsado, `Drawer`/`Sidebar` en móvil. |
| **Vue 3 / Nuxt + Vuetify / PrimeVue** | `useRoute()` + `watch(() => route.path)` para cerrar drawer en móvil y sincronizar acordeón. |
