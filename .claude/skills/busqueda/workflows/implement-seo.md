# Workflow: Implementación Controlada por Fases (Con Autorización)

> **Prerrequisito:** auditoría completada y autorización explícita del usuario para la fase a ejecutar.

1. **Verificación previa a editar:**
   - Confirmar estado de Git (`git status`) y alcance exacto de la fase autorizada.
   - Mapear dependencias afectadas (autenticación, RBAC, rutas públicas/privadas, APIs existentes).
2. **Implementación incremental (cambio mínimo seguro):**
   - Aplicar únicamente los cambios aprobados respetando el adaptador del framework real (`references/04-qa-monitoring-adapters-antipatterns.md`).
   - Mantener una sola fuente de metadatos sin contradicciones entre frontend y backend.
3. **Pruebas técnicas, funcionales y de regresión:**
   - Ejecutar `autopilot busqueda generar` y `autopilot busqueda auditar --strict`.
   - Correr tests unitarios/build/E2E reales del proyecto (incluyendo `tests/seo/` si existen).
   - Comprobar que login, RBAC, APIs privadas y navegación principal siguen intactos.
4. **¿Todas las pruebas pasan?**
   - **No:** corregir o documentar el bloqueo con evidencia exacta antes de continuar.
   - **Sí:** emitir informe de evidencias y cierre; si el cambio altera rutas públicas/301/contratos (`C2–C4`), registrar ficha con `/change-governance` (`CHG-XXXX`) y sincronizar `/routes-architect`.
