# Blueprint de Optimización de Landing Page (`F5` — Requiere `GATE 1`)

## 1. Hallazgos Estructurados (`LP-XXX-001`)
```yaml
finding:
  id: LP-PERF-001
  category: performance
  severity: critical # critical | high | medium | low
  title: "<título concreto>"
  evidence:
    file: "<ruta real>"
    measured_value: "<tamaño/ms/resultado>"
    measured_impact: "<efecto en LCP/INP/CLS/SEO/CRO>"
  root_cause: "<causa raíz verificada>"
  recommendation:
    - "<acción concreta 1>"
  risk: low # low | medium | high
  estimated_effort: medium
  requires_approval: true
  verification_method: "<Lighthouse / Network / autopilot optimizar comparar>"
```

## 2. Plan de Tareas Priorizado (`P0`–`P3`)
| TASK_ID | Prioridad | FINDING_ID | Objetivo | Archivos afectados | Impacto esperado | Riesgo | Esfuerzo | Plan de pruebas (`TEST_PLAN`) | Plan de reversión (`ROLLBACK_PLAN`) |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `T-01` | P0 | `LP-PERF-001` | ... | ... | ... | Bajo | Medio | `autopilot optimizar comparar` + build | `git checkout -- <archivo>` |
