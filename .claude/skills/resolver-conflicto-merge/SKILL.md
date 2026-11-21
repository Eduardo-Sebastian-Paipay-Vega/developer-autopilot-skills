---
name: resolver-conflicto-merge
description: Resuelve un conflicto de merge o rebase de git de forma segura y verificada en cualquier repositorio, sin depender de diálogos gráficos de IDEs (como JetBrains o VS Code) que pueden inducir a errores por clics accidentales. Materializa los marcadores de conflicto con git, analiza y resuelve cada hunk conservando lo correcto de cada lado, audita con grep que no queden marcadores ni símbolos muertos, y ejecuta las validaciones y tests del proyecto antes de confirmar el commit de merge. Se invoca manualmente (/resolver-conflicto-merge).
---

# Resolver conflicto de merge y rebase en Git

Esta skill proporciona un procedimiento determinista, verificable y seguro para resolver conflictos de integración en Git desde la línea de comandos, eliminando la ambigüedad de herramientas visuales o extensiones de IDE.

## Principios Fundamentales

1. **Por qué surge un conflicto:** Ocurre cuando dos ramas modifican concurrentemente las mismas líneas o zonas adyacentes de un archivo. Si las modificaciones ocurren en secciones distintas, Git fusiona de forma automática. Un conflicto es evidencia de trabajo paralelo, no de un error de software.
2. **Evitar interfaces gráficas interactivas:** Si el entorno o IDE tiene abierto un asistente visual de merge (como "Merge Revisions" de JetBrains o el resolver de VS Code), cerrarlo o cancelar antes de continuar para evitar que sobreescriba cambios realizados en disco.
3. **No descartar lados a ciegas:** Nunca asumir que "ours" (la rama actual) o "theirs" (la rama que entra) tiene la verdad absoluta. La mayoría de los conflictos reales requieren combinar adiciones legítimas de ambas partes y descartar únicamente lo que fue explícitamente refactorizado o retirado.

---

## Flujo Operativo Paso a Paso

### 1. Diagnóstico del estado del repositorio

Determinar el tipo de operación en curso y listar los archivos en conflicto:

```bash
git status
test -f .git/MERGE_HEAD && echo "Estado: MERGE en curso" || echo "Estado: Sin merge"
test -d .git/rebase-merge -o -d .git/rebase-apply && echo "Estado: REBASE en curso" || echo "Estado: Sin rebase"
git diff --name-only --diff-filter=U   # Archivos sin resolver (Unmerged)
```

Confirmar la lista exacta de archivos en conflicto antes de proceder.

### 2. Materialización de marcadores de conflicto

Si los archivos no presentan marcadores claros en disco:

```bash
# Crear respaldo preventivo del archivo en conflicto
cp <archivo> "<archivo>.bak"

# Forzar escritura de marcadores estándar (ours / base / theirs)
git checkout --conflict=merge -- <archivo>

# Localizar los bloques de conflicto
grep -nE "<<<<<<<|>>>>>>>|^=======$" <archivo>
```

### 3. Resolución analítica de cada bloque (Hunk)

Por cada sección delimitada:
* `<<<<<<< ours`: Código de la rama local activa.
* `=======`: Separador de conflicto.
* `>>>>>>> theirs`: Código de la rama remota / entrante.

**Criterios de integración:**
* **Adiciones complementarias:** Si una rama agrega imports o funciones y la otra agrega otras distintas, conservar ambas en el orden adecuado.
* **Refactorizaciones:** Si una rama eliminó una función en desuso y la otra intentaba consumirla, verificar si existe un reemplazo implementado por la rama entrante.
* **Eliminar marcadores:** Al finalizar la edición, asegurar que ningún delimitador de conflicto permanezca en el archivo.

### 4. Verificación de limpieza e integridad

Comprobar que no quedaron residuos de conflicto ni dependencias rotas:

```bash
# 1. Asegurar ausencia total de marcadores
grep -nE "<<<<<<<|>>>>>>>|^=======$" <archivo>

# 2. Verificar imports o variables dudosas (1 coincidencia = solo importación, probable código muerto)
grep -nE "\b<simbolo>\b" <archivo>
```

**Ejecución de validaciones automáticas del proyecto:**
Detectar las herramientas configuradas en la raíz del proyecto y ejecutarlas:
* **Node / TypeScript / JavaScript:** `npm run build` o `npm test` / `pnpm run build` / `yarn build`.
* **Python:** `python -m pytest` o `python manage.py check` (si es Django) / `flake8` / `mypy`.
* **Rust:** `cargo check` / `cargo test`.
* **Go:** `go test ./...` / `go vet`.
* **Java / Kotlin:** `./gradlew check` o `mvn test`.

### 5. Finalización y Commit de Merge

Una vez validados todos los archivos:

```bash
# Marcar archivos como resueltos
git add <archivo-resuelto-1> <archivo-resuelto-2>

# Generar el commit de merge respetando el mensaje estándar de Git
git commit --no-edit
```

Verificar el historial resultante:
```bash
git status
git log --oneline -3
```

> [!NOTE]
> No realizar `git push` de forma automática. Siempre solicitar confirmación explícita del usuario antes de enviar cambios al repositorio remoto.

---

## Salida de Emergencia

Si la resolución se complica o se requiere restaurar el estado previo:
* Para merges: `git merge --abort`
* Para rebases: `git rebase --abort`

Ambos comandos devuelven el repositorio exactamente al estado en que se encontraba antes de iniciar la integración, sin pérdida de commits previos.

---

## Checklist de Finalización
- [ ] `git diff --name-only --diff-filter=U` no arroja archivos pendientes.
- [ ] No existen marcadores `<<<<<<<`, `=======` ni `>>>>>>>`.
- [ ] No se introdujeron imports huérfanos ni sintaxis rota.
- [ ] Las suites de pruebas, linters o builds locales compilan exitosamente.
- [ ] El commit de integración fue creado y registrado limpiamente en Git.
