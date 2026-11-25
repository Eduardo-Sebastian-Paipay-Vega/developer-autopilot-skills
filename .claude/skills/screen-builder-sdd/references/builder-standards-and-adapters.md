# Estándares de Construcción Frontend-First y Capa de Adaptadores DTO

## 1. Patrón Obligatorio de Adaptador Frontend-First (`adapters/<modulo>.adapter.ts`)

Para construir primero el frontend sin contaminar los componentes con datos falsos incrustados:

```ts
// @frontend-first-stub — Endpoint objetivo: GET /api/v1/usuarios (ver docs/arquitectura/routes-map.json)
export interface UsuarioDTO {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

export interface UsuariosAdapter {
  listar(params: { page: number; pageSize: number; q?: string }): Promise<{ items: UsuarioDTO[]; total: number }>;
}
```

**Reglas del adaptador:**
1. Los componentes UI (`page.tsx`, tablas, formularios) **solo** consumen la interfaz `Adapter` y los `DTO` tipados — jamás importan archivos `.mock.ts` directamente.
2. El adaptador soporta simular explícitamente los estados `loading`, `empty` y `error` en desarrollo para verificar los **5 UI States** antes de tener backend.
3. Al conectar el backend real, se sustituye la implementación del adaptador por `apiFetch` (`REAL_API`), se elimina el stub y se audita con `/mock-free-audit` (`autopilot escanear --strict`).

---

## 2. Convenciones de Archivos por Framework

| Framework | Ruta de Página | Componentes y Adaptadores del Módulo |
| :--- | :--- | :--- |
| **Next.js (App Router)** | `frontend/app/<ruta>/page.tsx` | `frontend/modules/<modulo>/components/` + `adapters/` |
| **Angular (Standalone)** | `src/app/features/<modulo>/<pantalla>.component.ts` | `src/app/features/<modulo>/components/` + `services/` |
| **React (Vite)** | `src/pages/<modulo>/<Pantalla>Page.tsx` | `src/features/<modulo>/components/` + `adapters/` |
| **Vue / Nuxt** | `pages/<ruta>.vue` | `modules/<modulo>/components/` + `composables/` |

---

## 3. Checklist del Agente Verificador de Código (antes de `UI_READY`)

- [ ] `00_relacional.md` y `01_frontend.md` existen y pasan `autopilot disenar verificar --strict`.
- [ ] Todos los `CMP-XXX` de `01_frontend.md` están implementados con la librería UI oficial del proyecto.
- [ ] Cero valores hex hardcoded (`bg-[#...]`, `text-[#...]`, `border-[#...]`).
- [ ] Cero mezcla de librerías UI (ej. sin `primeng` en un proyecto `PrimeReact`/`shadcn`).
- [ ] Los 5 estados UI (`Ideal`, `Loading/Skeleton`, `Empty`, `Error`, `Overflow`) funcionan en la vista.
- [ ] Formularios con validación `onBlur`, bloqueo `isLoading` anti-double-submit y preservación de datos ante error.
- [ ] `autopilot construir verificar --strict`, `typecheck` y `build` del proyecto pasan sin errores.
