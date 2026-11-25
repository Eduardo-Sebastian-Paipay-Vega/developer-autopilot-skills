#!/usr/bin/env node
/**
 * /screen-spec-architect — CLI sin dependencias del Gestor de Frontend (Frontend-First / SDD)
 * (`init`, `sync`, `generate`, `audit` | `iniciar`, `sincronizar`, `generar`, `auditar`)
 *
 * Conecta automáticamente con:
 * - `toolkit.config.json` (stack frontend, librería UI real)
 * - `docs/arquitectura/routes-map.json` (`/routes-architect`: rutas, módulos, RF, RBAC, endpoints)
 * - `docs/planeacion/plan-maestro.md` (`/crear-plan-maestro`: RF-XX y CU-XX)
 * - `docs/diseno/design-tokens.json` (`/design-tokens-source`: identidad visual)
 *
 * Artefactos en `docs/frontend/`:
 * - `screens-spec.json`         (fuente única estructurada de pantallas SCR-001..N)
 * - `00_INDICE_PANTALLAS.md`    (índice maestro agrupado por módulo)
 * - `modulos/<modulo>.md`       (especificación SDD completa por módulo lista para programar)
 *
 * Uso:
 *   node scripts/screens-cli.mjs init     [--dir <ruta>] [--name "Mi Proyecto"]
 *   node scripts/screens-cli.mjs sync     [--dir <ruta>] [--json]
 *   node scripts/screens-cli.mjs generate [--dir <ruta>]
 *   node scripts/screens-cli.mjs audit    [--dir <ruta>] [--strict] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';

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

function slugifyModule(name) {
  return String(name || 'general')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';
}

function titleFromPath(routePath) {
  if (routePath === '/') return 'Inicio / Portal Principal';
  const last = String(routePath).split('/').filter(Boolean).pop() || 'Pantalla';
  const clean = last.replace(/^\[|\]$/g, '').replace(/[-_]+/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function resolveScreenPaths(root) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const fsCfg = tkConfig?.frontend_specs || {};
  const rtCfg = tkConfig?.routes || {};
  const dsCfg = tkConfig?.design || {};

  const outDir = path.join(root, fsCfg.dir || path.join('docs', 'frontend'));
  return {
    tkConfig,
    outDir,
    modulesDir: path.join(outDir, 'modulos'),
    specFile: path.join(root, fsCfg.spec_file || path.join('docs', 'frontend', 'screens-spec.json')),
    indexMd: path.join(root, fsCfg.index_md || path.join('docs', 'frontend', '00_INDICE_PANTALLAS.md')),
    routesMap: path.join(root, rtCfg.map_file || path.join('docs', 'arquitectura', 'routes-map.json')),
    planMaestro: path.join(root, rtCfg.plan_maestro || path.join('docs', 'planeacion', 'plan-maestro.md')),
    designTokens: path.join(root, dsCfg.tokens_file || path.join('docs', 'diseno', 'design-tokens.json')),
  };
}

function extractPlanIds(planPath) {
  if (!fs.existsSync(planPath)) return { rfs: [], cus: [] };
  const txt = fs.readFileSync(planPath, 'utf8');
  const rfs = [...new Set(txt.match(/\bRF-\d{1,3}\b/g) || [])].sort();
  const cus = [...new Set(txt.match(/\bCU-[A-Z0-9-]+\b/g) || [])].sort();
  return { rfs, cus };
}

function buildScreenFromRoute(route, seqNum, uiLibs) {
  const group = route.group || 'internal';
  const layoutByGroup = {
    public: 'LandingShell (Portal Público aislado)',
    auth: 'AuthCardLayout (Centrado, sin sidebar)',
    internal: 'IntranetShell + EnterpriseSidebar (260/68px) + Vista Fija',
    terminal: 'TerminalFullScreenLayout (Offline-First)',
    system: 'SystemStateCenteredLayout (Error / Estado del sistema)',
  };
  const uiHint = (uiLibs && uiLibs.length) ? uiLibs.join(', ') : 'Librería UI del proyecto';

  return {
    id: `SCR-${String(seqNum).padStart(3, '0')}`,
    name: route.purpose || titleFromPath(route.path),
    path: route.path,
    module: route.module || (group === 'public' ? 'portal-publico' : group === 'system' ? 'sistema-errores' : 'core'),
    group,
    rf: Array.isArray(route.rf) ? route.rf : [],
    cu: [],
    roles: Array.isArray(route.roles) ? route.roles : (group === 'public' || group === 'auth' || group === 'system' ? ['publico'] : []),
    status: 'SPEC',
    dataStage: 'FRONTEND_FIRST_STUB',
    purpose: route.purpose || `Pantalla para la ruta ${route.path}.`,
    userFlow: [
      'Usuario accede a la ruta validando sesión/rol si aplica.',
      'Visualiza información principal o completa el formulario.',
      'Ejecuta la acción primaria y recibe confirmación o feedback de error.',
    ],
    layout: layoutByGroup[group] || 'AppShell',
    components: [
      `Header de pantalla + acciones (${uiHint})`,
      group === 'auth' ? 'Formulario validado con feedback de error' : 'Contenedor principal (Tabla/Cards/Detalle)',
    ],
    fields: [],
    states: {
      loading: 'Skeleton Screen replicando geometría real (/system-state-screens)',
      empty: 'Empty State con CTA contextual (first-use / no-results)',
      error: 'Manejo 400/401/403/500 con traceId y acción de recuperación',
      responsive: 'Móvil <768px: filtros apilados, formularios 1 columna y scroll horizontal en tablas (/responsividad)',
    },
    endpoints: [],
    acceptanceCriteria: [
      'Usa exclusivamente tokens de docs/diseno/design-tokens.json (cero hex hardcoded) con contraste WCAG 2.2 AA.',
      'Cubre estados Loading, Empty, Error y Success sin pantallas en blanco.',
      'Funciona en móvil (390px) y escritorio (1440px) sin desbordamiento horizontal.',
    ],
  };
}

/* -------------------- Subcomando: init -------------------- */

function cmdInit(root, projectName) {
  const paths = resolveScreenPaths(root);
  if (fs.existsSync(paths.specFile)) {
    console.log(`ℹ️  Ya existe ${path.relative(root, paths.specFile)}. Usa "sync" para incorporar rutas nuevas sin sobrescribir.`);
    return;
  }

  const routesMap = readJsonSafe(paths.routesMap);
  const planIds = extractPlanIds(paths.planMaestro);
  const uiLibs = paths.tkConfig?.stack?.ui_libraries || [];
  const frontendRoutes = routesMap?.frontendRoutes || [
    { path: '/', group: 'public', module: 'portal-publico', rf: ['RF-01'], roles: ['publico'], purpose: 'Inicio del portal público' },
    { path: '/login', group: 'auth', module: 'autenticacion', rf: ['RF-01'], roles: ['publico'], purpose: 'Inicio de sesión' },
  ];

  const screens = frontendRoutes.map((r, i) => buildScreenFromRoute(r, i + 1, uiLibs));
  const doc = {
    project: projectName || paths.tkConfig?.project?.name || routesMap?.project || path.basename(root),
    updatedAt: new Date().toISOString().slice(0, 10),
    stack: {
      frontend: paths.tkConfig?.stack?.frontend || 'Por detectar',
      ui_libraries: uiLibs,
      css_framework: paths.tkConfig?.stack?.css_framework || 'Por detectar',
    },
    sources: {
      routesMap: routesMap ? path.relative(root, paths.routesMap).replace(/\\/g, '/') : null,
      planMaestro: fs.existsSync(paths.planMaestro) ? path.relative(root, paths.planMaestro).replace(/\\/g, '/') : null,
      designTokens: fs.existsSync(paths.designTokens) ? path.relative(root, paths.designTokens).replace(/\\/g, '/') : null,
      detectedRfsCount: planIds.rfs.length,
      detectedCusCount: planIds.cus.length,
    },
    screens,
  };

  fs.mkdirSync(paths.outDir, { recursive: true });
  fs.writeFileSync(paths.specFile, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`✅ Especificación de pantallas creada: ${path.relative(root, paths.specFile)} (${screens.length} pantallas sembradas).`);
}

/* -------------------- Subcomando: sync -------------------- */

function cmdSync(root, asJson) {
  const paths = resolveScreenPaths(root);
  if (!fs.existsSync(paths.specFile)) {
    cmdInit(root, null);
  }
  const doc = JSON.parse(fs.readFileSync(paths.specFile, 'utf8'));
  const routesMap = readJsonSafe(paths.routesMap);
  if (!routesMap || !Array.isArray(routesMap.frontendRoutes)) {
    console.error(`❌ No se encontró ${path.relative(root, paths.routesMap)} con frontendRoutes.`);
    process.exit(2);
  }

  const existingPaths = new Set((doc.screens || []).map((s) => s.path));
  const uiLibs = doc.stack?.ui_libraries || paths.tkConfig?.stack?.ui_libraries || [];
  let seq = (doc.screens || []).length;
  const added = [];

  for (const r of routesMap.frontendRoutes) {
    if (!existingPaths.has(r.path)) {
      seq++;
      const scr = buildScreenFromRoute(r, seq, uiLibs);
      doc.screens.push(scr);
      existingPaths.add(r.path);
      added.push({ id: scr.id, path: scr.path, module: scr.module });
    }
  }

  doc.updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(paths.specFile, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');

  if (asJson) {
    console.log(JSON.stringify({ totalScreens: doc.screens.length, addedCount: added.length, added }, null, 2));
  } else {
    console.log(`✅ Sincronizado ${path.relative(root, paths.specFile)}: +${added.length} pantallas nuevas (total: ${doc.screens.length}).`);
  }
}

/* -------------------- Subcomando: generate -------------------- */

function cmdGenerate(root) {
  const paths = resolveScreenPaths(root);
  const doc = readJsonSafe(paths.specFile);
  if (!doc) {
    console.error(`❌ No existe ${path.relative(root, paths.specFile)}. Ejecuta "init" primero.`);
    process.exit(2);
  }

  fs.mkdirSync(paths.modulesDir, { recursive: true });
  const screens = doc.screens || [];
  const byModule = new Map();
  for (const s of screens) {
    const m = s.module || 'general';
    if (!byModule.has(m)) byModule.set(m, []);
    byModule.get(m).push(s);
  }

  // 1. Índice maestro
  const idxLines = [
    `# Índice Maestro de Pantallas (Frontend-First / SDD) — ${doc.project}`,
    '',
    `Fuente única: \`${path.relative(root, paths.specFile).replace(/\\/g, '/')}\` · Fecha: **${doc.updatedAt}** · Módulos: **${byModule.size}** · Pantallas: **${screens.length}**.`,
    '',
    '## Resumen por Módulo',
    '| Módulo | Pantallas | Archivo de Especificación |',
    '| :--- | :---: | :--- |',
  ];

  for (const [modName, modScreens] of byModule) {
    const slug = slugifyModule(modName);
    idxLines.push(`| **${modName}** | ${modScreens.length} | \`docs/frontend/modulos/${slug}.md\` |`);

    // 2. Documento SDD por módulo
    const mLines = [
      `# Especificación de Pantallas — Módulo: ${modName}`,
      '',
      `Proyecto: **${doc.project}** · Stack: \`${doc.stack?.frontend || 'Frontend'}\` (${(doc.stack?.ui_libraries || []).join(', ') || 'UI estándar'}) · Pantallas: **${modScreens.length}**.`,
      '',
      '---',
      '',
    ];

    for (const s of modScreens) {
      mLines.push(
        `## ${s.id} — ${s.name} (\`${s.path}\`)`,
        '',
        '### 1. Trazabilidad y Acceso',
        `- **Ruta URL:** \`${s.path}\` · **Grupo:** \`${s.group}\` · **Estado:** \`${s.status}\` · **Datos:** \`${s.dataStage}\``,
        `- **Requisitos Funcionales (RF):** ${(s.rf || []).join(', ') || 'Por asignar'}`,
        `- **Casos de Uso (CU):** ${(s.cu || []).join(', ') || 'Por asignar'}`,
        `- **Roles RBAC:** ${(s.roles || []).join(', ') || 'Por definir'}`,
        '',
        '### 2. Propósito y Flujo de Usuario',
        `- **Propósito:** ${s.purpose || '—'}`,
        ...(s.userFlow || []).map((step, i) => `${i + 1}. ${step}`),
        '',
        '### 3. Propuesta de Layout y Componentes',
        `- **Layout:** ${s.layout || '—'}`,
        ...(s.components || []).map((c) => `- ${c}`),
        '',
        '### 4. Campos / Columnas y Validaciones',
        ...(Array.isArray(s.fields) && s.fields.length
          ? [
            '| Campo | Tipo | Obligatorio | Validación | Origen |',
            '| :--- | :---: | :---: | :--- | :--- |',
            ...s.fields.map((f) => `| \`${f.name}\` | ${f.type || 'string'} | ${f.required ? 'Sí' : 'No'} | ${f.validation || '—'} | ${f.source || '—'} |`),
          ]
          : ['_Completar campos y validaciones antes de pasar a código productivo._']),
        '',
        '### 5. Estados UI y Responsividad',
        `- **Loading:** ${s.states?.loading || 'Skeleton Screen'}`,
        `- **Empty:** ${s.states?.empty || 'Empty State contextual'}`,
        `- **Error:** ${s.states?.error || 'ErrorScreen con traceId'}`,
        `- **Móvil (<768px):** ${s.states?.responsive || 'Apilado responsivo'}`,
        '',
        '### 6. Contrato Frontend-First y Criterios de Aceptación',
        `- **Endpoints previstos:** ${(s.endpoints || []).join(', ') || 'Definir desde routes-map.json'}`,
        ...(s.acceptanceCriteria || []).map((ac) => `- [ ] ${ac}`),
        '',
        '---',
        ''
      );
    }

    fs.writeFileSync(path.join(paths.modulesDir, `${slug}.md`), mLines.join('\n'), 'utf8');
  }

  idxLines.push('', '## Matriz Completa de Pantallas', '| ID | Ruta | Módulo | RF | CU | Roles | Estado | Datos |', '| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |');
  for (const s of screens) {
    idxLines.push(`| \`${s.id}\` | \`${s.path}\` | ${s.module} | ${(s.rf || []).join(', ') || '—'} | ${(s.cu || []).join(', ') || '—'} | ${(s.roles || []).join(', ') || '—'} | ${s.status} | ${s.dataStage} |`);
  }
  idxLines.push('');

  fs.writeFileSync(paths.indexMd, idxLines.join('\n'), 'utf8');
  console.log(`✅ Documentación SDD generada:`);
  console.log(`   • ${path.relative(root, paths.indexMd)}`);
  console.log(`   • ${byModule.size} archivos de módulo en ${path.relative(root, paths.modulesDir)}/`);
}

/* -------------------- Subcomando: audit -------------------- */

function cmdAudit(root, strict, asJson) {
  const paths = resolveScreenPaths(root);
  const doc = readJsonSafe(paths.specFile);
  const routesMap = readJsonSafe(paths.routesMap);
  const errors = [];
  const warnings = [];

  if (!doc) {
    errors.push(`Falta ${path.relative(root, paths.specFile)} (ejecuta "autopilot pantallas iniciar").`);
  }

  const screens = doc?.screens || [];
  const seenIds = new Set();
  const seenPaths = new Set();

  for (const s of screens) {
    if (seenIds.has(s.id)) errors.push(`ID de pantalla duplicado: ${s.id}`);
    seenIds.add(s.id);
    if (seenPaths.has(s.path)) errors.push(`Ruta de pantalla duplicada: ${s.path}`);
    seenPaths.add(s.path);

    if (s.group === 'internal' && (!s.rf || s.rf.length === 0) && (!s.cu || s.cu.length === 0)) {
      warnings.push(`${s.id} (${s.path}): pantalla interna sin trazabilidad RF ni CU.`);
    }
    if (s.group === 'internal' && (!s.roles || s.roles.length === 0)) {
      warnings.push(`${s.id} (${s.path}): pantalla interna sin roles RBAC definidos.`);
    }
    if (!Array.isArray(s.components) || s.components.length === 0) {
      warnings.push(`${s.id} (${s.path}): sin propuesta de componentes UI.`);
    }
    if (!Array.isArray(s.acceptanceCriteria) || s.acceptanceCriteria.length === 0) {
      warnings.push(`${s.id} (${s.path}): sin criterios de aceptación SDD.`);
    }
  }

  // Cobertura contra routes-map.json
  let totalRoutes = 0;
  let coveredRoutes = 0;
  if (routesMap && Array.isArray(routesMap.frontendRoutes)) {
    totalRoutes = routesMap.frontendRoutes.length;
    for (const r of routesMap.frontendRoutes) {
      if (seenPaths.has(r.path)) coveredRoutes++;
      else errors.push(`Ruta definida en routes-map.json sin especificación de pantalla: ${r.path} (ejecuta "autopilot pantallas sincronizar").`);
    }
  }

  const routeCoveragePct = totalRoutes > 0 ? Math.round((coveredRoutes / totalRoutes) * 100) : 100;
  const stubCount = screens.filter((s) => s.dataStage === 'FRONTEND_FIRST_STUB').length;
  const realApiCount = screens.filter((s) => s.dataStage === 'REAL_API').length;

  if (asJson) {
    console.log(JSON.stringify({ totalScreens: screens.length, routeCoveragePct, stubCount, realApiCount, errors, warnings }, null, 2));
  } else {
    console.log(`=== Auditoría de Especificaciones de Pantallas (/screen-spec-architect): ${root} ===`);
    console.log(`Pantallas: ${screens.length} · Cobertura de rutas: ${routeCoveragePct}% · Frontend-First Stub: ${stubCount} · API Real: ${realApiCount}`);
    console.log(`Resumen: ${errors.length} errores bloqueantes, ${warnings.length} avisos.`);
    for (const e of errors) console.error(`  ERROR: ${e}`);
    for (const w of warnings.slice(0, 15)) console.warn(`  WARN:  ${w}`);
  }

  if (strict && errors.length > 0) process.exit(1);
}

function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    console.log('Uso: node scripts/screens-cli.mjs <init|sync|generate|audit | iniciar|sincronizar|generar|auditar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'init' || cmd === 'iniciar') cmdInit(root, flags.name);
  else if (cmd === 'sync' || cmd === 'sincronizar') cmdSync(root, Boolean(flags.json));
  else if (cmd === 'generate' || cmd === 'generar') cmdGenerate(root);
  else if (cmd === 'audit' || cmd === 'auditar') cmdAudit(root, Boolean(flags.strict), Boolean(flags.json));
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
