# 📖 Manual de Uso del Usuario — Developer Autopilot Skills

Este manual está diseñado para que cualquier desarrollador aproveche al máximo las **33 skills** del kit en su día a día, organizado por **pestañas desplegables por funcionalidad**.

---

## 📑 Índice de Contenidos

1. [El Ciclo de Vida de un Proyecto](#1-el-ciclo-de-vida-de-un-proyecto)
2. [Paso 0: Inicialización con `/iniciar-toolkit`](#2-paso-0-inicialización-con-iniciar-toolkit)
3. [Funcionalidades por Pestaña (Módulos 1 al 6)](#3-funcionalidades-por-pestaña-módulos-1-al-6)
4. [Matriz de Consulta Rápida (Cheat Sheet)](#8-matriz-de-consulta-rápida-cheat-sheet)
5. [Prompts Maestros de Activación y Actualización (Universal vs. Equipo Cerrado)](#9-prompts-maestros-de-activación-y-actualización-universal-vs-equipo-cerrado)

---

## 1. El Ciclo de Vida de un Proyecto

El toolkit acompaña el flujo natural de cualquier desarrollo de software:

```
[1. SETUP]              [2. DESARROLLO]                  [3. REVISIÓN & DOCS]          [4. CI/CD & ENTREGA]
/iniciar-toolkit  ───>  /frontend-standards        ───>  /frontend-review        ───>  /resolver-conflicto-merge
                        /support-db                      /actualizar-contexto          /update-main-staging
                        /responsividad                   /crear-guia-tecnica           /reporte-semanal-resumen
                        /mejorar-vista-fija              /crear-manual-usuario         /diagnostico-staging
                        /landing-uniformizar
```

---

## 2. Paso 0: Inicialización con `/iniciar-toolkit`

### ¿Cuándo usarlo?
* El primer día que descargas un repositorio nuevo.
* Cuando cambias de rama o se incorpora un nuevo framework al proyecto.

### ¿Cómo invocarlo?
En el chat de tu agente de IA, escribe:
```text
/iniciar-toolkit
```

### ¿Qué hace por ti?
1. Inspecciona en 2 segundos el stack (Angular, React, Vue, Next.js, Django, FastAPI, etc.).
2. Genera el archivo `toolkit.config.json` con los datos del proyecto y usuario de Git.
3. Asegura la creación de las carpetas `docs/arquitectura/` y `docs/manuales/`.
4. Te muestra una lista personalizada de las skills activas para ese proyecto específico.

---

## 3. Funcionalidades por Pestaña (Módulos 1 al 6)

<details open>
<summary><b>💻 Módulo 1: Frontend & Experiencia de Usuario — UI/UX (7 skills)</b></summary>

### `/enterprise-sidebar`
* **Para qué sirve:** Diseña, reorganiza e implementa sidebars empresariales completos (`260px` expandido / `68px` colapsado con Popover/Flyout / Drawer móvil `<768px`), aplicando profundidad máx. 2 niveles, Regla de Miller (3–7 ítems), filtrado recursivo RBAC (oculta padres y secciones vacías), WCAG 2.2 AA, persistencia sin *layout shift* y atajo `Ctrl+B`, heredando los tokens de diseño y librería UI del proyecto.
* **Ejemplo de prompt:**
  > *"/enterprise-sidebar reorganiza nuestras rutas en máximo 2 niveles e implementa el sidebar colapsable con Flyout y filtrado RBAC respetando nuestra librería UI y paleta."*

### `/frontend-standards`
* **Para qué sirve:** Define estándares de arquitectura frontend, componentes reactivos y estilos limpios. Detecta el framework y librería UI real del proyecto (`toolkit.config.json` / `package.json`: PrimeNG, shadcn/ui, PrimeReact, MUI, Vuetify, etc.) sin asumir PrimeNG.
* **Ejemplo de prompt:**
  > *"Voy a crear la pantalla de gestión de usuarios. Aplica /frontend-standards adaptándolo a la librería UI instalada en este proyecto."*

### `/frontend-review`
* **Para qué sirve:** Audita un componente existente contra buenas prácticas del stack real del proyecto (rendimiento, estado reactivo, validación de formularios, accesibilidad A11y y tipado TypeScript estricto).
* **Ejemplo de prompt:**
  > *"/frontend-review src/app/features/usuarios/usuarios.component.ts"*

### `/responsividad`
* **Para qué sirve:** Adapta cualquier pantalla a celulares (`<768px`) sin mover ni un solo píxel de la vista de escritorio (`≥768px`). Resuelve el bug de `flex-wrap` y colapsa grillas a una columna.
* **Ejemplo de prompt:**
  > *"Esta pantalla se desborda en móvil. Aplica /responsividad sobre el componente abierto en el editor."*

### `/mejorar-vista-fija`
* **Para qué sirve:** Convierte tablas extensas en tablas de **vista fija**: filtros, cabecera y paginador quedan anclados; solo las filas hacen scroll vertical.
* **Ejemplo de prompt:**
  > *"/mejorar-vista-fija en la tabla de pedidos. Necesito que no scrollee toda la página."*

### `/tabla-orden-dinamico`
* **Para qué sirve:** Permite arrastrar columnas para ordenarlas y ajustar anchos persistiendo preferencias por usuario, manteniendo la columna "Acciones" siempre fija.
* **Ejemplo de prompt:**
  > *"/tabla-orden-dinamico en la tabla de facturación para que recuerde las columnas por usuario."*

### `/resaltar-fila-abierta`
* **Para qué sirve:** Mantiene resaltada visualmente la fila desde la que se abrió un modal para no perder contexto en listados largos.
* **Ejemplo de prompt:**
  > *"/resaltar-fila-abierta para marcar qué fila abrió el modal de edición."*

</details>

<details>
<summary><b>🎬 Módulo 2: Identidad Visual, Motion Design (MDES) & Pantallas del Sistema (3 skills interoperables)</b></summary>

### `/design-tokens-source`
* **Para qué sirve:** Fuente única de verdad de todos los tokens visuales (identidad de marca, neutros, estados, conversión automática Hex→HSL para `shadcn/ui`, overrides aislados de landing, tipografía, sidebar y puente `[data-motion-theme="brand"]` para MDES). Su CLI (`autopilot tokens iniciar|extraer|sincronizar-landing|generar|auditar`) verifica contraste **WCAG 2.2 AA** real y detecta tokens duplicados y hex sueltos en componentes.
* **Ejemplo de prompt:**
  > *"/design-tokens-source extrae todos los tokens actuales de este frontend, genera design-tokens.json + docs/diseno/DESIGN_TOKENS.md y audita contraste WCAG y hex sueltos."*

### `/routes-architect`
* **Para qué sirve:** Fuente única de verdad de **todas las rutas del sistema** (Frontend por grupos/módulos/RF/RBAC, Backend REST, Microservicios, WebSockets, pantallas de error/estado, interceptores HTTP, logs y discrepancias OpenAPI). Funciona tanto **planeado desde documentación** (`plan-maestro.md` / RFs / SDDs) como **extrayendo del código real** (`autopilot rutas iniciar|extraer|generar|auditar`).
* **Ejemplo de prompt:**
  > *"/routes-architect toma todos los RF de docs/planeacion/plan-maestro.md y el código actual, establece docs/arquitectura/routes-map.json, genera CATALOGO_RUTAS.md con Mermaid y audita ambigüedades OpenAPI y rutas sin RBAC."*

### `/busqueda`
* **Para qué sirve:** Estándar técnico integral de **SEO y visibilidad en buscadores con IA (GEO/AEO)** de punta a punta (infraestructura, backend, frontend SSR/SSG, `robots.txt`, `sitemap.xml`, `canonical`, `JSON-LD`, `manifest.webmanifest`, aislamiento público/privado, Core Web Vitals y matriz de auditoría 0–100). Conecta automáticamente con `routes-map.json`, `design-tokens.json` y `scope.json` vía `autopilot busqueda iniciar|extraer|generar|auditar`.
* **Ejemplo de prompt:**
  > *"/busqueda audita e implementa el estándar técnico SEO y GEO de este proyecto usando nuestras rutas públicas y tokens de marca, genera sitemap/robots/JSON-LD y corre la auditoría 0-100 en modo estricto."*

### `/landing-page-optimization-engineering`
* **Para qué sirve:** Ingeniería integral de optimización y verificación de landing pages (`F0–F10` con `GATE 1` de autorización). Combina presupuestos (`strict`/`balanced`/`flexible`), auditoría real de activos/imágenes/fuentes/scripts, Árbol KPI, CRO, accesibilidad WCAG 2.2 AA, SEO técnico (delegado a `/busqueda`), comparativa antes/después y generador de `lighthouserc.json` vía `autopilot optimizar`.
* **Ejemplo de prompt:**
  > *"/landing-page-optimization-engineering realiza FULL AUDIT + OPTIMIZATION BLUEPRINT de nuestra landing sin alterar la identidad visual ni modificar código hasta mi aprobación en GATE 1."*

### `/motion-design-engineer`
* **Para qué sirve:** Sistema de ingeniería de animaciones e ilustraciones visuales **originales mediante código** (`SVG + CSS + JavaScript / WAAPI`, sin GIF ni Lottie de pago). Maneja niveles **M1–M4**, contrato JSON validable, tokens `--motion-*` (recoloreables en vivo), `prefers-reduced-motion` y scripts de auditoría (`validate-config.mjs`, `audit-motion.mjs`).
* **Ejemplo de prompt:**
  > *"/motion-design-engineer crea una animación M2 de un libro pasando páginas mientras se procesa un documento, usando los colores del tema de mi proyecto y adaptador para Angular/React."*

### `/system-state-screens`
* **Para qué sirve:** Diseña, genera y **cablea de punta a punta** las **15 pantallas de estado del sistema, transición y error**:
  * **Estados:** Carga Global (`Full-page Loader`), `Skeleton Screen`, `Empty State` (`first-use`, `no-results`, `zero-inbox`), `Success State` y `Procesamiento en 2.º plano`.
  * **Errores y bloqueos:** HTTP `400`, `401`, `403`, `404`, `429` (`Retry-After`), `500`, `502/504`, `503 Mantenimiento`, `Offline State` y `Force Update`.
  * **Cableado real:** crea rutas físicas, Error Boundaries, interceptores HTTP y condicionales según el framework (Next.js, Angular, React, Vue/Nuxt). Se coordina con `/motion-design-engineer` si está instalada, o funciona de forma 100 % independiente con SVG/CSS limpios.
* **Ejemplo de prompt:**
  > *"/system-state-screens genera y cablea todas las pantallas de error (4xx/5xx), empty states, skeletons, mantenimiento y modo offline para este proyecto enlazando animaciones con motion-design-engineer."*

</details>

<details>
<summary><b>🎨 Módulo 3: Landing Pages y Diseño Visual Guardian (7 skills)</b></summary>

Este kit garantiza que nadie degrade el diseño de tus páginas públicas y que los estilos del landing se apliquen de forma consistente sin tocar el sistema privado.

1. **`/landing-recopilar`:** Abre la landing con Playwright y extrae colores computados, tipografías y espaciados reales.
2. **`/landing-auditar`:** Compara las pantallas públicas secundarias contra la landing de referencia y lista discrepancias.
3. **`/landing-aplicar`:** Aplica los estilos solo a rutas públicas autorizadas en `scope.json`.
4. **`/landing-verificar`:** Comprueba regresiones visuales en Desktop, Tablet y Mobile con capturas PNG.
5. **`/landing-uniformizar`:** Orquesta los 4 pasos anteriores en una sola ejecución.
6. **`/landing-actualizar`:** Versiona cambios aprobados en el diseño de referencia.
7. **`/landing-design-guardian`:** Reglas maestras de contención visual.

</details>

<details>
<summary><b>🗄️ Módulo 4: Backend, Bases de Datos e Integridad Anti-Mock (3 skills)</b></summary>

### `/mock-free-audit`
* **Para qué sirve:** Ejecuta una auditoría estática, dinámica y de contrato (`MK-001` a `MK-015` + scanner CLI `scripts/scan-mocks.mjs`) para detectar y eliminar datos simulados, fallbacks silenciosos en `catch`, catálogos estáticos, auth bypass y CRUDs falsos, reemplazándolos por integración real contra backend y BD (verificada con CRUD round-trip y Chaos Test).
* **Ejemplo de prompt:**
  > *"/mock-free-audit audita este proyecto, lista todos los mocks o fallbacks ocultos y dame el plan antes de reemplazarlos."*

### `/support-db`
* **Para qué sirve:** Inspecciona en tiempo real los modelos ORM (`models.py`, entidades) y migraciones activas. Nunca responde de memoria.
* **Ejemplo de prompt:**
  > *"/support-db ¿Qué campos tiene el modelo de Factura y cómo se relaciona con Cliente?"*

### `/diccionario-datos`
* **Para qué sirve:** Escribe comentarios de negocio directamente en el ORM y PostgreSQL (`db_table_comment` y `db_comment`) y genera `docs/arquitectura/diccionario-datos.md`.
* **Ejemplo de prompt:**
  > *"Acabo de agregar la tabla de suscripciones. Ejecuta /diccionario-datos para documentar los campos y actualizar el markdown."*

</details>

<details>
<summary><b>📝 Módulo 5: Documentación Viva, Arquitectura y Gobierno de Cambios (5 skills)</b></summary>

### `/change-governance` *(Regla obligatoria en cambios grandes C2–C4)*
* **Para qué sirve:** Gestiona la trazabilidad completa de cada cambio importante (`CHG-XXXX`) en 15 dimensiones (funcional, UX/UI, arquitectura, BD, API, seguridad), genera el prefijo exacto de rama y commit (`feat(CHG-XXXX): ...`), sincroniza `docs/CHANGELOG_INTERNO.md` y calcula métricas reales con `scripts/change-registry.mjs`.
* **Ejemplo de prompt:**
  > *"/change-governance registra este cambio C3 antes de implementar, dame el CHG-ID, la rama y el prefijo de commit, y al cerrar actualiza CHANGELOG_INTERNO.md y las métricas."*

### `/crear-plan-maestro`
* **Para qué sirve:** Genera la **información primaria** del proyecto (`docs/planeacion/plan-maestro.md`): RFs, Casos de Uso, jerarquía modular, rutas objetivo y límites Out-of-Scope. Si aún no hay código, reporta qué información falta; si ya hay código, audita la integración E2E (BD – Backend – Frontend) y residuos.
* **Ejemplo de prompt:**
  > *"/crear-plan-maestro a partir de la visión del sistema y requerimientos del cliente."*

### `/actualizar-contexto`
* **Para qué sirve:** Al cerrar una sesión de desarrollo, analiza `git diff` y propone actualizaciones a la documentación viva (`docs/arquitectura/`) sin borrar historial.
* **Ejemplo de prompt:**
  > *"Terminamos por hoy. Ejecuta /actualizar-contexto para registrar lo implementado."*

### `/crear-guia-tecnica <módulo>`
* **Para qué sirve:** Redacta una especificación técnica para desarrollo y soporte (roles, Mermaid, endpoints, estados y checklist pre-producción).
* **Ejemplo de prompt:**
  > *"/crear-guia-tecnica pagos-stripe"*

### `/crear-manual-usuario <módulo>`
* **Para qué sirve:** Redacta un manual en lenguaje no técnico para el usuario final y lo convierte a Microsoft Word (`.docx`) con el conversor integrado.
* **Ejemplo de prompt:**
  > *"/crear-manual-usuario facturacion"*

</details>

<details>
<summary><b>⚙️ Módulo 6: Git, DevOps y Reportes Gerenciales (4 skills)</b></summary>

### `/resolver-conflicto-merge`
* **Para qué sirve:** Resuelve conflictos de merge/rebase directamente desde CLI: materializa marcadores, integra ambos lados con criterio, limpia imports huérfanos con `grep` y corre los tests del proyecto.
* **Ejemplo de prompt:**
  > *"/resolver-conflicto-merge"*

### `/reporte-semanal-resumen`
* **Para qué sirve:** Lee tus commits de Git de la semana (domingo a sábado) y redacta el informe de avance en lenguaje de gerencia listo para copiar y pegar.
* **Ejemplo de prompt:**
  > *"/reporte-semanal-resumen"*

### `/diagnostico-staging`
* **Para qué sirve:** Diagnostica Google Cloud Run + Cloud SQL: revisa sincronización de imágenes de Jobs de migración, logs recientes y previene errores con `--update-secrets`.
* **Ejemplo de prompt:**
  > *"/diagnostico-staging. El backend en Cloud Run devuelve error 500 tras el despliegue."*

### `/update-main-staging`
* **Para qué sirve:** Orquesta el flujo CI/CD: validaciones locales, Conventional Commits, promoción de ramas, seguimiento de Cloud Build, migraciones y smoke tests HTTP 200.
* **Ejemplo de prompt:**
  > *"/update-main-staging para publicar los cambios validados a staging."*

</details>

<details>
<summary><b>☁️ Módulo 7: Skills Externas Oficiales — Read-Only (Cloudflare · 22 skills)</b></summary>

Este repositorio integra [`cloudflare/skills`](https://github.com/cloudflare/skills) en `external/cloudflare-skills` como **submódulo read-only**: nadie debe editar sus archivos manualmente; siempre se actualizan desde el repositorio oficial de Cloudflare.

* **Consultar si hay actualización oficial:**
  ```bash
  node scripts/sync-external.mjs --check
  ```
* **Sincronizar la última versión oficial e imprimir SHA/fecha:**
  ```bash
  node scripts/sync-external.mjs
  ```
* **Instalarlas en tu agente junto con tus 26 skills:**
  ```bash
  node scripts/install.mjs --target claude-project --include-external
  # Otros targets: antigravity | claude-global | cursor | windsurf | cline
  ```

</details>

---

## 8. Matriz de Consulta Rápida (Cheat Sheet)

| Si necesitas... | Invoca esta skill |
| :--- | :--- |
| Configurar un proyecto nuevo | `/iniciar-toolkit` |
| Elaborar el Plan Maestro de Dominio (Info Primaria) | `/crear-plan-maestro` |
| Registrar cambio grande (`CHG-XXXX`), métricas y commit/PR | `/change-governance` |
| Arreglar desbordamiento en celular | `/responsividad` |
| Arreglar una tabla que scrollea toda la pantalla | `/mejorar-vista-fija` |
| Destacar la fila que abrió un modal | `/resaltar-fila-abierta` |
| Crear animaciones, ilustraciones o escenas en código (MDES) | `/motion-design-engineer` |
| Centralizar, extraer, editar o auditar tokens de identidad/colores | `/design-tokens-source` |
| Planear, extraer o auditar todas las rutas FE/API/WS y errores | `/routes-architect` |
| Implementar o auditar SEO técnico integral y GEO (AI Search) | `/busqueda` |
| Optimizar y verificar rendimiento, activos, CRO y CWV de una landing | `/landing-page-optimization-engineering` |
| Generar y cablear pantallas de estado, errores 4xx/5xx, offline y rutas | `/system-state-screens` |
| Dejar columnas reordenables por el usuario | `/tabla-orden-dinamico` |
| Auditar código de un componente frontend | `/frontend-review` |
| Diseñar o reorganizar el sidebar empresarial con RBAC | `/enterprise-sidebar` |
| Capturar tokens de diseño de una landing | `/landing-recopilar` |
| Uniformizar diseño en páginas públicas | `/landing-uniformizar` |
| Consultar tipos y relaciones de base de datos | `/support-db` |
| Auditar y eliminar mocks / verificar integración real con backend | `/mock-free-audit` |
| Documentar tablas en PostgreSQL | `/diccionario-datos` |
| Resolver un merge roto en Git | `/resolver-conflicto-merge` |
| Actualizar docs al cerrar el día | `/actualizar-contexto` |
| Generar especificación técnica de arquitectura | `/crear-guia-tecnica <módulo>` |
| Crear manual para el cliente en `.docx` | `/crear-manual-usuario <módulo>` |
| Generar informe semanal para tu jefe/gerencia | `/reporte-semanal-resumen` |
| Revisar servicios caídos en Cloud Run | `/diagnostico-staging` |
| Desplegar a staging con validaciones | `/update-main-staging` |

---

## 9. Prompts Maestros de Activación y Actualización (Universal vs. Equipo Cerrado)

Para no tener que explicarle al agente el contexto desde cero cada vez, copia y pega el prompt que corresponda a tu escenario de trabajo:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ELIGE TU ESCENARIO                              │
│                                                                        │
│  [CASO 1: MODO UNIVERSAL]             [CASO 2: EQUIPO CERRADO / SQUAD] │
│  • Freelance, pet projects o clientes • Empresas, squads, colegios     │
│  • Libertad ágil de arquitectura      • Contratos estrictos y blindaje │
│  • Sin burocracia de reglas fijas     • Aislamiento y cero alucinación │
└────────────────────────────────────────────────────────────────────────┘
```

---

### CASO 1: Modo Universal (Proyectos Propios, Freelance y Prototipos)

#### A. Prompt de Arranque / Activación Inicial
> *"Actúa como Senior Fullstack Architect. Vamos a trabajar en este proyecto utilizando el toolkit de automatización ubicado en `.claude/skills/`.*
> 
> *Por favor ejecuta `/iniciar-toolkit` para inspeccionar el repositorio, detectar el stack tecnológico (frontend, backend, base de datos y ramas de Git) y generar el archivo `toolkit.config.json`.*
> 
> *Una vez generado el contexto, muestra un resumen conciso del entorno detectado y las skills recomendadas para comenzar a construir funcionalidades con arquitectura limpia."*

#### B. Prompt de Actualización (Nuevas Skills / Nuevas Herramientas)
> *"Se han incorporado nuevas skills o mejoras al toolkit en GitHub. Por favor actualiza el submódulo ejecutando `git submodule update --remote --merge .developer-autopilot` y vuelve a ejecutar `node .developer-autopilot/scripts/install.mjs --target claude-project` (o el target de mi agente).*
> 
> *Luego ejecuta `/iniciar-toolkit` para refrescar `toolkit.config.json` con cualquier cambio reciente en dependencias o carpetas del proyecto, y confirma que todas las herramientas están sincronizadas y listas."*

---

### CASO 2: Modo Equipo Cerrado / Blindado (Squads, Empresas y Sistemas Institucionales)

#### A. Prompt de Arranque / Activación con Blindaje Anti-Alucinación
> *"Actúa como Tech Lead y Senior Software Engineer asignado a este proyecto de equipo. Tu objetivo es ejecutar tareas respetando estrictamente los contratos, roles y delimitaciones del proyecto:*
> 
> *1. **PASO 1 (Contexto de Infraestructura):** Ejecuta `/iniciar-toolkit` para asegurar que `toolkit.config.json` refleje las rutas exactas del frontend, backend y documentación del repositorio.*
> *2. **PASO 2 (Contrato Canónico e Información Primaria):** Lee como FUENTE ÚNICA DE VERDAD el archivo maestro de planeación (`docs/planeacion/plan-maestro.md` o `docs/planeacion/plan.md`) y `AGENTS.md`. Si aún no existe el plan maestro, ejecútalo con `/crear-plan-maestro`.*
> *3. **PASO 3 (Límites Inquebrantables y Anti-Alucinación):***
>    - *PROHIBIDO inventar roles o permisos fuera del catálogo oficial (`rol_usuario_enum` y `permisos_core`).*
>    - *PROHIBIDO implementar funcionalidades marcadas como Out-of-Scope (ej. pasarelas de pago no aplicables, cobros comerciales o hardware propietario).*
>    - *RESPETA el aislamiento multi-tenant obligatorio (`withTenant`), el sobre canónico HTTP (`success`, `data`, `error`) y el diseño protegido (`landing-design-guardian`).*
>    - *Si falta información crítica de negocio, DETENTE y pregunta antes de asumir o programar.*
> 
> *Confirma que has asimilado estas reglas antes de comenzar a editar código."*

#### B. Prompt de Actualización (Evolución de Sprint / Nuevas Migraciones o Requisitos)
> *"Actúa como Tech Lead del equipo. Ha ocurrido una evolución en el proyecto (nuevos Requisitos Funcionales, migraciones de base de datos o cambios en el alcance del sprint). Por favor ejecuta el siguiente protocolo de re-sincronización cerrada:*
> 
> *1. **AUDITORÍA DE INTEGRACIÓN:** Ejecuta `/crear-plan-maestro` (o actualiza el `plan.md`) para auditar la base de datos física (`database/migrations/`), las rutas del backend (`backend/src/routes/`) y las pantallas del frontend, actualizando la matriz de integración E2E ([OK], [PARCIAL], [PENDIENTE]).*
> *2. **DETECCIÓN DE RESIDUOS:** Identifica rutas huérfanas, proyectos fantasma o tablas sin endpoint asociado que deban limpiarse.*
> *3. **DOCUMENTACIÓN VIVA:** Ejecuta `/actualizar-contexto` para registrar en `docs/arquitectura/` qué cambió en la sesión respecto a los contratos arquitectónicos.*
> *4. **VERIFICACIÓN DE LÍMITES:** Confirma que ningún cambio haya roto las reglas Out-of-Scope ni los contratos de aislamiento multi-tenant.*
> 
> *Muestra el reporte comparativo de lo actualizado antes de continuar con la siguiente tarea."*

