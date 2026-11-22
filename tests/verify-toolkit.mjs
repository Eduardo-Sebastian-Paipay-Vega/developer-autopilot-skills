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
import os from 'node:os';
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
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'external') continue;
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

const REF_LINK = /`((?:references|scripts|core|schema|templates)(?:\/[\w.-]+)+)`/g;

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
    const rootSeg = rel.split('/')[0];
    // `core/` solo es referencia interna si la propia skill posee una carpeta `core/` (evita rutas de proyectos Angular `src/app/core/...`)
    if (rootSeg === 'core' && !fs.existsSync(path.join(skillDir, 'core'))) continue;
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

for (const target of [
  'claude-project',
  'claude-global',
  'antigravity',
  'codex-project',
  'codex-global',
  'cursor',
  'windsurf',
  'cline',
  'all-global',
  'all-project',
]) {
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

try {
  execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'autopilot.mjs'), '--help'], { stdio: 'pipe' });
  check('scripts/autopilot.mjs --help', true);
} catch (err) {
  check('scripts/autopilot.mjs --help', false, err.stderr?.toString() || err.message);
}

console.log('\n=== 6. Integridad de skills externas oficiales (read-only) ===');
const extManifestPath = path.join(REPO_ROOT, 'external', 'sources.json');
if (fs.existsSync(extManifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(extManifestPath, 'utf8'));
    check('external/sources.json es JSON válido', Array.isArray(manifest.sources));
    for (const src of manifest.sources || []) {
      const absSub = path.join(REPO_ROOT, src.path);
      if (fs.existsSync(path.join(absSub, '.git'))) {
        const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: absSub, encoding: 'utf8' }).trim();
        check(`Submódulo read-only limpio (sin ediciones locales): ${src.path}`, dirty === '', dirty);
      } else {
        check(`Submódulo declarado en sources.json: ${src.id} (no inicializado en este entorno)`, true);
      }
    }
  } catch (err) {
    check('external/sources.json es JSON válido', false, err.message);
  }
}

console.log('\n=== 7. Pruebas de integración reales (directorio temporal) ===');
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'das-verify-'));
try {
  const projDir = path.join(tmpRoot, 'sample-project');
  fs.mkdirSync(projDir, { recursive: true });

  // 7.1 Instalación real all-project --include-external
  execFileSync(process.execPath, [
    path.join(REPO_ROOT, 'scripts', 'install.mjs'),
    '--target', 'all-project',
    '--dest', projDir,
    '--include-external',
  ], { stdio: 'pipe' });

  const claudeSkillsDir = path.join(projDir, '.claude', 'skills');
  const codexSkillsDir = path.join(projDir, '.agents', 'skills');
  const cursorRulesFile = path.join(projDir, '.cursor', 'rules', 'developer-autopilot.mdc');
  const manifestFile = path.join(claudeSkillsDir, '.developer-autopilot-manifest.json');

  const hasNestedBug = fs.existsSync(path.join(claudeSkillsDir, '.claude'));
  check('Integración: instalación sin anidación (.claude/skills/.claude no existe)', !hasNestedBug);
  check('Integración: manifiesto creado en .claude/skills/', fs.existsSync(manifestFile));
  check('Integración: reglas Cursor generadas (.cursor/rules/developer-autopilot.mdc)', fs.existsSync(cursorRulesFile));

  const manifestObj = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const expectedWithExt = fs.existsSync(path.join(REPO_ROOT, 'external', 'cloudflare-skills', 'skills'))
    ? count + 22
    : count;
  check(`Integración: ${expectedWithExt} skills instaladas en Claude y Codex`,
    manifestObj.skillCount === expectedWithExt
    && fs.existsSync(path.join(claudeSkillsDir, 'motion-design-engineer', 'SKILL.md'))
    && fs.existsSync(path.join(codexSkillsDir, 'system-state-screens', 'SKILL.md')),
    `manifest=${manifestObj.skillCount}, esperado=${expectedWithExt}`);

  // 7.2 Idempotencia: segunda instalación sobre el mismo destino
  execFileSync(process.execPath, [
    path.join(REPO_ROOT, 'scripts', 'install.mjs'),
    '--target', 'claude-project',
    '--dest', projDir,
    '--include-external',
  ], { stdio: 'pipe' });
  const manifestObj2 = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  check('Integración: instalación idempotente (2.ª ejecución conserva conteo exacto)', manifestObj2.skillCount === expectedWithExt);

  // 7.3 Pruning seguro: eliminar skill obsoleta administrada SIN tocar skill ajena del usuario
  const customSkillDir = path.join(claudeSkillsDir, 'custom-user-skill');
  fs.mkdirSync(customSkillDir, { recursive: true });
  fs.writeFileSync(path.join(customSkillDir, 'SKILL.md'), '---\nname: custom-user-skill\ndescription: Skill privada del usuario.\n---\n', 'utf8');

  const obsoleteSkillDir = path.join(claudeSkillsDir, 'obsolete-managed-skill');
  fs.mkdirSync(obsoleteSkillDir, { recursive: true });
  fs.writeFileSync(path.join(obsoleteSkillDir, 'SKILL.md'), '---\nname: obsolete-managed-skill\ndescription: Skill obsoleta.\n---\n', 'utf8');
  manifestObj2.skills.push('obsolete-managed-skill');
  fs.writeFileSync(manifestFile, JSON.stringify(manifestObj2, null, 2), 'utf8');

  execFileSync(process.execPath, [
    path.join(REPO_ROOT, 'scripts', 'install.mjs'),
    '--target', 'claude-project',
    '--dest', projDir,
    '--include-external',
  ], { stdio: 'pipe' });

  check('Integración: skill obsoleta eliminada automáticamente (pruning por manifiesto)', !fs.existsSync(obsoleteSkillDir));
  check('Integración: skill ajena del usuario preservada intacta', fs.existsSync(path.join(customSkillDir, 'SKILL.md')));

  // 7.4 Prueba real de iniciar-toolkit/setup.py (detección BD/ORM/PM + protección PII)
  const mockApp = path.join(tmpRoot, 'mock-fullstack');
  fs.mkdirSync(mockApp, { recursive: true });
  fs.writeFileSync(path.join(mockApp, 'package.json'), JSON.stringify({
    name: 'mock-fullstack',
    dependencies: {
      next: '^15.0.0',
      react: '^19.0.0',
      '@radix-ui/react-dialog': '^1.0.0',
      tailwindcss: '^3.4.0',
      express: '^4.19.0',
      pg: '^8.12.0',
      '@prisma/client': '^5.18.0',
    },
  }, null, 2), 'utf8');
  fs.writeFileSync(path.join(mockApp, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n', 'utf8');

  execFileSync(pyCmd, [
    path.join(SKILLS_DIR, 'iniciar-toolkit', 'setup.py'),
    '--dir', mockApp,
  ], { stdio: 'pipe' });

  const genCfg = JSON.parse(fs.readFileSync(path.join(mockApp, 'toolkit.config.json'), 'utf8'));
  check('Integración setup.py: detecta Next.js + shadcn + Express + PostgreSQL + Prisma + pnpm',
    genCfg.stack?.frontend === 'Next.js'
    && (genCfg.stack?.ui_libraries || []).includes('shadcn/ui + Radix UI')
    && genCfg.stack?.backend === 'Express'
    && (genCfg.stack?.databases || []).includes('PostgreSQL')
    && (genCfg.stack?.orms || []).includes('Prisma')
    && (genCfg.stack?.package_managers || []).includes('pnpm'),
    JSON.stringify(genCfg.stack));
  check('Integración setup.py: protección PII (no expone email en toolkit.config.json por defecto)', !genCfg.team);

  // 7.5 Prueba real de mock-free-audit/scripts/scan-mocks.mjs
  const mockScanDir = path.join(tmpRoot, 'mock-scan-app');
  fs.mkdirSync(path.join(mockScanDir, 'src', 'services'), { recursive: true });
  fs.writeFileSync(path.join(mockScanDir, 'package.json'), JSON.stringify({
    name: 'mock-scan-app',
    dependencies: { msw: '^2.0.0' },
  }), 'utf8');
  fs.writeFileSync(path.join(mockScanDir, 'src', 'services', 'users.mock.ts'), 'export const ENABLE_MOCK_API = true;\nsetTimeout(() => {}, 500);\n', 'utf8');
  fs.writeFileSync(path.join(mockScanDir, 'src', 'services', 'users.spec.ts'), 'export const ENABLE_MOCK_API = true;\n', 'utf8');

  const scanJsonOut = execFileSync(process.execPath, [
    path.join(SKILLS_DIR, 'mock-free-audit', 'scripts', 'scan-mocks.mjs'),
    mockScanDir,
    '--json',
  ], { encoding: 'utf8' });
  const scanReport = JSON.parse(scanJsonOut);
  const specFlagged = scanReport.findings.some((f) => f.file.includes('users.spec.ts'));
  check('Integración scan-mocks.mjs: detecta msw, flag ENABLE_MOCK_API, archivo *.mock.ts y setTimeout',
    scanReport.counts.CRITICAL >= 2 && scanReport.counts.HIGH >= 2,
    JSON.stringify(scanReport.counts));
  check('Integración scan-mocks.mjs: ignora legítimamente pruebas unitarias (*.spec.ts)', !specFlagged);

  let strictExitedNonZero = false;
  try {
    execFileSync(process.execPath, [
      path.join(SKILLS_DIR, 'mock-free-audit', 'scripts', 'scan-mocks.mjs'),
      mockScanDir,
      '--strict',
    ], { stdio: 'pipe' });
  } catch {
    strictExitedNonZero = true;
  }
  check('Integración scan-mocks.mjs: --strict falla (exit != 0) ante hallazgos CRITICAL/HIGH', strictExitedNonZero);

  // 7.6 Prueba real de change-governance/scripts/change-registry.mjs (init -> add -> metrics -> validate)
  const cmDir = path.join(tmpRoot, 'cm-test-app');
  fs.mkdirSync(cmDir, { recursive: true });
  const cmScript = path.join(SKILLS_DIR, 'change-governance', 'scripts', 'change-registry.mjs');

  execFileSync(process.execPath, [cmScript, 'init', '--dir', cmDir], { stdio: 'pipe' });
  execFileSync(process.execPath, [
    cmScript, 'add',
    '--dir', cmDir,
    '--title', 'Rediseño del sidebar con RBAC',
    '--type', 'UI/UX',
    '--criticality', 'C3',
    '--dimensions', 'ux-ui,frontend,seguridad',
    '--modules', 'navegacion',
    '--refs', 'RF-04',
  ], { stdio: 'pipe' });

  const metricsOut = execFileSync(process.execPath, [cmScript, 'metrics', '--dir', cmDir, '--json'], { encoding: 'utf8' });
  const metrics = JSON.parse(metricsOut);
  check('Integración change-registry.mjs: init + add crea CHG-0001 y calcula métricas',
    metrics.totalChanges === 1
    && metrics.byCriticality.C3 === 1
    && metrics.kpis.traceabilityPct === 100
    && fs.existsSync(path.join(cmDir, '.change-management', 'changes', 'CHG-0001.md'))
    && fs.existsSync(path.join(cmDir, 'docs', 'CHANGELOG_INTERNO.md'))
    && fs.existsSync(path.join(cmDir, '.github', 'pull_request_template.md')));

  execFileSync(process.execPath, [cmScript, 'validate', '--dir', cmDir, '--strict'], { stdio: 'pipe' });
  check('Integración change-registry.mjs: validate --strict aprueba registro válido', true);

  // 7.7 Prueba real de design-tokens-source/scripts/tokens-cli.mjs (init -> generate -> audit)
  const tokDir = path.join(tmpRoot, 'tokens-test-app');
  fs.mkdirSync(tokDir, { recursive: true });
  const tokScript = path.join(SKILLS_DIR, 'design-tokens-source', 'scripts', 'tokens-cli.mjs');

  execFileSync(process.execPath, [tokScript, 'init', '--dir', tokDir, '--name', 'Demo Brand'], { stdio: 'pipe' });
  execFileSync(process.execPath, [tokScript, 'generate', '--dir', tokDir], { stdio: 'pipe' });
  const auditJson = execFileSync(process.execPath, [tokScript, 'audit', '--dir', tokDir, '--strict', '--json'], { encoding: 'utf8' });
  const auditRes = JSON.parse(auditJson);
  const genCss = fs.readFileSync(path.join(tokDir, 'docs', 'diseno', 'design-tokens.generated.css'), 'utf8');

  check('Integración tokens-cli.mjs: genera CSS con HSL shadcn + puente MDES brand + DESIGN_TOKENS.md',
    genCss.includes('--primary:') && genCss.includes('[data-motion-theme="brand"]')
    && fs.existsSync(path.join(tokDir, 'docs', 'diseno', 'DESIGN_TOKENS.md')));
  check('Integración tokens-cli.mjs: auditoría WCAG 2.2 AA calcula ratios reales y pasa --strict',
    auditRes.errors.length === 0 && auditRes.contrastChecks.length === 3 && auditRes.contrastChecks.every((c) => c.ok));
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

console.log(`\n========================================`);
console.log(`Resultado: ${passed} aprobadas, ${failed} fallidas.`);
console.log(`========================================`);
process.exit(failed > 0 ? 1 : 0);
