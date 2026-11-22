---
name: change-governance
description: Regla obligatoria y Sistema Integral de Gestión de Cambios de Software (SIGCS) para todo cambio relevante o grande (criticidad C2–C4: arquitectura, módulos nuevos, rediseños UI/UX, contratos API, migraciones de BD, seguridad/RBAC o refactorizaciones estructurales). Registra fichas trazables (`CHG-XXXX`), evalúa impacto en 15 dimensiones, genera ramas/commits (`tipo(CHG-XXXX): ...`) y plantillas de Pull Request para GitHub, sincroniza `CHANGELOG_INTERNO.md` y ADRs, y calcula métricas reales de calidad y trazabilidad mediante `scripts/change-registry.mjs`. Úsala siempre que se planifique, ejecute o documente un cambio grande en cualquier proyecto.
---

# Change Governance — Sistema Integral de Gestión de Cambios (SIGCS)

> [!IMPORTANT]
> **Regla transversal obligatoria:** ante cualquier cambio de criticidad **C2 (Medio), C3 (Alto) o C4 (Crítico)** — o que toque arquitectura, estructura de carpetas, diseño UI/UX mayor, contratos API, migraciones de base de datos, seguridad/RBAC o múltiples módulos — **debe existir un registro `CHG-XXXX` trazable** antes o durante su ejecución, vinculado a sus commits, Pull Request, pruebas y documentación.
>
> Referencias (*progressive disclosure*):
> - `references/governance-standard.md` — Las 15 dimensiones, tipos de cambio, criticidad `C0–C4`, ciclo de vida de 10 pasos, estados (`DRAFT`→`CLOSED`), control de diseño UX/UI y estructura (ADR/ACR), y reglas `CM-001`–`CM-016`.
> - `references/git-pr-and-metrics.md` — Convención de ramas/commits (`tipo(CHG-XXXX)`), plantilla de PR, formato de `CHANGELOG_INTERNO.md`, métricas de gobierno y CI Quality Gate.
> - `scripts/change-registry.mjs` — CLI real (0 dependencias): `init`, `add`, `metrics`, `validate`.

---

## Principio de separación de fuentes de verdad

- **Git** es la fuente de verdad del historial del código.
- **El Registro de Cambios (`CHG-XXXX`)** es la fuente de verdad de la justificación, alcance, impacto, aprobación, evidencias y reversión.
- **Las Especificaciones (Plan Maestro / SDD / ADR)** son la referencia del comportamiento y arquitectura esperados.

Ninguno sustituye a los otros; esta skill los mantiene sincronizados.

---

## Cuándo es obligatorio activar esta skill (umbral de criticidad)

| Nivel | Descripción | ¿Requiere ficha `CHG-XXXX`? | Controles obligatorios |
| :---: | :--- | :---: | :--- |
| **C0** | Informativo (typos, comentarios, formato). | No | Commit convencional limpio. |
| **C1** | Bajo (ajuste localizado y trivialmente reversible). | Opcional | Commit convencional + verificación básica. |
| **C2** | Medio (afecta un módulo, flujo funcional o vista UI). | **Sí** | Ficha `CHG-XXXX` + impacto + pruebas + commit `tipo(CHG-XXXX)`. |
| **C3** | Alto (afecta varios módulos, contratos API, diseño transversal o datos). | **Sí** | Ficha + impacto + rollback + aprobación previa + PR completo + `CHANGELOG_INTERNO.md`. |
| **C4** | Crítico (arquitectura, seguridad/RBAC, integridad de datos, migraciones destructivas). | **Sí** | Todo lo de C3 + ADR/ACR + evidencias reales obligatorias + autorización explícita. |

---

## Procedimiento obligatorio (6 pasos)

### Paso 1: Inicializar y auditar antes de cambiar (`CM-002` Audit before change)
1. Si el proyecto aún no tiene registro de cambios, inicializar sin sobrescribir nada existente:
   ```bash
   node .claude/skills/change-governance/scripts/change-registry.mjs init
   ```
2. Leer el registro previo (`.change-management/registry/changes.json`), `docs/CHANGELOG_INTERNO.md` y el estado real del código/documentación (`git status`, archivos afectados) antes de tocar nada.

### Paso 2: Crear el registro `CHG-XXXX` y análisis de impacto (`CM-001`, `CM-003`)
Registrar el cambio antes de implementar cambios C2–C4:
```bash
node .claude/skills/change-governance/scripts/change-registry.mjs add \
  --title "Título descriptivo del cambio" \
  --type FEATURE \
  --criticality C3 \
  --dimensions "funcional,ux-ui,frontend,backend,database" \
  --modules "modulo-a,modulo-b" \
  --refs "RF-08,SDD-004"
```
Completar en `.change-management/changes/CHG-XXXX.md`:
- **Motivación**, **Estado anterior (AS-IS)** y **Estado esperado (TO-BE)**.
- **Dimensiones afectadas** (de las 15 dimensiones) y dependencias cruzadas.
- Si es cambio de **UX/UI**: registrar componentes, tokens afectados, estados, responsive y accesibilidad (nunca solo una captura).
- Si es cambio **estructural/arquitectónico**: documentar árbol ANTES/DESPUÉS y crear/enlazar un ADR en `docs/adr/`.
- **Plan de reversión (Rollback)** obligatorio en C3 y C4.

### Paso 3: Puerta de autorización para C3 / C4 (`CM-012`, `CM-015`)
Para cambios `C3` o `C4` (o si durante la ejecución se amplía el alcance aprobado), presentar el resumen de impacto, riesgos y archivos afectados y **esperar autorización explícita** antes de aplicar cambios destructivos, migraciones o merges.

### Paso 4: Implementación con trazabilidad en GitHub
Vincular siempre rama y commits al ID generado:
- **Rama:** `feature/CHG-XXXX-descripcion`, `fix/CHG-XXXX-descripcion`, `refactor/CHG-XXXX-descripcion`, `architecture/CHG-XXXX-descripcion`.
- **Commits (Conventional Commits):**
  ```text
  feat(CHG-0042): agregar desglose de impuestos por ítem
  fix(CHG-0043): corregir validación de permisos en endpoint de exportación
  refactor(CHG-0044): reorganizar servicios en core/shared/features
  docs(CHG-0045): registrar ADR-0008 y actualizar CHANGELOG_INTERNO
  ```

### Paso 5: Evidencias, Pull Request y Documentación Sincronizada (`CM-009`–`CM-011`)
1. Registrar en la ficha `CHG-XXXX` los archivos creados/modificados/eliminados, las **pruebas realmente ejecutadas y sus resultados** (nunca declarar pruebas no corridas) y actualizar `docs/CHANGELOG_INTERNO.md`.
2. Si el cambio afectó arquitectura o pantallas, ejecutar también `/actualizar-contexto` (y `/mock-free-audit` si conecta nuevas pantallas al backend).
3. Generar la descripción del Pull Request usando `.github/pull_request_template.md` con ID `CHG-XXXX`, impacto, evidencias y rollback.
4. No confundir `RELEASED` (desplegado) con `VERIFIED` (verificado funcionando en el entorno objetivo).

### Paso 6: Validar gobierno y consultar métricas reales
```bash
node .claude/skills/change-governance/scripts/change-registry.mjs validate --strict
node .claude/skills/change-governance/scripts/change-registry.mjs metrics
```

---

## Reglas especiales para agentes de IA (inquebrantables)
- Consultar el registro de cambios y ADRs antes de iniciar cualquier cambio grande.
- Nunca inventar requisitos, endpoints ni aprobaciones.
- Nunca modificar módulos fuera del alcance del `CHG-XXXX` sin actualizar el registro y pedir confirmación.
- Nunca eliminar código existente sin investigar dependencias y justificarlo en la ficha.
- Nunca marcar `docSync: true` ni `status: VERIFIED` sin haber comprobado realmente el diff y las pruebas.
- Nunca hacer `git commit` ni `git push` sin autorización del usuario.
