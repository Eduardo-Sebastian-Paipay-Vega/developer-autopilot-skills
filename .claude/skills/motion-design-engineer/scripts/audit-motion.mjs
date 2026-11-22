#!/usr/bin/env node
/**
 * MDES — Auditor estático de rendimiento, tokens y accesibilidad (sin dependencias)
 * Uso:
 *   node scripts/audit-motion.mjs <carpeta-del-recurso | carpeta-examples>
 */

import fs from 'node:fs';
import path from 'node:path';
import { validateConfig } from '../core/mdes-core.js';

const LAYOUT_PROPS = /\b(width|height|top|left|right|bottom|margin(?:-\w+)?|padding(?:-\w+)?|border-width|font-size)\s*:/gi;
const HEX_COLOR = /#[0-9a-f]{3,8}\b/gi;

function findResources(dir) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Ruta no encontrada: ${abs}`);
    process.exit(2);
  }
  const results = [];
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  if (entries.some((e) => e.isFile() && e.name === 'mdes.config.json')) {
    results.push(abs);
  }
  for (const e of entries) {
    if (e.isDirectory()) results.push(...findResources(path.join(abs, e.name)));
  }
  return results;
}

function extractKeyframesBlocks(css) {
  const blocks = [];
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }
    blocks.push({ name: match[1], body: css.slice(start, i - 1) });
  }
  return blocks;
}

function auditResource(dir) {
  const errors = [];
  const warnings = [];
  const rel = path.relative(process.cwd(), dir);
  const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());

  // 1. Validar mdes.config.json
  const cfgPath = path.join(dir, 'mdes.config.json');
  if (!fs.existsSync(cfgPath)) {
    errors.push('Falta mdes.config.json.');
  } else {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      const res = validateConfig(cfg);
      for (const e of res.errors) errors.push(`config: ${e}`);
      for (const w of res.warnings) warnings.push(`config: ${w}`);
    } catch (err) {
      errors.push(`config: JSON inválido (${err.message})`);
    }
  }

  // 2. Auditar CSS
  for (const f of files.filter((x) => x.endsWith('.css'))) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');

    // Propiedades que disparan layout dentro de @keyframes
    for (const kf of extractKeyframesBlocks(css)) {
      const hits = [...kf.body.matchAll(LAYOUT_PROPS)].map((m) => m[1].toLowerCase());
      if (hits.length > 0) {
        errors.push(`${f} (@keyframes ${kf.name}): evita animar propiedades de layout (${[...new Set(hits)].join(', ')}). Usa transform/opacity.`);
      }
      if (/filter\s*:\s*[^;]*(blur|drop-shadow)/i.test(kf.body)) {
        warnings.push(`${f} (@keyframes ${kf.name}): filter blur/drop-shadow animado puede penalizar FPS.`);
      }
    }

    // Colores hex fuera de declaraciones de tokens --motion-*
    for (const [idx, line] of css.split('\n').entries()) {
      if (/--[\w-]+\s*:/.test(line)) continue;
      const hexes = line.match(HEX_COLOR);
      if (hexes) {
        errors.push(`${f}:${idx + 1}: color hardcodeado (${hexes.join(', ')}). Usa tokens var(--motion-*).`);
      }
    }

    // Uso indiscriminado de will-change
    const willChanges = css.match(/will-change\s*:/gi) || [];
    if (willChanges.length > 2) {
      warnings.push(`${f}: ${willChanges.length} reglas will-change detectadas; limita a ≤ 2 capas justificadas.`);
    }
  }

  // 3. Auditar SVG / HTML
  for (const f of files.filter((x) => x.endsWith('.svg') || x.endsWith('.html'))) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');

    // Imágenes rasterizadas embebidas
    if (/data:image\/(png|jpeg|jpg|gif|webp)/i.test(raw)) {
      errors.push(`${f}: contiene imagen rasterizada embebida (data:image/...). Usa vectores SVG.`);
    }

    // Revisar etiqueta <svg>
    const svgTags = [...raw.matchAll(/<svg\b[^>]*>/gi)];
    for (const [tag] of svgTags) {
      if (!/\bviewBox\s*=/i.test(tag)) {
        errors.push(`${f}: <svg> sin atributo viewBox.`);
      }
      if (/\b(width|height)\s*=\s*["']\d+/i.test(tag)) {
        warnings.push(`${f}: <svg> declara width/height fijos; controla el tamaño desde CSS (.mdes).`);
      }
    }

    // Colores hex en SVG/HTML (fuera de <style> tokens o ejemplos)
    const withoutComments = raw.replace(/<!--[\s\S]*?-->/g, '');
    const hexAttr = withoutComments.match(/\b(fill|stroke|stop-color)\s*=\s*["']#[0-9a-f]{3,8}["']/gi);
    if (hexAttr) {
      errors.push(`${f}: colores hardcodeados en atributos SVG (${hexAttr.slice(0, 3).join(', ')}). Usa var(--motion-*).`);
    }

    // Verificar partes móviles con data-part
    if (svgTags.length > 0 && !/data-part\s*=/.test(raw)) {
      warnings.push(`${f}: el <svg> no declara grupos data-part="...".`);
    }
  }

  return { rel, errors, warnings };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: node scripts/audit-motion.mjs <carpeta> [...]');
  process.exit(2);
}

const resources = [...new Set(args.flatMap(findResources))];
if (resources.length === 0) {
  console.error('❌ No se encontraron carpetas con mdes.config.json.');
  process.exit(2);
}

let totalErrors = 0;
for (const dir of resources) {
  const { rel, errors, warnings } = auditResource(dir);
  if (errors.length === 0) {
    console.log(`✅ ${rel} (0 errores, ${warnings.length} avisos)`);
  } else {
    console.error(`❌ ${rel} (${errors.length} errores, ${warnings.length} avisos)`);
    for (const e of errors) console.error(`   ERROR: ${e}`);
    totalErrors += errors.length;
  }
  for (const w of warnings) console.warn(`   WARN:  ${w}`);
}

process.exit(totalErrors > 0 ? 1 : 0);
