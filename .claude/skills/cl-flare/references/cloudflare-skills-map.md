# Mapa de Skills Oficiales de Cloudflare y Plantilla de Justificación

`/cl-flare` orquesta directamente las **22 skills oficiales de Cloudflare** incluidas en el repositorio (`external/cloudflare-skills/skills/`, instaladas automáticamente en `.claude/skills/` y agentes globales). Cada subagente debe leer la skill oficial correspondiente antes de decidir o escribir código.

---

## 1. Asignación de Skills Oficiales por Subagente

| Subagente / Fase | Skills Oficiales de Cloudflare a Consultar |
| :--- | :--- |
| **Coordinador / Fase 1 (Selección)** | `/cloudflare` (descubrimiento y elección de productos, errores 52x/1xxx/403) |
| **Subagente Frontend (`01_evaluacion_frontend.md`)** | `/frameworks-on-cloudflare` · `/nextjs-on-cloudflare` · `/web-perf` |
| **Subagente Backend (`02_evaluacion_backend.md`)** | `/workers-best-practices` · `/workers-development` · `/workers-profiling` · `/durable-objects` · `/gateway-workers` · `/agents-sdk` · `/sandbox-stable` · `/sandbox-next` · `/sandbox-migrate-to-next` |
| **Subagente Base de Datos (`03_evaluacion_base_datos.md`)** | `/wrangler` · `/cf-cli` · `/cloudflare-app-bootstrap` · `/workers-best-practices` |
| **Subagente Storage y Caché (`04_evaluacion_storage.md`)** | `/wrangler` · `/cf-cli` · `/durable-objects` · `/basin` · `/k2` |
| **Subagente Integraciones (`05_evaluacion_integraciones.md`)** | `/turnstile-spin` · `/cloudflare-email-service` · `/cloudflare-one` · `/cloudflare-one-migrations` |
| **Subagentes Ejecutores y Verificador (Fases 5–6)** | `/wrangler` · `/cf-cli` · `/cloudflare-app-bootstrap` · `/workers-development` · `/workers-profiling` · `/web-perf` |

---

## 2. Plantilla Obligatoria de Justificación por Tecnología (Fase 2)

Cada subagente debe evaluar **todas las tecnologías obligatorias de su área** con este formato exacto:

```markdown
### [Nombre de la Tecnología de Cloudflare]

* **Estado de Decisión:** [SELECCIONADA / DESCARTADA]
* **Skill Oficial Consultada:** [ej. /workers-best-practices, /turnstile-spin, /cf-cli]
* **Descripción Técnica:** [Qué es y cómo opera en Cloudflare]
* **Caso de Uso en el Sistema:**
  - Si es SELECCIONADA: [Componente o funcionalidad exacta que resolverá en este proyecto]
  - Si es DESCARTADA: [Por qué este proyecto no la necesita o qué alternativa se prefiere]
* **Justificación de Ingeniería:** [Latencia, costo, simplicidad arquitectónica, seguridad o límites]
* **Parámetros y Límites:** [Cuotas del plan, CPU time, tamaño máximo, consistencia]
* **Cómo se Implementaría:** [Rutas, bindings en `wrangler.jsonc` o comandos `wrangler`/`cf`]
```

---

## 3. Checklist del Agente Verificador (Fase 6)

- [ ] Rama activa es `cloudflare` (no se tocó `main`/`dev` sin validación).
- [ ] Existen los 7 documentos en `docs/cloudflare/` (`01..05`, `00_arquitectura_integrada.md`, `PLAN_MAESTRO_IMPLEMENTACION.md`).
- [ ] `autopilot cf verificar --strict` en verde (cero secretos en `vars`, sin SSL `Flexible`/`Off`).
- [ ] Build y typecheck del proyecto en verde.
- [ ] Smoke tests ejecutados sobre `/health` y endpoints críticos tras desplegar.
- [ ] Turnstile validado en servidor (`siteverify`) si aplica.
- [ ] SSL/TLS confirmado en modo `Full (strict)`.
