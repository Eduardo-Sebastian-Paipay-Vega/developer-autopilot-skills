# Cableado de Rutas, Interceptores y Condicionales por Framework

Una pantalla de error o estado sin cablear es código muerto. Aplica la receta correspondiente al framework detectado en el Paso 0.

---

## 1. Next.js (App Router)

### Archivos y rutas obligatorias
```text
app/
├── loading.tsx                  # Skeleton / Loader de segmento raíz
├── not-found.tsx                # 404 Not Found global
├── error.tsx                    # 500 Error Boundary de segmento ('use client')
├── global-error.tsx             # 500 Error Boundary raíz (incluye <html><body>)
├── (system)/
│   ├── 401/page.tsx             # Sesión expirada (lee ?returnUrl=...)
│   ├── 403/page.tsx             # Acceso denegado
│   ├── 429/page.tsx             # Rate limiting (lee ?retryAfter=...)
│   └── mantenimiento/page.tsx   # 503 Mantenimiento
└── layout.tsx                   # Monta <OfflineIndicator /> y <ForceUpdateGate />
```

### Interceptor de Fetch / Cliente API
En el cliente HTTP central (`lib/api-client.ts` o equivalente):
- `res.status === 401` → redirigir a `/401?returnUrl=${encodeURIComponent(pathname)}` (o disparar refresh de token antes).
- `res.status === 403` → lanzar `ForbiddenError` o navegar a `/403` sin cerrar sesión.
- `res.status === 429` → leer `res.headers.get('Retry-After')` y propagar `RateLimitError(retryAfter)`.
- `res.status === 503` → redirigir a `/mantenimiento`.
- `res.status === 400 | 500 | 502 | 504` → tipar en `ApiError(status, message, traceId)` para que la vista muestre `<ErrorScreen>` o notificación contextual.

---

## 2. Angular (Standalone — v19/20/21)

### Rutas (`app.routes.ts`)
```ts
{ path: 'error/400', loadComponent: () => import('./shared/system-states/pages/error-page.component').then(m => m.ErrorPageComponent), data: { code: 400 } },
{ path: 'error/401', loadComponent: () => ..., data: { code: 401 } },
{ path: 'error/403', loadComponent: () => ..., data: { code: 403 } },
{ path: 'error/429', loadComponent: () => ..., data: { code: 429 } },
{ path: 'error/500', loadComponent: () => ..., data: { code: 500 } },
{ path: 'error/502', loadComponent: () => ..., data: { code: 502 } },
{ path: 'mantenimiento', loadComponent: () => ..., data: { code: 503 } },
{ path: '**', loadComponent: () => ..., data: { code: 404 } }, // SIEMPRE al final
```

### Interceptor HTTP funcional (`system-error.interceptor.ts`)
Registrar en `provideHttpClient(withInterceptors([systemErrorInterceptor]))`:
- `err.status === 0` → notificar a `NetworkStatusService` (posible caída de red / CORS).
- `401` → redirigir a `/login` o `/error/401` con `queryParams: { returnUrl: router.url }`.
- `403` → navegar a `/error/403` (sin borrar token).
- `429` → leer `err.headers.get('Retry-After')` y pasar al estado `429`.
- `503` → navegar a `/mantenimiento`.
- `500 / 502 / 504` → emitir a servicio de error global o mostrar `<app-error-screen [code]="err.status" />`.

### Shell raíz (`app.html`)
Montar globalmente `<app-offline-indicator />`, `<app-force-update-gate />` y `<app-full-page-loader />` controlado por un signal global `SystemStateService.blockingLoading()`.

---

## 3. React (Vite + React Router v6/v7)

### Rutas y Error Boundary
- Envolver `<RouterProvider>` o `<Routes>` en `<GlobalErrorBoundary fallback={<ErrorScreen code={500} />}>`.
- Rutas explícitas: `/401`, `/403`, `/429`, `/500`, `/mantenimiento` (503) y `<Route path="*" element={<ErrorScreen code={404} />} />`.
- En el interceptor de Axios (`api.interceptors.response.use`): mapear `401 / 403 / 429 / 500 / 502 / 503 / 504` y `!error.response` (offline).
- Montar `<OfflineIndicator />` y `<ForceUpdateGate />` en `App.tsx`.

---

## 4. Vue 3 / Nuxt 3

- **Nuxt 3:** crear `error.vue` en la raíz mapeando `error.statusCode` (`400`, `401`, `403`, `404`, `429`, `500`, `502`, `503`, `504`) a `<ErrorScreen />`.
- **Vue Router:** ruta catch-all `{ path: '/:pathMatch(.*)*', component: NotFoundView }` + rutas `/error/:code` + `app.config.errorHandler`.
- **Conectividad:** composable `useOnlineStatus()` con `window.addEventListener('online' | 'offline')` y limpieza en `onUnmounted`.

---

## 5. Condicionales estándar en vistas de datos (aplican a todos los frameworks)

Orden estricto de renderizado condicional en cualquier pantalla que consume datos:

```text
1. ¿Bloqueo global (Force Update / 503 / Offline sin caché)?  → Pantalla bloqueante
2. ¿Cargando inicial (isLoading && !data)?                    → <SkeletonScreen />
3. ¿Error de petición (error)?                                → <ErrorScreen code={error.status} onRetry={refetch} />
4. ¿Sin datos y hay filtros activos?                          → <EmptyState variant="no-results" onClear={clearFilters} />
5. ¿Sin datos y sin filtros (primer uso o bandeja limpia)?    → <EmptyState variant="first-use | zero-inbox" />
6. ¿Datos listos?                                             → Contenido real (+ <FullPageLoader /> solo si hay mutación crítica)
```
