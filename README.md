# 🚀 Developer Autopilot Skills — Enterprise & Fullstack AI Toolkit

> **Kit integral de 29 skills de ingeniería de software, diseño visual, motion engineering, gobierno de cambios y DevOps para agentes de IA (Claude Code, Cursor, Antigravity, Gemini CLI, Windsurf).**  
> Diseñado para que cualquier desarrollador pueda llegar a cualquier proyecto, empresa o cliente y disponer de un copiloto con estándares de clase mundial sin fricción ni configuraciones manuales.

---

## 📚 Documentación Rápida
* 📖 **[Manual de Uso para el Desarrollador (Guía paso a paso y Cheat Sheet)](docs/MANUAL_DE_USO.md)**
* ⚙️ **[Guía de Configuración para Agentes (Claude, Cursor, Antigravity, Windsurf, Copilot)](docs/CONFIGURACION_AGENTES.md)**

---

## 🚀 ¿Por dónde empezar? (La Skill Iniciadora)

Al abrir cualquier proyecto o repositorio nuevo, ejecuta un solo comando:

```text
/iniciar-toolkit
```

Esta skill inspecciona el repositorio en 2 segundos:
* Detecta el stack de frontend (Angular, React, Vue, Next.js, PrimeNG, Tailwind).
* Detecta el stack de backend (Django, FastAPI, NestJS, Express).
* Configura la identidad del desarrollador desde Git y ramas activas.
* Genera el archivo de contexto `toolkit.config.json`.
* Prepara las carpetas de documentación viva y activa la convivencia armónica entre todas las skills.

---

## 📦 Cómo instalar este Toolkit (sin rutas anidadas)

> [!IMPORTANT]
> Este repositorio contiene internamente `.claude/skills/`. **Nunca** lo agregues como submódulo directamente en `.claude/skills` (produciría `.claude/skills/.claude/skills/`). Usa el instalador oficial [`scripts/install.mjs`](scripts/install.mjs) que copia cada skill directamente a la ruta que espera tu agente.

### Opción 1: CLI Global Contextual (`autopilot` / `das`) — ¡Sin rutas largas!
Clona este repositorio **una sola vez** y enlázalo con `npm link`. A partir de ahí, puedes ejecutar `autopilot` (o `das`) desde **cualquier carpeta o proyecto** de tu PC y detectará automáticamente tanto dónde vive el toolkit como en qué proyecto estás parado:

```bash
git clone --recurse-submodules https://github.com/Eduardo-Sebastian-Paipay-Vega/developer-autopilot-skills.git ~/tools/developer-autopilot-skills
cd ~/tools/developer-autopilot-skills
npm link

# Ya desde CUALQUIER proyecto en tu terminal:
autopilot where                 # Verifica rutas detectadas automáticamente
autopilot sync-global           # Actualiza Claude + Antigravity + Codex + Cloudflare
autopilot sync                  # Instala/actualiza el proyecto actual (Claude + Codex + Cursor)
autopilot init                  # Detecta stack/UI/BD y crea toolkit.config.json en el proyecto actual
autopilot scan --strict         # Escaneo anti-mock en el proyecto actual
autopilot chg metrics           # Métricas SIGCS del registro de cambios del proyecto actual
autopilot external --check      # Verifica si hay nueva versión de Cloudflare Skills
autopilot new-skill mi-skill "Descripción clara de qué resuelve."
```

### Opción 2: Submódulo aislado por Proyecto (Equipos)
Monta el repositorio en `.developer-autopilot/` y ejecuta el instalador hacia tu proyecto:

```bash
git submodule add https://github.com/Eduardo-Sebastian-Paipay-Vega/developer-autopilot-skills.git .developer-autopilot
node .developer-autopilot/scripts/install.mjs --target claude-project
# Otros targets: --target cursor | --target windsurf | --target cline
```

Para actualizar en cualquier momento:
```bash
git submodule update --remote --merge .developer-autopilot
node .developer-autopilot/scripts/install.mjs --target claude-project
```

### Opción 3: Verificación automatizada del repositorio
```bash
node tests/verify-toolkit.mjs
```
Valida frontmatter de las 26 skills, referencias internas, sintaxis JS/Python, archivos JSON, validadores MDES y `--dry-run` del instalador.

---

## 💬 Prompts Rápidos de Arranque (Copia y Pega)

Consulta el **[Manual de Uso Completo](docs/MANUAL_DE_USO.md#9-prompts-maestros-de-activación-y-actualización-universal-vs-equipo-cerrado)** para ver los 4 prompts detallados con sus instrucciones de actualización. Aquí tienes los dos de arranque rápido:

<details>
<summary><b>🔹 Caso 1: Modo Universal (Proyectos Propios / Freelance / Prototipos)</b></summary>

```text
Actúa como Senior Fullstack Architect. Vamos a trabajar en este proyecto utilizando el toolkit de automatización ubicado en .claude/skills/.
Por favor ejecuta /iniciar-toolkit para inspeccionar el repositorio, detectar el stack tecnológico (frontend, backend, base de datos y ramas de Git) y generar el archivo toolkit.config.json.
Una vez generado el contexto, muestra un resumen conciso del entorno detectado y las skills recomendadas para comenzar a construir funcionalidades con arquitectura limpia.
```
</details>

<details>
<summary><b>🔒 Caso 2: Modo Equipo Cerrado (Squads / Empresas / Sistemas Institucionales)</b></summary>

```text
Actúa como Tech Lead y Senior Software Engineer asignado a este proyecto de equipo. Tu objetivo es ejecutar tareas respetando estrictamente los contratos, roles y delimitaciones del proyecto:

1. PASO 1 (Contexto de Infraestructura): Ejecuta /iniciar-toolkit para asegurar que toolkit.config.json refleje las rutas exactas del frontend, backend y documentación del repositorio.
2. PASO 2 (Contrato Canónico e Información Primaria): Lee como FUENTE ÚNICA DE VERDAD el archivo maestro de planeación (docs/planeacion/plan-maestro.md o docs/planeacion/plan.md) y AGENTS.md. Si aún no existe el plan maestro, ejecútalo con /crear-plan-maestro.
3. PASO 3 (Límites Inquebrantables y Anti-Alucinación):
   - PROHIBIDO inventar roles o permisos fuera del catálogo oficial (rol_usuario_enum y permisos_core).
   - PROHIBIDO implementar funcionalidades marcadas como Out-of-Scope (ej. pasarelas de pago no aplicables, cobros comerciales o hardware propietario).
   - RESPETA el aislamiento multi-tenant obligatorio (withTenant), el sobre canónico HTTP (success, data, error) y el diseño protegido (landing-design-guardian).
   - Si falta información crítica de negocio, DETENTE y pregunta antes de asumir o programar.

Confirma que has asimilado estas reglas antes de comenzar a editar código.
```
</details>

---

## 🧭 Catálogo Maestro de Skills (29 Skills por Funcionalidad)

Despliega cada pestaña para ver los comandos, propósito y enlace directo a cada funcionalidad:

<details open>
<summary><b>1. 🚀 Orquestación y Setup (1 skill)</b></summary>

| Comando | Descripción |
| :--- | :--- |
| **`/iniciar-toolkit`** | Arrancador automático: detecta el stack técnico (framework + librería UI real sin asumir PrimeNG), genera `toolkit.config.json` y sincroniza las demás skills. |

</details>

<details>
<summary><b>2. 💻 Frontend y Experiencia de Usuario — UI/UX (7 skills)</b></summary>

| Comando | Descripción |
| :--- | :--- |
| **`/frontend-standards`** | Estándares de arquitectura frontend, componentes reactivos, validación y manejo de errores; se adapta al framework y librería UI real del proyecto. |
| **`/frontend-review`** | Auditoría y corrección de componentes: rendimiento, estado reactivo, A11y, formularios y desacoplamiento REST. |
| **`/enterprise-sidebar`** | Diseña, reorganiza e implementa sidebars empresariales (`260px`/`68px` con Flyout/Drawer móvil, máx. 2 niveles, RBAC recursivo, WCAG 2.2 AA y `Ctrl+B`) heredando el diseño y librería UI del proyecto. |
| **`/responsividad`** | Adaptación móvil (`<768px`) con preservación pixel-perfect de escritorio y prevención del bug `flex-wrap`. |
| **`/mejorar-vista-fija`** | Layout Flexbox para tablas con sticky header, filtros anclados y scroll vertical interno sin desbordar la página. |
| **`/tabla-orden-dinamico`** | Reordenamiento de columnas por usuario, anchos redimensionables y persistencia segura de preferencias. |
| **`/resaltar-fila-abierta`** | Feedback visual de fila activa al abrir/cerrar diálogos modales para mantener el contexto del usuario. |

</details>

<details>
<summary><b>3. 🎬 Motion Design Engineering & Pantallas del Sistema (2 skills interoperables)</b></summary>

| Comando | Descripción |
| :--- | :--- |
| **`/motion-design-engineer`** | **MDES:** Ingeniería de animaciones, ilustraciones vectoriales y escenas (`SVG + CSS + WAAPI`) sin GIF ni Lottie de pago, con niveles M1–M4, tokens `--motion-*`, validadores CLI y accesibilidad. |
| **`/system-state-screens`** | Genera y cablea las **15 pantallas de estado y error** (Full-page Loader, Skeleton, Empty States ×3, Success, 2.º plano, HTTP `400/401/403/404/429/500/502/503/504`, Offline y Force Update) con rutas, interceptores HTTP, Error Boundaries y puente opcional con MDES. |

</details>

<details>
<summary><b>4. 🎨 Landing Design Guardian — Diseño Visual y Sitios Públicos (7 skills)</b></summary>

| Comando | Descripción |
| :--- | :--- |
| **`/landing-uniformizar`** | Orquestador completo de diseño visual: recopila tokens, audita páginas públicas, aplica estilos y verifica. |
| **`/landing-recopilar`** | Inspección y captura de tokens de diseño computados (colores, tipografía, espaciado) con Playwright. |
| **`/landing-auditar`** | Clasifica rutas públicas y detecta discrepancias contra el diseño de referencia. |
| **`/landing-aplicar`** | Aplica la identidad visual exclusivamente a rutas autorizadas respetando la línea base. |
| **`/landing-verificar`** | Comprobación de regresiones visuales y estados interactivos con evidencias gráficas. |
| **`/landing-actualizar`** | Versiona y actualiza la fuente de verdad del diseño tras cambios aprobados. |
| **`/landing-design-guardian`** | Reglas maestras de contención para proteger el sistema privado contra cambios de estilo del landing. |

</details>

<details>
<summary><b>5. 🗄️ Backend, Bases de Datos e Integridad Anti-Mock (3 skills)</b></summary>

| Comando | Descripción |
| :--- | :--- |
| **`/mock-free-audit`** | Auditoría anti-mock e implementador/verificador de backend real (`MK-001`–`MK-015`, scanner CLI `scan-mocks.mjs --strict`, CRUD round-trip y Chaos Test con backend apagado). |
| **`/support-db`** | Inspección viva de modelos ORM (`models.py`, entidades), tipos de datos, relaciones FK/M2M y enums. |
| **`/diccionario-datos`** | Extrae y documenta tablas y campos directamente desde comentarios del ORM y PostgreSQL a Markdown y Word. |

</details>

<details>
<summary><b>6. 📝 Documentación Viva, Arquitectura y Gobierno de Cambios (5 skills)</b></summary>

| Comando | Descripción |
| :--- | :--- |
| **`/change-governance`** | **SIGCS (Regla obligatoria en cambios C2–C4):** registro trazable `CHG-XXXX` en 15 dimensiones, métricas reales (`change-registry.mjs`), `CHANGELOG_INTERNO.md`, ramas/commits `tipo(CHG-XXXX)` y plantilla de PR. |
| **`/crear-plan-maestro`** | Genera el Plan Maestro de Arquitectura y Dominio (Información Primaria): RFs, Casos de Uso, delimitaciones Out-of-Scope y auditoría E2E. |
| **`/actualizar-contexto`** | Analiza `git diff` al final de la sesión y actualiza la arquitectura viva (`docs/arquitectura`) sin perder historial. |
| **`/crear-guia-tecnica`** | Genera especificaciones técnicas de módulos para soporte y desarrollo con diagramas de flujo Mermaid. |
| **`/crear-manual-usuario`** | Redacta manuales en lenguaje de usuario final y los convierte a Word (`.docx`) mediante conversor integrado. |

</details>

<details>
<summary><b>7. ⚙️ Git, DevOps y Reportes de Avance (4 skills)</b></summary>

| Comando | Descripción |
| :--- | :--- |
| **`/resolver-conflicto-merge`** | Resolución determinista de conflictos Git en CLI con verificación de hunks, grep de imports y tests. |
| **`/reporte-semanal-resumen`** | Extrae tus commits de Git de la semana y redacta el informe de avance en lenguaje de gerencia. |
| **`/diagnostico-staging`** | Diagnóstico en Google Cloud Platform: Cloud Run, Cloud SQL, sincronización de Jobs de migración y logs. |
| **`/update-main-staging`** | Pipeline completo de despliegue: validación local, commits convencionales, Cloud Build, migraciones y smoke tests. |

</details>

<details>
<summary><b>8. ☁️ Skills Externas Oficiales — Read-Only (Cloudflare · 22 skills)</b></summary>

Integradas como **submódulo oficial inmutable** en `external/cloudflare-skills` (fuente: [`cloudflare/skills`](https://github.com/cloudflare/skills), solo lectura — nadie las modifica manualmente).

* **Comprobar si hay nueva versión oficial (sin modificar nada):**
  ```bash
  node scripts/sync-external.mjs --check
  ```
* **Actualizar a la última versión oficial (informa commit SHA y fecha):**
  ```bash
  node scripts/sync-external.mjs
  ```
* **Instalar junto con el toolkit principal:**
  ```bash
  node scripts/install.mjs --target claude-project --include-external
  ```

Incluye las 22 skills oficiales de Cloudflare: `cloudflare`, `workers-best-practices`, `workers-development`, `workers-profiling`, `agents-sdk`, `durable-objects`, `wrangler`, `web-perf`, `cloudflare-one`, `cloudflare-one-migrations`, `turnstile-spin`, `nextjs-on-cloudflare`, `frameworks-on-cloudflare`, `cloudflare-app-bootstrap`, `cloudflare-email-service`, `gateway-workers`, `cf-cli`, `basin`, `k2`, `sandbox-stable`, `sandbox-next` y `sandbox-migrate-to-next`.

</details>

---

## 🛠️ Estructura del Repositorio

```text
developer-autopilot-skills/
├── .claude/
│   ├── landing-design/            # Configuración de scope y evidencias visuales
│   └── skills/                    # Directorio unificado de las 29 skills
│       ├── iniciar-toolkit/
│       ├── motion-design-engineer/
│       ├── system-state-screens/
│       ├── crear-plan-maestro/
│       ├── frontend-standards/
│       ├── resolver-conflicto-merge/
│       ├── landing-design-guardian/
│       └── ...
├── docs/
│   ├── MANUAL_DE_USO.md           # Manual por pestañas de funcionalidad y prompts maestros
│   └── CONFIGURACION_AGENTES.md   # Setup para Claude, Cursor, Antigravity, Windsurf, Copilot
├── toolkit.config.template.json   # Plantilla de configuración agnóstica
└── README.md                      # Este documento
```

---

## 📄 Licencia

MIT License — Creado y mantenido por **Eduardo Sebastián Paipay Vega**.  
Úsalo libremente en tus proyectos personales, profesionales y empresariales.
