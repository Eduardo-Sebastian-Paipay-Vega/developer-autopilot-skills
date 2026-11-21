---
name: crear-plan-maestro
description: Genera o actualiza el Plan Maestro de Arquitectura, Dominio, Rutas y Delimitaciones del Sistema (Información Primaria). Estructura Requisitos Funcionales (RF), Casos de Uso (CU), jerarquía modular, matriz RBAC y límites Out-of-Scope (blindaje anti-alucinación para IA). Si el proyecto aún no tiene código, delimita el alcance funcional e identifica qué información falta; si ya tiene código, audita e integra la base de datos, endpoints REST, rutas y componentes existentes en una matriz relacional E2E. Se invoca manualmente (/crear-plan-maestro).
---

# Generador del Plan Maestro de Arquitectura y Dominio (Información Primaria)

Esta skill elabora la **fuente canónica de verdad e información primaria** del sistema: el **Plan Maestro de Arquitectura, Dominio, Rutas, Pantallas y Delimitaciones**.

A partir de este documento primario se genera y valida toda la **información secundaria**: Documentos de Diseño de Software (SDD / IEEE 1016), historias de usuario, contratos de API, esquemas de base de datos, código frontend/backend y manuales.

---

## 🎯 Los Dos Modos de Operación

La skill evalúa de inmediato el estado del repositorio para operar en uno de dos modos:

```
                                  ¿Existe código ejecutable?
                                        (BD, Backend o UI)
                                         /              \
                                       NO                SÍ
                                       /                  \
                        [MODO 1: CONCEPCIÓN]      [MODO 2: SISTEMA VIVO]
                        • RFs y Casos de Uso      • Todo lo del Modo 1 +
                        • Jerarquía Modular       • Auditoría BD y Migraciones
                        • Rutas/Pantallas objetivo • Inventario Endpoints Backend
                        • Límites Out-of-Scope    • Matriz E2E (BD - API - UI)
                        • Detección de Faltantes  • Detección de Residuos/Fantasmas
```

---

## Estructura Canónica del Plan Maestro

El documento generado (habitualmente guardado en `docs/planeacion/plan-maestro.md` o `docs/arquitectura/plan-maestro.md`) sigue la estructura canónica de 9 secciones:

### I. Estado de Ramas y Contexto del Proyecto
* Nombre del sistema, organización/cliente, propósito general y stack objetivo.
* En proyectos con Git: rama base, sincronización (`dev`/`main`) y estado de salud de compilación.

### II. Matriz Maestra de Requisitos Funcionales (`RF-01` a `RF-n`)
Tabla exhaustiva con identificadores únicos:
| RF | Nombre del Requisito Funcional | Módulo | Actor / Rol | Capa de Datos / Persistencia Esperada |
|:---|:---|:---:|:---:|:---|
| **RF-01** | Autenticación Segura de Usuarios con Credenciales | M1 (Seguridad) | Todos | `usuarios`, `sesiones` |
| **RF-02** | Control de Privilegios y Acceso Basado en Roles (RBAC) | M1 (Seguridad) | Administrador | `roles`, `permisos` |

### III. Matriz Maestra de Casos de Uso (`CU-01` a `CU-n`)
Mapeo 1:1 o 1:N entre Casos de Uso y Requisitos Funcionales:
| ID Caso de Uso | RF Asociado | Título Oficial del Caso de Uso | Actor Responsable | Frecuencia de Ejecución |
|:---|:---:|:---|:---:|:---|
| **CU-SEG-01** | RF-01 | Iniciar Sesión en la Plataforma | Usuario Registrado | Muy Alta |
| **CU-SEG-02** | RF-02 | Gestionar Privilegios de Usuario | Administrador | Media |

### IV. Consolidación Jerárquica
Organización estructurada en 4 niveles para eliminar ambigüedades:
> **Módulo de Negocio / Datos** → **Submódulo (Pantalla o Vista)** → **Casos de Uso (CU)** → **Requisitos Funcionales (RF)**

### V. Sistema de Diseño y Arquitectura de Rutas Propuestas
* **Directivas Visuales:** Design system base (ej. Tailwind CSS, shadcn/ui, PrimeNG, Material, tokens semánticos).
* **Mapa de Rutas Propuestas:** Rutas públicas (landing, login, recuperación) vs. Rutas privadas (intranet, dashboard, módulos operativos).
* **Pantallas Físicas vs. Vistas Operativas:** Desglose de archivos de página (ej. `page.tsx`, componentes de ruta) y pestañas/paneles internos.

### VI. Reglas Inquebrantables y Contratos Anti-Alucinación para Agentes de IA
> [!CAUTION]
> **Blindaje para que ningún agente de IA invente código o contratos erróneos:**
1. **Catálogo Oficial de Roles (`rol_enum`):** Lista cerrada de roles permitidos en el sistema (prohibido inventar nombres en inglés o sinónimos).
2. **Catálogo Oficial de Permisos:** Permisos atómicos del núcleo.
3. **Límites Estrictos de Alcance (Out-of-Scope):** Tabla detallada de qué funcionalidades están **TERMINANTEMENTE EXCLUIDAS** del proyecto y el motivo institucional o técnico (ej. pasarelas de pago no aplicables, integraciones de hardware inexistentes, etc.).
4. **Contratos de Comunicación:** Formato canónico del sobre de respuesta HTTP (`success`, `data`, `error`), aislamiento multi-tenant (`tenant_id`), o políticas de cifrado de datos personales.

---

### VII, VIII y IX. (Solo en Modo 2: Cuando ya existe código)

#### VII. Matriz Relacional E2E (BD – Backend – Frontend)
Evaluación pantalla por pantalla del estado de integración:
* **[OK] Completo E2E:** Flujo integrado desde la pantalla hasta la base de datos.
* **[PARCIAL] Parcial / Simulado:** Existe la interfaz o el backend pero usa datos simulados o falta migración.
* **[PENDIENTE] No Implementado:** Pantalla o endpoint aún no construido.
* **[SSG] Estático:** Páginas informativas sin necesidad de base de datos.

#### VIII. Auditoría Física de Componentes y Residuos Fantasma
* Inventario de migraciones y tablas reales en la base de datos.
* Inventario de routers y endpoints del backend.
* **Detección de Residuos:** Carpetas obsoletas, rutas que no tienen interfaz, endpoints sin pantalla y tablas huérfanas sin mantenimiento.

---

## 🔍 Detección y Reporte de Información Faltante

Si durante la elaboración del Plan Maestro la información inicial provista por el usuario o encontrada en el repositorio es insuficiente, la skill **NO asume ni inventa datos de negocio**.

En su lugar, incluye una sección destacada al inicio:

> ### ⚠️ Información Faltante para Completar la Información Primaria
> Para blindar el alcance definitivo, se requiere que el usuario / cliente aclare los siguientes puntos:
> 1. **Actores y Roles:** *(ej. ¿El personal administrativo comparte roles con la dirección o tienen permisos segregados?)*
> 2. **Límites de Integración:** *(ej. ¿La exportación a sistemas externos es por archivos planos/Excel o existe algún servicio web?)*
> 3. **Políticas de Privacidad / Retención:** *(ej. ¿Se requiere encriptar identificadores civiles o cumplir con normativas locales de protección de datos?)*

---

## Procedimiento Paso a Paso de la Skill

### Paso 1: Exploración del Repositorio
1. Inspeccionar si existen carpetas de código (`src/`, `frontend/`, `backend/`, `database/`, `app/`, etc.).
2. Buscar documentación preliminar existente (`README.md`, requerimientos en `docs/`, RFCs, notas de cliente).

### Paso 2: Entrevista y Detección de Brechas
* Si el proyecto no tiene código: Formular preguntas concisas sobre el modelo de negocio, actores, requisitos principales y lo que está fuera de alcance.
* Si el proyecto tiene código: Ejecutar inspección de endpoints, modelos y componentes para armar la radiografía real.

### Paso 3: Redacción del Plan Maestro
Redactar el documento completo en Markdown con tablas formateadas, diagramas de flujo Mermaid para casos críticos, y alertas GitHub Flavored Markdown (`[!IMPORTANT]`, `[!CAUTION]`).

### Paso 4: Publicación y Registro
Guardar el documento en `docs/planeacion/plan-maestro.md`. Este archivo pasa a ser la fuente de verdad que consultarán todas las demás skills (`iniciar-toolkit`, `crear-guia-tecnica`, `frontend-review`, etc.).
