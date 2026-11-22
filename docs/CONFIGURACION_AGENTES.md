# ⚙️ Guía de Configuración para Agentes de IA

Esta guía detalla cómo integrar y activar las **27 skills** de este toolkit en los principales entornos y agentes de inteligencia artificial del mercado: **Claude Code**, **Cursor IDE**, **Google Antigravity / Gemini CLI**, **Windsurf / Cascade**, y **VS Code con Cline / Roo Code / Copilot**.

---

## 📑 Tabla de Contenidos
1. [Claude Code (Anthropic CLI)](#1-claude-code-anthropic-cli)
2. [Cursor IDE](#2-cursor-ide)
3. [Google Antigravity / Gemini CLI](#3-google-antigravity--gemini-cli)
4. [Windsurf / Cascade](#4-windsurf--cascade)
5. [VS Code (Cline / Roo Code / GitHub Copilot)](#5-vs-code-cline--roo-code--github-copilot)
6. [Estructura del Archivo de Contexto (`toolkit.config.json`)](#6-estructura-del-archivo-de-contexto-toolkitconfigjson)

---

## Matriz de Compatibilidad Real por Agente

No todos los agentes descubren `SKILL.md` de la misma manera. Esta tabla distingue el mecanismo real de cada entorno:

| Agente | Mecanismo de descubrimiento | Target en `scripts/install.mjs` | Estado |
| :--- | :--- | :--- | :--- |
| **Google Antigravity / Gemini CLI** | Nativo en `~/.gemini/config/skills/<skill>/SKILL.md` | `--target antigravity` | Verificado en entorno real |
| **Claude Code (Anthropic CLI)** | Nativo en `.claude/skills/<skill>/SKILL.md` o `~/.claude/skills/<skill>/SKILL.md` | `--target claude-project` / `claude-global` | Formato estándar nativo |
| **OpenAI Codex CLI** | Nativo en `.agents/skills/<skill>/SKILL.md` o `~/.codex/skills/<skill>/SKILL.md` | `--target codex-project` / `codex-global` | Formato estándar Agent Skills |
| **Todos los agentes a la vez** | Propaga simultáneamente a Claude + Antigravity + Codex (global) o Claude + Codex + Cursor (proyecto) | `--target all-global` / `all-project` | Vía `scripts/autopilot.mjs sync` |
| **Cursor IDE** | No auto-descubre `SKILL.md`; requiere `.cursor/rules/*.mdc` | `--target cursor` | Vía archivo de reglas generado |
| **Windsurf / Cascade** | No auto-descubre `SKILL.md`; requiere `.windsurfrules` | `--target windsurf` | Vía archivo de reglas generado |
| **Cline / Roo Code (VS Code)** | No auto-descubre `SKILL.md`; requiere `.clinerules` | `--target cline` | Vía archivo de reglas generado |

---

## 1. Claude Code (Anthropic CLI)

Claude Code soporta de forma nativa `.claude/skills/<skill>/SKILL.md` (sin carpetas intermedias anidadas).

### Configuración por Proyecto (Recomendada)
1. En la raíz de tu proyecto, agrega este repositorio como submódulo en `.developer-autopilot` y ejecuta el instalador oficial:
   ```bash
   git submodule add https://github.com/Eduardo-Sebastian-Paipay-Vega/developer-autopilot-skills.git .developer-autopilot
   node .developer-autopilot/scripts/install.mjs --target claude-project
   ```
2. Inicia o reinicia tu sesión de Claude Code:
   ```bash
   claude
   ```
3. Claude Code descubrirá directamente cada carpeta en `.claude/skills/<skill>/SKILL.md`.

### Configuración Global (Disponible en todos tus proyectos)
```bash
git clone https://github.com/Eduardo-Sebastian-Paipay-Vega/developer-autopilot-skills.git ~/tools/developer-autopilot-skills
node ~/tools/developer-autopilot-skills/scripts/install.mjs --target claude-global
```

---

## 2. Cursor IDE

Cursor utiliza reglas de contexto (`.cursorrules` o la carpeta moderna `.cursor/rules/`).

### Configuración Rápida en `.cursorrules`
1. Clona el toolkit en la raíz de tu proyecto dentro de `.claude/skills/` o `tools/skills/`.
2. Crea o edita el archivo `.cursorrules` en la raíz de tu repositorio con el siguiente contenido:

```markdown
# Developer AI Toolkit Rules
Este proyecto cuenta con un kit de 27 skills ubicadas en `.claude/skills/`.
Siempre que el usuario solicite una tarea coincidente con las siguientes directivas, lee el archivo `SKILL.md` correspondiente antes de actuar:

- Inicializar proyecto o setup: `.claude/skills/iniciar-toolkit/SKILL.md`
- Plan Maestro de Arquitectura y Dominio: `.claude/skills/crear-plan-maestro/SKILL.md`
- Resolución de conflictos Git: `.claude/skills/resolver-conflicto-merge/SKILL.md`
- Responsividad móvil: `.claude/skills/responsividad/SKILL.md`
- Tablas fijas y scroll interno: `.claude/skills/mejorar-vista-fija/SKILL.md`
- Reordenar columnas: `.claude/skills/tabla-orden-dinamico/SKILL.md`
- Resaltar fila activa: `.claude/skills/resaltar-fila-abierta/SKILL.md`
- Ingeniería de animaciones e ilustraciones (MDES): `.claude/skills/motion-design-engineer/SKILL.md`
- Pantallas de estado del sistema, errores 4xx/5xx y rutas: `.claude/skills/system-state-screens/SKILL.md`
- Auditoría frontend: `.claude/skills/frontend-review/SKILL.md`
- Sidebar empresarial con RBAC y tokens del proyecto: `.claude/skills/enterprise-sidebar/SKILL.md`
- Estándares UI: `.claude/skills/frontend-standards/SKILL.md`
- Modelos y BD: `.claude/skills/support-db/SKILL.md`
- Diccionario de datos: `.claude/skills/diccionario-datos/SKILL.md`
- Documentación viva: `.claude/skills/actualizar-contexto/SKILL.md`
- Guías técnicas: `.claude/skills/crear-guia-tecnica/SKILL.md`
- Manuales Word (.docx): `.claude/skills/crear-manual-usuario/SKILL.md`
- Reporte semanal Git: `.claude/skills/reporte-semanal-resumen/SKILL.md`
- Landing design: `.claude/skills/landing-uniformizar/SKILL.md`
- Diagnóstico staging: `.claude/skills/diagnostico-staging/SKILL.md`
- Despliegue CI/CD: `.claude/skills/update-main-staging/SKILL.md`

Lee siempre `toolkit.config.json` para obtener las rutas y configuraciones del proyecto.
```

### Configuración Modular en `.cursor/rules/`
Si usas la versión moderna de Cursor con reglas independientes por archivo, crea un archivo `.cursor/rules/toolkit.mdc` con la misma referencia.

---

## 3. Google Antigravity / Gemini CLI

Google Antigravity y Gemini CLI cargan skills mediante directorios declarados en su configuración de usuario.

### Instalación Global
1. Copia o clona las carpetas de skills en tu ruta de configuración:
   * **Windows:** `C:\Users\<TuUsuario>\.gemini\config\skills\`
   * **Linux/macOS:** `~/.gemini/config/skills/`
2. En Antigravity, las skills se registran de forma automática en el catálogo de capacidades y son descubiertas de inmediato por el orquestador.
3. Para ejecutar el inicializador, escribe en el chat:
   ```text
   /iniciar-toolkit
   ```

---

## 4. Windsurf / Cascade (Codeium)

Windsurf utiliza el archivo `.windsurfrules` en la raíz del proyecto.

### Configuración:
Crea un archivo `.windsurfrules` en la raíz del proyecto:
```markdown
# Reglas de Ingeniería y Toolkit de Skills
- El proyecto utiliza el kit de automatización ubicado en `.claude/skills/`.
- Ante peticiones de maquetación móvil, consulta `.claude/skills/responsividad/SKILL.md`.
- Ante resolución de merges de Git, sigue el procedimiento de `.claude/skills/resolver-conflicto-merge/SKILL.md`.
- Para inspeccionar modelos ORM y bases de datos, consulta `.claude/skills/support-db/SKILL.md`.
- Para redacción de manuales y especificaciones, consulta las carpetas en `.claude/skills/crear-*/`.
- Parámetros de configuración del proyecto disponibles en `toolkit.config.json`.
```

---

## 5. VS Code (Cline / Roo Code / GitHub Copilot)

### Con Cline o Roo Code:
1. Agrega las directivas al archivo `.clinerules` o a la sección **Custom Instructions**:
   ```markdown
   Tienes acceso a un conjunto de herramientas estandarizadas en `.claude/skills/`.
   Al iniciar una tarea en el proyecto:
   1. Si no existe `toolkit.config.json`, ejecuta `python .claude/skills/iniciar-toolkit/setup.py`.
   2. Consulta la skill correspondiente en `.claude/skills/<nombre-skill>/SKILL.md` antes de escribir código.
   ```

### Con GitHub Copilot Workspace:
1. Añade a tu archivo `.github/copilot-instructions.md`:
   ```markdown
   Sigue los estándares de código y procedimientos de arquitectura documentados en `.claude/skills/frontend-standards/SKILL.md` y `.claude/skills/actualizar-contexto/SKILL.md`.
   ```

---

## 6. Estructura del Archivo de Contexto (`toolkit.config.json`)

Todas las skills leen este archivo centralizado en la raíz del proyecto. El script `/iniciar-toolkit` lo genera de forma automática, pero puedes personalizarlo según tus necesidades:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "project": {
    "name": "mi-sistema-empresarial",
    "description": "Plataforma de gestión operativa",
    "organization": "Mi Empresa / Cliente"
  },
  "cloud": {
    "provider": "gcp",
    "project_id": "mi-proyecto-cloud",
    "region": "southamerica-west1",
    "services": {
      "backend": "api-backend-staging",
      "frontend": "web-frontend-staging",
      "migration_job": "api-backend-migrate",
      "database_instance": "postgres-staging"
    },
    "urls": {
      "backend_staging": "https://api-staging.ejemplo.com",
      "frontend_staging": "https://staging.ejemplo.com"
    }
  },
  "team": {
    "members": [
      {
        "name": "DESARROLLADOR_LEAD",
        "emails": ["dev@empresa.com", "personal@gmail.com"]
      }
    ]
  },
  "paths": {
    "frontend_dir": "frontend",
    "backend_dir": "BACKEND",
    "docs_dir": "docs/arquitectura",
    "manuals_dir": "docs/manuales"
  }
}
```
