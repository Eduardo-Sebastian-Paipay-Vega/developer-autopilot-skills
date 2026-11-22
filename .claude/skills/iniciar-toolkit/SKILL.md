---
name: iniciar-toolkit
description: Skill iniciadora y orquestadora del Toolkit de desarrollo. Inspecciona automáticamente el stack del proyecto (lenguajes, frameworks frontend y backend, bases de datos, Git y Cloud), genera el archivo de contexto toolkit.config.json, crea las carpetas de documentación viva necesarias y sincroniza la convivencia de todas las demás skills para que se adapten de inmediato a cualquier empresa o repositorio. Se invoca manualmente (/iniciar-toolkit o /setup-toolkit).
---

# Iniciar Toolkit — Orquestación, Contexto y Convivencia de Skills

Esta skill actúa como el **arrancador y director de orquesta** del Toolkit. Al llegar a un repositorio o proyecto nuevo (sea en una empresa nueva, freelance o proyecto personal), esta skill analiza el entorno, genera el contexto vivo y adapta el comportamiento de las demás 15 skills para que trabajen sincronizadas y sin fricción.

---

## ¿Qué problema resuelve la Skill Iniciadora?

Sin esta skill, al llevar tus herramientas a un proyecto nuevo tendrías que:
1. Configurar a mano las rutas de frontend, backend y documentación en cada archivo.
2. Recordar qué skills aplican a este proyecto y cuáles no.
3. Pedir al agente que adivine la estructura del código en cada interacción.

Con `/iniciar-toolkit`:
* **Inspección en segundos:** Detecta automáticamente si el proyecto usa Angular, React, Vue, Next.js, Django, FastAPI, NestJS, Express, etc.
* **Fuente única de contexto:** Genera `toolkit.config.json` con los datos del proyecto, ramas Git y usuario activo.
* **Convivencia armónica:** Habilita y orienta a cada skill sobre dónde residen los componentes, modelos y documentación del proyecto actual.

---

## Flujo de Ejecución

### Paso 1: Ejecutar la Inspección Automatizada
La skill ejecuta el script de detección:

```bash
python .claude/skills/iniciar-toolkit/setup.py
# o si está en la raíz de skills:
python iniciar-toolkit/setup.py
```

### Paso 2: Análisis del Diagnóstico y Detección de Librería UI
El script examina el proyecto y confirma:
* **Identidad:** Nombre del proyecto y usuario activo de Git (`user.name` y `user.email`).
* **Frontend y Librería UI:** Framework detectado (Angular, Next.js, React, Vue, Svelte, Astro) y librería de componentes real (`PrimeNG`, `PrimeReact`, `PrimeVue`, `shadcn/ui + Radix UI`, `Angular Material`, `MUI`, `Ant Design`, `Vuetify`, `Chakra UI`, `Tailwind CSS`, etc.).
* **Regla si el formato/librería UI no está definido:** Si el script no detecta la librería de UI (por ejemplo, proyecto nuevo sin `package.json`), **preguntar explícitamente al usuario** qué framework y librería de componentes usará (o buscar su documentación oficial) y registrarlo en `toolkit.config.json` bajo `stack.ui_libraries`. **Nunca asumir PrimeNG por defecto.**
* **Backend:** Framework detectado (ej. Django, FastAPI, NestJS) y su ubicación.
* **Infraestructura:** Presencia de Dockerfiles o pipelines de Cloud Build / GCP.
* **Estructura Documental:** Verifica y crea si no existen las carpetas de documentación viva (`docs/arquitectura/` y `docs/manuales/`).

### Paso 3: Generación del Contexto Vivo (`toolkit.config.json`)
Crea o actualiza el archivo maestro de configuración con la topología detectada:

```json
{
  "project": {
    "name": "nombre-del-proyecto-actual"
  },
  "paths": {
    "frontend_dir": "frontend",
    "backend_dir": "BACKEND",
    "docs_dir": "docs/arquitectura",
    "manuals_dir": "docs/manuales"
  },
  "team": {
    "members": [
      {
        "name": "TU_USUARIO",
        "emails": ["tu_correo@empresa.com"]
      }
    ]
  }
}
```

### Paso 4: Inicialización de la Documentación Viva
Si el proyecto no cuenta aún con un documento de arquitectura base, la skill propone generar una plantilla inicial en `docs/arquitectura/contexto-proyecto.md`:
* Resumen del propósito del sistema.
* Módulos detectados.
* Pila tecnológica en uso.

---

## Mapa de Convivencia: ¿Qué skill usar en cada momento?

Una vez inicializado el proyecto con esta skill, las demás herramientas conviven así:

| Situación u Objetivo | Skill a Invocar |
| :--- | :--- |
| **Inicio de proyecto o cambio de entorno** | `/iniciar-toolkit` |
| **Generar Plan Maestro y Delimitaciones (Info Primaria)** | `/crear-plan-maestro` |
| **Garantizar fidelidad visual de Landing Page** | `/landing-uniformizar` o `/landing-recopilar` |
| **Auditar consistencia estética del sitio público** | `/landing-auditar` |
| **Aplicar diseño de referencia a rutas públicas** | `/landing-aplicar` |
| **Verificar que no hubo regresiones visuales** | `/landing-verificar` |
| **Resolver un choque de ramas en Git** | `/resolver-conflicto-merge` |
| **Hacer que una pantalla funcione en celulares** | `/responsividad` |
| **Evitar que una tabla scrollee la página completa** | `/mejorar-vista-fija` |
| **Tablas interactivas con arrastre y anchos dinámicos**| `/tabla-orden-dinamico` |
| **Feedback visual al cerrar un diálogo modal** | `/resaltar-fila-abierta` |
| **Crear animaciones, ilustraciones o escenas SVG+CSS+JS** | `/motion-design-engineer` |
| **Generar y cablear pantallas de estado, errores 4xx/5xx, offline y rutas** | `/system-state-screens` |
| **Revisar y auditar la calidad de un componente** | `/frontend-review` |
| **Normas de código y buenas prácticas UI** | `/frontend-standards` |
| **Consultar modelos, campos y relaciones de BD** | `/support-db` |
| **Documentar tablas en PostgreSQL y el ORM** | `/diccionario-datos` |
| **Al cerrar una sesión con cambios importantes** | `/actualizar-contexto` |
| **Generar especificación técnica de un módulo** | `/crear-guia-tecnica` |
| **Generar manual para el cliente y exportar Word** | `/crear-manual-usuario` |
| **Armar el informe semanal de trabajo para gerencia**| `/reporte-semanal-resumen` |
| **Revisar por qué staging o la nube falló** | `/diagnostico-staging` |
| **Subir a dev, promover a main y validar despliegue**| `/update-main-staging` |

---

## Checklist de Finalización
- [ ] `toolkit.config.json` creado y verificado con las rutas correctas del proyecto.
- [ ] Carpetas `docs/arquitectura` y `docs/manuales` listas para recibir documentación.
- [ ] Identidad del desarrollador y correo de Git confirmados.
- [ ] Todas las skills sincronizadas y listas para actuar.
