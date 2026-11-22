#!/usr/bin/env node
/**
 * Developer Autopilot Skills — CLI Unificado para Agentes y Humanos (0 dependencias)
 *
 * Permite que cualquier agente (Claude Code, Antigravity/AGY, Codex, Cursor, Windsurf)
 * actualice o cree skills desde la Fuente Única de Verdad y propague los cambios a
 * TODOS los agentes sin tocar el código fuente de ningún proyecto.
 *
 * Subcomandos:
 *   node scripts/autopilot.mjs sync [--target all-global|all-project|...] [--dest <ruta>] [--include-external] [--skip-pull] [--dry-run]
 *   node scripts/autopilot.mjs new-skill <nombre-kebab> "<descripción>"
 *   node scripts/autopilot.mjs verify
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function runNode(scriptRel, extraArgs = []) {
  execFileSync(process.execPath, [path.join(REPO_ROOT, scriptRel), ...extraArgs], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

function cmdSync(argv) {
  let target = 'all-global';
  let dest = null;
  let includeExternal = true;
  let skipPull = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target' && argv[i + 1]) target = argv[++i];
    else if (a === '--dest' && argv[i + 1]) dest = argv[++i];
    else if (a === '--no-external') includeExternal = false;
    else if (a === '--include-external') includeExternal = true;
    else if (a === '--skip-pull') skipPull = true;
    else if (a === '--dry-run') dryRun = true;
  }

  console.log('=== 1/4 Actualizando repositorio fuente (developer-autopilot-skills) ===');
  if (!skipPull && !dryRun) {
    try {
      const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      if (dirty) {
        console.warn('⚠️  El repositorio fuente tiene cambios locales sin commitear; omitiendo git pull.');
      } else {
        execFileSync('git', ['pull', '--ff-only', 'origin', 'main'], { cwd: REPO_ROOT, stdio: 'inherit' });
      }
    } catch (err) {
      console.warn(`⚠️  No se pudo hacer git pull (continuando con copia local): ${err.message}`);
    }
  } else {
    console.log('  (omitido por --skip-pull o --dry-run)');
  }

  console.log('\n=== 2/4 Verificando/actualizando skills externas read-only (ej. cloudflare/skills) ===');
  runNode('scripts/sync-external.mjs', dryRun ? ['--check'] : []);

  console.log('\n=== 3/4 Validando integridad del toolkit antes de propagar ===');
  runNode('tests/verify-toolkit.mjs');

  console.log(`\n=== 4/4 Propagando a agentes (target: ${target}) ===`);
  const installArgs = ['--target', target];
  if (dest) installArgs.push('--dest', dest);
  if (includeExternal) installArgs.push('--include-external');
  if (dryRun) installArgs.push('--dry-run');
  runNode('scripts/install.mjs', installArgs);

  console.log('\n🎉 Todos los agentes sincronizados desde la misma fuente sin tocar el código de tus proyectos.');
}

function cmdNewSkill(argv) {
  const name = argv[0];
  const description = argv.slice(1).join(' ').trim();

  if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    console.error('❌ Nombre inválido. Usa kebab-case (ej. "mi-nueva-skill").');
    process.exit(2);
  }
  if (description.length < 20) {
    console.error('❌ Proporciona una descripción clara (mínimo 20 caracteres).');
    console.error('   Ejemplo: node scripts/autopilot.mjs new-skill api-contract-check "Valida contratos OpenAPI/REST antes de desplegar."');
    process.exit(2);
  }

  const skillDir = path.join(REPO_ROOT, '.claude', 'skills', name);
  if (fs.existsSync(skillDir)) {
    console.error(`❌ La skill "${name}" ya existe en ${skillDir}.`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(skillDir, 'references'), { recursive: true });
  const md = [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    '---',
    '',
    `# ${name}`,
    '',
    '## Paso 0 — Contexto del proyecto',
    'Lee `toolkit.config.json` (si existe) para respetar stack, librería UI y reglas cerradas del proyecto.',
    '',
    '## Procedimiento',
    '1. Analiza el objetivo y confirma restricciones antes de editar.',
    '2. Aplica los cambios de forma verificable.',
    '3. Ejecuta las validaciones reales del proyecto antes de reportar éxito.',
    '',
    '## Reglas',
    '- No inventes métricas ni declares pruebas no ejecutadas.',
    '- No hagas commits ni sobrescribas archivos sin autorización.',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), md, 'utf8');
  console.log(`✅ Skill creada: .claude/skills/${name}/SKILL.md`);
  console.log('📌 Siguientes pasos:');
  console.log('   1. Completa el procedimiento y agrega referencias en references/ si hace falta.');
  console.log('   2. Actualiza el conteo y tabla en README.md, docs/MANUAL_DE_USO.md y docs/CONFIGURACION_AGENTES.md.');
  console.log('   3. Ejecuta: node scripts/autopilot.mjs verify');
  console.log('   4. Propaga a todos tus agentes: node scripts/autopilot.mjs sync --skip-pull');
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === '-h' || cmd === '--help') {
    console.log('Developer Autopilot Skills — CLI Multi-Agente');
    console.log('Uso:');
    console.log('  node scripts/autopilot.mjs sync [--target all-global|all-project|...] [--dest <ruta>] [--no-external] [--skip-pull] [--dry-run]');
    console.log('  node scripts/autopilot.mjs new-skill <nombre-kebab> "<descripción>"');
    console.log('  node scripts/autopilot.mjs verify');
    process.exit(0);
  }

  if (cmd === 'sync') cmdSync(rest);
  else if (cmd === 'new-skill') cmdNewSkill(rest);
  else if (cmd === 'verify') runNode('tests/verify-toolkit.mjs');
  else {
    console.error(`❌ Subcomando desconocido: ${cmd}`);
    process.exit(2);
  }
}

main();
