---
name: db-guardian
description: Guardián activo de Base de Datos, Diccionario de Datos vivo, Diagrama ER (Mermaid) y Registro Automático de Cambios de Esquema (`DB-0001`, `DB-0002`...) para cualquier stack (SQL/PostgreSQL/MySQL/SQLite, Prisma, Django ORM, TypeORM, Drizzle). Cada vez que se crea o modifica una tabla, columna, relación FK, índice o política RLS, detecta el diff exacto contra el snapshot previo (`docs/bd/db-schema.json`), registra el cambio en `docs/bd/HISTORIAL_CAMBIOS_BD.md`, regenera `docs/bd/DICCIONARIO_BD.md` con su diagrama ER completo y audita riesgos destructivos (`DROP TABLE/COLUMN`, `TRUNCATE`, FKs sin índice, PII y drift). Incluye el CLI `scripts/db-guardian-cli.mjs` (`autopilot bd`). Úsala obligatoriamente ante cualquier cambio en modelos, migraciones o esquema SQL.
---

# `/db-guardian` — Guardián Activo de BD, Diccionario Vivo y Registro de Cambios

Mantiene la **base de datos siempre bajo control y documentada automáticamente**: cada vez que cambia una tabla, columna, relación foránea (FK), enum, índice o política RLS, el guardián calcula el **diff exacto**, lo guarda en el **historial inmutable (`DB-XXXX`)** y regenera el **Diccionario de Datos + Diagrama ER en Mermaid**.

> [!IMPORTANT]
> **Regla obligatoria del Guardián Activo:**
> 1. **Ningún cambio de esquema queda sin registro:** tras crear o editar migraciones SQL, `schema.prisma`, `models.py` o entidades TypeORM/Drizzle, ejecutar `autopilot bd registrar --motivo "..."`.
> 2. **Bloqueo anti-destrucción:** nunca ejecutar `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` ni `DELETE` sin `WHERE` sin autorización explícita y plan de respaldo/rollback.
> 3. **Fuente única viva:** `docs/bd/db-schema.json`, `docs/bd/DICCIONARIO_BD.md` y `docs/bd/HISTORIAL_CAMBIOS_BD.md`.
>
> Referencias (*progressive disclosure*):
> - `references/db-governance-and-er.md` — Reglas de integridad, detección de drift, protección anti-destrucción, RLS/PII y puente con `/support-db`, `/diccionario-datos` y `/change-governance`.
> - `scripts/db-guardian-cli.mjs` — CLI sin dependencias (`extract`, `record`, `generate`, `audit` | `extraer`, `registrar`, `generar`, `auditar`).

---

## Los 4 Modos de Operación

| Modo | Cuándo usarlo | Comando CLI |
| :--- | :--- | :--- |
| **1. Extraer esquema vivo** | Inspeccionar en solo lectura todas las tablas, columnas, tipos, FKs, índices y políticas RLS del repo actual. | `autopilot bd extraer` |
| **2. Registrar cambio (Guardián Activo)** | **Después de cada cambio en BD/migraciones/ORM:** calcula el diff exacto vs snapshot previo, agrega entrada `DB-XXXX` a `HISTORIAL_CAMBIOS_BD.md`, actualiza `db-schema.json` y regenera `DICCIONARIO_BD.md` + diagrama ER. | `autopilot bd registrar --motivo "Descripción del cambio"` |
| **3. Regenerar Diccionario + ER** | Reconstruir `docs/bd/DICCIONARIO_BD.md` (tablas, columnas, matriz de relaciones y `erDiagram` Mermaid) desde `db-schema.json`. | `autopilot bd generar` |
| **4. Auditar seguridad y drift** | Detectar **drift** (cambios de BD sin registrar), operaciones destructivas (`DROP`/`TRUNCATE`), tablas sin PK, FKs sin índice y exposición PII. | `autopilot bd auditar --strict` |

---

## Procedimiento Obligatorio ante Cualquier Cambio en BD (5 pasos)

### Paso 1: Inspección y Prevención antes de Tocar la BD
- Lee `toolkit.config.json` (`stack.databases`, `stack.orms`, `database`) y `docs/bd/db-schema.json` (si existe).
- Si vas a modificar modelos o crear una migración, verifica que no rompa relaciones existentes, contratos API (`/routes-architect`) ni políticas RLS.

### Paso 2: Aplicar la Migración / Cambio de Modelo de Forma Segura
- Prefiere cambios aditivos y reversibles (migración `up` + `down` o rollback documentado).
- Documenta siempre comentarios de negocio (`COMMENT ON TABLE/COLUMN`, `db_table_comment`/`db_comment` en Django, o comentarios en `schema.prisma`).
- Agrega índices explícitos a toda columna Foreign Key (`FK`) y columnas de búsqueda frecuente.

### Paso 3: Activar el Guardián (`registrar`)
Ejecuta inmediatamente tras el cambio:
```bash
autopilot bd registrar --motivo "Agrega tabla X / columna Y para RF-XX"
```
Esto ejecuta automáticamente:
1. Extracción real del esquema desde SQL / Prisma / Django / TypeORM / Drizzle.
2. **Diff estructural automático:** tablas añadidas/eliminadas, columnas añadidas/eliminadas/modificadas, relaciones FK añadidas/eliminadas, índices y políticas RLS.
3. Registro permanente **`DB-XXXX`** en `docs/bd/HISTORIAL_CAMBIOS_BD.md` (con fecha, motivo, archivos fuente y alerta si hubo operación destructiva).
4. Actualización de `docs/bd/db-schema.json` y regeneración completa de **`docs/bd/DICCIONARIO_BD.md`** con su **diagrama ER Mermaid (`erDiagram`)** y matriz de relaciones.

### Paso 4: Auditar Integridad, Drift y Seguridad (`auditar --strict`)
Ejecuta `autopilot bd auditar --strict` para comprobar:
- **Cero drift:** el código y las migraciones coinciden 100% con `docs/bd/db-schema.json`.
- **Cero destructivos no autorizados:** sin `DROP TABLE`, `DROP COLUMN` o `TRUNCATE` ocultos.
- **Integridad:** todas las tablas tienen PK, las FKs tienen índice y los campos sensibles (contraseña, DNI, token) cumplen convención de cifrado/hash.

### Paso 5: Conexión con el Ecosistema
- Para cambios de esquema medianos o grandes (`C2–C4`: nuevas tablas, alteraciones mayores, migraciones de datos), vincula el ID `DB-XXXX` con una ficha `/change-governance` (`CHG-XXXX`, Dimensión 07).
- Mantén `/support-db` (consultas en solo lectura) y `/diccionario-datos` sincronizados con `docs/bd/DICCIONARIO_BD.md`.
- Nunca ejecutes migraciones sobre producción ni hagas commits sin autorización explícita del usuario.
