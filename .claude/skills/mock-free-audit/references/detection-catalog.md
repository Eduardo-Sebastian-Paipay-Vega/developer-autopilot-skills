# Catálogo de Detección, Checklists y Matriz de Evaluación (Mock-Free Audit)

## 1. Catálogo de Parámetros de Detección (`MK-001` a `MK-015`)

| ID | Parámetro | Qué verificar | Severidad |
| :---: | :--- | :--- | :---: |
| **MK-001** | Mock data | Arrays y objetos literales con registros ficticios en rutas productivas. | Alta |
| **MK-002** | Hardcoded data | Registros de negocio escritos directamente en componentes UI. | Alta |
| **MK-003** | Fake services | Servicios que devuelven `of(...)`, `Promise.resolve(...)` o constantes artificiales. | Crítica |
| **MK-004** | Mock API | Endpoints simulados o interceptados (`msw`, `MockAdapter`, `miragejs`) activos en app. | Crítica |
| **MK-005** | Fake responses | Respuestas HTTP construidas artificialmente en controladores o interceptores. | Crítica |
| **MK-006** | Static JSON | Archivos `.json` estáticos usados como fuente funcional en vez de API. | Alta |
| **MK-007** | Local storage simulation | `localStorage`/`sessionStorage` usados para simular persistencia de negocio. | Crítica |
| **MK-008** | Fake CRUD | Mutaciones que muestran éxito y alteran estado local pero se pierden al hacer `F5`. | Crítica |
| **MK-009** | Fallback simulation | Bloques `catch`/`catchError` que devuelven datos de ejemplo cuando falla el backend. | Crítica |
| **MK-010** | Demo mode | Flags `IS_DEMO_MODE`, `USE_MOCKS`, `ENABLE_MOCK_API` presentes en producción. | Crítica |
| **MK-011** | Seed contamination | Datos de demostración mezclados con datos reales de producción. | Alta |
| **MK-012** | Fake authentication | Usuarios, sesiones o JWTs hardcodeados / `BYPASS_AUTH`. | Crítica |
| **MK-013** | Fake permissions | Permisos/roles resueltos únicamente en frontend sin verificación en backend. | Crítica |
| **MK-014** | Simulated pagination | Paginación/filtros calculados sobre arrays locales en vez de query params al servidor. | Media |
| **MK-015** | Fake statistics | KPIs y gráficos con números fijos o calculados sobre datos ficticios. | Alta |

---

## 2. Checklist de Integridad de Base de Datos (`DB-001` a `DB-012`)

- **DB-001** Conexión real contra la instancia configurada (no SQLite/memoria accidental en producción).
- **DB-002** Persistencia verificada tras recarga completa (`Ctrl+Shift+R`).
- **DB-003** IDs generados por la BD/backend (nunca `Math.random()` en frontend).
- **DB-004 / DB-005** FKs válidas y 0 registros huérfanos.
- **DB-006 / DB-007** Transacciones atómicas y constraints respetados.
- **DB-008** Auditoría registrada en operaciones críticas cuando corresponda.
- **DB-009 / DB-010** Concurrencia segura y aislamiento real por usuario/tenant (`tenant_id` desde JWT, nunca del body).
- **DB-011 / DB-012** Migraciones al día y consultas reales sin resultados mockeados en controladores.

---

## 3. Checklist de Pruebas E2E Obligatorias (`E2E-001` a `E2E-012`)

| ID | Prueba | Evidencia requerida |
| :---: | :--- | :--- |
| **E2E-001** | Cargar pantalla | Petición real a `API_BASE_URL` con `200`/`304`. |
| **E2E-002** | Crear registro | `POST` exitoso con ID real persistido en BD. |
| **E2E-003** | Consultar registro | `GET` devuelve el registro creado desde BD. |
| **E2E-004** | Actualizar registro | `PUT`/`PATCH` persiste el cambio en BD. |
| **E2E-005** | Eliminar registro | `DELETE` / baja lógica aplicada y verificada en BD. |
| **E2E-006 / 007** | Filtrar y paginar | Query params enviados al servidor y total real del backend. |
| **E2E-008** | Exportar (PDF/Excel/CSV) | Stream/archivo generado por backend con datos reales (no `/public/samples/`). |
| **E2E-009** | Permisos (401/403) | Backend rechaza solicitudes sin token o sin rol autorizado. |
| **E2E-010** | Chaos Test (desconexión) | Con backend apagado, **0** registros ficticios y estado de error visible. |
| **E2E-011** | Recarga (`Ctrl+Shift+R`) | Todo cambio CRUD sobrevive a la recarga dura. |
| **E2E-012** | Concurrencia | Modificaciones simultáneas sin corrupción de estado. |

---

## 4. Matriz Ponderada de Evaluación (Propuesta de Reporte)

| Área | Peso |
| :--- | :---: |
| Detección de mocks y datos hardcodeados | 15 % |
| Integración frontend–backend | 15 % |
| CRUD y lógica de negocio | 15 % |
| Persistencia e integridad de datos | 15 % |
| Autenticación y autorización | 10 % |
| Manejo de errores y estados | 10 % |
| Pruebas de integración y E2E | 15 % |
| Configuración y despliegue | 5 % |
| **Total** | **100 %** |

> **Escala orientativa:** `0–49` Crítico · `50–69` Deficiente · `70–84` Aceptable · `85–94` Bueno · `95–100` Excelente.  
> **Bloqueo crítico:** cualquier fallo en `MK-003`, `MK-004`, `MK-008`, `MK-009`, `MK-010`, `MK-012` o `MK-013` impide declarar el sistema *Mock-Free* independientemente del porcentaje global.
