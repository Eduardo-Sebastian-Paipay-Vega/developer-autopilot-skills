"""Script de inicialización y adaptación del Toolkit en cualquier proyecto.

Inspecciona el repositorio actual, detecta de forma independiente:
  - Frontend y librerías de UI (sin asumir PrimeNG)
  - Backend, Base de Datos, ORM y Package Manager
  - Estructura documental y nube
Genera `toolkit.config.json` SIN exponer información personal (PII como correos)
salvo consentimiento explícito (--include-email o archivo local ignorado).

Uso:
    python .claude/skills/iniciar-toolkit/setup.py [--include-email] [--dir <ruta>]
"""

import json
import subprocess
import sys
from pathlib import Path


def ejecutar_git(raiz: Path, *args: str) -> str:
    try:
        r = subprocess.run(["git", *args], cwd=str(raiz), capture_output=True, text=True, encoding="utf-8", errors="replace")
        return r.stdout.strip()
    except Exception:
        return ""


def leer_json(ruta: Path) -> dict:
    try:
        return json.loads(ruta.read_text(encoding="utf-8", errors="ignore"))
    except Exception:
        return {}


def leer_texto(ruta: Path) -> str:
    try:
        return ruta.read_text(encoding="utf-8", errors="ignore").lower()
    except Exception:
        return ""


def detectar_package_manager(raiz: Path) -> list[str]:
    pms = []
    checks = [
        ("pnpm-lock.yaml", "pnpm"),
        ("yarn.lock", "yarn"),
        ("bun.lockb", "bun"),
        ("bun.lock", "bun"),
        ("package-lock.json", "npm"),
        ("uv.lock", "uv"),
        ("poetry.lock", "poetry"),
        ("Pipfile.lock", "pipenv"),
    ]
    carpetas = [raiz, raiz / "frontend", raiz / "backend", raiz / "BACKEND"]
    for carpeta in carpetas:
        if not carpeta.exists():
            continue
        for fname, pm in checks:
            if (carpeta / fname).exists() and pm not in pms:
                pms.append(pm)
    return pms


def detectar_bd_y_orm(raiz: Path, deps_js: dict, texto_py: str) -> tuple[list[str], list[str]]:
    dbs = []
    orms = []

    def add_db(name: str):
        if name not in dbs:
            dbs.append(name)

    def add_orm(name: str):
        if name not in orms:
            orms.append(name)

    # Dependencias JS/TS
    if any(k in deps_js for k in ("pg", "postgres", "@vercel/postgres", "@neondatabase/serverless")):
        add_db("PostgreSQL")
    if "@supabase/supabase-js" in deps_js or (raiz / "supabase").exists():
        add_db("PostgreSQL (Supabase)")
    if any(k in deps_js for k in ("mysql", "mysql2")):
        add_db("MySQL")
    if any(k in deps_js for k in ("sqlite3", "better-sqlite3", "@libsql/client")):
        add_db("SQLite")
    if any(k in deps_js for k in ("mongodb", "mongoose")):
        add_db("MongoDB")
    if any(k in deps_js for k in ("redis", "ioredis", "@upstash/redis")):
        add_db("Redis")

    if "prisma" in deps_js or "@prisma/client" in deps_js or list(raiz.glob("**/schema.prisma")):
        add_orm("Prisma")
    if "drizzle-orm" in deps_js:
        add_orm("Drizzle ORM")
    if "typeorm" in deps_js:
        add_orm("TypeORM")
    if "sequelize" in deps_js:
        add_orm("Sequelize")
    if "mongoose" in deps_js:
        add_orm("Mongoose")
    if "node-pg-migrate" in deps_js:
        add_orm("node-pg-migrate (SQL)")

    # Dependencias Python
    if any(k in texto_py for k in ("psycopg2", "psycopg", "asyncpg")):
        add_db("PostgreSQL")
    if any(k in texto_py for k in ("pymysql", "mysqlclient")):
        add_db("MySQL")
    if "pymongo" in texto_py or "motor" in texto_py:
        add_db("MongoDB")
    if "redis" in texto_py:
        add_db("Redis")
    if "django" in texto_py:
        add_orm("Django ORM")
    if "sqlalchemy" in texto_py:
        add_orm("SQLAlchemy")
    if "sqlmodel" in texto_py:
        add_orm("SQLModel")

    # Migraciones SQL genéricas
    if (raiz / "database" / "migrations").exists() and not dbs:
        add_db("SQL (migraciones detectadas)")

    return dbs, orms


def detectar_stack(raiz: Path) -> dict:
    info = {
        "nombre_proyecto": raiz.name,
        "frontend": None,
        "ui_libraries": [],
        "css_framework": None,
        "backend": None,
        "databases": [],
        "orms": [],
        "package_managers": detectar_package_manager(raiz),
        "carpetas": {
            "frontend": None,
            "backend": None,
            "docs": None,
        },
        "cloud": {
            "provider": None,
        },
        "landing": False,
        "git": {
            "usuario": ejecutar_git(raiz, "config", "user.name") or "Desarrollador",
            "email": ejecutar_git(raiz, "config", "user.email") or "",
            "rama_actual": ejecutar_git(raiz, "branch", "--show-current") or "main",
        },
    }

    all_js_deps = {}
    all_py_text = ""

    # 1. Detectar Frontend y Librerías UI
    for c in ["frontend", "client", "ui", "web", "."]:
        p = raiz / c
        pkg = p / "package.json"
        if not pkg.exists():
            continue
        data = leer_json(pkg)
        deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
        all_js_deps.update(deps)

        frame = None
        if "next" in deps:
            frame = "Next.js"
        elif "@angular/core" in deps:
            frame = "Angular"
        elif "nuxt" in deps:
            frame = "Nuxt"
        elif "vue" in deps:
            frame = "Vue"
        elif "svelte" in deps:
            frame = "Svelte"
        elif "astro" in deps:
            frame = "Astro"
        elif "react" in deps:
            frame = "React"

        if frame:
            ui_libs = []
            if "primeng" in deps:
                ui_libs.append("PrimeNG")
            if "primereact" in deps:
                ui_libs.append("PrimeReact")
            if "primevue" in deps:
                ui_libs.append("PrimeVue")
            if (p / "components.json").exists() or any(k.startswith("@radix-ui/") for k in deps):
                ui_libs.append("shadcn/ui + Radix UI")
            if "@angular/material" in deps:
                ui_libs.append("Angular Material")
            if "@mui/material" in deps:
                ui_libs.append("Material UI (MUI)")
            if "antd" in deps:
                ui_libs.append("Ant Design")
            if "vuetify" in deps:
                ui_libs.append("Vuetify")
            if "@chakra-ui/react" in deps:
                ui_libs.append("Chakra UI")
            if "daisyui" in deps:
                ui_libs.append("DaisyUI")

            css_fw = None
            if "tailwindcss" in deps:
                css_fw = "Tailwind CSS"
            elif "bootstrap" in deps:
                css_fw = "Bootstrap"
            elif "sass" in deps or "scss" in deps:
                css_fw = "SCSS"

            info["frontend"] = frame
            info["ui_libraries"] = ui_libs
            info["css_framework"] = css_fw
            info["carpetas"]["frontend"] = c if c != "." else "."
            break

    # 2. Detectar Backend (independiente del frontend; soporta monorepo y fullstack raíz)
    for c in ["backend", "BACKEND", "server", "api", "."]:
        p = raiz / c
        if not p.exists():
            continue
        for py_dep_file in ("requirements.txt", "pyproject.toml", "Pipfile"):
            if (p / py_dep_file).exists():
                all_py_text += "\n" + leer_texto(p / py_dep_file)

        if (p / "manage.py").exists():
            info["backend"] = "Django"
            info["carpetas"]["backend"] = c
            break
        if (p / "main.py").exists() or (p / "app.py").exists():
            info["backend"] = "FastAPI" if "fastapi" in all_py_text else "Python (Flask/FastAPI)"
            info["carpetas"]["backend"] = c
            break
        if (p / "package.json").exists():
            data = leer_json(p / "package.json")
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            all_js_deps.update(deps)
            if "@nestjs/core" in deps:
                info["backend"] = "NestJS"
                info["carpetas"]["backend"] = c
                break
            if "express" in deps:
                info["backend"] = "Express"
                info["carpetas"]["backend"] = c
                break
            if "fastify" in deps:
                info["backend"] = "Fastify"
                info["carpetas"]["backend"] = c
                break
            if "hono" in deps:
                info["backend"] = "Hono"
                info["carpetas"]["backend"] = c
                break

    # 3. Detectar Base de Datos y ORM
    info["databases"], info["orms"] = detectar_bd_y_orm(raiz, all_js_deps, all_py_text)

    # 4. Detectar Landing / Sitio Público
    for cand in ["landing", "public", "website", "sitio", "src/pages/index.tsx", "src/app/page.tsx", "app/page.tsx", "index.html"]:
        if (raiz / cand).exists():
            info["landing"] = True
            break

    # 5. Detectar Documentación
    for doc_cand in ["docs/arquitectura", "docs/architecture", "docs", "documentation"]:
        if (raiz / doc_cand).exists():
            info["carpetas"]["docs"] = doc_cand
            break
    if not info["carpetas"]["docs"]:
        info["carpetas"]["docs"] = "docs/arquitectura"

    # 6. Detectar Cloud / Despliegue
    if list(raiz.glob("*cloudbuild*.yaml")) or (raiz / "app.yaml").exists():
        info["cloud"]["provider"] = "gcp"
    elif (raiz / "wrangler.toml").exists() or (raiz / "wrangler.jsonc").exists() or (raiz / "wrangler.json").exists():
        info["cloud"]["provider"] = "cloudflare"
    elif (raiz / "vercel.json").exists():
        info["cloud"]["provider"] = "vercel"

    # 7. Detectar Identidad Visual / Design Tokens + Landing Design Guardian
    tokens_file = "docs/diseno/design-tokens.json"
    if (raiz / "design-tokens.json").exists() and not (raiz / tokens_file).exists():
        tokens_file = "design-tokens.json"
    detected_css = []
    for css_cand in [
        "app/globals.css",
        "src/app/globals.css",
        "frontend/app/globals.css",
        "frontend/src/app/globals.css",
        "src/styles.scss",
        "src/styles.css",
        "frontend/src/styles.scss",
        "src/index.css",
    ]:
        if (raiz / css_cand).exists():
            detected_css.append(css_cand)
    info["design"] = {
        "tokens_file": tokens_file,
        "generated_css": "docs/diseno/design-tokens.generated.css",
        "docs_md": "docs/diseno/DESIGN_TOKENS.md",
        "landing_dir": ".claude/landing-design",
        "landing_scope": ".claude/landing-design/scope.json",
        "landing_tokens": ".claude/landing-design/TOKENS.json",
        "landing_evidence": ".claude/landing-design/evidence",
        "has_tokens_file": (raiz / tokens_file).exists(),
        "has_landing_guardian": (raiz / ".claude/landing-design").exists(),
        "detected_css_files": detected_css,
    }

    return info


def main():
    args = sys.argv[1:]
    include_email = "--include-email" in args
    raiz = Path.cwd()
    if "--dir" in args:
        idx = args.index("--dir")
        if idx + 1 < len(args):
            raiz = Path(args[idx + 1]).resolve()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("=" * 60)
    print(" 🚀 INICIALIZADOR DEL TOOLKIT DE SKILLS")
    print("=" * 60)
    print(f"Directorio de trabajo: {raiz}\n")

    info = detectar_stack(raiz)

    print("🔎 Diagnóstico detectado automáticamente:")
    print(f"  • Proyecto:        {info['nombre_proyecto']}")
    print(f"  • Frontend:        {info['frontend'] or 'No detectado / Preguntar al usuario'}")
    print(f"  • Librería UI:     {', '.join(info['ui_libraries']) if info['ui_libraries'] else 'No detectada / Preguntar al usuario'}")
    print(f"  • Estilos CSS:     {info['css_framework'] or 'CSS estándar / Por definir'}")
    print(f"  • Backend:         {info['backend'] or 'No detectado / No aplica'}")
    print(f"  • Base de datos:   {', '.join(info['databases']) if info['databases'] else 'No detectada / Preguntar al usuario'}")
    print(f"  • ORM / Migración: {', '.join(info['orms']) if info['orms'] else 'No detectado'}")
    print(f"  • Package Manager: {', '.join(info['package_managers']) if info['package_managers'] else 'No detectado'}")
    print(f"  • Carpeta Docs:    {info['carpetas']['docs']}")
    print(f"  • Rama activa:     {info['git']['rama_actual']}\n")

    config_file = raiz / "toolkit.config.json"
    config_data = leer_json(config_file) if config_file.exists() else {}

    config_data.setdefault("project", {})["name"] = info["nombre_proyecto"]
    config_data["project"].setdefault("description", f"Proyecto {info['nombre_proyecto']}")

    stack = config_data.setdefault("stack", {})
    if info["frontend"]:
        stack["frontend"] = info["frontend"]
    if info["ui_libraries"]:
        stack["ui_libraries"] = info["ui_libraries"]
    if info["css_framework"]:
        stack["css_framework"] = info["css_framework"]
    if info["backend"]:
        stack["backend"] = info["backend"]
    if info["databases"]:
        stack["databases"] = info["databases"]
    if info["orms"]:
        stack["orms"] = info["orms"]
    if info["package_managers"]:
        stack["package_managers"] = info["package_managers"]

    paths = config_data.setdefault("paths", {})
    if info["carpetas"]["frontend"]:
        paths["frontend_dir"] = info["carpetas"]["frontend"]
    if info["carpetas"]["backend"]:
        paths["backend_dir"] = info["carpetas"]["backend"]
    paths["docs_dir"] = info["carpetas"]["docs"]
    paths["manuals_dir"] = "docs/manuales"

    # Protección PII: NO guardar correos personales en toolkit.config.json por defecto
    if include_email and info["git"]["email"]:
        members = config_data.setdefault("team", {}).setdefault("members", [])
        if not any(info["git"]["email"] in m.get("emails", []) for m in members):
            members.append({"name": info["git"]["usuario"].upper(), "emails": [info["git"]["email"]]})
        print("ℹ️  Correo incluido en toolkit.config.json por --include-email.")
    else:
        print("🔒 Protección PII: no se guardó tu correo personal en toolkit.config.json (usa --include-email solo si lo autorizas explícitamente).")

    cloud = config_data.setdefault("cloud", {})
    if info["cloud"]["provider"]:
        cloud["provider"] = info["cloud"]["provider"]

    design = config_data.setdefault("design", {})
    design.setdefault("tokens_file", info["design"]["tokens_file"])
    design.setdefault("generated_css", info["design"]["generated_css"])
    design.setdefault("docs_md", info["design"]["docs_md"])
    design.setdefault("landing_dir", info["design"]["landing_dir"])
    design.setdefault("landing_scope", info["design"]["landing_scope"])
    design.setdefault("landing_tokens", info["design"]["landing_tokens"])
    design.setdefault("landing_evidence", info["design"]["landing_evidence"])
    if info["design"]["detected_css_files"]:
        design["detected_css_files"] = info["design"]["detected_css_files"]

    routes_cfg = config_data.setdefault("routes", {})
    routes_cfg.setdefault("map_file", "docs/arquitectura/routes-map.json")
    routes_cfg.setdefault("catalog_md", "docs/arquitectura/CATALOGO_RUTAS.md")
    routes_cfg.setdefault("plan_maestro", "docs/planeacion/plan-maestro.md")

    config_file.write_text(json.dumps(config_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"✅ Archivo de configuración generado: {config_file.name}")

    (raiz / info["carpetas"]["docs"]).mkdir(parents=True, exist_ok=True)
    (raiz / "docs/manuales").mkdir(parents=True, exist_ok=True)

    print("\n📋 Skills recomendadas y activas para este proyecto:")
    print("  ✓ /resolver-conflicto-merge ─ Resolución segura de conflictos Git")
    print("  ✓ /actualizar-contexto      ─ Documentación viva en " + info["carpetas"]["docs"])
    print("  ✓ /reporte-semanal-resumen  ─ Informe semanal desde Git")
    if info["frontend"]:
        print("  ✓ /frontend-review          ─ Auditoría de componentes (" + info["frontend"] + ")")
        print("  ✓ /enterprise-sidebar       ─ Sidebar empresarial (260/68px, Flyout, RBAC, WCAG 2.2 AA)")
        print("  ✓ /design-tokens-source     ─ Fuente única de identidad visual (colores, HSL, WCAG 2.2 AA, MDES)")
        print("  ✓ /responsividad            ─ Optimización móvil")
        print("  ✓ /motion-design-engineer   ─ Animaciones e ilustraciones SVG+CSS+JS (MDES)")
        print("  ✓ /system-state-screens     ─ Pantallas de estado, errores 4xx/5xx, offline y rutas")
    if info["backend"] or info["databases"]:
        print("  ✓ /mock-free-audit          ─ Auditoría anti-mock e integridad real con backend/BD")
        print("  ✓ /support-db               ─ Inspección viva del esquema y modelos")
        print("  ✓ /diccionario-datos        ─ Documentación de tablas y columnas")
    if info["cloud"]["provider"] == "cloudflare":
        print("  ✓ /cloudflare               ─ Skills oficiales de Cloudflare (external/cloudflare-skills)")
    print("  ✓ /crear-plan-maestro       ─ Plan Maestro de Arquitectura y Dominio (Información Primaria)")
    print("  ✓ /routes-architect         ─ Fuente única de rutas FE/API/WS, errores, logs y auditoría OpenAPI")
    print("  ✓ /change-governance        ─ Gobierno de cambios grandes (CHG-XXXX, métricas, PR y CHANGELOG_INTERNO)")
    print("  ✓ /crear-guia-tecnica       ─ Especificaciones técnicas")
    print("  ✓ /crear-manual-usuario     ─ Manual de usuario y exportación .docx")
    print("\n🎉 Entorno listo.")


if __name__ == "__main__":
    main()
