#!/usr/bin/env node
/**
 * Landing Page Optimization Engineering — CLI sin dependencias
 * (`init`, `audit-assets`, `baseline`, `compare`, `generate-lhci` |
 *  `iniciar`, `auditar-activos`, `linea-base`, `comparar`, `generar-lhci`)
 *
 * Conecta automáticamente con:
 * - `toolkit.config.json` (stack, proyecto, rutas)
 * - `.claude/landing-design/scope.json` (rutas públicas de la landing)
 * - `docs/arquitectura/routes-map.json` (aislamiento público/privado)
 * - `docs/seo/seo-config.json` (`/busqueda` para el pilar LP-05)
 *
 * Uso:
 *   node scripts/landing-opt-cli.mjs init          [--dir <ruta>] [--preset balanced|strict|flexible]
 *   node scripts/landing-opt-cli.mjs audit-assets  [--dir <ruta>] [--strict] [--json]
 *   node scripts/landing-opt-cli.mjs baseline      [--dir <ruta>] [--json]
 *   node scripts/landing-opt-cli.mjs compare       [--dir <ruta>] [--json]
 *   node scripts/landing-opt-cli.mjs generate-lhci [--dir <ruta>]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, '..');

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

function resolveOptPaths(root) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const o = tkConfig?.optimization || {};
  const d = tkConfig?.design || {};
  const s = tkConfig?.seo || {};
  const r = tkConfig?.routes || {};

  const optDir = path.join(root, o.dir || path.join('docs', 'optimizacion'));
  return {
    tkConfig,
    optDir,
    configFile: path.join(optDir, 'landing-opt.config.json'),
    baselineFile: path.join(optDir, 'baseline.json'),
    lhciFile: path.join(optDir, 'lighthouserc.generated.json'),
    landingScope: path.join(root, d.landing_scope || path.join('.claude', 'landing-design', 'scope.json')),
    seoConfig: path.join(root, s.config_file || path.join('docs', 'seo', 'seo-config.json')),
    routesMap: path.join(root, r.map_file || path.join('docs', 'arquitectura', 'routes-map.json')),
  };
}

function loadPreset(presetName) {
  const safe = ['strict', 'balanced', 'flexible'].includes(String(presetName || '').toLowerCase())
    ? String(presetName).toLowerCase()
    : 'balanced';
  return readJsonSafe(path.join(SKILL_ROOT, 'config', `${safe}.json`)) || {
    preset: 'balanced',
    budgets: {
      LCP_TARGET_MS: 2500, INP_TARGET_MS: 200, CLS_TARGET: 0.1,
      TTFB_TARGET_MS: 800, FCP_TARGET_MS: 1800, TBT_TARGET_MS: 200,
      INITIAL_TRANSFER_BUDGET_KB: 1000, INITIAL_JS_BUDGET_KB: 150,
      HERO_IMAGE_BUDGET_KB: 150, INITIAL_REQUESTS_BUDGET: 35,
    },
  };
}

/* -------------------- Subcomando: init -------------------- */

function cmdInit(root, flags) {
  const paths = resolveOptPaths(root);
  if (fs.existsSync(paths.configFile)) {
    console.log(`ℹ️  Ya existe ${path.relative(root, paths.configFile)}. No se sobrescribió.`);
    return;
  }

  const preset = loadPreset(flags.preset || 'balanced');
  const scope = readJsonSafe(paths.landingScope);
  const seoCfg = readJsonSafe(paths.seoConfig);
  const routesMap = readJsonSafe(paths.routesMap);

  const cfg = {
    project: paths.tkConfig?.project?.name || seoCfg?.project || routesMap?.project || path.basename(root),
    landingRoute: flags.route || scope?.referenceRoute || '/',
    publicRoutes: scope?.publicRoutes || ['/'],
    frontendStack: paths.tkConfig?.stack?.frontend || 'Por detectar',
    backendStack: paths.tkConfig?.stack?.backend || 'Ninguno / Por detectar',
    preset: preset.preset,
    updatedAt: new Date().toISOString().slice(0, 10),
    seoSkillBridge: {
      skill: '/busqueda',
      seoConfigFile: fs.existsSync(paths.seoConfig) ? path.relative(root, paths.seoConfig).replace(/\\/g, '/') : 'docs/seo/seo-config.json',
    },
    businessGoals: {
      PRIMARY_CONVERSION_GOAL: flags.goal || 'contacto',
      BASELINE_CONVERSION_RATE: null,
      note: 'Línea base comercial no disponible hasta conectar analítica real (RULE-003).',
    },
    budgets: preset.budgets,
    autonomy: preset.autonomy || {
      EXECUTION_MODE: 'audit',
      AUTONOMY_LEVEL: 'controlled',
      REQUIRE_BASELINE: true,
      REQUIRE_IMPLEMENTATION_APPROVAL: true,
    },
  };

  fs.mkdirSync(paths.optDir, { recursive: true });
  fs.writeFileSync(paths.configFile, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
  console.log(`✅ Configuración de optimización creada: ${path.relative(root, paths.configFile)} (preset: ${cfg.preset})`);
}

/* -------------------- Auditoría determinista de activos y HTML/JSX -------------------- */

function runAssetAudit(root) {
  const paths = resolveOptPaths(root);
  const cfg = readJsonSafe(paths.configFile) || { budgets: loadPreset('balanced').budgets, preset: 'balanced' };
  const budgets = cfg.budgets || loadPreset('balanced').budgets;
  const heroBudgetKb = Number(budgets.HERO_IMAGE_BUDGET_KB) || 150;

  const assetExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.woff2', '.woff', '.ttf', '.otf', '.mp4', '.webm']);
  const assetFiles = walkFiles(root, (_full, name) => assetExts.has(path.extname(name).toLowerCase()));

  const findings = [];
  let seq = 1;
  const addFinding = (prefix, category, severity, title, file, measured, impact, rootCause, recs) => {
    findings.push({
      id: `LP-${prefix}-${String(seq++).padStart(3, '0')}`,
      category,
      severity,
      title,
      evidence: { file, measured_value: measured, measured_impact: impact },
      root_cause: rootCause,
      recommendation: recs,
      requires_approval: true,
    });
  };

  let totalBytes = 0;
  let oversizedImages = 0;
  const assetInventory = [];

  for (const f of assetFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const ext = path.extname(f).toLowerCase();
    const sizeBytes = fs.statSync(f).size;
    const sizeKb = Math.round((sizeBytes / 1024) * 10) / 10;
    totalBytes += sizeBytes;
    assetInventory.push({ file: rel, ext, sizeKb });

    if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
      if (sizeKb > heroBudgetKb) {
        oversizedImages++;
        addFinding(
          'PERF', 'performance', 'critical',
          `Imagen sobredimensionada (${sizeKb} KB > presupuesto ${heroBudgetKb} KB)`,
          rel, `${sizeKb} KB`, 'Afecta directamente LCP y peso inicial en móvil.',
          `Archivo ${ext.toUpperCase()} sin compresión moderna ni variantes responsivas.`,
          ['Convertir a AVIF/WebP', 'Implementar srcset y sizes (480w/768w/1280w/1920w)', 'Validar con autopilot optimizar comparar']
        );
      } else if (sizeKb > 50) {
        const baseNoExt = f.slice(0, -ext.length);
        if (!fs.existsSync(`${baseNoExt}.webp`) && !fs.existsSync(`${baseNoExt}.avif`)) {
          addFinding(
            'ASSET', 'resources', 'medium',
            `Imagen en formato legacy sin variante WebP/AVIF (${sizeKb} KB)`,
            rel, `${sizeKb} KB`, 'Transferencia innecesaria en redes móviles.',
            `Formato ${ext.toUpperCase()} sin alternativa moderna.`,
            ['Generar versión WebP/AVIF manteniendo fallback compatible']
          );
        }
      }
    }

    if (['.ttf', '.otf'].includes(ext)) {
      addFinding(
        'FONT', 'resources', 'medium',
        `Fuente en formato pesado ${ext.toUpperCase()} (${sizeKb} KB)`,
        rel, `${sizeKb} KB`, 'Retrasa FCP/LCP y provoca FOIT/FOUT.',
        'Fuente no convertida a WOFF2 ni recortada (subsetting).',
        ['Convertir a WOFF2 con subsetting latino', 'Aplicar font-display: swap']
      );
    }
  }

  // Escanear código frontend para lazy en Hero, img sin dimensiones y scripts de terceros bloqueantes
  const codeFiles = walkFiles(root, (_full, name) => /\.(tsx|jsx|html|vue|svelte|astro)$/i.test(name));
  for (const f of codeFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    if (/\.(spec|test)\./i.test(rel)) continue;
    const txt = fs.readFileSync(f, 'utf8');

    const imgTags = txt.match(/<img\b[^>]*>/gi) || [];
    for (const tag of imgTags) {
      if (/loading\s*=\s*["']lazy["']/i.test(tag) && /(hero|banner|lcp|portada)/i.test(tag)) {
        addFinding(
          'LCP', 'performance', 'high',
          'Imagen Hero/LCP marcada con loading="lazy"',
          rel, tag.slice(0, 120), 'Retrasa artificialmente el elemento LCP principal.',
          'Carga diferida aplicada por error sobre un recurso above-the-fold.',
          ['Quitar loading="lazy" en la imagen Hero', 'Agregar fetchpriority="high" y dimensiones explícitas']
        );
      }
      if (!/\bwidth\s*=/i.test(tag) || !/\bheight\s*=/i.test(tag)) {
        addFinding(
          'CLS', 'frontend', 'medium',
          'Etiqueta <img> sin atributos width/height explícitos',
          rel, tag.slice(0, 120), 'Riesgo de Cumulative Layout Shift (CLS).',
          'Espacio no reservado antes de decodificar la imagen.',
          ['Definir width y height (o aspect-ratio CSS) en la imagen']
        );
      }
    }

    const thirdParty = txt.match(/<script\b[^>]*src=["'][^"']*(googletagmanager|fbevents|hotjar|tiktok|doubleclick)[^"']*["'][^>]*>/gi) || [];
    for (const sc of thirdParty) {
      if (!/\b(async|defer)\b/i.test(sc)) {
        addFinding(
          'JS', 'frontend', 'high',
          'Script de terceros síncrono bloqueando renderizado',
          rel, sc.slice(0, 120), 'Bloquea el hilo principal (TBT/INP) y retrasa FCP/LCP.',
          'Tag de tracking insertado sin defer/async ni carga tras interacción.',
          ['Agregar defer/async o cargar tras interacción / Web Worker']
        );
      }
    }
  }

  const totalAssetKb = Math.round((totalBytes / 1024) * 10) / 10;
  const criticalCount = findings.filter((x) => x.severity === 'critical').length;
  const highCount = findings.filter((x) => x.severity === 'high').length;

  return {
    preset: cfg.preset || 'balanced',
    totalAssets: assetInventory.length,
    totalAssetKb,
    oversizedImages,
    counts: { total: findings.length, critical: criticalCount, high: highCount },
    seoBridgeConfigured: fs.existsSync(paths.seoConfig),
    findings,
  };
}

function cmdAuditAssets(root, strict, asJson) {
  const res = runAssetAudit(root);
  if (asJson) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log(`=== Auditoría de Activos y Frontend de Landing (${res.preset}) ===`);
    console.log(`Activos escaneados: ${res.totalAssets} · Peso total: ${res.totalAssetKb} KB · Imágenes sobredimensionadas: ${res.oversizedImages}`);
    console.log(`Hallazgos: ${res.counts.total} (critical: ${res.counts.critical}, high: ${res.counts.high})`);
    for (const f of res.findings.slice(0, 15)) {
      console.log(`  [${f.id}] (${f.severity.toUpperCase()}) ${f.title} — ${f.evidence.file}`);
    }
    if (!res.seoBridgeConfigured) {
      console.log(`ℹ️  Pilar LP-05 (SEO): ejecuta "autopilot busqueda iniciar && autopilot busqueda auditar --strict" para auditar SEO.`);
    }
  }
  if (strict && (res.counts.critical > 0 || res.counts.high > 0)) process.exit(1);
}

/* -------------------- Subcomando: baseline & compare -------------------- */

function cmdBaseline(root, asJson) {
  const paths = resolveOptPaths(root);
  const audit = runAssetAudit(root);
  const snapshot = {
    capturedAt: new Date().toISOString(),
    preset: audit.preset,
    totalAssets: audit.totalAssets,
    totalAssetKb: audit.totalAssetKb,
    oversizedImages: audit.oversizedImages,
    counts: audit.counts,
    seoBridgeConfigured: audit.seoBridgeConfigured,
  };
  fs.mkdirSync(paths.optDir, { recursive: true });
  fs.writeFileSync(paths.baselineFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  if (asJson) console.log(JSON.stringify(snapshot, null, 2));
  else console.log(`✅ Línea base guardada en ${path.relative(root, paths.baselineFile)} (${snapshot.totalAssetKb} KB, ${snapshot.counts.total} hallazgos).`);
}

function cmdCompare(root, asJson) {
  const paths = resolveOptPaths(root);
  const base = readJsonSafe(paths.baselineFile);
  if (!base) {
    console.error(`❌ No existe ${path.relative(root, paths.baselineFile)}. Ejecuta "baseline" antes de comparar.`);
    process.exit(2);
  }
  const current = runAssetAudit(root);
  const diff = {
    baselineCapturedAt: base.capturedAt,
    comparedAt: new Date().toISOString(),
    before: { totalAssetKb: base.totalAssetKb, oversizedImages: base.oversizedImages, totalFindings: base.counts.total },
    after: { totalAssetKb: current.totalAssetKb, oversizedImages: current.oversizedImages, totalFindings: current.counts.total },
    delta: {
      totalAssetKb: Math.round((current.totalAssetKb - base.totalAssetKb) * 10) / 10,
      oversizedImages: current.oversizedImages - base.oversizedImages,
      totalFindings: current.counts.total - base.counts.total,
    },
    regressed: current.counts.critical > base.counts.critical || current.totalAssetKb > base.totalAssetKb * 1.1,
  };
  if (asJson) {
    console.log(JSON.stringify(diff, null, 2));
  } else {
    console.log(`=== Comparativa Antes vs Después (F2 vs F8) ===`);
    console.log(`  Peso activos: ${diff.before.totalAssetKb} KB → ${diff.after.totalAssetKb} KB (delta: ${diff.delta.totalAssetKb} KB)`);
    console.log(`  Imágenes sobredimensionadas: ${diff.before.oversizedImages} → ${diff.after.oversizedImages}`);
    console.log(`  Hallazgos totales: ${diff.before.totalFindings} → ${diff.after.totalFindings}`);
  }
}

/* -------------------- Subcomando: generate-lhci -------------------- */

function cmdGenerateLhci(root) {
  const paths = resolveOptPaths(root);
  const cfg = readJsonSafe(paths.configFile) || { landingRoute: '/', budgets: loadPreset('balanced').budgets, preset: 'balanced' };
  const b = cfg.budgets || loadPreset('balanced').budgets;
  const lhci = {
    ci: {
      collect: {
        url: [`http://localhost:3000${cfg.landingRoute || '/'}`],
        numberOfRuns: 3,
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: cfg.preset === 'strict' ? 0.95 : 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:seo': ['error', { minScore: 0.9 }],
          'largest-contentful-paint': ['error', { maxNumericValue: b.LCP_TARGET_MS || 2500 }],
          'cumulative-layout-shift': ['error', { maxNumericValue: b.CLS_TARGET || 0.1 }],
          'total-blocking-time': ['warn', { maxNumericValue: b.TBT_TARGET_MS || 200 }],
        },
      },
    },
  };
  fs.mkdirSync(paths.optDir, { recursive: true });
  fs.writeFileSync(paths.lhciFile, `${JSON.stringify(lhci, null, 2)}\n`, 'utf8');
  console.log(`✅ Generado candado CI/CD: ${path.relative(root, paths.lhciFile)} (preset: ${cfg.preset || 'balanced'})`);
}

function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    console.log('Uso: node scripts/landing-opt-cli.mjs <init|audit-assets|baseline|compare|generate-lhci | iniciar|auditar-activos|linea-base|comparar|generar-lhci> [opciones]');
    process.exit(0);
  }
  if (cmd === 'init' || cmd === 'iniciar') cmdInit(root, flags);
  else if (cmd === 'audit-assets' || cmd === 'auditar-activos') cmdAuditAssets(root, Boolean(flags.strict), Boolean(flags.json));
  else if (cmd === 'baseline' || cmd === 'linea-base') cmdBaseline(root, Boolean(flags.json));
  else if (cmd === 'compare' || cmd === 'comparar') cmdCompare(root, Boolean(flags.json));
  else if (cmd === 'generate-lhci' || cmd === 'generar-lhci') cmdGenerateLhci(root);
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
