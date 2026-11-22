#!/usr/bin/env node
/**
 * Developer Autopilot Skills — Suite de verificación automatizada (0 dependencias)
 *
 * Verifica:
 *  1. Frontmatter YAML válido en todas las skills (name == carpeta, description >= 20 chars).
 *  2. Integridad de referencias internas (`references/`, `scripts/`, `core/`, `schema/`).
 *  3. Coherencia del conteo de skills en README.md, MANUAL_DE_USO.md y CONFIGURACION_AGENTES.md.
 *  4. Validez de todos los archivos JSON del repositorio.
 *  5. Sintaxis JS/MJS (`node --check`) y Python (`py_compile`) en todos los scripts.
 *  6. Ejecución real de los validadores de `motion-design-engineer` y `--dry-run` de `scripts/install.mjs`.
 *  7. Regresión de comandos rotos conocidos (`manage.py ... --if-present`, submódulo anidado).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, '.claude', 'skills');

let passed = 0;
let failed = 0;

function check(label, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function walkFiles(dir, extList) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, extList));
    else if (extList.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

console.log('=== 1. Validación de skills y frontmatter ===');
const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

check(`Carpetas de skills encontradas: ${skillDirs.length}`, skillDirs.length > 0);

const REF_LINK = /`((?:references|scripts|core|schema|templates)\/[\w.-]+(?:\.[\w.-]+)?)`/g;

for (const name of skillDirs) {
  const skillDir = path.join(SKILLS_DIR, name);
  const mdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(mdPath)) {
    check(`${name}: existe SKILL.md`, false, 'Archivo faltante');
    continue;
  }
  const md = fs.readFileSync(mdPath, 'utf8');
  const fmMatch = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = fmMatch ? fmMatch[1] : '';
  const nameMatch = fm.match(/^name:\s*([^\r\n]+)/m);
  const descMatch = fm.match(/^description:\s*([^\r\n]+)/m);
  const fmName = nameMatch ? nameMatch[1].trim() : '';
  const fmDesc = descMatch ? descMatch[1].trim() : '';

  check(`${name}: frontmatter válido`, fmName === name && fmDesc.length >= 20,
    `name="${fmName}" (esperado "${name}"), descLen=${fmDesc.length}`);

  // Verificar que los archivos internos citados existan
  const missingRefs = [];
  for (const m of md.matchAll(REF_LINK)) {
    const rel = m[1];
    if (!fs.existsSync(path.join(skillDir, rel))) missingRefs.push(rel);
  }
  if (missingRefs.length > 0) {
    check(`${name}: referencias internas existentes`, false, `Faltan: ${[...new Set(missingRefs)].join(', ')}`);
  }
}

console.log('\n=== 2. Coherencia documental ===');
const count = skillDirs.length;
const docChecks = [
  ['README.md', new RegExp(`\\b${count}\\s+skills\\b`, 'i')],
  ['docs/MANUAL_DE_USO.md', new RegExp(`\\b${count}\\s+skills\\b`, 'i')],
  ['docs/CONFIGURACION_AGENTES.md', new RegExp(`\\b${count}\\s+skills\\b`, 'i')],
];
for (const [rel, re] of docChecks) {
  const txt = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
  check(`${rel} anuncia exactamente ${count} skills`, re.test(txt));
}

// Verificar que no existan comandos rotos conocidos
const mdFiles = walkFiles(REPO_ROOT, ['.md']);
const BROKEN_PATTERNS = [
  { label: 'Django/pytest --if-present inválido', re: /(?:manage\.py\s+\w+|pytest)[^\r\n]*--if-present/ },
  { label: 'Submódulo anidado .claude/skills', re: /git\s+submodule\s+add\s+\S+developer-autopilot-skills\.git\s+\.claude\/skills\b/ },
];
for (const bp of BROKEN_PATTERNS) {
  const hits = [];
  for (const f of mdFiles) {
    if (bp.re.test(fs.readFileSync(f, 'utf8'))) hits.push(path.relative(REPO_ROOT, f));
  }
  check(`Sin regresión: ${bp.label}`, hits.length === 0, hits.join(', '));
}

console.log('\n=== 3. Validez de archivos JSON ===');
for (const jf of walkFiles(REPO_ROOT, ['.json'])) {
  try {
    JSON.parse(fs.readFileSync(jf, 'utf8'));
    check(`JSON válido: ${path.relative(REPO_ROOT, jf)}`, true);
  } catch (err) {
    check(`JSON válido: ${path.relative(REPO_ROOT, jf)}`, false, err.message);
  }
}

console.log('\n=== 4. Sintaxis de scripts JS/MJS y Python ===');
for (const jsf of walkFiles(REPO_ROOT, ['.js', '.mjs'])) {
  try {
    execFileSync(process.execPath, ['--check', jsf], { stdio: 'pipe' });
    check(`node --check: ${path.relative(REPO_ROOT, jsf)}`, true);
  } catch (err) {
    check(`node --check: ${path.relative(REPO_ROOT, jsf)}`, false, err.stderr?.toString() || err.message);
  }
}

const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
for (const pyf of walkFiles(REPO_ROOT, ['.py'])) {
  try {
    execFileSync(pyCmd, ['-m', 'py_compile', pyf], { stdio: 'pipe' });
    check(`py_compile: ${path.relative(REPO_ROOT, pyf)}`, true);
  } catch (err) {
    check(`py_compile: ${path.relative(REPO_ROOT, pyf)}`, false, err.stderr?.toString() || err.message);
  }
}

console.log('\n=== 5. Ejecución real de herramientas CLI ===');
const mdesDir = path.join(SKILLS_DIR, 'motion-design-engineer');
try {
  execFileSync(process.execPath, [
    path.join(mdesDir, 'scripts', 'validate-config.mjs'),
    path.join(mdesDir, 'templates'),
    path.join(mdesDir, 'examples'),
  ], { stdio: 'pipe' });
  check('motion-design-engineer validate-config.mjs (templates + examples)', true);
} catch (err) {
  check('motion-design-engineer validate-config.mjs', false, err.stderr?.toString() || err.message);
}

try {
  execFileSync(process.execPath, [
    path.join(mdesDir, 'scripts', 'audit-motion.mjs'),
    path.join(mdesDir, 'templates'),
    path.join(mdesDir, 'examples'),
  ], { stdio: 'pipe' });
  check('motion-design-engineer audit-motion.mjs (templates + examples)', true);
} catch (err) {
  check('motion-design-engineer audit-motion.mjs', false, err.stderr?.toString() || err.message);
}

for (const target of ['claude-project', 'claude-global', 'antigravity', 'cursor', 'windsurf', 'cline']) {
  try {
    execFileSync(process.execPath, [
      path.join(REPO_ROOT, 'scripts', 'install.mjs'),
      '--target', target,
      '--dry-run',
    ], { stdio: 'pipe' });
    check(`scripts/install.mjs --target ${target} --dry-run`, true);
  } catch (err) {
    check(`scripts/install.mjs --target ${target} --dry-run`, false, err.stderr?.toString() || err.message);
  }
}

console.log(`\n========================================`);
console.log(`Resultado: ${passed} aprobadas, ${failed} fallidas.`);
console.log(`========================================`);
process.exit(failed > 0 ? 1 : 0);
