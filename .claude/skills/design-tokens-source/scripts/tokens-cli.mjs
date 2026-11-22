#!/usr/bin/env node
/**
 * Design Tokens Source — CLI sin dependencias (`init`, `extract`, `generate`, `audit`)
 *
 * Fuente única de verdad para tokens visuales de Landing + Sistema Interno + MDES + Sidebar.
 * - Convierte automáticamente Hex → HSL (para shadcn/ui y Tailwind).
 * - Calcula ratios de contraste reales WCAG 2.2 AA (luminancia relativa W3C).
 * - Detecta variables CSS duplicadas en :root y valores hex sueltos en componentes.
 *
 * Uso:
 *   node scripts/tokens-cli.mjs init     [--dir <ruta>] [--name "Mi Proyecto"]
 *   node scripts/tokens-cli.mjs extract  [--dir <ruta>] [--json]
 *   node scripts/tokens-cli.mjs generate [--dir <ruta>]
 *   node scripts/tokens-cli.mjs audit    [--dir <ruta>] [--strict] [--json]
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

/* -------------------- Utilidades de color (Hex -> RGB / HSL / WCAG) -------------------- */

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

/* -------------------- Subcomando: init -------------------- */

function cmdInit(root, projectName) {
  const tokensPath = path.join(root, 'design-tokens.json');
  if (fs.existsSync(tokensPath)) {
    console.log(`ℹ️  Ya existe ${tokensPath}. No se sobrescribió.`);
    return;
  }
  const template = {
    project: projectName || path.basename(root),
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
    },
    typography: {
      sans: 'Inter, system-ui, sans-serif',
      heading: 'Plus Jakarta Sans, Inter, sans-serif',
      display: 'Plus Jakarta Sans, Inter, sans-serif',
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
  fs.writeFileSync(tokensPath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  console.log(`✅ Plantilla creada: ${tokensPath}`);
}

/* -------------------- Subcomando: extract -------------------- */

function extractFromProject(root) {
  const cssFiles = walkFiles(root, ['.css', '.scss']);
  const codeFiles = walkFiles(root, ['.tsx', '.jsx', '.ts', '.html', '.vue', '.svelte']);

  const cssVars = {};
  const duplicates = [];
  for (const f of cssFiles) {
    const rel = path.relative(root, f);
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

  return {
    scannedCssFiles: cssFiles.length,
    scannedCodeFiles: codeFiles.length,
    totalCssVariables: Object.keys(cssVars).length,
    duplicateDeclarations: duplicates,
    hardcodedHexInComponents,
    variables: cssVars,
  };
}

function cmdExtract(root, asJson) {
  const data = extractFromProject(root);
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`=== Extracción de Tokens Visuales: ${root} ===`);
    console.log(`Archivos CSS/SCSS: ${data.scannedCssFiles} · Variables CSS encontradas: ${data.totalCssVariables}`);
    console.log(`Variables duplicadas en mismo archivo: ${data.duplicateDeclarations.length}`);
    for (const d of data.duplicateDeclarations.slice(0, 10)) {
      console.log(`  ⚠️  ${d.file}:${d.line} ${d.token} (primera vez en línea ${d.firstLine})`);
    }
    console.log(`Hex sueltos en clases Tailwind de componentes: ${data.hardcodedHexInComponents.length}`);
    for (const h of data.hardcodedHexInComponents.slice(0, 10)) {
      console.log(`  ⚠️  ${h.file}:${h.line} → ${h.matches.join(', ')}`);
    }
  }
}

/* -------------------- Subcomando: generate -------------------- */

function cmdGenerate(root) {
  const tokensPath = path.join(root, 'design-tokens.json');
  if (!fs.existsSync(tokensPath)) {
    console.error(`❌ No existe ${tokensPath}. Ejecuta "init" primero.`);
    process.exit(2);
  }
  const t = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
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
    `/* Generado automáticamente desde design-tokens.json (${t.project || 'proyecto'}) — NO editar a mano */`,
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

  const cssPath = path.join(root, 'docs', 'diseno', 'design-tokens.generated.css');
  const mdPath = path.join(root, 'docs', 'diseno', 'DESIGN_TOKENS.md');
  fs.mkdirSync(path.dirname(cssPath), { recursive: true });
  fs.writeFileSync(cssPath, cssOut, 'utf8');

  const mdOut = [
    `# Datos de diseño — ${t.project || 'Proyecto'}`,
    '',
    `Fuente única de verdad generada desde \`design-tokens.json\`. Fecha: ${t.updatedAt || new Date().toISOString().slice(0, 10)}. Esquemas: ${(t.colorSchemes || ['light']).join(', ')}.`,
    '',
    '## 1. Identidad de marca',
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
    '## 3. Tipografía, geometría y accesibilidad',
    `- **Sans:** \`${t.typography?.sans || 'system-ui'}\``,
    `- **Heading:** \`${t.typography?.heading || 'system-ui'}\``,
    `- **Radio base:** \`${g.radius || '0.75rem'}\` · **Sidebar:** \`${g.sidebarExpanded || '260px'}\` / \`${g.sidebarCollapsed || '68px'}\``,
    `- **Foco global:** \`${f.outlineWidth || '3px'} solid ${f.outlineColor || b.primary}\` (offset \`${f.outlineOffset || '3px'}\`)`,
    '',
  ].join('\n');
  fs.writeFileSync(mdPath, mdOut, 'utf8');

  console.log(`✅ Generados desde design-tokens.json:`);
  console.log(`   • ${path.relative(root, cssPath)}`);
  console.log(`   • ${path.relative(root, mdPath)}`);
}

/* -------------------- Subcomando: audit -------------------- */

function cmdAudit(root, strict, asJson) {
  const tokensPath = path.join(root, 'design-tokens.json');
  const errors = [];
  const warnings = [];
  const contrastChecks = [];

  if (!fs.existsSync(tokensPath)) {
    errors.push('Falta design-tokens.json en la raíz del proyecto.');
  } else {
    const t = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
    const b = t.brand || {};
    const pairs = [
      { label: 'Texto base sobre superficie (WCAG AA ≥ 4.5)', fg: b.foreground, bg: b.surface, min: 4.5 },
      { label: 'Texto atenuado sobre superficie (WCAG AA ≥ 4.5)', fg: b.mutedForeground, bg: b.surface, min: 4.5 },
      { label: 'Blanco sobre primario (botones, WCAG AA ≥ 4.5)', fg: '#FFFFFF', bg: b.primary, min: 4.5 },
    ];
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

  if (asJson) {
    console.log(JSON.stringify({ errors, warnings, contrastChecks }, null, 2));
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
    console.log('Uso: node scripts/tokens-cli.mjs <init|extract|generate|audit | iniciar|extraer|generar|auditar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'init' || cmd === 'iniciar') cmdInit(root, flags.name);
  else if (cmd === 'extract' || cmd === 'extraer') cmdExtract(root, Boolean(flags.json));
  else if (cmd === 'generate' || cmd === 'generar') cmdGenerate(root);
  else if (cmd === 'audit' || cmd === 'auditar') cmdAudit(root, Boolean(flags.strict), Boolean(flags.json));
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
