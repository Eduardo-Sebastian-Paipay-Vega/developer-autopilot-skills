"""Recolector de actividad semanal de Git para reportes de avance.

Uso (desde la raíz del repositorio):
    python .claude/skills/reporte-semanal-resumen/recolectar.py [AAAA-MM-DD] [--sin-fetch]

La fecha opcional es cualquier día de la semana a reportar (por defecto, hoy).
Semana = domingo a sábado, por FECHA DE AUTORÍA del commit.
Imprime: persona, rango de fechas, commits de la semana actual y la anterior con sus
«zonas» (carpetas afectadas), cambios en working tree y pendientes de planes tocados.
"""
import datetime as dt
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]


def git(*args: str) -> str:
    r = subprocess.run(["git", *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.stdout


def cargar_alias_config() -> dict[str, list[str]]:
    """Carga alias de miembros desde toolkit.config.json o team.json si existen."""
    for ruta in ("toolkit.config.json", "team.json", ".claude/toolkit.config.json"):
        p = Path(ruta)
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                members = data.get("team", {}).get("members", [])
                if members:
                    return {m["name"]: m.get("emails", []) for m in members if "name" in m}
            except Exception:
                pass
    return {}


def zona(ruta: str) -> str | None:
    """Identifica el módulo o área afectada a partir de la ruta del archivo."""
    p = ruta.replace("\\", "/").split("/")
    if not p or not p[0]:
        return None

    primer = p[0].lower()
    if primer in ("frontend", "client", "ui", "web"):
        if len(p) > 2 and p[1] in ("src", "app"):
            return f"front:{p[2]}"
        return f"front:{p[1]}" if len(p) > 1 else "front:raiz"

    if primer in ("backend", "server", "api"):
        return f"back:{p[1]}" if len(p) > 1 and "." not in p[1] else "back:raiz"

    if primer in ("docs", "doc", "documentation"):
        return f"docs:{p[1]}" if len(p) > 1 else "docs:general"

    if primer in ("infra", "deploy", "k8s", "terraform"):
        return f"infra:{p[1]}" if len(p) > 1 else "infra:general"

    return primer


def rango_semana(dia: dt.date) -> tuple[dt.date, dt.date]:
    domingo = dia - dt.timedelta(days=(dia.weekday() + 1) % 7)
    return domingo, domingo + dt.timedelta(days=6)


def commits(correos: list[str], refs: list[str], desde: dt.date, hasta: dt.date) -> list[tuple]:
    autores = [f"--author={c}" for c in correos]
    salida = git("log", *refs, "--no-merges", *autores, f"--since={desde - dt.timedelta(days=45)}",
                 "--format=@@%h|%ad|%s", "--date=short", "--name-only")
    vistos, lista = set(), []
    for bloque in salida.split("@@")[1:]:
        lineas = [l for l in bloque.strip().splitlines() if l.strip()]
        if not lineas:
            continue
        partes = lineas[0].split("|", 2)
        if len(partes) < 3:
            continue
        h, fecha, asunto = partes
        if h in vistos or not (desde.isoformat() <= fecha <= hasta.isoformat()):
            continue
        vistos.add(h)
        zonas = sorted({z for z in (zona(f) for f in lineas[1:]) if z})
        planes = sorted({f for f in lineas[1:] if re.match(r".*(?:plan|roadmap).*\.md$", f, re.IGNORECASE)})
        lista.append((fecha, h, asunto, zonas, planes))
    return sorted(lista)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dia = dt.date.fromisoformat(args[0]) if args else dt.date.today()

    if "--sin-fetch" not in sys.argv:
        git("fetch", "--all", "-q")

    correo = git("config", "user.email").strip()
    nombre_git = git("config", "user.name").strip()

    alias_map = cargar_alias_config()
    persona = None
    correos_persona = [correo]

    if alias_map:
        for nombre, correos in alias_map.items():
            if correo in correos:
                persona = nombre
                correos_persona = correos
                break

    if not persona:
        persona = nombre_git or (correo.split("@")[0].upper() if correo else "DESARROLLADOR")

    # Detectar ramas principales disponibles
    candidatos_ref = ["dev", "origin/dev", "main", "origin/main", "master", "origin/master", "HEAD"]
    refs = [r for r in candidatos_ref if git("rev-parse", "--verify", "-q", r).strip()]
    if not refs:
        refs = ["HEAD"]

    desde, hasta = rango_semana(dia)
    desde_ant, hasta_ant = desde - dt.timedelta(days=7), desde - dt.timedelta(days=1)
    ahora = dt.datetime.now()
    hora = ahora.strftime("%I:%M %p").replace("AM", "a.m.").replace("PM", "p.m.")

    print(f"PERSONA: {persona} ({correo})")
    print(f"FECHA: {desde.day} de {MESES[desde.month - 1]} al {hasta.day} de {MESES[hasta.month - 1]} de {hasta.year}")
    print(f"HORA DE CORTE: {hora}")

    planes_tocados: set[str] = set()
    for titulo, (d, h) in (("ACTUAL", (desde, hasta)), ("ANTERIOR", (desde_ant, hasta_ant))):
        lista = commits(correos_persona, refs, d, h)
        print(f"\n=== {titulo} {d} a {h} ({len(lista)} commits)")
        for fecha, hsh, asunto, zonas, planes in lista:
            if zonas:
                print(f"{fecha} {hsh} {asunto}  [{', '.join(zonas[:6])}]")
            if titulo == "ACTUAL":
                planes_tocados.update(planes)

    sin_commitear = Counter()
    for linea in git("status", "--porcelain").splitlines():
        ruta = linea[3:].strip().strip('"').split(" -> ")[-1]
        z = zona(ruta)
        if z:
            sin_commitear[z] += 1
    print("\n=== TRABAJO EN CURSO (SIN COMMITEAR)")
    print(", ".join(f"{z}: {n}" for z, n in sin_commitear.most_common()) or "Sin cambios pendientes")

    if planes_tocados:
        print("\n=== PLANES DE TRABAJO TOCADOS")
        for plan in sorted(planes_tocados):
            p = Path(plan)
            if p.exists():
                texto = p.read_text(encoding="utf-8", errors="replace")
                m = re.search(r"\*\*(?:Siguiente trabajo|Pendiente|Next steps?):?\*\*:?\s*(.+)", texto, re.IGNORECASE)
                print(f"{plan}: {m.group(1)[:300] if m else 'En seguimiento'}")


if __name__ == "__main__":
    main()
