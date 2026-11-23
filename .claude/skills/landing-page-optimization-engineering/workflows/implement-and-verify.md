# Workflow: Implementación Controlada y Verificación (`F6–F10`, Con Autorización)

> **Prerrequisito:** `GATE 1` aprobado explícitamente por el usuario y `docs/optimizacion/baseline.json` guardado.

1. **F6. Controlled Implementation:**
   - Verificar `git status` limpio o crear punto seguro antes de editar.
   - Aplicar cambios pequeños, incrementales y strictly scoped a las tareas aprobadas (`TASK_ID`), preservando identidad visual (`/landing-design-guardian`) y lógica de negocio.
   - Si una tarea involucra SEO técnico (`LP-05`), seguir `workflows/implement-seo.md` de `/busqueda`.
2. **F7. Quality Assurance:**
   - Comprobar botones, formularios, validaciones, navegación, enlaces, responsive (`390x844` / `768x1024` / `1440x900`), accesibilidad teclado/contraste, cero errores de consola/HTTP y eventos de analítica intactos.
   - Si existe `landing-design-guardian`, ejecutar `guard-changes.mjs verify` para asegurar que no se tocó nada fuera de `allowedSourcePaths`.
3. **F8. Performance Re-measurement:**
   - Ejecutar `autopilot optimizar comparar` contra `docs/optimizacion/baseline.json` para medir deltas reales (KB transferidos, activos sobredimensionados resueltos, hallazgos eliminados).
   - Repetir Lighthouse/mediciones bajo las mismas condiciones de la línea base cuando el servidor local esté disponible.
4. **F9. Final Validation:**
   - Confirmar cumplimiento de criterios de aceptación de cada `TASK_ID`, cero regresiones funcionales/visuales y `autopilot busqueda auditar --strict` en verde.
5. **F10. Documentation & Handover:**
   - Generar `templates/final-handover-report.md` (antes/después, archivos modificados, pruebas, riesgos residuales y `lighthouserc.generated.json` si se solicita candado CI/CD).
   - Si el cambio es estructural (`C2–C4`), registrar ficha con `/change-governance` (`CHG-XXXX`).
