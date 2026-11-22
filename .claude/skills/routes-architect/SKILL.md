---
name: routes-architect
description: Arquitecto y fuente única de verdad para planear, crear, extraer, actualizar y auditar todo el mapa de rutas de un sistema (Frontend por grupos/módulos/RF/RBAC, Backend REST, Microservicios, WebSockets, pantallas de error/estado, interceptores HTTP, logs/auditoría y discrepancias OpenAPI) a partir de la documentación primaria (Plan Maestro, RF, CU, SDD, ADR) y del código real. Incluye el CLI `scripts/routes-cli.mjs` (`init`, `extract`, `generate`, `audit`) y se conecta con `crear-plan-maestro`, `enterprise-sidebar`, `system-state-screens`, `landing-design-guardian` y `change-governance`. Úsala siempre que se planifiquen rutas desde RF/documentación, se inventaríe un repo completo o se auditen endpoints y rutas huérfanas.
---

# Routes Architect — Fuente Única de Rutas, Endpoints, Errores y Auditoría

Planifica, inventaría, sincroniza y audita **todas las rutas del sistema** (Frontend, Backend REST, WebSockets, Pantallas de Error/Estado, Interceptores y Logs) desde una **única fuente de verdad (`docs/arquitectura/routes-map.json`)**, combinando **documentación primaria (RF, CU, SDD, Plan Maestro)** con **verificación real sobre el código fuente**.

> [!IMPORTANT]
> **Regla de fuente única:** `enterprise-sidebar`, `system-state-screens`, `landing-design-guardian`, `crear-plan-maestro` y `actualizar-contexto` consumen `docs/arquitectura/routes-map.json` (y su vista `docs/arquitectura/CATALOGO_RUTAS.md`) para no inventar rutas, no dejar enlaces muertos y no romper contratos RBAC/API.
>
> Referencias (*progressive disclosure*):
> - `references/routes-architecture.md` — Estructura canónica de las 5 secciones (Enjambre/Mermaid, Rutas Frontend por grupo/RF/RBAC, Backend REST + WebSockets, Errores/Estados/Logs y Discrepancias OpenAPI).
> - `scripts/routes-cli.mjs` — CLI sin dependencias (`init`, `extract`, `generate`, `audit` / `iniciar`, `extraer`, `generar`, `auditar`).

---

## Los 5 Modos de Operación

| Modo | Cuándo usarlo | Comando CLI |
| :--- | :--- | :--- |
| **1. Iniciar plantilla** | Proyecto nuevo o primera vez: crea `docs/arquitectura/routes-map.json` leyendo `toolkit.config.json` y `scope.json`. | `node .claude/skills/routes-architect/scripts/routes-cli.mjs init` |
| **2. Planear desde documentación (RF/SDD)** | Antes de programar o al rediseñar: leer `plan-maestro.md`, RFs, CUs, ADRs y roles RBAC para establecer **todas** las rutas planificadas en `routes-map.json` (`status: "PLANNED"`). | *(Flujo guiado por agente + `generate`)* |
| **3. Extraer del código real** | Proyecto con código vivo: escanea Next.js/Angular/React/Vue + Express/NestJS/FastAPI/Django + WebSockets y detecta rutas no documentadas o faltantes. | `node .claude/skills/routes-architect/scripts/routes-cli.mjs extract --merge` |
| **4. Generar catálogo completo** | Regenerar `docs/arquitectura/CATALOGO_RUTAS.md` con diagrama Mermaid, tablas por grupo/módulo/RF/RBAC, endpoints, errores/logs y discrepancias. | `node .claude/skills/routes-architect/scripts/routes-cli.mjs generate` |
| **5. Auditar integridad y drift** | Detectar rutas duplicadas, ambigüedades OpenAPI (`/me` vs `/:id`), rutas sin RF, internas sin RBAC, faltantes de error (`401/403/404/500/503`) y desfase plan vs código. | `node .claude/skills/routes-architect/scripts/routes-cli.mjs audit --strict` |

*(También disponible globalmente desde cualquier proyecto vía `autopilot rutas <iniciar|extraer|generar|auditar>`).*

---

## Procedimiento obligatorio (5 pasos)

### Paso 1: Leer la Documentación Primaria y Configuración (Planeación)
1. Lee `toolkit.config.json` (`stack`, `paths`, `routes`) para detectar frameworks, carpetas y ubicación de `routes-map.json`.
2. Lee la documentación viva existente antes de proponer o inventar rutas:
   - `docs/planeacion/plan-maestro.md` (RFs, CUs, módulos/squads, catálogo cerrado de roles RBAC, límites Out-of-Scope).
   - `docs/arquitectura/` (SDDs, ADRs, auditorías iniciales).
   - `.claude/landing-design/scope.json` (rutas públicas autorizadas vs rutas protegidas).
3. Si faltan RFs o definiciones de roles, **no los inventes**: documéntalos en `findings` / `missingInfo` y pregúntalos al usuario.

### Paso 2: Establecer la Arquitectura y el Mapa Planificado (`routes-map.json`)
Estructura el catálogo en 5 bloques trazables (ver `references/routes-architecture.md`):
1. **Topología / Servicios (`architecture`):** frentes del sistema (Frontend público/interno, Backends/Microservicios, WebSockets, BD/Caché) para generar el diagrama Mermaid.
2. **Rutas Frontend (`frontendRoutes`):** separadas en grupos explícitos (`public`, `auth`, `internal`, `system`, `terminal`), cada una con `path`, `group`, `module`, `file`, `rf`, `roles`, `purpose`, `status`.
3. **Endpoints Backend & WebSockets (`backendEndpoints` y `websockets`):** método HTTP, ruta completa, servicio/router, archivo, permisos RBAC, `rf`, `public` (`true/false`) y `status`.
4. **Contrato de Errores, Estados y Logs (`systemErrorsAndLogs`):**
   - Boundaries y rutas de error (`/400`, `/401`, `/403`, `/404`, `/429`, `/500`, `/502`, `/503`, `/504`, `/offline`).
   - Interceptor HTTP (sobre canónico, `X-Request-Id`, `Retry-After`, `X-Min-App-Version`).
   - Sanitización de logs (protección PII: nunca loguear DNI/tokens en URLs o consola) y auditoría inmutable.
5. **Discrepancias y Hallazgos (`findings`):** colisiones OpenAPI, endpoints duplicados entre servicios, rutas huérfanas o deuda técnica de enrutamiento.

### Paso 3: Contrastar con el Código Real (`extract`)
Ejecuta `extract` (y `--merge` si deseas incorporar rutas detectadas preservando tus anotaciones de `rf`, `roles` y `purpose`):
- Compara lo **planeado** (`PLANNED`) contra lo **implementado** (`IMPLEMENTED`) en el repositorio.
- Marca claramente cualquier ruta existente en código que no esté respaldada por un RF (posible residuo o alcance no autorizado).

### Paso 4: Generar el Catálogo Vivo (`generate`)
Ejecuta `generate` para producir `docs/arquitectura/CATALOGO_RUTAS.md` con:
- Diagrama Mermaid de arquitectura y flujo de servicios.
- Tablas ordenadas por grupo (`public`, `auth`, `internal` por módulo/squad, `system`).
- Inventario completo de endpoints REST + WebSockets.
- Sección completa de Errores, Interceptores, Trazabilidad y Logs.
- Matriz de discrepancias y hallazgos pendientes.

### Paso 5: Auditar y Conectar con el Ecosistema (`audit`)
1. Ejecuta `audit --strict` para validar:
   - Cero duplicados exactos (`METHOD + PATH`).
   - Detección de ambigüedades OpenAPI (rutas estáticas conviviendo con `/:id` en el mismo nivel).
   - Cobertura mínima de rutas de error del sistema (`401`, `403`, `404`, `500`, `503`).
   - Trazabilidad de RFs y RBAC en rutas internas.
2. **Conexión natural con otras skills:**
   - Si agregas o reorganizas rutas privadas, sincronízalas con `/enterprise-sidebar`.
   - Si faltan pantallas de error/estado, créalas con `/system-state-screens`.
   - Si cambias rutas públicas del landing, actualiza `.claude/landing-design/scope.json` (`/landing-design-guardian`).
   - Si el cambio altera contratos API o arquitectura (`C2–C4`), regístralo con `/change-governance` (`CHG-XXXX`).
