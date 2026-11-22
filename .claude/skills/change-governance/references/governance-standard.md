# Estándar SIGCS — Dimensiones, Clasificación, Estados y Reglas (`CM-001`–`CM-016`)

## 1. Las 15 Dimensiones de Control

| N.º | Dimensión (`--dimensions`) | Qué registra |
| :-: | :--- | :--- |
| 01 | `funcional` | Nuevas funcionalidades, modificaciones y eliminaciones de reglas de negocio. |
| 02 | `arquitectura` | Capas, módulos, dependencias, patrones y ADRs. |
| 03 | `estructura` | Directorios, archivos creados/renombrados/eliminados, convenciones. |
| 04 | `ux-ui` | Layouts, componentes, design tokens, navegación, responsive, animaciones, A11y. |
| 05 | `frontend` | Componentes, páginas, rutas, estados, formularios y servicios cliente. |
| 06 | `backend` | Controladores, servicios de negocio, modelos, validaciones y jobs. |
| 07 | `database` | Tablas, columnas, relaciones, índices, constraints y migraciones. |
| 08 | `api` | Endpoints, contratos, DTOs, integraciones externas y compatibilidad. |
| 09 | `seguridad` | Autenticación, RBAC, permisos, aislamiento multi-tenant y protección de datos. |
| 10 | `rendimiento` | Consultas, caché, tiempos de respuesta, memoria, FPS y optimizaciones. |
| 11 | `calidad` | Pruebas unitarias, integración, E2E, regresiones y cobertura. |
| 12 | `infraestructura` | Configuración, despliegues, entornos, dependencias y CI/CD. |
| 13 | `documentacion` | Manuales, especificaciones SDD, Plan Maestro, diagramas y contratos. |
| 14 | `deuda-tecnica` | Código duplicado, soluciones temporales, riesgos y refactors pendientes. |
| 15 | `operacion` | Incidentes, post-mortems, compatibilidad, observabilidad y soporte. |

---

## 2. Tipos de Cambio y Nivel de Control

`FEATURE` (Alto) · `ENHANCEMENT` (Medio/Alto) · `BUGFIX` (Medio) · `REFACTOR` (Medio/Alto) · `ARCHITECTURE` (Crítico) · `UI/UX` (Medio) · `DATABASE` (Crítico) · `SECURITY` (Crítico) · `PERFORMANCE` (Medio/Alto) · `INTEGRATION` (Alto) · `DEPRECATION` (Alto) · `CONFIGURATION` (Según impacto) · `DOCUMENTATION` (Bajo/Medio) · `HOTFIX` (Alto con revisión posterior).

---

## 3. Ciclo de Vida (10 Fases) y Máquina de Estados

**Fases:** `01 Detección → 02 Registro → 03 Auditoría de impacto → 04 Especificación SDD → 05 Evaluación y autorización → 06 Implementación → 07 Verificación → 08 Revisión y aprobación → 09 Liberación → 10 Cierre y seguimiento`.

**Estados válidos:** `DRAFT`, `PROPOSED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `IN_PROGRESS`, `BLOCKED`, `IN_TESTING`, `READY_FOR_MERGE`, `RELEASED`, `VERIFIED`, `CLOSED`, `ROLLED_BACK`, `DEFERRED`.

> **Regla:** `RELEASED` ≠ `VERIFIED`. Desplegar un cambio no prueba que funcione en el entorno objetivo.

---

## 4. Control Específico de Diseño UX/UI y Cambios Estructurales

- **UX/UI:** todo rediseño importante debe documentar: área de diseño (Layout, Componentes, Design Tokens, Navegación, Responsive, Interacciones, Accesibilidad, Consistencia), componentes y tokens modificados, impacto sobre permisos RBAC y evidencias antes/después.
- **Estructura (ADR/ACR):** documentar árbol `ANTES` vs. `DESPUÉS`, archivos creados/movidos/eliminados, responsabilidades trasladadas, imports afectados y dependencias agregadas/eliminadas.

---

## 5. Las 16 Reglas de Control (`CM-001` a `CM-016`)

| Código | Regla | Momento |
| :---: | :--- | :--- |
| **CM-001** | Todo cambio relevante (C2–C4) debe registrarse con `CHG-XXXX`. | Antes de implementar |
| **CM-002** | No modificar sin auditar el estado actual (*Audit before change*). | Auditoría previa |
| **CM-003** | No modificar sin análisis de impacto. | Antes de aprobar |
| **CM-004** | No duplicar funcionalidades existentes. | Diseño |
| **CM-005** | No eliminar código sin investigar dependencias y justificarlo. | Registro |
| **CM-006** | No romper contratos API sin evaluar consumidores. | Backend/API |
| **CM-007** | No alterar datos sin migración controlada y reversible. | Base de datos |
| **CM-008** | No introducir dependencias sin justificación. | Paquetes |
| **CM-009** | No cerrar cambios sin pruebas ejecutadas. | QA |
| **CM-010** | No declarar completo sin evidencia verificable. | Cierre |
| **CM-011** | No dejar documentación desactualizada (`docSync`). | Cierre |
| **CM-012** | No integrar cambios C3/C4 sin aprobación explícita. | Pull Request |
| **CM-013** | No sobrescribir cambios ajenos. | Git |
| **CM-014** | No introducir mocks en rutas productivas (`/mock-free-audit`). | Integración |
| **CM-015** | No salir del alcance aprobado sin actualizar el registro. | Ejecución |
| **CM-016** | No ocultar cambios no documentados en el diff. | Auditoría de PR |

---

## 6. Marcos de Referencia

Inspirado en principios aplicables de: **ISO 10007** (configuración), **ISO/IEC/IEEE 12207** (ciclo de vida), **ISO/IEC 25010** (calidad), **ISO/IEC/IEEE 42010** (arquitectura), **Conventional Commits**, **SemVer**, **ADR**, **SDD** y **DevSecOps**.
