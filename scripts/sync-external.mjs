#!/usr/bin/env node
/**
 * Developer Autopilot Skills — Sincronizador de Skills Externas Oficiales (Read-Only)
 *
 * Mantiene actualizados los repositorios externos oficiales (ej. cloudflare/skills)
 * sin permitir modificaciones locales manuales, e informa siempre cuál es la última
 * versión oficial sincronizada (commit SHA, fecha y cantidad de skills).
 *
 * Uso:
 *   node scripts/sync-external.mjs            # Actualiza a la última versión oficial y actualiza external/sources.json
 *   node scripts/sync-external.mjs --check    # Solo comprueba si hay una versión más reciente en GitHub (sin modificar)
 *   node scripts/sync-external.mjs --reset    # Descarta cualquier cambio local accidental en external/ antes de actualizar
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCES_FILE = path.join(REPO_ROOT, 'external', 'sources.json');

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const FORCE_RESET = args.has('--reset');

function git(cwd, gitArgs) {
  return execFileSync('git', gitArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function countSkills(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'SKILL.md')))
    .length;
}

function main() {
  if (!fs.existsSync(SOURCES_FILE)) {
    console.error(`❌ No existe ${SOURCES_FILE}`);
    process.exit(2);
  }

  const manifest = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8'));
  let anyUpdate = false;
  let anyError = false;

  for (const src of manifest.sources || []) {
    const absPath = path.join(REPO_ROOT, src.path);
    console.log(`\n🔎 [${src.id}] ${src.name} (${src.repo})`);

    // Consultar última versión oficial en GitHub sin tocar disco
    let remoteSha = '';
    try {
      const lsOut = git(REPO_ROOT, ['ls-remote', src.repo, 'HEAD']);
      remoteSha = lsOut.split(/\s+/)[0] || '';
    } catch (err) {
      console.error(`  ❌ No se pudo consultar el remoto (${src.repo}): ${err.message}`);
      anyError = true;
      continue;
    }

    const initialized = fs.existsSync(path.join(absPath, '.git'));
    let localSha = initialized ? git(absPath, ['rev-parse', 'HEAD']) : (src.lastCommit || '');

    if (CHECK_ONLY) {
      if (localSha === remoteSha) {
        console.log(`  ✅ Al día. Última versión oficial: ${remoteSha.slice(0, 10)} (${src.lastCommitDate || 'sin fecha'}, ${src.skillCount || 0} skills).`);
      } else {
        console.log(`  ⚠️  Actualización disponible!`);
        console.log(`      Versión local:   ${localSha.slice(0, 10)} (${src.lastCommitDate || 'desconocida'})`);
        console.log(`      Última oficial:  ${remoteSha.slice(0, 10)}`);
        console.log(`      Ejecuta: node scripts/sync-external.mjs`);
      }
      continue;
    }

    // Inicializar submódulo si aún no fue clonado
    if (!initialized) {
      console.log(`  ⬇️  Inicializando submódulo read-only en ${src.path}...`);
      git(REPO_ROOT, ['submodule', 'update', '--init', '--recursive', src.path]);
      localSha = git(absPath, ['rev-parse', 'HEAD']);
    }

    // Protección read-only: impedir modificaciones locales manuales
    const dirty = git(absPath, ['status', '--porcelain']);
    if (dirty) {
      if (FORCE_RESET) {
        console.warn(`  ⚠️  Se detectaron cambios locales en ${src.path}; restaurando estado oficial (--reset)...`);
        git(absPath, ['reset', '--hard', 'HEAD']);
        git(absPath, ['clean', '-fd']);
      } else {
        console.error(`  ❌ Bloqueado (read-only): ${src.path} tiene cambios locales no permitidos.`);
        console.error(`     Las skills externas no deben editarse manualmente. Usa --reset para restaurar.`);
        anyError = true;
        continue;
      }
    }

    const prevSha = localSha;
    git(REPO_ROOT, ['submodule', 'update', '--remote', '--merge', src.path]);
    const newSha = git(absPath, ['rev-parse', 'HEAD']);
    const newDate = git(absPath, ['log', '-1', '--format=%ci']);
    const skillCount = countSkills(path.join(absPath, src.skillsSubdir || 'skills'));

    if (prevSha !== newSha) {
      anyUpdate = true;
      console.log(`  🆕 Actualizado: ${prevSha.slice(0, 10)} → ${newSha.slice(0, 10)}`);
    } else {
      console.log(`  ✅ Ya está en la última versión oficial.`);
    }
    console.log(`  📌 Última versión oficial: ${newSha.slice(0, 10)} · Fecha: ${newDate} · Skills: ${skillCount}`);

    src.lastCommit = newSha;
    src.lastCommitDate = newDate;
    src.skillCount = skillCount;
  }

  if (!CHECK_ONLY && !anyError) {
    fs.writeFileSync(SOURCES_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`\n📝 Registro actualizado en external/sources.json.`);
    if (anyUpdate) {
      console.log(`💡 Recuerda ejecutar \`node scripts/install.mjs --target <tu-agente> --include-external\` para propagar la actualización.`);
    }
  }

  process.exit(anyError ? 1 : 0);
}

main();
