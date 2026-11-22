# 📖 Manual de Uso del Usuario — Developer Autopilot Skills

Este manual está diseñado para que cualquier desarrollador aproveche al máximo las **26 skills** del kit en su día a día, organizado por **pestañas desplegables por funcionalidad**.

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
<summary><b>💻 Módulo 1: Frontend & Experiencia de Usuario — UI/UX (6 skills)</b></summary>

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
<summary><b>🎬 Módulo 2: Motion Design Engineering (MDES) & Pantallas del Sistema (2 skills interoperables)</b></summary>

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
<summary><b>🗄️ Módulo 4: Backend y Bases de Datos (2 skills)</b></summary>

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
<summary><b>📝 Módulo 5: Documentación Viva, Arquitectura y Entregables (4 skills)</b></summary>

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

---

## 8. Matriz de Consulta Rápida (Cheat Sheet)

| Si necesitas... | Invoca esta skill |
| :--- | :--- |
| Configurar un proyecto nuevo | `/iniciar-toolkit` |
| Elaborar el Plan Maestro de Dominio (Info Primaria) | `/crear-plan-maestro` |
| Arreglar desbordamiento en celular | `/responsividad` |
| Arreglar una tabla que scrollea toda la pantalla | `/mejorar-vista-fija` |
| Destacar la fila que abrió un modal | `/resaltar-fila-abierta` |
| Crear animaciones, ilustraciones o escenas en código (MDES) | `/motion-design-engineer` |
| Generar y cablear pantallas de estado, errores 4xx/5xx, offline y rutas | `/system-state-screens` |
| Dejar columnas reordenables por el usuario | `/tabla-orden-dinamico` |
| Auditar código de un componente frontend | `/frontend-review` |
| Capturar tokens de diseño de una landing | `/landing-recopilar` |
| Uniformizar diseño en páginas públicas | `/landing-uniformizar` |
| Consultar tipos y relaciones de base de datos | `/support-db` |
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
> *"Se han incorporado nuevas skills o mejoras al toolkit en GitHub. Por favor actualiza el submódulo ejecutando `git submodule update --remote .claude/skills`.*
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

