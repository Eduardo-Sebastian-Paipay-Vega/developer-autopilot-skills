# 🚀 Developer Autopilot Skills — Enterprise & Fullstack AI Toolkit

> **Kit integral de 24 skills de ingeniería de software, diseño visual y DevOps para agentes de IA (Claude Code, Cursor, Antigravity, Gemini CLI, Windsurf).**  
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

## 📦 Cómo instalar este Toolkit en tus proyectos

Tienes 3 formas limpias de usar este repositorio sin mezclar tus herramientas con el código de la empresa o cliente:

### Opción 1: Instalación Global (Recomendada)
Disponible en todos los proyectos de tu computadora sin tocar el `.git` del cliente:
* **Antigravity / Gemini CLI:** Clona este repositorio en `~/.gemini/config/skills/`.
* **Claude Code:** Clona este repositorio en `~/.claude/skills/`.

### Opción 2: Como Git Submodule (Para proyectos de equipo)
Si deseas que viva en la carpeta `.claude/skills` del repositorio pero como un puntero aislado que nunca mezcla archivos:
```bash
git submodule add https://github.com/Eduardo-Sebastian-Paipay-Vega/developer-autopilot-skills.git .claude/skills
```

Para actualizar a la última versión en cualquier momento:
```bash
git submodule update --remote
```

### Opción 3: Clon local con `.gitignore`
Clona directamente dentro de tu proyecto:
```bash
git clone https://github.com/Eduardo-Sebastian-Paipay-Vega/developer-autopilot-skills.git .claude/skills
```
Y añade en el `.gitignore` del proyecto del cliente:
```gitignore
.claude/skills/
toolkit.config.json
```

---

## 🧭 Catálogo Maestro de Skills (23 Skills)

### 1. Orquestación y Setup
| Comando | Descripción |
| :--- | :--- |
| **`/iniciar-toolkit`** | Arrancador automático: detecta el stack técnico, genera `toolkit.config.json` y sincroniza las demás skills. |

### 2. Frontend y Experiencia de Usuario (UI/UX)
| Comando | Descripción |
| :--- | :--- |
| **`/frontend-standards`** | Guía y estándares de oro de arquitectura Angular, componentes reactivos, PrimeNG y TypeScript. |
| **`/frontend-review`** | Auditoría y corrección de componentes: OnPush, Signals, A11y, formularios y desacoplamiento REST. |
| **`/responsividad`** | Adaptación móvil (<768px) con preservación pixel-perfect de escritorio y prevención del bug flex-wrap. |
| **`/mejorar-vista-fija`** | Layout con Flexbox para tablas con sticky header, filtros anclados y scroll vertical interno sin desbordar la página. |
| **`/tabla-orden-dinamico`** | Reordenamiento de columnas por usuario, anchos redimensionables y persistencia segura de preferencias. |
| **`/resaltar-fila-abierta`** | Feedback visual de fila activa al abrir/cerrar diálogos modales para mantener el contexto del usuario. |

### 3. Landing Design Guardian (Diseño Visual y Sitios Públicos)
| Comando | Descripción |
| :--- | :--- |
| **`/landing-uniformizar`** | Orquestador completo de diseño visual: recopila tokens, audita páginas públicas, aplica estilos y verifica. |
| **`/landing-recopilar`** | Inspección y captura de tokens de diseño computados (colores, tipografía, espaciado) con Playwright. |
| **`/landing-auditar`** | Clasifica rutas públicas y detecta discrepancias contra el diseño de referencia. |
| **`/landing-aplicar`** | Aplica la identidad visual exclusivamente a rutas autorizadas respetando la línea base. |
| **`/landing-verificar`** | Comprobación de regresiones visuales y estados interactivos con evidencias gráficas. |
| **`/landing-actualizar`** | Versiona y actualiza la fuente de verdad del diseño tras cambios aprobados. |
| **`/landing-design-guardian`** | Reglas maestras de contención para proteger el sistema privado contra cambios de estilo del landing. |

### 4. Backend, Bases de Datos y Modelos
| Comando | Descripción |
| :--- | :--- |
| **`/support-db`** | Inspección viva de modelos ORM (`models.py`, entidades), tipos de datos, relaciones FK/M2M y enums. |
| **`/diccionario-datos`** | Extrae y documenta tablas y campos directamente desde comentarios del ORM y PostgreSQL a Markdown y Word. |

### 5. Documentación Viva, Arquitectura y Entregables
| Comando | Descripción |
| :--- | :--- |
| **`/crear-plan-maestro`** | Genera el Plan Maestro de Arquitectura y Dominio (Información Primaria): RFs, Casos de Uso, delimitaciones Out-of-Scope y auditoría E2E. |
| **`/actualizar-contexto`** | Analiza `git diff` al final de la sesión y actualiza la arquitectura viva (`docs/arquitectura`) sin perder historial. |
| **`/crear-guia-tecnica`** | Genera especificaciones técnicas de módulos para soporte y desarrollo con diagramas de flujo Mermaid. |
| **`/crear-manual-usuario`** | Redacta manuales en lenguaje de usuario final y los convierte a Word (`.docx`) mediante conversor integrado. |

### 6. Git, DevOps y Reportes de Avance
| Comando | Descripción |
| :--- | :--- |
| **`/resolver-conflicto-merge`** | Resolución determinista de conflictos Git en CLI con verificación de hunks, grep de imports y tests. |
| **`/reporte-semanal-resumen`** | Extrae tus commits de Git de la semana y redacta el informe de avance en lenguaje de gerencia. |
| **`/diagnostico-staging`** | Diagnóstico en Google Cloud Platform: Cloud Run, Cloud SQL, sincronización de Jobs de migración y logs. |
| **`/update-main-staging`** | Pipeline completo de despliegue: validación local, commits convencionales, Cloud Build, migraciones y smoke tests. |

---

## 🛠️ Estructura del Repositorio

```text
developer-autopilot-skills/
├── .claude/
│   ├── landing-design/        # Configuración de scope y evidencias visuales
│   └── skills/                # Directorio unificado de las 23 skills
│       ├── iniciar-toolkit/
│       ├── frontend-standards/
│       ├── resolver-conflicto-merge/
│       ├── landing-design-guardian/
│       └── ...
├── toolkit.config.template.json # Plantilla de configuración agnóstica
└── README.md                  # Este documento
```

---

## 📄 Licencia

MIT License — Creado y mantenido por **Eduardo Sebastián Paipay Vega**.  
Úsalo libremente en tus proyectos personales, profesionales y empresariales.
