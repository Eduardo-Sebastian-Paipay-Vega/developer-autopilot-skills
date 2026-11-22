#!/usr/bin/env node
/**
 * Design Tokens Source — CLI sin dependencias
 * (`init`, `extract`, `sync-landing`, `generate`, `audit`)
 *
 * Fuente única de verdad conectada con `toolkit.config.json` y `landing-design-guardian`:
 * - Convierte automáticamente Hex → HSL (para shadcn/ui y Tailwind) y rgb() → Hex.
 * - Lee evidencia real de navegador Nivel A (`.claude/landing-design/evidence/*.json` y `TOKENS.json`).
 * - Calcula ratios de contraste reales WCAG 2.2 AA (luminancia relativa W3C).
 * - Detecta variables CSS duplicadas en :root, divergencias CSS vs computed y hex sueltos en Tailwind.
 *
 * Uso:
 *   node scripts/tokens-cli.mjs init         [--dir <ruta>] [--name "Mi Proyecto"]
 *   node scripts/tokens-cli.mjs extract      [--dir <ruta>] [--json]
 *   node scripts/tokens-cli.mjs sync-landing [--dir <ruta>] [--json]
 *   node scripts/tokens-cli.mjs generate     [--dir <ruta>]
 *   node scripts/tokens-cli.mjs audit        [--dir <ruta>] [--strict] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.angular', '.nuxt', 'coverage']);

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

/* -------------------- Resolución automática vía toolkit.config.json -------------------- */

function resolveDesignPaths(root) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const d = tkConfig?.design || {};

  const configuredTokens = d.tokens_file ? path.join(root, d.tokens_file) : null;
  const docsTokens = path.join(root, 'docs', 'diseno', 'design-tokens.json');
  const rootTokens = path.join(root, 'design-tokens.json');

  let tokensPath = configuredTokens || docsTokens;
  if (configuredTokens && fs.existsSync(configuredTokens)) tokensPath = configuredTokens;
  else if (fs.existsSync(docsTokens)) tokensPath = docsTokens;
  else if (fs.existsSync(rootTokens)) tokensPath = rootTokens;
  else if (!configuredTokens) tokensPath = docsTokens;

  const generatedCss = path.join(root, d.generated_css || path.join('docs', 'diseno', 'design-tokens.generated.css'));
  const docsMd = path.join(root, d.docs_md || path.join('docs', 'diseno', 'DESIGN_TOKENS.md'));
  const landingDir = path.join(root, d.landing_dir || path.join('.claude', 'landing-design'));

  return {
    tkConfig,
    tokensPath,
    generatedCss,
    docsMd,
    landingDir,
    landingScope: path.join(landingDir, 'scope.json'),
    landingTokens: path.join(landingDir, 'TOKENS.json'),
    landingEvidenceDir: path.join(landingDir, 'evidence'),
    landingBridge: path.join(landingDir, 'tokens-bridge.json'),
  };
}

/* -------------------- Utilidades de color (Hex / rgb() -> RGB / HSL / WCAG) -------------------- */

function rgbStringToHex(val) {
  const m = String(val || '').match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (!m) return null;
  if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
  const toHex = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
}

function normalizeToHex(val) {
  const s = String(val || '').trim();
  if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(s)) {
    const clean = s.slice(1);
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    return `#${full.toUpperCase()}`;
  }
  return rgbStringToHex(s);
}

function hexToRgb(hex) {
  const clean = String(hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(clean)) return null;
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function hexToHslString(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const toLinear = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  if (l1 === null || l2 === null) return null;
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

function walkFiles(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(full, exts));
    else if (exts.some((ext) => e.name.endsWith(ext))) out.push(full);
  }
  return out;
}

/* -------------------- Puente con landing-design-guardian (Nivel A) -------------------- */

function readLandingGuardianData(paths) {
  const scope = readJsonSafe(paths.landingScope);
  const tokensJson = readJsonSafe(paths.landingTokens);
  const evidenceFiles = [];
  const rootVariables = {};
  const colorCounts = new Map();
  const loadedFonts = new Set();
  const capturedRoutes = new Set();

  if (fs.existsSync(paths.landingEvidenceDir)) {
    for (const f of fs.readdirSync(paths.landingEvidenceDir)) {
      if (!f.endsWith('.json') || f === 'manifest.json') continue;
      const full = path.join(paths.landingEvidenceDir, f);
      const data = readJsonSafe(full);
      if (!data) continue;
      evidenceFiles.push(f);
      if (data.requestedRoute) capturedRoutes.add(data.requestedRoute);

      if (data.rootVariables && typeof data.rootVariables === 'object') {
        for (const [k, v] of Object.entries(data.rootVariables)) {
          if (!rootVariables[k]) rootVariables[k] = String(v);
        }
      }
      if (Array.isArray(data.colorsObserved)) {
        for (const item of data.colorsObserved) {
          const hex = normalizeToHex(item?.value);
          if (!hex) continue;
          colorCounts.set(hex, (colorCounts.get(hex) || 0) + (Number(item?.count) || 1));
        }
      }
      if (Array.isArray(data.loadedFonts)) {
        for (const font of data.loadedFonts) {
          if (font?.family && (!font.status || font.status === 'loaded')) {
            loadedFonts.add(String(font.family).replace(/^["']|["']$/g, ''));
          }
        }
      }
    }
  }

  const topObservedColors = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([hex, count]) => ({ hex, count }));

  return {
    available: Boolean(scope || tokensJson || evidenceFiles.length > 0),
    hasScope: Boolean(scope),
    hasTokensJson: Boolean(tokensJson),
    evidenceFileCount: evidenceFiles.length,
    publicRoutes: scope?.publicRoutes || [...capturedRoutes],
    referenceRoute: scope?.referenceRoute || null,
    rootVariables,
    topObservedColors,
    loadedFonts: [...loadedFonts],
    tokensJson,
  };
}

/* -------------------- Subcomando: init -------------------- */

function cmdInit(root, projectName) {
  const paths = resolveDesignPaths(root);
  if (fs.existsSync(paths.tokensPath)) {
    console.log(`ℹ️  Ya existe ${path.relative(root, paths.tokensPath)}. No se sobrescribió.`);
    return;
  }
  const landing = readLandingGuardianData(paths);
  const template = {
    project: projectName || paths.tkConfig?.project?.name || path.basename(root),
    updatedAt: new Date().toISOString().slice(0, 10),
    colorSchemes: ['light'],
    brand: {
      primary: '#1D4ED8',
      primaryDark: '#1E3A8A',
      primaryDeep: '#172554',
      primaryLight: '#3B82F6',
      secondary: '#F8FAFC',
      accent: '#0EA5E9',
      surface: '#FFFFFF',
      bodyBg: '#FFFFFF',
      foreground: '#0F172A',
      muted: '#F1F5F9',
      mutedForeground: '#475569',
      border: '#E2E8F0',
    },
    utilities: {
      success: '#16A34A',
      error: '#DC2626',
      warning: '#D97706',
      info: '#2563EB',
    },
    landingOverrides: {
      containerSelector: '.landing-page',
      primary: '#1D4ED8',
      accent: '#0EA5E9',
      publicRoutes: landing.publicRoutes || [],
      observedColors: landing.topObservedColors.slice(0, 8),
      loadedFonts: landing.loadedFonts,
    },
    typography: {
      sans: landing.loadedFonts[0] ? `${landing.loadedFonts[0]}, system-ui, sans-serif` : 'Inter, system-ui, sans-serif',
      heading: landing.loadedFonts[1] || landing.loadedFonts[0]
        ? `${landing.loadedFonts[1] || landing.loadedFonts[0]}, system-ui, sans-serif`
        : 'Plus Jakarta Sans, Inter, sans-serif',
      display: landing.loadedFonts[1] || landing.loadedFonts[0]
        ? `${landing.loadedFonts[1] || landing.loadedFonts[0]}, system-ui, sans-serif`
        : 'Plus Jakarta Sans, Inter, sans-serif',
    },
    geometry: {
      radius: '0.75rem',
      sidebarExpanded: '260px',
      sidebarCollapsed: '68px',
    },
    focus: {
      outlineWidth: '3px',
      outlineOffset: '3px',
      outlineColor: '#3B82F6',
    },
    observations: [],
  };
  fs.mkdirSync(path.dirname(paths.tokensPath), { recursive: true });
  fs.writeFileSync(paths.tokensPath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  console.log(`✅ Plantilla creada: ${path.relative(root, paths.tokensPath)}`);
  if (landing.evidenceFileCount > 0) {
    console.log(`   🔗 Se precargaron ${landing.topObservedColors.length} colores y ${landing.loadedFonts.length} fuentes desde .claude/landing-design/evidence/.`);
  }
}

/* -------------------- Subcomando: extract -------------------- */

function extractFromProject(root) {
  const paths = resolveDesignPaths(root);
  const cssFiles = walkFiles(root, ['.css', '.scss']);
  const codeFiles = walkFiles(root, ['.tsx', '.jsx', '.ts', '.html', '.vue', '.svelte']);

  const cssVars = {};
  const duplicates = [];
  for (const f of cssFiles) {
    const rel = path.relative(root, f);
    if (rel.endsWith('design-tokens.generated.css')) continue;
    const txt = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const seenInFile = new Map();
    for (const [idx, line] of txt.split(/\r?\n/).entries()) {
      const m = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/);
      if (!m) continue;
      const [, name, value] = m;
      if (seenInFile.has(name)) {
        duplicates.push({ file: rel, line: idx + 1, token: name, firstLine: seenInFile.get(name), value: value.trim() });
      } else {
        seenInFile.set(name, idx + 1);
      }
      cssVars[name] = { value: value.trim(), file: rel, line: idx + 1 };
    }
  }

  const hardcodedHexInComponents = [];
  const HARDCODED_TW = /\b(?:text|bg|border|from|via|to|ring|fill|stroke)-\[#[0-9a-f]{3,8}\]/gi;
  for (const f of codeFiles) {
    const rel = path.relative(root, f);
    if (/\.(spec|test)\./i.test(rel)) continue;
    const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].match(HARDCODED_TW);
      if (matches) {
        hardcodedHexInComponents.push({ file: rel, line: i + 1, matches: [...new Set(matches)] });
      }
    }
  }

  const landing = readLandingGuardianData(paths);
  const computedDivergences = [];
  for (const [varName, computedVal] of Object.entries(landing.rootVariables)) {
    if (cssVars[varName] && cssVars[varName].value.toLowerCase() !== computedVal.toLowerCase()) {
      computedDivergences.push({
        token: varName,
        declared: cssVars[varName].value,
        computed: computedVal,
        file: cssVars[varName].file,
      });
    }
  }

  return {
    tokensFile: path.relative(root, paths.tokensPath),
    scannedCssFiles: cssFiles.length,
    scannedCodeFiles: codeFiles.length,
    totalCssVariables: Object.keys(cssVars).length,
    duplicateDeclarations: duplicates,
    hardcodedHexInComponents,
    variables: cssVars,
    landingGuardian: {
      available: landing.available,
      evidenceFileCount: landing.evidenceFileCount,
      publicRoutes: landing.publicRoutes,
      topObservedColors: landing.topObservedColors,
      loadedFonts: landing.loadedFonts,
      rootVariablesCount: Object.keys(landing.rootVariables).length,
      computedDivergences,
    },
  };
}

function cmdExtract(root, asJson) {
  const data = extractFromProject(root);
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`=== Extracción de Tokens Visuales: ${root} ===`);
    console.log(`Fuente configurada: ${data.tokensFile}`);
    console.log(`Archivos CSS/SCSS: ${data.scannedCssFiles} · Variables CSS encontradas: ${data.totalCssVariables}`);
    console.log(`Variables duplicadas en mismo archivo: ${data.duplicateDeclarations.length}`);
    for (const d of data.duplicateDeclarations.slice(0, 10)) {
      console.log(`  ⚠️  ${d.file}:${d.line} ${d.token} (primera vez en línea ${d.firstLine})`);
    }
    console.log(`Hex sueltos en clases Tailwind de componentes: ${data.hardcodedHexInComponents.length}`);
    for (const h of data.hardcodedHexInComponents.slice(0, 10)) {
      console.log(`  ⚠️  ${h.file}:${h.line} → ${h.matches.join(', ')}`);
    }
    if (data.landingGuardian.available) {
      console.log(`\n🔗 Evidencia Landing Design Guardian (Nivel A):`);
      console.log(`   Archivos de evidencia: ${data.landingGuardian.evidenceFileCount} · Rutas públicas: ${data.landingGuardian.publicRoutes.join(', ') || '(ninguna)'}`);
      console.log(`   Fuentes cargadas: ${data.landingGuardian.loadedFonts.join(', ') || '(ninguna)'}`);
      if (data.landingGuardian.topObservedColors.length) {
        const preview = data.landingGuardian.topObservedColors.slice(0, 6).map((c) => `${c.hex}(${c.count})`).join(', ');
        console.log(`   Colores computados más frecuentes: ${preview}`);
      }
      if (data.landingGuardian.computedDivergences.length) {
        console.log(`   ⚠️  Divergencias CSS declarado vs computed: ${data.landingGuardian.computedDivergences.length}`);
      }
    }
  }
}

/* -------------------- Subcomando: sync-landing -------------------- */

function cmdSyncLanding(root, asJson) {
  const paths = resolveDesignPaths(root);
  const landing = readLandingGuardianData(paths);
  if (!landing.available) {
    console.error('❌ No se encontró .claude/landing-design/ (scope.json, TOKENS.json o evidence/*.json).');
    console.error('   Ejecuta primero /landing-recopilar o capture-landing.mjs.');
    process.exit(2);
  }
  if (!fs.existsSync(paths.tokensPath)) {
    cmdInit(root, null);
  }

  const t = JSON.parse(fs.readFileSync(paths.tokensPath, 'utf8'));
  const prevLanding = t.landingOverrides || {};

  // Extrae primer color no blanco/negro si no había override explícito
  const chromatic = landing.topObservedColors.filter((c) => !['#FFFFFF', '#000000', '#FAFAFA', '#F5F5F5', '#111111', '#202020'].includes(c.hex));
  const tokensFromJsonPrimary = normalizeToHex(landing.tokensJson?.colors?.primary || landing.tokensJson?.brand?.primary);
  const tokensFromJsonAccent = normalizeToHex(landing.tokensJson?.colors?.accent || landing.tokensJson?.brand?.accent);

  t.landingOverrides = {
    ...prevLanding,
    containerSelector: prevLanding.containerSelector || '.landing-page',
    primary: tokensFromJsonPrimary || prevLanding.primary || chromatic[0]?.hex || t.brand?.primary,
    accent: tokensFromJsonAccent || prevLanding.accent || chromatic[1]?.hex || t.brand?.accent,
    publicRoutes: landing.publicRoutes,
    referenceRoute: landing.referenceRoute,
    observedColors: landing.topObservedColors.slice(0, 10),
    loadedFonts: landing.loadedFonts,
    computedRootVariables: landing.rootVariables,
    syncedFromLandingAt: new Date().toISOString().slice(0, 10),
  };
  t.updatedAt = new Date().toISOString().slice(0, 10);

  fs.writeFileSync(paths.tokensPath, `${JSON.stringify(t, null, 2)}\n`, 'utf8');

  const summary = {
    tokensFile: path.relative(root, paths.tokensPath),
    evidenceFileCount: landing.evidenceFileCount,
    publicRoutes: landing.publicRoutes,
    observedColorsImported: t.landingOverrides.observedColors.length,
    loadedFontsImported: t.landingOverrides.loadedFonts.length,
    computedRootVariablesImported: Object.keys(landing.rootVariables).length,
    internalBrandUntouched: true,
  };

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`✅ Sincronizado landing → ${summary.tokensFile} (sin contaminar paleta interna):`);
    console.log(`   • Colores computados importados: ${summary.observedColorsImported}`);
    console.log(`   • Fuentes cargadas: ${summary.loadedFontsImported}`);
    console.log(`   • Variables :root computadas: ${summary.computedRootVariablesImported}`);
  }
}

/* -------------------- Subcomando: generate -------------------- */

function cmdGenerate(root) {
  const paths = resolveDesignPaths(root);
  if (!fs.existsSync(paths.tokensPath)) {
    console.error(`❌ No existe ${path.relative(root, paths.tokensPath)}. Ejecuta "init" primero.`);
    process.exit(2);
  }
  const t = JSON.parse(fs.readFileSync(paths.tokensPath, 'utf8'));
  const b = t.brand || {};
  const u = t.utilities || {};
  const g = t.geometry || {};
  const f = t.focus || {};
  const l = t.landingOverrides || {};

  const hslPrimary = hexToHslString(b.primary) || '221 83% 53%';
  const hslSecondary = hexToHslString(b.secondary) || '210 40% 98%';
  const hslAccent = hexToHslString(b.accent) || '199 89% 48%';
  const hslDestructive = hexToHslString(u.error) || '0 72% 51%';
  const hslBg = hexToHslString(b.surface) || '0 0% 100%';
  const hslFg = hexToHslString(b.foreground) || '222 47% 11%';
  const hslMuted = hexToHslString(b.muted) || '210 40% 96%';
  const hslMutedFg = hexToHslString(b.mutedForeground) || '215 16% 47%';
  const hslBorder = hexToHslString(b.border) || '214 32% 91%';

  const cssOut = [
    `/* Generado automáticamente desde ${path.relative(root, paths.tokensPath)} (${t.project || 'proyecto'}) — NO editar a mano */`,
    ':root {',
    `  /* Identidad de marca */`,
    `  --brand-primary: ${b.primary};`,
    `  --brand-primary-dark: ${b.primaryDark || b.primary};`,
    `  --brand-primary-deep: ${b.primaryDeep || b.primaryDark || b.primary};`,
    `  --brand-primary-light: ${b.primaryLight || b.primary};`,
    `  --brand-secondary: ${b.secondary};`,
    `  --brand-accent: ${b.accent};`,
    `  --brand-surface: ${b.surface};`,
    `  --brand-body-bg: ${b.bodyBg || b.surface};`,
    '',
    `  /* Utilidades de estado */`,
    `  --utility-success: ${u.success};`,
    `  --utility-error: ${u.error};`,
    `  --utility-warning: ${u.warning};`,
    `  --utility-info: ${u.info};`,
    '',
    `  /* Tokens semánticos HSL (shadcn/ui + Tailwind) */`,
    `  --background: ${hslBg};`,
    `  --foreground: ${hslFg};`,
    `  --card: ${hslBg};`,
    `  --card-foreground: ${hslFg};`,
    `  --primary: ${hslPrimary};`,
    `  --primary-foreground: 0 0% 100%;`,
    `  --secondary: ${hslSecondary};`,
    `  --secondary-foreground: ${hslPrimary};`,
    `  --muted: ${hslMuted};`,
    `  --muted-foreground: ${hslMutedFg};`,
    `  --accent: ${hslAccent};`,
    `  --accent-foreground: ${hslPrimary};`,
    `  --destructive: ${hslDestructive};`,
    `  --destructive-foreground: 0 0% 100%;`,
    `  --border: ${hslBorder};`,
    `  --ring: ${hslPrimary};`,
    `  --radius: ${g.radius || '0.75rem'};`,
    '',
    `  /* Enterprise Sidebar */`,
    `  --sidebar-width-expanded: ${g.sidebarExpanded || '260px'};`,
    `  --sidebar-width-collapsed: ${g.sidebarCollapsed || '68px'};`,
    `  --sidebar-active-text: var(--brand-primary);`,
    `  --sidebar-active-bar: var(--brand-primary);`,
    '',
    `  /* Foco global */`,
    `  --focus-outline-width: ${f.outlineWidth || '3px'};`,
    `  --focus-outline-offset: ${f.outlineOffset || '3px'};`,
    `  --focus-outline-color: ${f.outlineColor || b.primaryLight || b.primary};`,
    '}',
    '',
    `/* Puente automático para motion-design-engineer (MDES) */`,
    `.mdes[data-motion-theme="brand"] {`,
    `  --motion-primary: ${b.primary};`,
    `  --motion-secondary: ${b.secondary};`,
    `  --motion-accent: ${b.accent};`,
    `  --motion-danger: ${u.error};`,
    `  --motion-surface: ${b.surface};`,
    `  --motion-stroke: ${b.primaryDeep || b.primaryDark || b.primary};`,
    '}',
    '',
    l.containerSelector ? [
      `/* Overrides aislados del portal público / landing */`,
      `${l.containerSelector} {`,
      `  --brand-primary: ${l.primary || b.primary};`,
      `  --brand-accent: ${l.accent || b.accent};`,
      '}',
      '',
    ].join('\n') : '',
  ].join('\n');

  fs.mkdirSync(path.dirname(paths.generatedCss), { recursive: true });
  fs.writeFileSync(paths.generatedCss, cssOut, 'utf8');

  const mdLines = [
    `# Datos de diseño — ${t.project || 'Proyecto'}`,
    '',
    `Fuente única de verdad generada desde \`${path.relative(root, paths.tokensPath)}\`. Fecha: ${t.updatedAt || new Date().toISOString().slice(0, 10)}. Esquemas: ${(t.colorSchemes || ['light']).join(', ')}.`,
    '',
    '## 1. Identidad de marca (sistema interno)',
    '| Rol | Hex | HSL (shadcn/ui) |',
    '| :--- | :---: | :---: |',
    `| Primario | \`${b.primary}\` | \`${hslPrimary}\` |`,
    `| Primario oscuro | \`${b.primaryDark || b.primary}\` | \`${hexToHslString(b.primaryDark || b.primary)}\` |`,
    `| Acento | \`${b.accent}\` | \`${hslAccent}\` |`,
    `| Superficie | \`${b.surface}\` | \`${hslBg}\` |`,
    `| Texto base | \`${b.foreground}\` | \`${hslFg}\` |`,
    '',
    '## 2. Estados y utilidades',
    `| Estado | Hex |`,
    `| :--- | :---: |`,
    `| Éxito | \`${u.success}\` |`,
    `| Error | \`${u.error}\` |`,
    `| Advertencia | \`${u.warning}\` |`,
    `| Información | \`${u.info}\` |`,
    '',
    '## 3. Portal público / Landing (scope aislado)',
    `- **Selector aislado:** \`${l.containerSelector || '.landing-page'}\``,
    `- **Primario landing:** \`${l.primary || b.primary}\` · **Acento landing:** \`${l.accent || b.accent}\``,
    ...(Array.isArray(l.publicRoutes) && l.publicRoutes.length ? [`- **Rutas públicas:** ${l.publicRoutes.map((r) => `\`${r}\``).join(', ')}`] : []),
    ...(Array.isArray(l.loadedFonts) && l.loadedFonts.length ? [`- **Fuentes reales detectadas (Nivel A):** ${l.loadedFonts.map((fn) => `\`${fn}\``).join(', ')}`] : []),
    '',
    '## 4. Tipografía, geometría y accesibilidad',
    `- **Sans:** \`${t.typography?.sans || 'system-ui'}\``,
    `- **Heading:** \`${t.typography?.heading || 'system-ui'}\``,
    `- **Radio base:** \`${g.radius || '0.75rem'}\` · **Sidebar:** \`${g.sidebarExpanded || '260px'}\` / \`${g.sidebarCollapsed || '68px'}\``,
    `- **Foco global:** \`${f.outlineWidth || '3px'} solid ${f.outlineColor || b.primary}\` (offset \`${f.outlineOffset || '3px'}\`)`,
    '',
  ];
  fs.mkdirSync(path.dirname(paths.docsMd), { recursive: true });
  fs.writeFileSync(paths.docsMd, mdLines.join('\n'), 'utf8');

  // Si existe .claude/landing-design/, publicar puente no destructivo tokens-bridge.json
  if (fs.existsSync(paths.landingDir)) {
    const bridge = {
      sourceOfTruth: path.relative(root, paths.tokensPath),
      generatedCss: path.relative(root, paths.generatedCss),
      updatedAt: t.updatedAt || new Date().toISOString().slice(0, 10),
      landingOverrides: l,
      typography: t.typography || {},
      focus: f,
    };
    fs.writeFileSync(paths.landingBridge, `${JSON.stringify(bridge, null, 2)}\n`, 'utf8');
  }

  console.log(`✅ Generados desde ${path.relative(root, paths.tokensPath)}:`);
  console.log(`   • ${path.relative(root, paths.generatedCss)}`);
  console.log(`   • ${path.relative(root, paths.docsMd)}`);
  if (fs.existsSync(paths.landingDir)) {
    console.log(`   • ${path.relative(root, paths.landingBridge)} (puente landing-design-guardian)`);
  }
}

/* -------------------- Subcomando: audit -------------------- */

function cmdAudit(root, strict, asJson) {
  const paths = resolveDesignPaths(root);
  const errors = [];
  const warnings = [];
  const contrastChecks = [];

  if (!fs.existsSync(paths.tokensPath)) {
    errors.push(`Falta ${path.relative(root, paths.tokensPath)} (ejecuta "autopilot tokens iniciar").`);
  } else {
    const t = JSON.parse(fs.readFileSync(paths.tokensPath, 'utf8'));
    const b = t.brand || {};
    const l = t.landingOverrides || {};
    const pairs = [
      { label: 'Texto base sobre superficie (WCAG AA ≥ 4.5)', fg: b.foreground, bg: b.surface, min: 4.5 },
      { label: 'Texto atenuado sobre superficie (WCAG AA ≥ 4.5)', fg: b.mutedForeground, bg: b.surface, min: 4.5 },
      { label: 'Blanco sobre primario interno (botones, WCAG AA ≥ 4.5)', fg: '#FFFFFF', bg: b.primary, min: 4.5 },
    ];
    if (l.primary && l.primary !== b.primary) {
      pairs.push({ label: 'Blanco sobre primario landing (CTA, WCAG AA ≥ 4.5)', fg: '#FFFFFF', bg: l.primary, min: 4.5 });
    }
    for (const pair of pairs) {
      if (!pair.fg || !pair.bg) continue;
      const ratio = contrastRatio(pair.fg, pair.bg);
      const ok = ratio !== null && ratio >= pair.min;
      contrastChecks.push({ ...pair, ratio, ok });
      if (!ok) {
        errors.push(`Contraste insuficiente (${ratio}:1 < ${pair.min}:1): ${pair.label} (${pair.fg} sobre ${pair.bg}).`);
      }
    }
  }

  const extracted = extractFromProject(root);
  for (const d of extracted.duplicateDeclarations) {
    warnings.push(`Token duplicado en ${d.file}:${d.line} (${d.token}, ya declarado en línea ${d.firstLine}).`);
  }
  for (const h of extracted.hardcodedHexInComponents) {
    warnings.push(`Hex suelto en ${h.file}:${h.line} (${h.matches.join(', ')}) — preferir tokens semánticos.`);
  }
  for (const div of extracted.landingGuardian.computedDivergences) {
    warnings.push(`Divergencia CSS vs navegador en ${div.token}: declarado "${div.declared}" (${div.file}) vs computed "${div.computed}".`);
  }

  if (asJson) {
    console.log(JSON.stringify({ errors, warnings, contrastChecks, landingGuardian: extracted.landingGuardian }, null, 2));
  } else {
    console.log(`=== Auditoría de Tokens & WCAG 2.2 AA: ${root} ===`);
    for (const c of contrastChecks) {
      console.log(`  ${c.ok ? '✅' : '❌'} ${c.label}: ${c.ratio}:1`);
    }
    console.log(`Resumen: ${errors.length} errores, ${warnings.length} avisos.`);
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
    console.log('Uso: node scripts/tokens-cli.mjs <init|extract|sync-landing|generate|audit | iniciar|extraer|sincronizar-landing|generar|auditar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'init' || cmd === 'iniciar') cmdInit(root, flags.name);
  else if (cmd === 'extract' || cmd === 'extraer') cmdExtract(root, Boolean(flags.json));
  else if (cmd === 'sync-landing' || cmd === 'sincronizar-landing') cmdSyncLanding(root, Boolean(flags.json));
  else if (cmd === 'generate' || cmd === 'generar') cmdGenerate(root);
  else if (cmd === 'audit' || cmd === 'auditar') cmdAudit(root, Boolean(flags.strict), Boolean(flags.json));
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
