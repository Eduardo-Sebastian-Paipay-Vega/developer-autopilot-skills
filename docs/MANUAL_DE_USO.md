# 📖 Manual de Uso del Usuario — Developer AI Toolkit

Este manual está diseñado para que cualquier desarrollador aproveche al máximo las **23 skills** del kit en su día a día. Aprenderás cuándo invocar cada herramienta, qué parámetros pasarle y cómo automatizar tareas repetitivas de desarrollo, diseño y gestión.

---

## 📑 Índice de Contenidos

1. [El Ciclo de Vida de un Proyecto](#1-el-ciclo-de-vida-de-un-proyecto)
2. [Paso 0: Inicialización con `/iniciar-toolkit`](#2-paso-0-inicialización-con-iniciar-toolkit)
3. [Módulo 1: Frontend & Experiencia de Usuario (UI/UX)](#3-módulo-1-frontend--experiencia-de-usuario-uiux)
4. [Módulo 2: Landing Pages y Diseño Visual Guardian](#4-módulo-2-landing-pages-y-diseño-visual-guardian)
5. [Módulo 3: Backend y Bases de Datos](#5-módulo-3-backend-y-bases-de-datos)
6. [Módulo 4: Documentación y Entregables en Word](#6-módulo-4-documentación-y-entregables-en-word)
7. [Módulo 5: Git, DevOps y Reportes Gerenciales](#7-módulo-5-git-devops-y-reportes-gerenciales)
8. [Matriz de Consulta Rápida (Cheat Sheet)](#8-matriz-de-consulta-rápida-cheat-sheet)

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

## 3. Módulo 1: Frontend & Experiencia de Usuario (UI/UX)

### `/frontend-standards`
* **Para qué sirve:** Define los estándares de oro para escribir componentes Angular, PrimeNG, Signals y estilos limpios.
* **Cuándo usarlo:** Antes de crear una pantalla nueva o cuando quieras asegurarte de seguir las convenciones de arquitectura limpia.
* **Ejemplo de prompt:**
  > *"Voy a crear la pantalla de gestión de usuarios. Aplica /frontend-standards para estructurar el componente y sus servicios."*

### `/frontend-review`
* **Para qué sirve:** Audita un componente existente contra buenas prácticas (ChangeDetection OnPush, Signals reactivos, validación de formularios, accesibilidad A11y y tipado TypeScript estricto).
* **Cuándo usarlo:** Antes de hacer Pull Request o después de implementar una funcionalidad compleja.
* **Ejemplo de prompt:**
  > *"/frontend-review src/app/features/usuarios/usuarios.component.ts"*

### `/responsividad`
* **Para qué sirve:** Adapta cualquier pantalla a celulares (`<768px`) sin mover ni un solo píxel de la vista de escritorio (`≥768px`). Resuelve automáticamente el molesto bug de `flex-wrap` y colapsa grillas a una sola columna.
* **Ejemplo de prompt:**
  > *"Esta pantalla se desborda en móvil. Aplica /responsividad sobre el componente abierto en el editor."*

### `/mejorar-vista-fija`
* **Para qué sirve:** Convierte tablas infinitas en tablas de **vista fija**: los filtros superiores, la cabecera de columnas y el paginador se quedan siempre a la vista; solo las filas del cuerpo hacen scroll vertical.
* **Ejemplo de prompt:**
  > *"/mejorar-vista-fija en la tabla de pedidos. Necesito que no scrollee toda la página."*

### `/tabla-orden-dinamico`
* **Para qué sirve:** Permite que el usuario final arrastre columnas para ordenarlas a su gusto y estire los bordes para cambiar anchos, guardando su preferencia en backend o `localStorage`.
* **Regla de oro:** La columna "Acciones" permanece siempre fija al final y protegida contra arrastres accidentales.
* **Ejemplo de prompt:**
  > *"/tabla-orden-dinamico en la tabla de facturación para que recuerde las columnas por usuario."*

### `/resaltar-fila-abierta`
* **Para qué sirve:** Cuando un usuario hace clic en una fila (para ver detalle o editar en un modal) y lo cierra, esa fila queda suavemente pintada. Así no pierde la vista en listados de 100 registros.
* **Ejemplo de prompt:**
  > *"/resaltar-fila-abierta para marcar qué fila abrió el modal de edición."*

---

## 4. Módulo 2: Landing Pages y Diseño Visual Guardian

Este kit garantiza que nadie degrade el diseño de tus páginas públicas y que los estilos del landing se apliquen de forma consistente.

### Flujo recomendado de 4 pasos:
1. **/landing-recopilar:** Abre la landing con Playwright, extrae colores computados, fuentes tipográficas y espaciados reales.
2. **/landing-auditar:** Compara tus pantallas públicas secundarias contra la landing de referencia y lista las discrepancias visuales.
3. **/landing-aplicar:** Aplica los estilos y clases de la landing a las rutas públicas autorizadas (sin tocar nunca el dashboard privado ni el backend).
4. **/landing-verificar:** Comprueba regresiones visuales en tres tamaños de pantalla (Desktop, Tablet, Mobile) y emite un veredicto con capturas PNG.

> [!TIP]
> Si tienes configurado `.claude/landing-design/scope.json`, puedes ejecutar directamente **/landing-uniformizar** para orquestar los 4 pasos en una sola llamada.

---

## 5. Módulo 3: Backend y Bases de Datos

### `/support-db`
* **Para qué sirve:** Inspecciona en tiempo real los modelos del ORM (`models.py`, entidades de base de datos) y las migraciones activas. Nunca responde de memoria: lee el código fuente exacto para decirte tipos de campos, choices, claves foráneas y relaciones Many-to-Many.
* **Ejemplo de prompt:**
  > *"/support-db ¿Qué campos tiene el modelo de Factura y cómo se relaciona con Cliente?"*

### `/diccionario-datos`
* **Para qué sirve:** Fomenta la regla de fuente única de verdad: redacta los comentarios en el modelo ORM y PostgreSQL (`db_table_comment` y `db_comment`) y genera el archivo `docs/arquitectura/diccionario-datos.md` automáticamente.
* **Ejemplo de prompt:**
  > *"Acabo de agregar la tabla de suscripciones. Ejecuta /diccionario-datos para documentar los campos y actualizar el markdown."*

---

## 6. Módulo 4: Documentación Viva, Arquitectura y Entregables

### `/crear-plan-maestro`
* **Para qué sirve:** Genera la **información primaria y fuente canónica de verdad** del proyecto (`docs/planeacion/plan-maestro.md`). Define Requisitos Funcionales (`RF-01` a `RF-n`), Casos de Uso (`CU-01` a `CU-n`), jerarquía modular, rutas/pantallas objetivo y límites Out-of-Scope (blindaje anti-alucinación para IA).
  * **Si aún no hay código:** Estructura el dominio funcional y reporta explícitamente qué información falta aclarar antes de programar.
  * **Si ya hay código:** Audita la integración E2E entre base de datos, backend REST y pantallas frontend, detectando residuos y componentes fantasma.
* **Ejemplo de prompt:**
  > *"/crear-plan-maestro a partir de la visión del sistema y requerimientos del cliente."*

### `/actualizar-contexto`
* **Para qué sirve:** Se ejecuta al terminar una sesión de desarrollo. Analiza con `git diff` qué cambió realmente en la arquitectura (nuevos endpoints, carpetas o contratos) y te propone actualizar la documentación viva (`docs/arquitectura/contexto-proyecto.md`) sin borrar contexto histórico.
* **Ejemplo de prompt:**
  > *"Terminamos por hoy. Ejecuta /actualizar-contexto para registrar lo implementado."*

### `/crear-guia-tecnica <módulo>`
* **Para qué sirve:** Redacta una especificación técnica de nivel senior para desarrolladores, DevOps y soporte: roles requeridos, diagrama de flujo Mermaid, endpoints consumidos, estados y checklist de despliegue.
* **Ejemplo de prompt:**
  > *"/crear-guia-tecnica pagos-stripe"*

### `/crear-manual-usuario <módulo>`
* **Para qué sirve:** Escribe un manual en lenguaje accesible (sin código ni tecnicismos) para el cliente final y lo convierte a un documento editable de Microsoft Word (`.docx`) mediante su conversor integrado.
* **Ejemplo de prompt:**
  > *"/crear-manual-usuario facturacion"*

---

## 7. Módulo 5: Git, DevOps y Reportes Gerenciales

### `/resolver-conflicto-merge`
* **Para qué sirve:** Cuando Git se detiene por conflictos en un merge o rebase, esta skill los resuelve directamente desde la terminal. Materializa los marcadores, analiza el código de ambos lados con rigor, elimina imports muertos con `grep` y corre los tests del proyecto antes de commitear.
* **Ejemplo de prompt:**
  > *"/resolver-conflicto-merge"*

### `/reporte-semanal-resumen`
* **Para qué sirve:** Lee automáticamente todos tus commits de Git de la semana (domingo a sábado) y redacta en 5 segundos tu informe de avance en lenguaje de gerencia, listo para copiar y pegar en Slack, correo o el acta de seguimiento.
* **Ejemplo de prompt:**
  > *"/reporte-semanal-resumen"*

### `/diagnostico-staging`
* **Para qué sirve:** Revisa por qué falló el entorno de staging en Google Cloud: compara si la imagen del Job de migración coincide con la del backend, audita logs de error recientes y previene accidentes con `--update-secrets`.
* **Ejemplo de prompt:**
  > *"/diagnostico-staging. El backend en Cloud Run devuelve error 500 tras el despliegue."*

### `/update-main-staging`
* **Para qué sirve:** Conduce el flujo de CI/CD: corre tests locales, propone commits estructurados (Conventional Commits), sube a la rama remota, vigila el build de Cloud Build y ejecuta smoke tests HTTP 200.
* **Ejemplo de prompt:**
  > *"/update-main-staging para publicar los cambios validados a staging."*

---

## 8. Matriz de Consulta Rápida (Cheat Sheet)

| Si necesitas... | Invoca esta skill |
| :--- | :--- |
| Configurar un proyecto nuevo | `/iniciar-toolkit` |
| Elaborar el Plan Maestro de Dominio (Info Primaria) | `/crear-plan-maestro` |
| Arreglar desbordamiento en celular | `/responsividad` |
| Arreglar una tabla que scrollea toda la pantalla | `/mejorar-vista-fija` |
| Destacar la fila que abrió un modal | `/resaltar-fila-abierta` |
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
