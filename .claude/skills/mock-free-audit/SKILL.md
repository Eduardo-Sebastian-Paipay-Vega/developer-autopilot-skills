---
name: mock-free-audit
description: Auditoría integral anti-mock, implementador y verificador de integración real con backend (Mock-Free Software Audit). Detecta y clasifica datos simulados, servicios falsos, fallbacks silenciosos en catch, catálogos hardcodeados, auth bypass, KPIs estáticos y CRUDs sin persistencia (MK-001 a MK-015) mediante scanner CLI (`scripts/scan-mocks.mjs`) e inspección arquitectónica, traza la cadena UI→API→Controller→BD, cruza endpoints huérfanos, elimina simulaciones y conecta/implementa la integración real verificando CRUD round-trip y Chaos Test (backend apagado). Úsala antes de producción, al pasar de Frontend-First a backend real, o para certificar que no quedan mocks productivos.
---

# Mock-Free Audit & Backend Integrity Enforcer

Garantiza que el **100 % de las rutas productivas** operen contra el backend y la base de datos reales — sin datos simulados, sin fallbacks silenciosos que oculten errores y sin operaciones CRUD ficticias.

> [!IMPORTANT]
> **Distinción obligatoria:** esta skill prohíbe mocks en **rutas de ejecución productivas**. **Nunca** elimines automáticamente fixtures, factories o mocks legítimos dentro de pruebas unitarias (`*.spec.*`, `*.test.*`, `tests/`).
>
> Referencias (*progressive disclosure*):
> - `references/detection-catalog.md` — Catálogo `MK-001`–`MK-015`, puntos de fuga, checklist `DB-001`–`DB-012`, `E2E-001`–`E2E-012` y matriz ponderada.
> - `scripts/scan-mocks.mjs` — Scanner estático CLI (0 dependencias) usable también como Quality Gate en CI/CD (`--strict`).

---

## Protocolo obligatorio en 2 tiempos

> [!CAUTION]
> **Primero audita y presenta el diagnóstico; NO modifiques archivos durante el descubrimiento.** Solicita autorización explícita antes de iniciar la eliminación de mocks o la implementación de endpoints faltantes.

---

### Tiempo 1 — Auditoría y Descubrimiento (solo lectura)

#### Paso 0: Contexto y escaneo automatizado
1. Lee `toolkit.config.json` y `docs/planeacion/plan-maestro.md` / `plan.md` (si existen) para conocer stack, arquitectura, endpoints reales y reglas de negocio.
2. Ejecuta el scanner estático oficial sobre la raíz del proyecto (o carpetas `frontend/` y `backend/`):
   ```bash
   node .claude/skills/mock-free-audit/scripts/scan-mocks.mjs .
   ```
3. Clasifica manualmente cada hallazgo (p. ej. `localStorage` para preferencias visuales como sidebar colapsado es legítimo; `localStorage` simulando una tabla de pedidos es `MK-007` crítico).

#### Paso 1: Revisión manual de los 6 puntos de fuga ocultos (`references/detection-catalog.md`)
Revisa expresamente donde los mocks suelen esconderse sin llamarse "mock":
1. **Fallbacks silenciosos en `catch` / `catchError`:** un error `500`/`404` devuelve `mockData` en vez de propagar el error a la UI.
2. **Catálogos y dropdowns estáticos:** `Select`/filtros con arrays fijos desincronizados de la BD.
3. **Mutaciones falsas:** `POST`/`PUT`/`PATCH`/`DELETE` que muestran `toast.success` y mutan estado en memoria sin petición HTTP real.
4. **Auth/RBAC bypass:** guards que inyectan un usuario/rol por defecto o tokens JWT en constantes.
5. **KPIs, gráficos y dashboards:** métricas fijas (`1,240`, `+14.5%`) mientras solo la tabla usa API real.
6. **Exportaciones/descargas falsas:** botones que sirven archivos estáticos desde `/public/samples/` o blobs vacíos.

#### Paso 2: Trazabilidad E2E y Cruce de Endpoints
Por cada módulo y pantalla, verifica la cadena completa:
`UI → State → Frontend Service → HTTP Request → API Endpoint → Controller → Business Logic → Repository/ORM → Database`

Clasifica cada funcionalidad como:
- **`REAL`**: petición HTTP real, lógica en backend y persistencia verificable en BD.
- **`PARTIAL`**: llama al endpoint pero ignora campos nuevos, calcula datos en cliente o tiene fallback simulado.
- **`MOCKED`**: comportamiento simulado o datos hardcodeados.
- **`DISCONNECTED`**: sin conexión verificable al backend.
- **`BLOCKED`**: imposible comprobar por entorno/credenciales faltantes.

Cruza el inventario real de endpoints del backend (OpenAPI, `urls.py`, routers Express/NestJS) contra los servicios del frontend para señalar **Endpoints Huérfanos (*Dead Endpoints*)**.

#### 🛑 Puerta de Autorización
Presenta al usuario el informe diagnóstico (inventario de hallazgos `MK-*`, tabla de trazabilidad, endpoints huérfanos, riesgos y plan incremental por módulo) y **espera confirmación** antes de editar código.

---

### Tiempo 2 — Eliminación, Implementación Real y Verificación

#### Paso 3: Reemplazo incremental por módulo
Por cada hallazgo aprobado:
1. Comprueba si el endpoint ya existe en el backend (usa `/support-db` para confirmar modelos y migraciones).
2. **Si existe:** conecta el servicio frontend al endpoint real, valida la respuesta (Zod/Valibot o contrato tipado) y elimina el archivo/rama mock.
3. **Si no existe:** valida el contrato y las reglas de negocio con el usuario antes de implementar controlador, servicio de negocio, repositorio y migración.
4. **Conecta errores reales:** reemplaza fallbacks silenciosos por estados explícitos de error y vacío (coordina con `/system-state-screens` si está instalada).
5. Elimina flags de entorno (`NEXT_PUBLIC_USE_MOCKS`, `ENABLE_MOCK_API`, `IS_DEMO_MODE`, `BYPASS_AUTH`) y mueve cualquier librería de mocking (`msw`, `@faker-js/faker`, `json-server`, `axios-mock-adapter`) fuera de `dependencies`.

#### Paso 4: Verificación dinámica obligatoria (Runtime, CRUD y Chaos Test)
No declares una funcionalidad `REAL` solo por compilar. Ejecuta y documenta:
1. **Auditoría de red:** cada ruta dinámica dispara al menos una petición `XHR`/`Fetch` al `API_BASE_URL` real.
2. **Round-Trip CRUD (`E2E-001`–`E2E-012`):** Crear → recargar (`Ctrl+Shift+R`) → Editar → recargar → Eliminar → recargar, verificando persistencia real en BD (en entorno/BD de testing aislada).
3. **Chaos Test (Backend desconectado):** apagar backend o bloquear host API → el **100 %** de las pantallas dinámicas deben mostrar estado de error/sin conexión y **0 registros ficticios**.
4. **4 escenarios:** Backend disponible · Backend desconectado · Error HTTP (`400`/`401`/`403`/`500`) · Datos vacíos reales (sin rellenar con ejemplos).
5. **Re-escaneo final:** `node .claude/skills/mock-free-audit/scripts/scan-mocks.mjs . --strict` + `build`/`lint`/`tests` del proyecto.

---

## Criterios estrictos de aprobación

Un sistema **solo** puede declararse **MOCK-FREE** cuando:
- 0 hallazgos críticos/altos en rutas productivas.
- 0 fallbacks silenciosos ante fallos de backend.
- Login, roles y permisos validados en backend (ocultar botones en UI no es autorización).
- CRUD y recarga verificados contra BD real.
- Un puntaje promedio alto en la matriz ponderada **nunca** compensa un fallo crítico (login simulado, CRUD falso o pantalla productiva mockeada).

## Reglas inquebrantables
- Nunca inventes endpoints, tablas ni reglas de negocio.
- Nunca sustituyas datos faltantes con valores ficticios (`data?.total ?? 1500` → prohibido; usar estado vacío o error).
- Nunca ejecutes pruebas destructivas sobre datos reales de producción.
- No declares pruebas que no ejecutaste ni hagas commits sin autorización.
