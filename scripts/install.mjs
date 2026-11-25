#!/usr/bin/env node
/**
 * Developer Autopilot Skills — Instalador Multi-Agente con Manifiesto (0 dependencias)
 *
 * Garantiza sincronización exacta (réplica limpia) mediante un manifiesto por destino
 * (`.developer-autopilot-manifest.json`):
 *  - Reemplaza limpiamente cada skill administrada (sin dejar archivos viejos dentro).
 *  - Elimina automáticamente skills obsoletas que ya no existen en la fuente.
 *  - NUNCA toca ni elimina skills ajenas al toolkit que el usuario haya creado.
 *
 * Targets individuales:
 *   claude-project | claude-global | antigravity | codex-project | codex-global | cursor | windsurf | cline
 * Targets combinados:
 *   all-global  -> Claude Code (~/.claude/skills) + Antigravity (~/.gemini/config/skills) + Codex (~/.codex/skills)
 *   all-project -> Proyecto destino: Claude (.claude/skills) + Codex (.agents/skills) + Cursor (.cursor/rules)
 *
 * Uso:
 *   node scripts/install.mjs --target <target> [--dest <ruta>] [--include-external] [--no-prune] [--dry-run]
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_SRC = path.join(REPO_ROOT, '.claude', 'skills');
const EXTERNAL_SOURCES_FILE = path.join(REPO_ROOT, 'external', 'sources.json');
const LANDING_SCOPE_SRC = path.join(REPO_ROOT, '.claude', 'landing-design', 'scope.json');
export const MANIFEST_FILENAME = '.developer-autopilot-manifest.json';

const VALID_TARGETS = [
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
];

function parseArgs(argv) {
  const opts = { target: null, dest: process.cwd(), dryRun: false, includeExternal: false, prune: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target' && argv[i + 1]) opts.target = argv[++i];
    else if (a === '--dest' && argv[i + 1]) opts.dest = path.resolve(argv[++i]);
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--include-external') opts.includeExternal = true;
    else if (a === '--no-prune') opts.prune = false;
    else if (a === '-h' || a === '--help') {
      console.log(`Uso: node scripts/install.mjs --target <${VALID_TARGETS.join('|')}> [--dest <ruta>] [--include-external] [--no-prune] [--dry-run]`);
      process.exit(0);
    }
  }
  return opts;
}

function listSkillsIn(dir, origin = 'core') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'SKILL.md')))
    .map((e) => {
      const md = fs.readFileSync(path.join(dir, e.name, 'SKILL.md'), 'utf8');
      const descMatch = md.match(/^description:\s*(.+)$/m);
      return {
        name: e.name,
        srcDir: path.join(dir, e.name),
        origin,
        description: descMatch ? descMatch[1].trim() : '',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function listSkills(includeExternal) {
  const skills = listSkillsIn(SKILLS_SRC, 'core');
  if (includeExternal && fs.existsSync(EXTERNAL_SOURCES_FILE)) {
    const manifest = JSON.parse(fs.readFileSync(EXTERNAL_SOURCES_FILE, 'utf8'));
    for (const src of manifest.sources || []) {
      const extDir = path.join(REPO_ROOT, src.path, src.skillsSubdir || 'skills');
      const extSkills = listSkillsIn(extDir, src.id);
      for (const s of extSkills) {
        if (!skills.some((x) => x.name === s.name)) skills.push(s);
      }
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function safeRemove(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  try {
    fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EBUSY') {
      try {
        fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 15, retryDelay: 200 });
        return;
      } catch {
        // Si no se puede remover el directorio raíz por un lock transitorio en Windows,
        // cpSync sobrescribirá su contenido directamente.
        return;
      }
    }
    throw err;
  }
}

function syncDirExact(src, dst, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  safeRemove(dst);
  fs.cpSync(src, dst, { recursive: true, force: true });
}

function readPreviousManifest(skillsDst) {
  const manifestPath = path.join(skillsDst, MANIFEST_FILENAME);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (data && data.managedBy === 'developer-autopilot-skills' && Array.isArray(data.skills)) {
      return data;
    }
  } catch {
    return null;
  }
  return null;
}

function buildRulesFile(skills, skillsRelDir) {
  const lines = [
    '# Developer Autopilot Skills — Reglas generadas automáticamente',
    '',
    `Este proyecto cuenta con ${skills.length} skills instaladas en \`${skillsRelDir}/\`.`,
    'Antes de ejecutar tareas cubiertas por una skill, lee su `SKILL.md` correspondiente y consulta `toolkit.config.json`:',
    '',
  ];
  for (const s of skills) {
    lines.push(`- **/${s.name}**: \`${skillsRelDir}/${s.name}/SKILL.md\` — ${s.description.slice(0, 140)}`);
  }
  lines.push('');
  return lines.join('\n');
}

function installSingle(target, skills, opts) {
  const home = os.homedir();
  const isGlobal = target === 'claude-global' || target === 'antigravity' || target === 'codex-global';
  const tag = opts.dryRun ? '[DRY-RUN] ' : '';

  let skillsDst;
  if (target === 'claude-global') skillsDst = path.join(home, '.claude', 'skills');
  else if (target === 'antigravity') skillsDst = path.join(home, '.gemini', 'config', 'skills');
  else if (target === 'codex-global') skillsDst = path.join(home, '.codex', 'skills');
  else if (target === 'codex-project') skillsDst = path.join(opts.dest, '.agents', 'skills');
  else skillsDst = path.join(opts.dest, '.claude', 'skills');

  const currentNames = new Set(skills.map((s) => s.name));
  const prevManifest = readPreviousManifest(skillsDst);
  const removed = [];

  // Eliminar SOLO skills administradas previamente que ya no están en la fuente (nunca skills ajenas)
  if (opts.prune && prevManifest) {
    for (const prevName of prevManifest.skills) {
      if (!currentNames.has(prevName) && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(prevName)) {
        const obsoleteDir = path.join(skillsDst, prevName);
        if (fs.existsSync(obsoleteDir)) {
          if (!opts.dryRun) safeRemove(obsoleteDir);
          removed.push(prevName);
        }
      }
    }
  }

  const alreadySynced = opts.syncedSkillsDsts && opts.syncedSkillsDsts.has(skillsDst);

  if (!alreadySynced) {
    console.log(`${tag}[${target}] ${skills.length} skills → ${skillsDst}${removed.length ? ` (eliminadas ${removed.length} obsoletas: ${removed.join(', ')})` : ''}`);
    for (const s of skills) {
      syncDirExact(s.srcDir, path.join(skillsDst, s.name), opts.dryRun);
    }

    // Escribir manifiesto de skills administradas
    if (!opts.dryRun) {
      fs.mkdirSync(skillsDst, { recursive: true });
      const manifestData = {
        managedBy: 'developer-autopilot-skills',
        target,
        includeExternal: opts.includeExternal,
        updatedAt: new Date().toISOString(),
        skillCount: skills.length,
        skills: skills.map((s) => s.name),
      };
      fs.writeFileSync(path.join(skillsDst, MANIFEST_FILENAME), `${JSON.stringify(manifestData, null, 2)}\n`, 'utf8');
      opts.syncedSkillsDsts?.add(skillsDst);
    }
  } else {
    console.log(`${tag}[${target}] Skills compartidas ya sincronizadas en ${skillsDst}`);
  }

  if (!isGlobal && target !== 'codex-project' && fs.existsSync(LANDING_SCOPE_SRC)) {
    const scopeDst = path.join(opts.dest, '.claude', 'landing-design', 'scope.json');
    if (!fs.existsSync(scopeDst)) {
      if (!opts.dryRun) {
        fs.mkdirSync(path.dirname(scopeDst), { recursive: true });
        fs.copyFileSync(LANDING_SCOPE_SRC, scopeDst);
      }
      console.log(`${tag}[${target}] Plantilla creada: ${scopeDst}`);
    }
  }

  let rulesPath = null;
  if (target === 'cursor') rulesPath = path.join(opts.dest, '.cursor', 'rules', 'developer-autopilot.mdc');
  else if (target === 'windsurf') rulesPath = path.join(opts.dest, '.windsurfrules');
  else if (target === 'cline') rulesPath = path.join(opts.dest, '.clinerules');

  if (rulesPath) {
    if (!opts.dryRun) {
      fs.mkdirSync(path.dirname(rulesPath), { recursive: true });
      fs.writeFileSync(rulesPath, buildRulesFile(skills, '.claude/skills'), 'utf8');
    }
    console.log(`${tag}[${target}] Reglas generadas: ${rulesPath}`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.target || !VALID_TARGETS.includes(opts.target)) {
    console.error(`❌ --target inválido. Valores permitidos: ${VALID_TARGETS.join(', ')}`);
    process.exit(2);
  }

  opts.syncedSkillsDsts = new Set();
  const skills = listSkills(opts.includeExternal);
  const targets = opts.target === 'all-global'
    ? ['claude-global', 'antigravity', 'codex-global']
    : opts.target === 'all-project'
      ? ['claude-project', 'codex-project', 'cursor']
      : [opts.target];

  for (const t of targets) {
    installSingle(t, skills, opts);
  }

  const tag = opts.dryRun ? '[DRY-RUN] ' : '';
  console.log(`${tag}✅ Sincronización completada (${skills.length} skills en ${targets.join(', ')}).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
