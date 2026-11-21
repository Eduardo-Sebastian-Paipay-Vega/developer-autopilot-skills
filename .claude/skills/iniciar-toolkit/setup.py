"""Script de inicialización y adaptación del Toolkit en cualquier proyecto.

Inspecciona el repositorio actual, detecta el stack (frontend, backend, cloud, git),
genera automáticamente `toolkit.config.json` y activa la convivencia entre skills.

Uso:
    python .claude/skills/iniciar-toolkit/setup.py
    o
    python iniciar-toolkit/setup.py
"""

import json
import os
import subprocess
from pathlib import Path


def ejecutar_git(*args: str) -> str:
    try:
        r = subprocess.run(["git", *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
        return r.stdout.strip()
    except Exception:
        return ""


def detectar_stack(raiz: Path) -> dict:
    info = {
        "nombre_proyecto": raiz.name,
        "frontend": None,
        "backend": None,
        "base_datos": None,
        "carpetas": {
            "frontend": None,
            "backend": None,
            "docs": None
        },
        "cloud": {
            "provider": None
        },
        "git": {
            "usuario": ejecutar_git("config", "user.name") or "Desarrollador",
            "email": ejecutar_git("config", "user.email") or "",
            "rama_actual": ejecutar_git("branch", "--show-current") or "main"
        }
    }

    # 1. Detectar Frontend
    candidatos_front = ["frontend", "client", "ui", "web", "src/app", "."]
    for c in candidatos_front:
        p = raiz / c
        pkg = p / "package.json"
        if pkg.exists():
            try:
                data = json.loads(pkg.read_text(encoding="utf-8", errors="ignore"))
                deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                frame = "JavaScript/Node"
                if "@angular/core" in deps:
                    frame = "Angular"
                elif "react" in deps:
                    frame = "React"
                elif "vue" in deps:
                    frame = "Vue"
                elif "next" in deps:
                    frame = "Next.js"

                if "primeng" in deps:
                    frame += " + PrimeNG"
                elif "tailwindcss" in deps:
                    frame += " + TailwindCSS"

                info["frontend"] = frame
                info["carpetas"]["frontend"] = c if c != "." else ""
                break
            except Exception:
                pass

    # 2. Detectar Backend
    candidatos_back = ["backend", "server", "api", "BACKEND", "."]
    for c in candidatos_back:
        p = raiz / c
        if (p / "manage.py").exists():
            info["backend"] = "Django"
            info["carpetas"]["backend"] = c if c != "." else ""
            break
        if (p / "main.py").exists() or (p / "app.py").exists():
            info["backend"] = "Python (FastAPI / Flask)"
            info["carpetas"]["backend"] = c if c != "." else ""
            break
        if (p / "package.json").exists() and c not in [info["carpetas"]["frontend"]]:
            try:
                data = json.loads((p / "package.json").read_text(encoding="utf-8", errors="ignore"))
                deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                if "@nestjs/core" in deps:
                    info["backend"] = "NestJS"
                    info["carpetas"]["backend"] = c if c != "." else ""
                    break
                elif "express" in deps:
                    info["backend"] = "Express"
                    info["carpetas"]["backend"] = c if c != "." else ""
                    break
            except Exception:
                pass

    # 3. Detectar Landing / Sitio Público
    info["landing"] = False
    for cand in ["landing", "public", "website", "sitio", "src/pages/index.tsx", "src/app/page.tsx", "index.html"]:
        if (raiz / cand).exists():
            info["landing"] = True
            break
    for doc_cand in ["docs/arquitectura", "docs/architecture", "docs", "documentation"]:
        if (raiz / doc_cand).exists():
            info["carpetas"]["docs"] = doc_cand
            break
    if not info["carpetas"]["docs"]:
        info["carpetas"]["docs"] = "docs/arquitectura"

    # 4. Detectar Cloud / Despliegue
    if list(raiz.glob("*cloudbuild*.yaml")) or list(raiz.glob("Dockerfile")):
        info["cloud"]["provider"] = "gcp"

    return info


def main():
    raiz = Path.cwd()
    print("=" * 60)
    print(" 🚀 INICIALIZADOR DEL TOOLKIT DE SKILLS")
    print("=" * 60)
    print(f"Directorio de trabajo: {raiz}\n")

    info = detectar_stack(raiz)

    print("🔎 Diagnóstico detectado automáticamente:")
    print(f"  • Proyecto:  {info['nombre_proyecto']}")
    print(f"  • Frontend:  {info['frontend'] or 'No detectado / No aplica'}")
    print(f"  • Backend:   {info['backend'] or 'No detectado / No aplica'}")
    print(f"  • Carpeta Docs: {info['carpetas']['docs']}")
    print(f"  • Desarrollador Git: {info['git']['usuario']} <{info['git']['email']}>")
    print(f"  • Rama activa: {info['git']['rama_actual']}\n")

    # Generar o actualizar toolkit.config.json
    config_file = raiz / "toolkit.config.json"
    config_data = {}
    if config_file.exists():
        try:
            config_data = json.loads(config_file.read_text(encoding="utf-8"))
            print("ℹ️  Se encontró un 'toolkit.config.json' previo. Actualizando valores...")
        except Exception:
            pass

    config_data.setdefault("project", {})["name"] = info["nombre_proyecto"]
    config_data["project"].setdefault("description", f"Proyecto {info['nombre_proyecto']}")

    config_data.setdefault("paths", {})
    if info["carpetas"]["frontend"]:
        config_data["paths"]["frontend_dir"] = info["carpetas"]["frontend"]
    if info["carpetas"]["backend"]:
        config_data["paths"]["backend_dir"] = info["carpetas"]["backend"]
    config_data["paths"]["docs_dir"] = info["carpetas"]["docs"]
    config_data["paths"]["manuals_dir"] = "docs/manuales"

    config_data.setdefault("team", {}).setdefault("members", [])
    if info["git"]["email"]:
        ya_existe = any(info["git"]["email"] in m.get("emails", []) for m in config_data["team"]["members"])
        if not ya_existe:
            config_data["team"]["members"].append({
                "name": info["git"]["usuario"].upper(),
                "emails": [info["git"]["email"]]
            })

    config_data.setdefault("cloud", {})
    if info["cloud"]["provider"]:
        config_data["cloud"].setdefault("provider", info["cloud"]["provider"])
    config_data["cloud"].setdefault("region", "southamerica-west1")

    config_file.write_text(json.dumps(config_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ Archivo de configuración generado: {config_file.name}")

    # Asegurar carpetas base de documentación
    docs_path = raiz / info["carpetas"]["docs"]
    docs_path.mkdir(parents=True, exist_ok=True)
    manuals_path = raiz / "docs/manuales"
    manuals_path.mkdir(parents=True, exist_ok=True)

    print("\n📋 Skills recomendadas y activas para este proyecto:")
    print("  ✓ /resolver-conflicto-merge ─ Resolución segura de conflictos Git.")
    print("  ✓ /actualizar-contexto      ─ Documentación viva en " + info['carpetas']['docs'])
    print("  ✓ /reporte-semanal-resumen  ─ Informe de avances para " + info['git']['usuario'])

    if info["frontend"]:
        print("  ✓ /frontend-review          ─ Auditoría de componentes " + info["frontend"])
        print("  ✓ /responsividad            ─ Optimización móvil para " + info["frontend"])
        print("  ✓ /mejorar-vista-fija       ─ Tablas con scroll interno y sticky header")
        print("  ✓ /tabla-orden-dinamico     ─ Tablas interactivas")
        print("  ✓ /resaltar-fila-abierta    ─ Feedback de fila activa en modales")

    if info.get("landing") or info["frontend"]:
        print("  ✓ /landing-uniformizar      ─ Kit Landing Design Guardian (auditar, aplicar y verificar landing)")
        print("  ✓ /landing-recopilar        ─ Captura de tokens visuales y estilos del landing")

    if info["backend"]:
        print("  ✓ /support-db               ─ Inspección viva del esquema ORM")
        print("  ✓ /diccionario-datos        ─ Documentación de tablas y columnas")

    print("  ✓ /crear-plan-maestro       ─ Plan Maestro de Arquitectura y Dominio (Información Primaria)")
    print("  ✓ /crear-guia-tecnica       ─ Especificaciones técnicas en " + str(manuals_path))
    print("  ✓ /crear-manual-usuario     ─ Generación de manuales para clientes y exportación .docx")

    print("\n🎉 El entorno está listo y todas las skills ahora conviven sincronizadas.")


if __name__ == "__main__":
    main()
