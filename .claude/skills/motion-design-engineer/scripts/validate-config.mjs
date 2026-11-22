#!/usr/bin/env node
/**
 * MDES — Validador de configuración (CLI sin dependencias)
 * Uso:
 *   node scripts/validate-config.mjs <ruta-a-mdes.config.json | carpeta>
 */

import fs from 'node:fs';
import path from 'node:path';
import { validateConfig } from '../core/mdes-core.js';

function collectConfigFiles(target) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Ruta no encontrada: ${abs}`);
    process.exit(2);
  }
  const stat = fs.statSync(abs);
  if (stat.isFile()) return [abs];
  const found = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) found.push(...collectConfigFiles(full));
    else if (entry.name === 'mdes.config.json') found.push(full);
  }
  return found;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: node scripts/validate-config.mjs <archivo-o-carpeta> [...]');
  process.exit(2);
}

const files = args.flatMap(collectConfigFiles);
if (files.length === 0) {
  console.error('❌ No se encontró ningún mdes.config.json.');
  process.exit(2);
}

let failed = 0;
for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`❌ ${rel}: JSON inválido (${err.message})`);
    failed++;
    continue;
  }

  const { valid, errors, warnings } = validateConfig(parsed);
  if (valid) {
    console.log(`✅ ${rel} (${parsed.id} · ${parsed.complexity} · ${parsed.renderer})`);
  } else {
    console.error(`❌ ${rel}:`);
    for (const e of errors) console.error(`   ERROR: ${e}`);
    failed++;
  }
  for (const w of warnings) console.warn(`   WARN:  ${w}`);
}

process.exit(failed > 0 ? 1 : 0);
