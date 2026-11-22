#!/usr/bin/env node
/**
 * SIGCS — Change Registry CLI (0 dependencias)
 *
 * Subcomandos:
 *   init     [--dir <ruta>]                                      Inicializa .change-management/, docs/CHANGELOG_INTERNO.md y PR template (sin sobrescribir).
 *   add      --title "..." --type <TYPE> --criticality <C0..C4> [--dimensions "a,b"] [--modules "m1"] [--refs "RF-01"] [--dir <ruta>]
 *   metrics  [--dir <ruta>] [--json]                             Calcula métricas reales del registro de cambios.
 *   validate [--dir <ruta>] [--strict]                           Valida reglas CM-001..CM-016 sobre changes.json.
 */

import fs from 'node:fs';
import path from 'node:path';

const VALID_TYPES = [
  'FEATURE', 'ENHANCEMENT', 'BUGFIX', 'REFACTOR', 'ARCHITECTURE', 'UI/UX',
  'DATABASE', 'SECURITY', 'PERFORMANCE', 'INTEGRATION', 'DEPRECATION',
  'CONFIGURATION', 'DOCUMENTATION', 'HOTFIX',
];
const VALID_CRIT = ['C0', 'C1', 'C2', 'C3', 'C4'];
const VALID_STATES = [
  'DRAFT', 'PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS',
  'BLOCKED', 'IN_TESTING', 'READY_FOR_MERGE', 'RELEASED', 'VERIFIED', 'CLOSED',
  'ROLLED_BACK', 'DEFERRED',
];

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i++; }
    }
  }
  return flags;
}

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'cambio';
}

function branchPrefix(type) {
  if (type === 'BUGFIX' || type === 'HOTFIX') return 'fix';
  if (type === 'REFACTOR') return 'refactor';
  if (type === 'ARCHITECTURE') return 'architecture';
  if (type === 'DOCUMENTATION') return 'docs';
  return 'feature';
}

function commitPrefix(type) {
  if (type === 'BUGFIX' || type === 'HOTFIX') return 'fix';
  if (type === 'REFACTOR') return 'refactor';
  if (type === 'DOCUMENTATION') return 'docs';
  if (type === 'PERFORMANCE') return 'perf';
  if (type === 'CONFIGURATION') return 'chore';
  return 'feat';
}

function registryPaths(root) {
  const cmDir = path.join(root, '.change-management');
  return {
    cmDir,
    registryDir: path.join(cmDir, 'registry'),
    changesDir: path.join(cmDir, 'changes'),
    registryFile: path.join(cmDir, 'registry', 'changes.json'),
    changelogFile: path.join(root, 'docs', 'CHANGELOG_INTERNO.md'),
    prTemplateFile: path.join(root, '.github', 'pull_request_template.md'),
  };
}

function cmdInit(root) {
  const p = registryPaths(root);
  fs.mkdirSync(p.registryDir, { recursive: true });
  fs.mkdirSync(p.changesDir, { recursive: true });
  fs.mkdirSync(path.dirname(p.changelogFile), { recursive: true });
  fs.mkdirSync(path.dirname(p.prTemplateFile), { recursive: true });

  const created = [];
  if (!fs.existsSync(p.registryFile)) {
    fs.writeFileSync(p.registryFile, `${JSON.stringify({ version: '1.0.0', changes: [] }, null, 2)}\n`, 'utf8');
    created.push(path.relative(root, p.registryFile));
  }
  if (!fs.existsSync(p.changelogFile)) {
    const cl = [
      '# Registro Interno de Cambios (CHANGELOG INTERNO)',
      '',
      'Memoria técnica, funcional y de diseño del proyecto. Todo cambio `C2–C4` debe vincularse a su ficha `CHG-XXXX` en `.change-management/changes/`.',
      '',
      '---',
      '',
      '## [Unreleased]',
      '*(Agrega aquí los cambios del sprint en curso con su `CHG-XXXX`)*',
      '',
    ].join('\n');
    fs.writeFileSync(p.changelogFile, cl, 'utf8');
    created.push(path.relative(root, p.changelogFile));
  }
  if (!fs.existsSync(p.prTemplateFile)) {
    const pr = [
      '## Identificación del Cambio',
      '- **ID de Cambio:** `CHG-XXXX`',
      '- **Tipo / Criticidad:** `FEATURE | FIX | REFACTOR | ARCHITECTURE` · `C1 | C2 | C3 | C4`',
      '- **Requisitos / SDD / ADR:** ',
      '',
      '## Resumen (AS-IS → TO-BE)',
      '- **Antes:** ',
      '- **Ahora:** ',
      '',
      '## Impacto y Dimensiones Afectadas',
      '- [ ] Funcional / Reglas de negocio',
      '- [ ] Diseño UX/UI / Tokens / Navegación',
      '- [ ] Contratos API / Backend',
      '- [ ] Base de Datos / Migraciones',
      '- [ ] Seguridad / Roles RBAC',
      '',
      '## Evidencias y Verificación',
      '- [ ] Build / Lint / Typecheck sin errores',
      '- [ ] Pruebas ejecutadas (adjuntar salida o capturas)',
      '- [ ] `docs/CHANGELOG_INTERNO.md` y ficha `CHG-XXXX` actualizados',
      '- [ ] Estrategia de Rollback documentada (obligatorio en C3/C4)',
      '',
    ].join('\n');
    fs.writeFileSync(p.prTemplateFile, pr, 'utf8');
    created.push(path.relative(root, p.prTemplateFile));
  }

  console.log(`✅ SIGCS inicializado en ${root}`);
  if (created.length) console.log(`   Creados: ${created.join(', ')}`);
  else console.log('   (Todos los archivos base ya existían; no se sobrescribió ninguno).');
}

function cmdAdd(root, flags) {
  const title = (flags.title || '').trim();
  const type = (flags.type || 'FEATURE').toUpperCase();
  const criticality = (flags.criticality || 'C2').toUpperCase();

  if (!title) { console.error('❌ --title es obligatorio.'); process.exit(2); }
  if (!VALID_TYPES.includes(type)) { console.error(`❌ --type inválido (${VALID_TYPES.join(', ')}).`); process.exit(2); }
  if (!VALID_CRIT.includes(criticality)) { console.error(`❌ --criticality inválido (${VALID_CRIT.join(', ')}).`); process.exit(2); }

  const p = registryPaths(root);
  if (!fs.existsSync(p.registryFile)) cmdInit(root);

  const reg = JSON.parse(fs.readFileSync(p.registryFile, 'utf8'));
  const nextNum = reg.changes.reduce((max, c) => {
    const m = String(c.id || '').match(/^CHG-(\d+)$/);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0) + 1;
  const id = `CHG-${String(nextNum).padStart(4, '0')}`;
  const today = new Date().toISOString().slice(0, 10);
  const splitList = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);

  const entry = {
    id,
    title,
    date: today,
    type,
    criticality,
    status: 'PROPOSED',
    requester: flags.requester || 'Equipo',
    owner: flags.owner || 'Por asignar',
    approver: flags.approver || null,
    dimensions: splitList(flags.dimensions),
    modules: splitList(flags.modules),
    refs: splitList(flags.refs),
    breakingChange: Boolean(flags['breaking-change']),
    impactSummary: flags.impact || '',
    rollbackPlan: flags.rollback || '',
    evidences: [],
    git: {
      branch: `${branchPrefix(type)}/${id}-${slugify(title)}`,
      commitPrefix: `${commitPrefix(type)}(${id}): `,
      pr: null,
    },
    docSync: false,
    repoSync: false,
  };

  reg.changes.push(entry);
  fs.writeFileSync(p.registryFile, `${JSON.stringify(reg, null, 2)}\n`, 'utf8');

  const mdFile = path.join(p.changesDir, `${id}.md`);
  const md = [
    `# ${id} — ${title}`,
    '',
    `- **Fecha:** ${today}`,
    `- **Tipo:** \`${type}\` · **Criticidad:** \`${criticality}\` · **Estado:** \`PROPOSED\``,
    `- **Dimensiones:** ${entry.dimensions.join(', ') || 'Por definir'}`,
    `- **Módulos:** ${entry.modules.join(', ') || 'Por definir'}`,
    `- **Referencias (RF/SDD/ADR):** ${entry.refs.join(', ') || 'Ninguna'}`,
    `- **Rama sugerida:** \`${entry.git.branch}\``,
    `- **Prefijo commit:** \`${entry.git.commitPrefix}<descripción>\``,
    '',
    '## 1. Motivación y Estado (AS-IS → TO-BE)',
    '- **Motivación:** ',
    '- **Estado anterior (AS-IS):** ',
    '- **Estado esperado (TO-BE):** ',
    '',
    '## 2. Análisis de Impacto y Dependencias',
    '- **Archivos / Componentes afectados:** ',
    '- **Cambios UX/UI (tokens, estados, A11y):** ',
    '- **Contratos API / Base de Datos:** ',
    '',
    '## 3. Verificación y Evidencias',
    '- [ ] Pruebas ejecutadas y resultados reales adjuntos',
    '- [ ] `docs/CHANGELOG_INTERNO.md` actualizado',
    '',
    '## 4. Plan de Reversión (Rollback)',
    '- *(Obligatorio en C3 y C4)*',
    '',
  ].join('\n');
  fs.writeFileSync(mdFile, md, 'utf8');

  console.log(`✅ Registro creado: ${id} (${type} · ${criticality})`);
  console.log(`   Ficha:  ${path.relative(root, mdFile)}`);
  console.log(`   Rama:   ${entry.git.branch}`);
  console.log(`   Commit: ${entry.git.commitPrefix}${title.toLowerCase()}`);
}

function cmdMetrics(root, asJson) {
  const p = registryPaths(root);
  if (!fs.existsSync(p.registryFile)) {
    console.error(`❌ No existe ${p.registryFile}. Ejecuta "init" primero.`);
    process.exit(2);
  }
  const reg = JSON.parse(fs.readFileSync(p.registryFile, 'utf8'));
  const list = reg.changes || [];
  const total = list.length;
  const byCrit = Object.fromEntries(VALID_CRIT.map((c) => [c, list.filter((x) => x.criticality === c).length]));
  const byStatus = {};
  for (const c of list) byStatus[c.status] = (byStatus[c.status] || 0) + 1;

  const pct = (num, den) => (den === 0 ? 100 : Math.round((num / den) * 100));
  const relevant = list.filter((c) => ['C2', 'C3', 'C4'].includes(c.criticality));
  const withRefs = relevant.filter((c) => (c.refs || []).length > 0).length;
  const closedOrVerified = list.filter((c) => ['VERIFIED', 'CLOSED'].includes(c.status));
  const withDocSync = closedOrVerified.filter((c) => c.docSync === true).length;
  const withEvidences = closedOrVerified.filter((c) => (c.evidences || []).length > 0).length;
  const criticals = list.filter((c) => ['C3', 'C4'].includes(c.criticality));
  const criticalsWithRollback = criticals.filter((c) => (c.rollbackPlan || '').trim().length > 0).length;
  const rolledBack = list.filter((c) => c.status === 'ROLLED_BACK').length;

  const report = {
    totalChanges: total,
    byCriticality: byCrit,
    byStatus,
    kpis: {
      traceabilityPct: pct(withRefs, relevant.length),
      docSyncPct: pct(withDocSync, closedOrVerified.length),
      evidenceCoveragePct: pct(withEvidences, closedOrVerified.length),
      criticalRollbackCoveragePct: pct(criticalsWithRollback, criticals.length),
      rolledBackCount: rolledBack,
      blockedCount: byStatus.BLOCKED || 0,
    },
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('=== Métricas SIGCS (Change Governance) ===');
    console.log(`Total de cambios: ${total} (C0:${byCrit.C0} C1:${byCrit.C1} C2:${byCrit.C2} C3:${byCrit.C3} C4:${byCrit.C4})`);
    console.log(`Trazabilidad (C2–C4 con RF/SDD/ADR): ${report.kpis.traceabilityPct}%`);
    console.log(`Documentación sincronizada (cerrados): ${report.kpis.docSyncPct}%`);
    console.log(`Cobertura de evidencias (cerrados): ${report.kpis.evidenceCoveragePct}%`);
    console.log(`Rollback documentado (C3–C4): ${report.kpis.criticalRollbackCoveragePct}%`);
    console.log(`Revertidos: ${rolledBack} · Bloqueados: ${report.kpis.blockedCount}`);
  }
}

function cmdValidate(root, strict) {
  const p = registryPaths(root);
  if (!fs.existsSync(p.registryFile)) {
    console.error(`❌ No existe ${p.registryFile}.`);
    process.exit(2);
  }
  const reg = JSON.parse(fs.readFileSync(p.registryFile, 'utf8'));
  const errors = [];
  const warnings = [];
  const seenIds = new Set();

  for (const c of reg.changes || []) {
    if (!/^CHG-\d{4,}$/.test(c.id || '')) errors.push(`ID inválido: "${c.id}"`);
    if (seenIds.has(c.id)) errors.push(`ID duplicado: ${c.id}`);
    seenIds.add(c.id);
    if (!c.title) errors.push(`${c.id}: falta title.`);
    if (!VALID_TYPES.includes(c.type)) errors.push(`${c.id}: type inválido (${c.type}).`);
    if (!VALID_CRIT.includes(c.criticality)) errors.push(`${c.id}: criticality inválida (${c.criticality}).`);
    if (!VALID_STATES.includes(c.status)) errors.push(`${c.id}: status inválido (${c.status}).`);

    const isClosing = ['READY_FOR_MERGE', 'RELEASED', 'VERIFIED', 'CLOSED'].includes(c.status);
    if (isClosing && ['C2', 'C3', 'C4'].includes(c.criticality)) {
      if (!(c.evidences && c.evidences.length > 0)) errors.push(`${c.id} (CM-010): estado ${c.status} sin evidencias registradas.`);
      if (!c.docSync) errors.push(`${c.id} (CM-011): estado ${c.status} con docSync=false.`);
    }
    if (isClosing && ['C3', 'C4'].includes(c.criticality)) {
      if (!c.approver) errors.push(`${c.id} (CM-012): cambio ${c.criticality} sin aprobador.`);
      if (!(c.rollbackPlan || '').trim()) errors.push(`${c.id}: cambio ${c.criticality} sin plan de rollback.`);
    }
    if (['C2', 'C3', 'C4'].includes(c.criticality) && !(c.dimensions && c.dimensions.length > 0)) {
      warnings.push(`${c.id}: sin dimensiones afectadas declaradas.`);
    }
  }

  if (errors.length === 0) {
    console.log(`✅ Registro SIGCS válido (${(reg.changes || []).length} cambios, 0 errores, ${warnings.length} avisos).`);
  } else {
    console.error(`❌ Validación SIGCS fallida (${errors.length} errores, ${warnings.length} avisos):`);
    for (const e of errors) console.error(`   ERROR: ${e}`);
  }
  for (const w of warnings) console.warn(`   WARN:  ${w}`);

  if (strict && errors.length > 0) process.exit(1);
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help') {
    console.log('Uso: node scripts/change-registry.mjs <init|add|metrics|validate> [opciones]');
    process.exit(0);
  }
  if (cmd === 'init') cmdInit(root);
  else if (cmd === 'add') cmdAdd(root, flags);
  else if (cmd === 'metrics') cmdMetrics(root, Boolean(flags.json));
  else if (cmd === 'validate') cmdValidate(root, Boolean(flags.strict));
  else {
    console.error(`❌ Subcomando desconocido: ${cmd}`);
    process.exit(2);
  }
}

main();
