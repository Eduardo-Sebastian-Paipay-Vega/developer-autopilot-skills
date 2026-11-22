# Integración Git/GitHub, Changelog Interno y Métricas (SIGCS)

## 1. Convención de Ramas y Commits

### Ramas
```text
feature/CHG-0042-resumen-corto
fix/CHG-0043-resumen-corto
refactor/CHG-0044-resumen-corto
architecture/CHG-0045-resumen-corto
```

### Commits (Conventional Commits + CHG-ID)
```text
feat(CHG-0042): agregar desglose de impuestos por ítem
fix(CHG-0043): corregir validación de permisos RBAC en exportación
refactor(CHG-0044): migrar servicios a arquitectura core/shared/features
docs(CHG-0045): registrar ADR-0008 y actualizar CHANGELOG_INTERNO
```

---

## 2. Plantilla de Entrada en `docs/CHANGELOG_INTERNO.md`

```markdown
## [vX.Y.Z] - YYYY-MM-DD | CHG-XXXX · Módulo: <Nombre>
- **Tipo / Criticidad:** FEATURE · C3 (Alto)
- **Refs:** RF-08, RF-09 | SDD-004 | PR #42
- **Breaking Change:** Sí / No
- **Dimensiones:** funcional, ux-ui, frontend, backend, database

### 1. Cambio Funcional (AS-IS → TO-BE)
- **Antes:** ...
- **Ahora:** ...

### 2. Diseño e Interfaz (UI/UX)
- **Componentes / Tokens:** ...

### 3. Estructura Técnica, API y Base de Datos
- **Frontend:** ...
- **Backend / API:** ...
- **Base de Datos / Migraciones:** ...

### 4. Verificación y Rollback
- **Evidencias:** `npm run build` (0 errores), tests E2E aprobados.
- **Rollback:** ...
```

---

## 3. Métricas de Gobierno (`node scripts/change-registry.mjs metrics`)

| Métrica | Qué mide | Objetivo orientativo |
| :--- | :--- | :---: |
| **Trazabilidad completa** | % de cambios C2–C4 con `refs` (RF/SDD/ADR) y `git.pr` o `git.commit` | 100 % en C3/C4 |
| **Documentación sincronizada** | % de cambios cerrados con `docSync: true` | 100 % |
| **Cobertura de evidencias** | % de cambios en `READY_FOR_MERGE`/`VERIFIED`/`CLOSED` con `evidences.length > 0` | 100 % |
| **Aprobación en críticos** | % de cambios C3/C4 con `approver` y `rollbackPlan` definidos | 100 % |
| **Tasa de reversión** | % de cambios en estado `ROLLED_BACK` sobre liberados | Minimizar (< 5 %) |
| **Bloqueados / Abiertos** | Cantidad en `BLOCKED` o `IN_PROGRESS` para revisión semanal | Controlado |

> Las métricas son objetivos de gobierno verificados sobre `changes.json`; nunca deben asumirse sin ejecutar `metrics` y `validate`.
