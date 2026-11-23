# Gobernanza de Base de Datos, Diccionario Vivo y Diagramas ER

## 1. Motores y ORMs Soportados Automáticamente por `db-guardian-cli.mjs`

| Fuente en el repo | Qué extrae automáticamente |
| :--- | :--- |
| **Migraciones / Esquemas SQL (`*.sql`)** | `CREATE TABLE`, `ALTER TABLE ... ADD/DROP COLUMN`, `PRIMARY KEY`, `UNIQUE`, `NOT NULL`, `REFERENCES tabla(col)`, `CREATE INDEX`, `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, `COMMENT ON TABLE/COLUMN` y `CREATE TYPE ... AS ENUM`. |
| **Prisma (`schema.prisma`)** | `model`, campos, tipos, `@id`, `@unique`, `?` (nullable), `@relation(fields: [...], references: [...])`, `@@index` y `enum`. |
| **Django ORM (`models.py`)** | `class X(models.Model)`, campos `models.*Field`, `ForeignKey`, `OneToOneField`, `ManyToManyField`, `db_table_comment` y `db_comment`. |
| **Drizzle / TypeORM (`*.entity.ts`, `*schema*.ts`)** | `pgTable('nombre', ...)`, `@Entity('nombre')`, columnas y referencias `.references(() => ...)`. |

## 2. Qué Registra Automáticamente cada Entrada `DB-XXXX`

Cada ejecución de `autopilot bd registrar` que detecta diferencias reales escribe un bloque trazable en `docs/bd/HISTORIAL_CAMBIOS_BD.md`:
- **ID:** `DB-0001`, `DB-0002`, ...
- **Fecha y Motivo:** timestamp ISO + `--motivo` (o `--ref CHG-XXXX`).
- **Tablas:** añadidas (`+`) y eliminadas (`-`, marcadas como destructivas).
- **Columnas:** añadidas (`+`), eliminadas (`-`, destructivas) y modificadas (`~`).
- **Relaciones FK:** añadidas (`+`) y eliminadas (`-`).
- **Índices y Políticas RLS:** añadidos/modificados.

## 3. Reglas de Seguridad y Auditoría (`auditar --strict`)

1. **Bloqueantes (`ERROR`):**
   - **Drift de esquema:** existen tablas, columnas o relaciones nuevas/modificadas en el código que aún no se registraron en `docs/bd/db-schema.json`.
   - **Operaciones destructivas:** `DROP TABLE`, `DROP COLUMN` o `TRUNCATE` detectadas en archivos SQL recientes sin bandera de autorización explícita (`--allow-destructive`).
   - **Tabla sin Primary Key:** toda tabla persistente debe declarar clave primaria explícita.
2. **Avisos (`WARN`):**
   - **FK sin índice:** columna `*_id` o referencia FK sin `CREATE INDEX` o `@@index` asociado.
   - **PII potencial sin cifrado/hash:** columnas llamadas `dni`, `password`, `clave`, `token`, `secret` sin sufijo `_hash`/`_cifrado`/`_encrypted`.
   - **Multi-tenant sin RLS:** si el proyecto usa `ENABLE ROW LEVEL SECURITY` y una tabla tiene `tenant_id` sin política RLS detectada.

## 4. Artefactos Generados en `docs/bd/`

- `docs/bd/db-schema.json` — Snapshot estructurado (fuente única legible por cualquier agente/CLI).
- `docs/bd/DICCIONARIO_BD.md` — Diccionario completo: **Diagrama ER en Mermaid (`erDiagram`)**, resumen de tablas, detalle columna por columna, matriz de relaciones FK, enums, índices y políticas RLS.
- `docs/bd/HISTORIAL_CAMBIOS_BD.md` — Bitácora cronológica de toda evolución del esquema (`DB-0001` en adelante).
