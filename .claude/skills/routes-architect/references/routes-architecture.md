# Arquitectura Canónica del Mapa de Rutas (`routes-map.json`)

Esta referencia define la estructura estándar de 5 bloques que `routes-architect` usa para planificar, extraer y auditar rutas en **cualquier stack** (Next.js, Angular, React, Vue/Nuxt, Express, NestJS, FastAPI, Django, microservicios y WebSockets).

---

## 1. Los 5 Bloques Obligatorios

### Bloque 1: Topología y Servicios (`architecture`)
- Lista los frentes activos del sistema (`frontends`, `backends`, `realtime`, `datastores`) y sus conexiones principales.
- Se renderiza automáticamente en un diagrama `mermaid` (`flowchart LR`) al inicio de `CATALOGO_RUTAS.md`.

### Bloque 2: Rutas de Frontend (`frontendRoutes`)
Cada ruta pertenece a uno de 5 grupos canónicos:
1. **`public`** — Portal público / landing / consultas sin sesión (debe coincidir con `.claude/landing-design/scope.json → publicRoutes`).
2. **`auth`** — Login, recuperación/restablecimiento de clave, activación de cuenta, consentimiento legal.
3. **`internal`** — Sistema autenticado (intranet/dashboard), siempre agrupado por **`module`** (o squad/dominio) con su lista explícita de **`roles`** (RBAC) y **`rf`** (`RF-XX`).
4. **`terminal`** — Vistas dedicadas especiales (kiosco offline-first, pantallas TV, escáneres).
5. **`system`** — Pantallas de error y estado del sistema (`/400`, `/401`, `/403`, `/404`, `/429`, `/500`, `/502`, `/503`, `/504`, `/offline`, boundaries `error.tsx`/`not-found.tsx`).

### Bloque 3: Backend REST y WebSockets (`backendEndpoints`, `websockets`)
- **REST:** `method`, `path`, `service`, `router`, `file`, `auth` (`public | jwt | api-key`), `permissions` (array de permisos RBAC), `rf`, `notes`, `status`.
- **WebSockets:** `path`, `service`, `file`, `authProtocol` (ej. `bearer`), `events` (ej. `NOTIFICATION`, `LIVE_UPDATE`), `rf`.

### Bloque 4: Errores, Interceptores y Logs (`systemErrorsAndLogs`)
Documenta el contrato completo de resiliencia y observabilidad:
- **Boundaries & rutas de error** en frontend.
- **Interceptor HTTP:** formato canónico de sobre (`{ success, data | error: { code, message }, timestamp }`), propagación de `X-Request-Id` (`traceId`), `Retry-After` y `X-Min-App-Version`.
- **Manejador central backend:** mapeo estándar (`400`, `401`, `403`, `404`, `409`, `413`, `429`, `500`, `503`) sin exponer stacktraces al cliente.
- **Sanitización de logs y auditoría:** política de privacidad (no loguear PII ni tokens en URLs) y registro inmutable de acciones críticas (`ACCESS_DENIED`, mutaciones, exportaciones).

### Bloque 5: Discrepancias y Hallazgos (`findings`)
Registra explícitamente deuda técnica y hallazgos verificados:
- **Ambigüedades OpenAPI (`no-ambiguous-paths`):** ej. `/users/me` y `/users/roles` conviviendo con `/users/:id`.
- **Duplicación de prefijos entre servicios:** ej. mismo endpoint implementado en backend monolítico y microservicio.
- **Drift Plan vs Código:** rutas planeadas (`PLANNED`) aún sin archivo real, o archivos reales sin `RF` ni registro en `routes-map.json`.
- **Fugas de alcance:** rutas internas que aparecen por error en `landing-design/scope.json → publicRoutes`.

---

## 2. Reglas de Trazabilidad y Higiene

1. **Toda ruta interna (`internal`) debe declarar `module`, `rf` y `roles` (o `permissions`).**
2. **Nunca eliminar silenciosamente una ruta en producción:** marcarla `status: "DEPRECATED"` y registrar el reemplazo antes de borrarla.
3. **Respeto estricto al aislamiento Landing vs Sistema:** las rutas `public` son gobernadas visualmente por `landing-design-guardian`; las rutas `internal` y `system` por el tema interno en `design-tokens.json`.
4. **Cobertura mínima de resiliencia:** todo sistema en producción debe tener definidas al menos las rutas/manejadores para `401`, `403`, `404`, `500` y `503`/`offline`.

---

## 3. Puente con Otras Skills del Toolkit

| Skill | Cómo consume o alimenta `routes-map.json` |
| :--- | :--- |
| **`crear-plan-maestro`** | Aporta la lista maestra de `RF-XX`, `CU-XX`, módulos y catálogo cerrado de roles RBAC. |
| **`enterprise-sidebar`** | Lee `frontendRoutes` (`group: "internal"`) para generar el menú sin rutas huérfanas y con permisos exactos. |
| **`system-state-screens`** | Implementa y cablea las rutas de `group: "system"` e interceptores HTTP declarados en `systemErrorsAndLogs`. |
| **`landing-design-guardian`** | Contrasta `scope.json` (`publicRoutes`/`excludedRoutes`) contra `frontendRoutes` (`group: "public"`). |
| **`actualizar-contexto`** | Detecta cambios en rutas/endpoints al cierre de sesión y pide regenerar `CATALOGO_RUTAS.md`. |
| **`change-governance`** | Registra cambios estructurales de rutas o contratos API (`C2–C4`) como fichas `CHG-XXXX`. |
