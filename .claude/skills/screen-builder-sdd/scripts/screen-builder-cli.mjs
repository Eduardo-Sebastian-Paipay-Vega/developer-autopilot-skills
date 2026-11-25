#!/usr/bin/env node
/**
 * /screen-builder-sdd — CLI sin dependencias (Herramienta #3 del Gestor de Frontend)
 * (`status`, `verify`, `mark` | `estado`, `verificar`, `marcar`)
 *
 * Verifica el código construido contra:
 * - Pre-flight documental (`00_relacional.md` + `01_frontend.md`)
 * - Cero hex hardcoded en Tailwind (`bg-[#...]`, `text-[#...]`, `border-[#...]`)
 * - Cero mezcla de librerías UI ajenas a `toolkit.config.json → stack.ui_libraries`
 * - Manejo de estados UI (`loading`/`skeleton`, `empty`/`error`)
 * - Actualización de progreso en `docs/frontend/screens-spec.json` (`SPEC` -> `UI_READY` -> `CONNECTED`)
 *
 * Uso:
 *   node scripts/screen-builder-cli.mjs status [--dir <ruta>] [--json]
 *   node scripts/screen-builder-cli.mjs verify [--dir <ruta>] [--screen <SCR-001|slug>] [--strict] [--json]
 *   node scripts/screen-builder-cli.mjs mark   [--dir <ruta>] --screen <SCR-001|slug> --status <SPEC|UI_READY|CONNECTED> [--stage <FRONTEND_FIRST_STUB|REAL_API>] [--file <ruta>]
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

function slugFromRoute(routePath) {
  if (!routePath || routePath === '/') return 'home';
  return String(routePath)
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/\[|\]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'screen';
}

function resolvePaths(root) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const feDir = path.join(root, tkConfig?.frontend_specs?.dir || path.join('docs', 'frontend'));
  return {
    tkConfig,
    feDir,
    specFile: path.join(root, tkConfig?.frontend_specs?.spec_file || path.join('docs', 'frontend', 'screens-spec.json')),
    pantallasDir: path.join(feDir, 'pantallas'),
    routesMapFile: path.join(root, tkConfig?.routes?.map_file || path.join('docs', 'arquitectura', 'routes-map.json')),
  };
}

function findScreen(screens, query) {
  if (!query) return null;
  const q = String(query).toLowerCase();
  return screens.find((s) =>
    s.id.toLowerCase() === q || slugFromRoute(s.path) === q || s.path.toLowerCase() === q
  ) || null;
}

function resolveCodeFile(root, screen, routesMap) {
  if (screen.file && fs.existsSync(path.join(root, screen.file))) return screen.file;
  const fromRoutes = (routesMap?.frontendRoutes || []).find((r) => r.path === screen.path);
  if (fromRoutes?.file && fs.existsSync(path.join(root, fromRoutes.file))) return fromRoutes.file;
  const cleanRoute = String(screen.path || '').replace(/^\/+/, '');
  for (const cand of [
    `frontend/app/${cleanRoute}/page.tsx`,
    `app/${cleanRoute}/page.tsx`,
    `src/app/${cleanRoute}/page.tsx`,
    `frontend/app/(intranet)/${cleanRoute}/page.tsx`,
    `frontend/app/(landing)/${cleanRoute}/page.tsx`,
  ]) {
    const norm = cand.replace(/\/+/g, '/');
    if (fs.existsSync(path.join(root, norm))) return norm;
  }
  return null;
}

function forbiddenUiImportPatterns(tkConfig, specDoc) {
  const libs = [
    ...(tkConfig?.stack?.ui_libraries || []),
    ...(specDoc?.stack?.ui_libraries || []),
  ].join(' ').toLowerCase();
  if (!libs) return [];
  const rules = [
    { key: 'primereact', rx: /from\s+['"]primereact(?:\/|['"])/i, label: 'primereact' },
    { key: 'primeng', rx: /from\s+['"]primeng(?:\/|['"])/i, label: 'primeng' },
    { key: 'mui', rx: /from\s+['"]@mui\/material(?:\/|['"])/i, label: '@mui/material' },
    { key: 'antd', rx: /from\s+['"]antd(?:\/|['"])/i, label: 'antd' },
  ];
  return rules.filter((r) => !libs.includes(r.key));
}

/* -------------------- Subcomando: status -------------------- */

function cmdStatus(root, asJson) {
  const paths = resolvePaths(root);
  const specDoc = readJsonSafe(paths.specFile);
  const routesMap = readJsonSafe(paths.routesMapFile);
  if (!specDoc) {
    console.error(`❌ No existe ${path.relative(root, paths.specFile)}.`);
    process.exit(2);
  }
  const rows = (specDoc.screens || []).map((s) => {
    const slug = slugFromRoute(s.path);
    const designed = fs.existsSync(path.join(paths.pantallasDir, slug, '00_relacional.md'))
      && fs.existsSync(path.join(paths.pantallasDir, slug, '01_frontend.md'));
    const codeFile = resolveCodeFile(root, s, routesMap);
    return { id: s.id, path: s.path, module: s.module, status: s.status, dataStage: s.dataStage, designed, codeFile };
  });

  const summary = {
    total: rows.length,
    designedCount: rows.filter((r) => r.designed).length,
    uiReadyCount: rows.filter((r) => r.status === 'UI_READY').length,
    connectedCount: rows.filter((r) => r.status === 'CONNECTED').length,
    rows,
  };

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`=== Estado Constructor Frontend-First (/screen-builder-sdd): ${root} ===`);
    console.log(`Total: ${summary.total} · Diseñadas (00+01): ${summary.designedCount} · UI_READY: ${summary.uiReadyCount} · CONNECTED: ${summary.connectedCount}`);
    for (const r of rows) {
      console.log(`  ${r.id} [${r.status}] ${r.path} · diseño=${r.designed ? '✅' : '❌'} · código=${r.codeFile || '(pendiente)'}`);
    }
  }
}

/* -------------------- Subcomando: verify -------------------- */

function cmdVerify(root, flags) {
  const paths = resolvePaths(root);
  const specDoc = readJsonSafe(paths.specFile);
  const routesMap = readJsonSafe(paths.routesMapFile);
  const errors = [];
  const warnings = [];
  let checkedFiles = 0;

  if (!specDoc || !Array.isArray(specDoc.screens)) {
    errors.push(`Falta ${path.relative(root, paths.specFile)}.`);
  } else {
    const targets = flags.screen
      ? [findScreen(specDoc.screens, flags.screen)].filter(Boolean)
      : specDoc.screens;
    if (flags.screen && !targets.length) {
      errors.push(`No se encontró la pantalla "${flags.screen}" en screens-spec.json.`);
    }

    const forbiddenLibs = forbiddenUiImportPatterns(paths.tkConfig, specDoc);
    const HARDCODED_HEX = /\b(?:text|bg|border|from|via|to|ring|fill|stroke)-\[#[0-9a-f]{3,8}\]/gi;

    for (const s of targets) {
      const slug = slugFromRoute(s.path);
      const hasRel = fs.existsSync(path.join(paths.pantallasDir, slug, '00_relacional.md'));
      const hasFe = fs.existsSync(path.join(paths.pantallasDir, slug, '01_frontend.md'));
      if (!hasRel || !hasFe) {
        errors.push(`${s.id} (${s.path}): falta diseño pre-flight (00_relacional.md o 01_frontend.md).`);
      }

      const codeRel = resolveCodeFile(root, s, routesMap);
      if (!codeRel) {
        if (s.status === 'UI_READY' || s.status === 'CONNECTED' || flags.screen) {
          errors.push(`${s.id} (${s.path}): no se encontró el archivo de código fuente en el repositorio.`);
        } else {
          warnings.push(`${s.id} (${s.path}): aún sin archivo de código implementado (estado ${s.status}).`);
        }
        continue;
      }

      checkedFiles++;
      const txt = fs.readFileSync(path.join(root, codeRel), 'utf8');
      const hexMatches = txt.match(HARDCODED_HEX);
      if (hexMatches) {
        errors.push(`${s.id} (${codeRel}): hex hardcoded detectado (${[...new Set(hexMatches)].join(', ')}) — usar tokens de design-tokens.json.`);
      }
      for (const fl of forbiddenLibs) {
        if (fl.rx.test(txt)) {
          errors.push(`${s.id} (${codeRel}): importa librería UI ajena "${fl.label}" no declarada en toolkit.config.json.`);
        }
      }
      if (!/(loading|skeleton|isLoading|spinner)/i.test(txt)) {
        warnings.push(`${s.id} (${codeRel}): no se detectó manejo explícito de estado Loading/Skeleton.`);
      }
      if (!/(error|empty|sin resultados|reintentar)/i.test(txt)) {
        warnings.push(`${s.id} (${codeRel}): no se detectó manejo explícito de estados Empty/Error.`);
      }
    }
  }

  if (flags.json) {
    console.log(JSON.stringify({ checkedFiles, errors, warnings }, null, 2));
  } else {
    console.log(`=== Verificación de Código Frontend-First (/screen-builder-sdd): ${root} ===`);
    console.log(`Archivos verificados: ${checkedFiles} · Errores: ${errors.length} · Avisos: ${warnings.length}`);
    for (const e of errors) console.error(`  ERROR: ${e}`);
    for (const w of warnings.slice(0, 15)) console.warn(`  WARN:  ${w}`);
  }

  if (flags.strict && errors.length > 0) process.exit(1);
}

/* -------------------- Subcomando: mark -------------------- */

function cmdMark(root, flags) {
  const paths = resolvePaths(root);
  const specDoc = readJsonSafe(paths.specFile);
  if (!specDoc || !Array.isArray(specDoc.screens)) {
    console.error(`❌ No existe ${path.relative(root, paths.specFile)}.`);
    process.exit(2);
  }
  const scr = findScreen(specDoc.screens, flags.screen);
  if (!scr) {
    console.error(`❌ No se encontró la pantalla "${flags.screen}".`);
    process.exit(2);
  }
  const validStatuses = ['SPEC', 'UI_READY', 'CONNECTED'];
  const st = String(flags.status || '').toUpperCase();
  if (!validStatuses.includes(st)) {
    console.error(`❌ Estado inválido "${flags.status}". Usa: ${validStatuses.join(' | ')}`);
    process.exit(2);
  }
  scr.status = st;
  if (flags.stage) scr.dataStage = String(flags.stage).toUpperCase();
  if (flags.file) scr.file = String(flags.file).replace(/\\/g, '/');
  specDoc.updatedAt = new Date().toISOString().slice(0, 10);

  fs.writeFileSync(paths.specFile, `${JSON.stringify(specDoc, null, 2)}\n`, 'utf8');
  console.log(`✅ Actualizado ${scr.id} (${scr.path}) → status=${scr.status}${scr.file ? ` · file=${scr.file}` : ''}`);
}

function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    console.log('Uso: node scripts/screen-builder-cli.mjs <status|verify|mark | estado|verificar|marcar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'status' || cmd === 'estado') cmdStatus(root, Boolean(flags.json));
  else if (cmd === 'verify' || cmd === 'verificar') cmdVerify(root, flags);
  else if (cmd === 'mark' || cmd === 'marcar') cmdMark(root, flags);
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
