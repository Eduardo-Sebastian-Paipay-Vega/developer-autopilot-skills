#!/usr/bin/env node
/**
 * Developer Autopilot Skills — Instalador oficial (sin dependencias)
 * Evita la estructura anidada `.claude/skills/.claude/skills/` instalando
 * cada skill directamente en la ruta que espera cada agente.
 *
 * Uso:
 *   node scripts/install.mjs --target <claude-project|claude-global|antigravity|cursor|windsurf|cline> [--dest <ruta>] [--dry-run]
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

const VALID_TARGETS = ['claude-project', 'claude-global', 'antigravity', 'cursor', 'windsurf', 'cline'];

function parseArgs(argv) {
  const opts = { target: null, dest: process.cwd(), dryRun: false, includeExternal: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target' && argv[i + 1]) opts.target = argv[++i];
    else if (a === '--dest' && argv[i + 1]) opts.dest = path.resolve(argv[++i]);
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--include-external') opts.includeExternal = true;
    else if (a === '-h' || a === '--help') {
      console.log(`Uso: node scripts/install.mjs --target <${VALID_TARGETS.join('|')}> [--dest <ruta>] [--include-external] [--dry-run]`);
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

function copyDir(src, dst, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
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

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.target || !VALID_TARGETS.includes(opts.target)) {
    console.error(`❌ --target inválido. Valores permitidos: ${VALID_TARGETS.join(', ')}`);
    process.exit(2);
  }

  const skills = listSkills(opts.includeExternal);
  const home = os.homedir();
  const isGlobal = opts.target === 'claude-global' || opts.target === 'antigravity';

  let skillsDst;
  if (opts.target === 'claude-global') skillsDst = path.join(home, '.claude', 'skills');
  else if (opts.target === 'antigravity') skillsDst = path.join(home, '.gemini', 'config', 'skills');
  else skillsDst = path.join(opts.dest, '.claude', 'skills');

  const tag = opts.dryRun ? '[DRY-RUN] ' : '';
  console.log(`${tag}Instalando ${skills.length} skills para target "${opts.target}" → ${skillsDst}`);

  for (const s of skills) {
    copyDir(s.srcDir, path.join(skillsDst, s.name), opts.dryRun);
  }

  // Copiar plantilla de scope para landing-design si es instalación de proyecto y aún no existe
  if (!isGlobal && fs.existsSync(LANDING_SCOPE_SRC)) {
    const scopeDst = path.join(opts.dest, '.claude', 'landing-design', 'scope.json');
    if (!fs.existsSync(scopeDst)) {
      if (!opts.dryRun) {
        fs.mkdirSync(path.dirname(scopeDst), { recursive: true });
        fs.copyFileSync(LANDING_SCOPE_SRC, scopeDst);
      }
      console.log(`${tag}Plantilla creada: ${scopeDst}`);
    }
  }

  // Generar reglas explícitas para agentes que no auto-descubren .claude/skills/
  const rulesContent = buildRulesFile(skills, '.claude/skills');
  let rulesPath = null;
  if (opts.target === 'cursor') {
    rulesPath = path.join(opts.dest, '.cursor', 'rules', 'developer-autopilot.mdc');
  } else if (opts.target === 'windsurf') {
    rulesPath = path.join(opts.dest, '.windsurfrules');
  } else if (opts.target === 'cline') {
    rulesPath = path.join(opts.dest, '.clinerules');
  }

  if (rulesPath) {
    if (!opts.dryRun) {
      fs.mkdirSync(path.dirname(rulesPath), { recursive: true });
      fs.writeFileSync(rulesPath, rulesContent, 'utf8');
    }
    console.log(`${tag}Archivo de reglas generado: ${rulesPath}`);
  }

  console.log(`${tag}✅ Instalación completada (${skills.length} skills, sin rutas anidadas).`);
}

main();
