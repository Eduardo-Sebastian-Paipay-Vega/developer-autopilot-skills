#!/usr/bin/env node
/**
 * /db-guardian — Guardián Activo de Base de Datos, Diccionario Vivo, Diagrama ER e Historial
 * CLI sin dependencias (`extract`, `record`, `generate`, `audit` | `extraer`, `registrar`, `generar`, `auditar`)
 *
 * Soporta automáticamente:
 * - Migraciones / esquemas SQL (`*.sql`: PostgreSQL, MySQL, SQLite)
 * - Prisma (`schema.prisma`)
 * - Django ORM (`models.py`)
 *
 * Artefactos en `docs/bd/` (configurable vía `toolkit.config.json → database`):
 * - `db-schema.json`           (snapshot estructurado y fuente única)
 * - `DICCIONARIO_BD.md`        (Diccionario de Datos + Diagrama ER Mermaid + Matriz de Relaciones)
 * - `HISTORIAL_CAMBIOS_BD.md`  (Registro automático de cada cambio `DB-0001`, `DB-0002`...)
 *
 * Uso:
 *   node scripts/db-guardian-cli.mjs extract  [--dir <ruta>] [--json]
 *   node scripts/db-guardian-cli.mjs record   [--dir <ruta>] [--motivo "..."] [--ref "CHG-0001"] [--json]
 *   node scripts/db-guardian-cli.mjs generate [--dir <ruta>]
 *   node scripts/db-guardian-cli.mjs audit    [--dir <ruta>] [--strict] [--allow-destructive] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.angular', '.nuxt',
  'coverage', '.venv', 'venv', '__pycache__', '.claude',
]);

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) flags[k] = true;
      else { flags[k] = next; i++; }
    }
  }
  return flags;
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function walkFiles(dir, predicate) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(full, predicate));
    else if (predicate(full, e.name)) out.push(full);
  }
  return out;
}

function resolveDbPaths(root) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const db = tkConfig?.database || {};
  const bdDir = path.join(root, db.dir || path.join('docs', 'bd'));
  return {
    tkConfig,
    bdDir,
    schemaFile: path.join(root, db.schema_file || path.join('docs', 'bd', 'db-schema.json')),
    dictionaryMd: path.join(root, db.dictionary_md || path.join('docs', 'bd', 'DICCIONARIO_BD.md')),
    historyMd: path.join(root, db.history_md || path.join('docs', 'bd', 'HISTORIAL_CAMBIOS_BD.md')),
  };
}

function cleanIdent(raw) {
  return String(raw || '').replace(/["`[\]]/g, '').split('.').pop().trim();
}

/* -------------------- Extractores de Esquema (SQL, Prisma, Django) -------------------- */

function ensureTable(tablesMap, name, sourceFile) {
  if (!tablesMap.has(name)) {
    tablesMap.set(name, {
      name,
      comment: '',
      sourceFile,
      rlsEnabled: false,
      rlsPolicies: [],
      columns: [],
      indexes: [],
    });
  }
  return tablesMap.get(name);
}

function upsertColumn(table, colObj) {
  const idx = table.columns.findIndex((c) => c.name === colObj.name);
  if (idx === -1) table.columns.push(colObj);
  else table.columns[idx] = { ...table.columns[idx], ...colObj };
}

function splitTopLevelCommas(body) {
  const parts = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "'" && body[i - 1] !== '\\') inSingle = !inSingle;
    if (!inSingle) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSqlFiles(root, tablesMap, relations, enums, destructiveOps) {
  const sqlFiles = walkFiles(root, (_full, name) => name.toLowerCase().endsWith('.sql')).sort();
  for (const f of sqlFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const raw = fs.readFileSync(f, 'utf8');
    const noLineComments = raw.replace(/--[^\r\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

    // Detectar operaciones destructivas
    for (const [rx, label] of [
      [/\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([\w."`]+)/gi, 'DROP TABLE'],
      [/\bALTER\s+TABLE\s+[\w."`]+\s+DROP\s+(?:COLUMN\s+)?(?:IF\s+EXISTS\s+)?([\w"`]+)/gi, 'DROP COLUMN'],
      [/\bTRUNCATE\s+(?:TABLE\s+)?([\w."`]+)/gi, 'TRUNCATE'],
    ]) {
      let dm;
      while ((dm = rx.exec(noLineComments)) !== null) {
        destructiveOps.push({ op: label, target: cleanIdent(dm[1]), file: rel });
      }
    }

    // CREATE TYPE ... AS ENUM (...)
    const reEnum = /CREATE\s+TYPE\s+([\w."`]+)\s+AS\s+ENUM\s*\(([^)]+)\)/gi;
    let em;
    while ((em = reEnum.exec(noLineComments)) !== null) {
      const name = cleanIdent(em[1]);
      const vals = em[2].split(',').map((v) => v.trim().replace(/^'|'$/g, '')).filter(Boolean);
      enums[name] = { values: vals, file: rel };
    }

    // CREATE TABLE (...)
    const reTable = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."`]+)\s*\(([\s\S]*?)\)\s*;/gi;
    let tm;
    while ((tm = reTable.exec(noLineComments)) !== null) {
      const tName = cleanIdent(tm[1]);
      const table = ensureTable(tablesMap, tName, rel);
      const defs = splitTopLevelCommas(tm[2]);

      for (const def of defs) {
        if (!def) continue;
        // Table-level PRIMARY KEY
        const pkTable = def.match(/^(?:CONSTRAINT\s+[\w"`]+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkTable) {
          for (const pkCol of pkTable[1].split(',').map((c) => cleanIdent(c))) {
            const found = table.columns.find((c) => c.name === pkCol);
            if (found) found.pk = true;
          }
          continue;
        }
        // Table-level FOREIGN KEY
        const fkTable = def.match(/^(?:CONSTRAINT\s+[\w"`]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([\w."`]+)\s*\(([^)]+)\)/i);
        if (fkTable) {
          const srcCol = cleanIdent(fkTable[1]);
          const dstTable = cleanIdent(fkTable[2]);
          const dstCol = cleanIdent(fkTable[3]);
          relations.push({ fromTable: tName, fromColumn: srcCol, toTable: dstTable, toColumn: dstCol, file: rel });
          const found = table.columns.find((c) => c.name === srcCol);
          if (found) found.fk = `${dstTable}.${dstCol}`;
          continue;
        }
        if (/^(CONSTRAINT|UNIQUE|CHECK|EXCLUDE)\b/i.test(def)) continue;

        const colMatch = def.match(/^([\w"`]+)\s+([A-Za-z0-9_]+(?:\s*\([^)]*\))?(?:\[\])?)/);
        if (!colMatch) continue;
        const colName = cleanIdent(colMatch[1]);
        const colType = colMatch[2].trim();
        const isPk = /\bPRIMARY\s+KEY\b/i.test(def);
        const isUnique = /\bUNIQUE\b/i.test(def);
        const nullable = !(/\bNOT\s+NULL\b/i.test(def) || isPk);
        const refMatch = def.match(/\bREFERENCES\s+([\w."`]+)\s*\(([^)]+)\)/i);
        let fk = null;
        if (refMatch) {
          const dstTable = cleanIdent(refMatch[1]);
          const dstCol = cleanIdent(refMatch[2]);
          fk = `${dstTable}.${dstCol}`;
          relations.push({ fromTable: tName, fromColumn: colName, toTable: dstTable, toColumn: dstCol, file: rel });
        }
        upsertColumn(table, { name: colName, type: colType, pk: isPk, unique: isUnique, nullable, fk, comment: '' });
      }
    }

    // ALTER TABLE ADD COLUMN
    const reAlterAdd = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?([\w."`]+)\s+ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([\w"`]+)\s+([A-Za-z0-9_]+(?:\s*\([^)]*\))?)([^;]*);/gi;
    let am;
    while ((am = reAlterAdd.exec(noLineComments)) !== null) {
      const tName = cleanIdent(am[1]);
      const colName = cleanIdent(am[2]);
      const colType = am[3].trim();
      const rest = am[4] || '';
      const table = ensureTable(tablesMap, tName, rel);
      const refMatch = rest.match(/\bREFERENCES\s+([\w."`]+)\s*\(([^)]+)\)/i);
      let fk = null;
      if (refMatch) {
        const dstTable = cleanIdent(refMatch[1]);
        const dstCol = cleanIdent(refMatch[2]);
        fk = `${dstTable}.${dstCol}`;
        relations.push({ fromTable: tName, fromColumn: colName, toTable: dstTable, toColumn: dstCol, file: rel });
      }
      upsertColumn(table, {
        name: colName,
        type: colType,
        pk: /\bPRIMARY\s+KEY\b/i.test(rest),
        unique: /\bUNIQUE\b/i.test(rest),
        nullable: !/\bNOT\s+NULL\b/i.test(rest),
        fk,
        comment: '',
      });
    }

    // CREATE INDEX
    const reIdx = /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([\w"`]+)\s+ON\s+([\w."`]+)\s*(?:USING\s+\w+\s*)?\(([^)]+)\)/gi;
    let im;
    while ((im = reIdx.exec(noLineComments)) !== null) {
      const tName = cleanIdent(im[3]);
      const table = ensureTable(tablesMap, tName, rel);
      const cols = im[4].split(',').map((c) => cleanIdent(c.split(/\s+/)[0])).filter(Boolean);
      table.indexes.push({ name: cleanIdent(im[2]), columns: cols, unique: Boolean(im[1]), file: rel });
    }

    // RLS & Policies
    const reRls = /ALTER\s+TABLE\s+([\w."`]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
    let rm;
    while ((rm = reRls.exec(noLineComments)) !== null) {
      const table = ensureTable(tablesMap, cleanIdent(rm[1]), rel);
      table.rlsEnabled = true;
    }
    const rePol = /CREATE\s+POLICY\s+([\w"`]+)\s+ON\s+([\w."`]+)/gi;
    let pm;
    while ((pm = rePol.exec(noLineComments)) !== null) {
      const table = ensureTable(tablesMap, cleanIdent(pm[2]), rel);
      table.rlsEnabled = true;
      const pName = cleanIdent(pm[1]);
      if (!table.rlsPolicies.includes(pName)) table.rlsPolicies.push(pName);
    }

    // COMMENT ON TABLE / COLUMN
    const reComT = /COMMENT\s+ON\s+TABLE\s+([\w."`]+)\s+IS\s+'([^']*)'/gi;
    let ctm;
    while ((ctm = reComT.exec(noLineComments)) !== null) {
      const table = tablesMap.get(cleanIdent(ctm[1]));
      if (table) table.comment = ctm[2];
    }
    const reComC = /COMMENT\s+ON\s+COLUMN\s+([\w."`]+)\.([\w"`]+)\s+IS\s+'([^']*)'/gi;
    let ccm;
    while ((ccm = reComC.exec(noLineComments)) !== null) {
      const table = tablesMap.get(cleanIdent(ccm[1]));
      const col = table?.columns.find((c) => c.name === cleanIdent(ccm[2]));
      if (col) col.comment = ccm[3];
    }
  }
}

function parsePrismaFiles(root, tablesMap, relations, enums) {
  const prismaFiles = walkFiles(root, (_full, name) => name.endsWith('.prisma'));
  for (const f of prismaFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const txt = fs.readFileSync(f, 'utf8');

    const reEnum = /enum\s+(\w+)\s*\{([\s\S]*?)\}/g;
    let em;
    while ((em = reEnum.exec(txt)) !== null) {
      const vals = em[2].split(/\r?\n/).map((l) => l.replace(/\/\/.*$/, '').trim()).filter(Boolean);
      enums[em[1]] = { values: vals, file: rel };
    }

    const reModel = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
    let mm;
    while ((mm = reModel.exec(txt)) !== null) {
      const mName = mm[1];
      const table = ensureTable(tablesMap, mName, rel);
      for (const rawLine of mm[2].split(/\r?\n/)) {
        const line = rawLine.replace(/\/\/.*$/, '').trim();
        if (!line) continue;
        const idxMatch = line.match(/^@@index\(\s*\[([^\]]+)\]/);
        if (idxMatch) {
          const cols = idxMatch[1].split(',').map((c) => c.trim()).filter(Boolean);
          table.indexes.push({ name: `idx_${mName}_${cols.join('_')}`, columns: cols, unique: false, file: rel });
          continue;
        }
        if (line.startsWith('@@')) continue;

        const fieldMatch = line.match(/^(\w+)\s+([A-Za-z0-9_]+)(\?|\[\])?(.*)$/);
        if (!fieldMatch) continue;
        const [, fName, fType, mod, attrs] = fieldMatch;
        const relMatch = attrs.match(/@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\]/);
        if (relMatch) {
          const srcCol = relMatch[1].split(',')[0].trim();
          const dstCol = relMatch[2].split(',')[0].trim();
          relations.push({ fromTable: mName, fromColumn: srcCol, toTable: fType, toColumn: dstCol, file: rel });
          const existing = table.columns.find((c) => c.name === srcCol);
          if (existing) existing.fk = `${fType}.${dstCol}`;
          continue;
        }
        if (mod === '[]') continue;
        upsertColumn(table, {
          name: fName,
          type: fType,
          pk: /@id\b/.test(attrs),
          unique: /@unique\b/.test(attrs),
          nullable: mod === '?',
          fk: null,
          comment: '',
        });
      }
    }
  }
}

function parseDjangoModels(root, tablesMap, relations) {
  const pyFiles = walkFiles(root, (_full, name) => name === 'models.py');
  for (const f of pyFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const txt = fs.readFileSync(f, 'utf8');
    const classBlocks = txt.split(/(?=^class\s+\w+\s*\()/m);
    for (const block of classBlocks) {
      const hdr = block.match(/^class\s+(\w+)\s*\(([^)]*Model[^)]*)\)/);
      if (!hdr) continue;
      const mName = hdr[1];
      const table = ensureTable(tablesMap, mName, rel);
      const tCom = block.match(/db_table_comment\s*=\s*['"]([^'"]+)['"]/);
      if (tCom) table.comment = tCom[1];

      for (const line of block.split(/\r?\n/)) {
        const fm = line.match(/^\s{4}(\w+)\s*=\s*models\.(\w+)\(([^)]*)\)/);
        if (!fm) continue;
        const [, fName, fType, args] = fm;
        const cCom = args.match(/db_comment\s*=\s*['"]([^'"]+)['"]/);
        let fk = null;
        if (/^(ForeignKey|OneToOneField|ManyToManyField)$/.test(fType)) {
          const target = args.split(',')[0].trim().replace(/['"]/g, '');
          if (target) {
            fk = `${target}.id`;
            relations.push({ fromTable: mName, fromColumn: fName, toTable: target, toColumn: 'id', file: rel });
          }
        }
        upsertColumn(table, {
          name: fName,
          type: fType,
          pk: /primary_key\s*=\s*True/.test(args),
          unique: /unique\s*=\s*True/.test(args),
          nullable: /null\s*=\s*True/.test(args),
          fk,
          comment: cCom ? cCom[1] : '',
        });
      }
      // Django agrega `id` implícito si no hay primary_key explícito
      if (!table.columns.some((c) => c.pk)) {
        table.columns.unshift({ name: 'id', type: 'BigAutoField', pk: true, unique: true, nullable: false, fk: null, comment: 'PK implícita Django' });
      }
    }
  }
}

function extractSchema(root) {
  const tablesMap = new Map();
  const relations = [];
  const enums = {};
  const destructiveOps = [];

  parseSqlFiles(root, tablesMap, relations, enums, destructiveOps);
  parsePrismaFiles(root, tablesMap, relations, enums);
  parseDjangoModels(root, tablesMap, relations);

  // Deduplicar relaciones
  const relSeen = new Set();
  const uniqueRelations = [];
  for (const r of relations) {
    const k = `${r.fromTable}.${r.fromColumn}->${r.toTable}.${r.toColumn}`;
    if (!relSeen.has(k)) {
      relSeen.add(k);
      uniqueRelations.push(r);
    }
  }

  const tables = [...tablesMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    extractedAt: new Date().toISOString(),
    tablesCount: tables.length,
    relationsCount: uniqueRelations.length,
    enumsCount: Object.keys(enums).length,
    tables,
    relations: uniqueRelations.sort((a, b) => `${a.fromTable}.${a.fromColumn}`.localeCompare(`${b.fromTable}.${b.fromColumn}`)),
    enums,
    destructiveOps,
  };
}

/* -------------------- Diff Estructural Automático -------------------- */

function computeSchemaDiff(prevSchema, nextSchema) {
  const prevTables = new Map((prevSchema?.tables || []).map((t) => [t.name, t]));
  const nextTables = new Map((nextSchema?.tables || []).map((t) => [t.name, t]));

  const tablesAdded = [];
  const tablesRemoved = [];
  const columnsAdded = [];
  const columnsRemoved = [];
  const columnsModified = [];

  for (const [name, nt] of nextTables) {
    if (!prevTables.has(name)) {
      tablesAdded.push(name);
    } else {
      const pt = prevTables.get(name);
      const pCols = new Map((pt.columns || []).map((c) => [c.name, c]));
      const nCols = new Map((nt.columns || []).map((c) => [c.name, c]));
      for (const [cn, nc] of nCols) {
        if (!pCols.has(cn)) columnsAdded.push(`${name}.${cn} (${nc.type})`);
        else {
          const pc = pCols.get(cn);
          if (pc.type !== nc.type || pc.nullable !== nc.nullable) {
            columnsModified.push(`${name}.${cn}: ${pc.type} → ${nc.type}`);
          }
        }
      }
      for (const cn of pCols.keys()) {
        if (!nCols.has(cn)) columnsRemoved.push(`${name}.${cn}`);
      }
    }
  }
  for (const name of prevTables.keys()) {
    if (!nextTables.has(name)) tablesRemoved.push(name);
  }

  const prevRels = new Set((prevSchema?.relations || []).map((r) => `${r.fromTable}.${r.fromColumn} -> ${r.toTable}.${r.toColumn}`));
  const nextRels = new Set((nextSchema?.relations || []).map((r) => `${r.fromTable}.${r.fromColumn} -> ${r.toTable}.${r.toColumn}`));
  const relationsAdded = [...nextRels].filter((r) => !prevRels.has(r));
  const relationsRemoved = [...prevRels].filter((r) => !nextRels.has(r));

  const hasChanges = tablesAdded.length + tablesRemoved.length + columnsAdded.length + columnsRemoved.length + columnsModified.length + relationsAdded.length + relationsRemoved.length > 0;
  const isDestructive = tablesRemoved.length > 0 || columnsRemoved.length > 0;

  return {
    hasChanges,
    isDestructive,
    tablesAdded,
    tablesRemoved,
    columnsAdded,
    columnsRemoved,
    columnsModified,
    relationsAdded,
    relationsRemoved,
  };
}

/* -------------------- Generador de Diccionario Vivo + ER Mermaid -------------------- */

function sanitizeMermaidId(name) {
  return String(name || 'entity').replace(/[^A-Za-z0-9_]/g, '_');
}

function writeDictionaryAndHistory(root, paths, dbDoc) {
  fs.mkdirSync(paths.bdDir, { recursive: true });
  const tables = dbDoc.schema?.tables || [];
  const relations = dbDoc.schema?.relations || [];
  const enums = dbDoc.schema?.enums || {};

  // 1. DICCIONARIO_BD.md
  const lines = [
    `# Diccionario de Datos y Relaciones ER — ${dbDoc.project}`,
    '',
    `Fuente única viva generada automáticamente por \`/db-guardian\`. Última actualización: **${dbDoc.updatedAt}** · Tablas: **${tables.length}** · Relaciones FK: **${relations.length}** · Cambios registrados: **${(dbDoc.history || []).length}**.`,
    '',
    '---',
    '',
    '## 1. Diagrama Entidad-Relación (ER)',
    '',
    '```mermaid',
    'erDiagram',
  ];

  for (const t of tables) {
    const tid = sanitizeMermaidId(t.name);
    lines.push(`    ${tid} {`);
    for (const c of (t.columns || []).slice(0, 20)) {
      const safeType = String(c.type || 'text').replace(/[^A-Za-z0-9_]/g, '_');
      const keys = [c.pk ? 'PK' : '', c.fk ? 'FK' : ''].filter(Boolean).join(',');
      lines.push(`        ${safeType} ${sanitizeMermaidId(c.name)}${keys ? ` ${keys}` : ''}`);
    }
    lines.push('    }');
  }
  for (const r of relations) {
    lines.push(`    ${sanitizeMermaidId(r.toTable)} ||--o{ ${sanitizeMermaidId(r.fromTable)} : "${r.fromColumn}"`);
  }
  lines.push('```', '', '---', '', '## 2. Resumen de Tablas', '');

  if (tables.length) {
    lines.push('| Tabla | Columnas | FKs | Índices | RLS | Archivo fuente | Descripción |');
    lines.push('| :--- | :---: | :---: | :---: | :---: | :--- | :--- |');
    for (const t of tables) {
      const fkCount = (t.columns || []).filter((c) => c.fk).length;
      lines.push(`| \`${t.name}\` | ${(t.columns || []).length} | ${fkCount} | ${(t.indexes || []).length} | ${t.rlsEnabled ? '✅' : '—'} | \`${t.sourceFile || '—'}\` | ${t.comment || '—'} |`);
    }
  } else {
    lines.push('_No se detectaron tablas aún en el repositorio._');
  }

  lines.push('', '---', '', '## 3. Matriz Completa de Relaciones (FK)', '');
  if (relations.length) {
    lines.push('| Tabla Origen | Columna FK | Tabla Destino | Columna Destino | Fuente |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    for (const r of relations) {
      lines.push(`| \`${r.fromTable}\` | \`${r.fromColumn}\` | \`${r.toTable}\` | \`${r.toColumn}\` | \`${r.file}\` |`);
    }
  } else {
    lines.push('_Sin relaciones foráneas registradas._');
  }

  lines.push('', '---', '', '## 4. Detalle por Tabla (Diccionario de Datos)', '');
  for (const t of tables) {
    lines.push(`### \`${t.name}\`${t.comment ? ` — ${t.comment}` : ''}`);
    lines.push(`- **Fuente:** \`${t.sourceFile || '—'}\` · **RLS:** ${t.rlsEnabled ? `Activo (${(t.rlsPolicies || []).join(', ') || 'sin política nombrada'})` : 'No configurado'}`);
    lines.push('');
    lines.push('| Columna | Tipo | Restricciones | Relación FK | Descripción |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    for (const c of t.columns || []) {
      const cons = [c.pk ? 'PK' : '', c.unique ? 'UNIQUE' : '', c.nullable ? 'NULL' : 'NOT NULL'].filter(Boolean).join(', ');
      lines.push(`| \`${c.name}\` | \`${c.type}\` | ${cons} | ${c.fk ? `\`${c.fk}\`` : '—'} | ${c.comment || '—'} |`);
    }
    if ((t.indexes || []).length) {
      lines.push('', '**Índices:** ' + t.indexes.map((ix) => `\`${ix.name}\` (${ix.columns.join(', ')}${ix.unique ? ', UNIQUE' : ''})`).join(' · '));
    }
    lines.push('');
  }

  if (Object.keys(enums).length) {
    lines.push('---', '', '## 5. Enums del Esquema', '');
    for (const [eName, eObj] of Object.entries(enums)) {
      lines.push(`- **\`${eName}\`**: ${(eObj.values || []).map((v) => `\`${v}\``).join(', ')} *(${eObj.file})*`);
    }
    lines.push('');
  }

  fs.writeFileSync(paths.dictionaryMd, lines.join('\n'), 'utf8');

  // 2. HISTORIAL_CAMBIOS_BD.md
  const hLines = [
    `# Historial de Cambios de Base de Datos — ${dbDoc.project}`,
    '',
    'Bitácora automática generada por `/db-guardian` (`autopilot bd registrar`). Cada cambio estructural queda registrado con su diff exacto.',
    '',
  ];
  for (const entry of [...(dbDoc.history || [])].reverse()) {
    hLines.push(`## ${entry.id} — ${entry.date} ${entry.isDestructive ? '⚠️ DESTRUCTIVO' : ''}`);
    hLines.push(`- **Motivo:** ${entry.reason}${entry.ref ? ` · **Ref:** \`${entry.ref}\`` : ''}`);
    if (entry.diff.tablesAdded.length) hLines.push(`- **Tablas agregadas:** ${entry.diff.tablesAdded.map((x) => `\`${x}\``).join(', ')}`);
    if (entry.diff.tablesRemoved.length) hLines.push(`- **Tablas eliminadas:** ${entry.diff.tablesRemoved.map((x) => `\`${x}\``).join(', ')}`);
    if (entry.diff.columnsAdded.length) hLines.push(`- **Columnas agregadas:** ${entry.diff.columnsAdded.map((x) => `\`${x}\``).join(', ')}`);
    if (entry.diff.columnsRemoved.length) hLines.push(`- **Columnas eliminadas:** ${entry.diff.columnsRemoved.map((x) => `\`${x}\``).join(', ')}`);
    if (entry.diff.columnsModified.length) hLines.push(`- **Columnas modificadas:** ${entry.diff.columnsModified.map((x) => `\`${x}\``).join(', ')}`);
    if (entry.diff.relationsAdded.length) hLines.push(`- **Relaciones FK agregadas:** ${entry.diff.relationsAdded.map((x) => `\`${x}\``).join(', ')}`);
    if (entry.diff.relationsRemoved.length) hLines.push(`- **Relaciones FK eliminadas:** ${entry.diff.relationsRemoved.map((x) => `\`${x}\``).join(', ')}`);
    hLines.push('');
  }
  fs.writeFileSync(paths.historyMd, hLines.join('\n'), 'utf8');
}

/* -------------------- Subcomandos -------------------- */

function cmdExtract(root, asJson) {
  const schema = extractSchema(root);
  if (asJson) {
    console.log(JSON.stringify(schema, null, 2));
  } else {
    console.log(`=== Extracción Viva de Base de Datos: ${root} ===`);
    console.log(`Tablas: ${schema.tablesCount} · Relaciones FK: ${schema.relationsCount} · Enums: ${schema.enumsCount}`);
    for (const t of schema.tables) {
      console.log(`  • ${t.name} (${t.columns.length} cols, ${t.indexes.length} idx${t.rlsEnabled ? ', RLS' : ''}) — ${t.sourceFile}`);
    }
  }
}

function cmdRecord(root, flags) {
  const paths = resolveDbPaths(root);
  const existing = readJsonSafe(paths.schemaFile);
  const current = extractSchema(root);
  const diff = computeSchemaDiff(existing?.schema || null, current);

  const projectName = flags.name || existing?.project || paths.tkConfig?.project?.name || path.basename(root);
  const history = existing?.history || [];
  let entry = null;

  if (!existing || diff.hasChanges) {
    const nextNum = history.length + 1;
    entry = {
      id: `DB-${String(nextNum).padStart(4, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      reason: flags.motivo || flags.reason || (!existing ? 'Snapshot inicial del esquema de base de datos' : 'Actualización estructural del esquema'),
      ref: flags.ref || null,
      isDestructive: diff.isDestructive,
      diff,
    };
    history.push(entry);
  }

  const dbDoc = {
    project: projectName,
    updatedAt: new Date().toISOString().slice(0, 10),
    schema: current,
    history,
  };

  fs.mkdirSync(paths.bdDir, { recursive: true });
  fs.writeFileSync(paths.schemaFile, `${JSON.stringify(dbDoc, null, 2)}\n`, 'utf8');
  writeDictionaryAndHistory(root, paths, dbDoc);

  if (flags.json) {
    console.log(JSON.stringify({ recorded: Boolean(entry), entry, tablesCount: current.tablesCount, relationsCount: current.relationsCount }, null, 2));
  } else {
    if (entry) {
      console.log(`✅ Cambio registrado: ${entry.id} (${entry.reason})`);
      if (entry.isDestructive) console.warn('   ⚠️  ALERTA: se detectaron operaciones destructivas (tablas o columnas eliminadas).');
    } else {
      console.log('ℹ️  Sin cambios estructurales respecto al último snapshot. Diccionario sincronizado.');
    }
    console.log(`   • ${path.relative(root, paths.schemaFile)}`);
    console.log(`   • ${path.relative(root, paths.dictionaryMd)}`);
    console.log(`   • ${path.relative(root, paths.historyMd)}`);
  }
}

function cmdGenerate(root) {
  const paths = resolveDbPaths(root);
  const dbDoc = readJsonSafe(paths.schemaFile);
  if (!dbDoc) {
    console.error(`❌ No existe ${path.relative(root, paths.schemaFile)}. Ejecuta "autopilot bd registrar" primero.`);
    process.exit(2);
  }
  writeDictionaryAndHistory(root, paths, dbDoc);
  console.log(`✅ Regenerados ${path.relative(root, paths.dictionaryMd)} y ${path.relative(root, paths.historyMd)}`);
}

function cmdAudit(root, flags) {
  const paths = resolveDbPaths(root);
  const existing = readJsonSafe(paths.schemaFile);
  const current = extractSchema(root);
  const errors = [];
  const warnings = [];

  if (!existing) {
    errors.push(`Falta ${path.relative(root, paths.schemaFile)}. Ejecuta "autopilot bd registrar" para inicializar el guardián.`);
  } else {
    const diff = computeSchemaDiff(existing.schema, current);
    if (diff.hasChanges) {
      errors.push(`Drift detectado: el esquema actual difiere de ${path.relative(root, paths.schemaFile)} (+${diff.tablesAdded.length} tablas, +${diff.columnsAdded.length} cols, -${diff.tablesRemoved.length} tablas). Ejecuta "autopilot bd registrar".`);
    }
  }

  if (!flags['allow-destructive']) {
    for (const op of current.destructiveOps) {
      errors.push(`Operación destructiva detectada (${op.op} ${op.target}) en ${op.file}. Requiere autorización explícita (--allow-destructive).`);
    }
  }

  const anyRls = current.tables.some((t) => t.rlsEnabled);
  for (const t of current.tables) {
    if (!t.columns.some((c) => c.pk)) {
      errors.push(`Tabla "${t.name}" (${t.sourceFile}) no tiene Primary Key explícita.`);
    }
    const indexedCols = new Set(t.indexes.flatMap((ix) => ix.columns));
    for (const c of t.columns) {
      if (c.fk && !c.pk && !c.unique && !indexedCols.has(c.name)) {
        warnings.push(`FK sin índice explícito: ${t.name}.${c.name} → ${c.fk}.`);
      }
      if (/^(dni|password|clave|token|secret)$/i.test(c.name)) {
        warnings.push(`Columna potencialmente sensible sin sufijo de cifrado/hash: ${t.name}.${c.name}.`);
      }
    }
    if (anyRls && t.columns.some((c) => c.name === 'tenant_id') && !t.rlsEnabled) {
      warnings.push(`Tabla multi-tenant "${t.name}" tiene tenant_id pero no activa ROW LEVEL SECURITY.`);
    }
  }

  if (flags.json) {
    console.log(JSON.stringify({ tablesCount: current.tablesCount, relationsCount: current.relationsCount, errors, warnings }, null, 2));
  } else {
    console.log(`=== Auditoría de Guardián de Base de Datos (/db-guardian): ${root} ===`);
    console.log(`Tablas: ${current.tablesCount} · Relaciones FK: ${current.relationsCount}`);
    console.log(`Resumen: ${errors.length} errores bloqueantes, ${warnings.length} avisos.`);
    for (const e of errors) console.error(`  ERROR: ${e}`);
    for (const w of warnings.slice(0, 15)) console.warn(`  WARN:  ${w}`);
  }

  if (flags.strict && errors.length > 0) process.exit(1);
}

function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    console.log('Uso: node scripts/db-guardian-cli.mjs <extract|record|generate|audit | extraer|registrar|generar|auditar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'extract' || cmd === 'extraer') cmdExtract(root, Boolean(flags.json));
  else if (cmd === 'record' || cmd === 'registrar' || cmd === 'snapshot') cmdRecord(root, flags);
  else if (cmd === 'generate' || cmd === 'generar') cmdGenerate(root);
  else if (cmd === 'audit' || cmd === 'auditar') cmdAudit(root, flags);
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
