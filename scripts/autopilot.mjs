#!/usr/bin/env node
/**
 * Developer Autopilot Skills — CLI Global Contextual (`autopilot` / `das`)
 *
 * Detecta automáticamente dónde vive la fuente única del toolkit (incluso vía `npm link`)
 * y en qué proyecto estás parado (`process.cwd()`), eliminando rutas largas.
 *
 * Subcomandos desde CUALQUIER carpeta:
 *   autopilot where                                        Muestra la ruta del toolkit y el proyecto actual (cwd).
 *   autopilot sync-global [--no-external] [--dry-run]      Actualiza Claude + Antigravity + Codex globalmente.
 *   autopilot sync [--target all-project|...] [--dest .]   Actualiza el proyecto actual (o --dest).
 *   autopilot init [--include-email]                       Ejecuta iniciar-toolkit/setup.py en el proyecto actual.
 *   autopilot scan [--strict] [--json]                     Ejecuta mock-free-audit/scripts/scan-mocks.mjs en el proyecto actual.
 *   autopilot chg <init|add|metrics|validate> [flags]      Ejecuta change-governance/scripts/change-registry.mjs en el proyecto actual.
 *   autopilot external [--check] [--reset]                 Consulta o actualiza skills externas read-only (Cloudflare).
 *   autopilot new-skill <nombre-kebab> "<descripción>"     Crea una skill nueva validada en la fuente única.
 *   autopilot verify                                       Ejecuta la suite automatizada completa del toolkit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// realpathSync garantiza que `npm link` resuelva la carpeta real del repositorio
const REAL_SCRIPT_PATH = fs.realpathSync(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(path.dirname(REAL_SCRIPT_PATH), '..');
const CALLER_CWD = process.cwd();
const PY_CMD = process.platform === 'win32' ? 'python' : 'python3';

function runNode(scriptRel, extraArgs = [], cwd = REPO_ROOT) {
  execFileSync(process.execPath, [path.join(REPO_ROOT, scriptRel), ...extraArgs], {
    cwd,
    stdio: 'inherit',
  });
}

function cmdWhere() {
  console.log(`📦 Fuente única del toolkit: ${REPO_ROOT}`);
  console.log(`📂 Proyecto actual (cwd):    ${CALLER_CWD}`);
  const hasCfg = fs.existsSync(path.join(CALLER_CWD, 'toolkit.config.json'));
  const hasSkills = fs.existsSync(path.join(CALLER_CWD, '.claude', 'skills'));
  console.log(`🔎 Estado en cwd: toolkit.config.json=${hasCfg ? 'sí' : 'no'} · .claude/skills=${hasSkills ? 'sí' : 'no'}`);
}

function cmdSync(argv, defaultTarget) {
  let target = defaultTarget;
  let dest = defaultTarget === 'all-global' ? null : CALLER_CWD;
  let includeExternal = true;
  let skipPull = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target' && argv[i + 1]) target = argv[++i];
    else if (a === '--dest' && argv[i + 1]) dest = path.resolve(CALLER_CWD, argv[++i]);
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

  console.log(`\n=== 4/4 Propagando a agentes (target: ${target}${dest && target !== 'all-global' ? ` → ${dest}` : ''}) ===`);
  const installArgs = ['--target', target];
  if (dest && target !== 'all-global' && target !== 'claude-global' && target !== 'antigravity' && target !== 'codex-global') {
    installArgs.push('--dest', dest);
  }
  if (includeExternal) installArgs.push('--include-external');
  if (dryRun) installArgs.push('--dry-run');
  runNode('scripts/install.mjs', installArgs);

  console.log('\n🎉 Sincronización completada sin tocar el código de negocio de tus proyectos.');
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
  console.log(`✅ Skill creada: ${path.join(skillDir, 'SKILL.md')}`);
  console.log('📌 Siguientes pasos: actualiza README/docs → `autopilot verify` → `autopilot sync-global --skip-pull`');
}

function printHelp() {
  console.log('Developer Autopilot Skills — CLI Global Contextual (`autopilot` / `das`)');
  console.log('');
  console.log('Uso desde CUALQUIER carpeta (español o inglés — auto-detecta tu proyecto actual):');
  console.log('  autopilot donde             (where)       Muestra rutas del toolkit y proyecto actual');
  console.log('  autopilot actualizar        (sync)        Actualiza el proyecto actual (Claude + Codex + Cursor)');
  console.log('  autopilot actualizar-global (sync-global) Actualiza todos tus agentes globales (Claude + AGY + Codex)');
  console.log('  autopilot iniciar           (init)        Detecta stack/UI/BD y crea toolkit.config.json en cwd');
  console.log('  autopilot escanear          (scan)        Ejecuta escaneo anti-mock en cwd [--strict] [--json]');
  console.log('  autopilot cambio            (chg)         Gestiona fichas CHG-XXXX y métricas SIGCS (iniciar|agregar|metricas|validar)');
  console.log('  autopilot tokens            (diseno)      Tokens de identidad: iniciar|extraer|sincronizar-landing|generar|auditar');
  console.log('  autopilot rutas             (routes)      Arquitectura de rutas: iniciar|extraer|generar|auditar (FE, API, WS, errores)');
  console.log('  autopilot busqueda          (seo)         Estándar SEO & GEO: iniciar|extraer|generar|auditar (sitemap, JSON-LD, 0-100)');
  console.log('  autopilot optimizar         (lpo)         Optimización Landing: iniciar|auditar-activos|linea-base|comparar|generar-lhci');
  console.log('  autopilot bd                (db)          Guardián activo BD: extraer|registrar|generar|auditar (ER, diccionario, diff)');
  console.log('  autopilot cf                (cl-flare)    Orquestador Cloudflare: estado|iniciar|verificar (guardrails #crear/#subida)');
  console.log('  autopilot pantallas         (screens)     Gestor Frontend SDD: iniciar|sincronizar|generar|auditar (SCR-XXX por módulo)');
  console.log('  autopilot externas          (external)    Comprueba/actualiza skills externas read-only (Cloudflare) [--check]');
  console.log('  autopilot nueva-skill       (new-skill)   Crea nueva skill validada en la fuente única');
  console.log('  autopilot verificar         (verify)      Ejecuta la suite completa de verificación');
}

function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    printHelp();
    process.exit(0);
  }

  if (cmd === 'where' || cmd === 'donde') cmdWhere();
  else if (cmd === 'sync' || cmd === 'actualizar') cmdSync(rest, 'all-project');
  else if (cmd === 'sync-global' || cmd === 'actualizar-global') cmdSync(rest, 'all-global');
  else if (cmd === 'init' || cmd === 'iniciar') {
    execFileSync(PY_CMD, [path.join(REPO_ROOT, '.claude', 'skills', 'iniciar-toolkit', 'setup.py'), '--dir', CALLER_CWD, ...rest], {
      cwd: CALLER_CWD,
      stdio: 'inherit',
    });
  } else if (cmd === 'scan' || cmd === 'escanear') {
    const hasPath = rest.some((a) => !a.startsWith('-'));
    const scanArgs = hasPath ? rest : [CALLER_CWD, ...rest];
    runNode('.claude/skills/mock-free-audit/scripts/scan-mocks.mjs', scanArgs, CALLER_CWD);
  } else if (cmd === 'chg' || cmd === 'cambio' || cmd === 'cambios') {
    const hasDir = rest.includes('--dir');
    const chgArgs = hasDir ? rest : [...rest, '--dir', CALLER_CWD];
    runNode('.claude/skills/change-governance/scripts/change-registry.mjs', chgArgs, CALLER_CWD);
  } else if (cmd === 'tokens' || cmd === 'diseno') {
    const hasDir = rest.includes('--dir');
    const tokArgs = hasDir ? rest : [...rest, '--dir', CALLER_CWD];
    runNode('.claude/skills/design-tokens-source/scripts/tokens-cli.mjs', tokArgs, CALLER_CWD);
  } else if (cmd === 'rutas' || cmd === 'routes' || cmd === 'mapa') {
    const hasDir = rest.includes('--dir');
    const rtArgs = hasDir ? rest : [...rest, '--dir', CALLER_CWD];
    runNode('.claude/skills/routes-architect/scripts/routes-cli.mjs', rtArgs, CALLER_CWD);
  } else if (cmd === 'busqueda' || cmd === 'seo') {
    const hasDir = rest.includes('--dir');
    const seoArgs = hasDir ? rest : [...rest, '--dir', CALLER_CWD];
    runNode('.claude/skills/busqueda/scripts/seo-cli.mjs', seoArgs, CALLER_CWD);
  } else if (cmd === 'optimizar' || cmd === 'optimize' || cmd === 'lpo') {
    const hasDir = rest.includes('--dir');
    const lpoArgs = hasDir ? rest : [...rest, '--dir', CALLER_CWD];
    runNode('.claude/skills/landing-page-optimization-engineering/scripts/landing-opt-cli.mjs', lpoArgs, CALLER_CWD);
  } else if (cmd === 'bd' || cmd === 'db' || cmd === 'database') {
    const hasDir = rest.includes('--dir');
    const dbArgs = hasDir ? rest : [...rest, '--dir', CALLER_CWD];
    runNode('.claude/skills/db-guardian/scripts/db-guardian-cli.mjs', dbArgs, CALLER_CWD);
  } else if (cmd === 'cf' || cmd === 'cl-flare' || cmd === 'cloudflare') {
    const hasDir = rest.includes('--dir');
    const cfArgs = hasDir ? rest : [...rest, '--dir', CALLER_CWD];
    runNode('.claude/skills/cl-flare/scripts/cl-flare-cli.mjs', cfArgs, CALLER_CWD);
  } else if (cmd === 'pantallas' || cmd === 'screens' || cmd === 'ui-spec') {
    const hasDir = rest.includes('--dir');
    const scrArgs = hasDir ? rest : [...rest, '--dir', CALLER_CWD];
    runNode('.claude/skills/screen-spec-architect/scripts/screens-cli.mjs', scrArgs, CALLER_CWD);
  } else if (cmd === 'external' || cmd === 'externas') {
    runNode('scripts/sync-external.mjs', rest);
  } else if (cmd === 'new-skill' || cmd === 'nueva-skill') {
    cmdNewSkill(rest);
  } else if (cmd === 'verify' || cmd === 'verificar') {
    runNode('tests/verify-toolkit.mjs');
  } else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    printHelp();
    process.exit(2);
  }
}

main();
