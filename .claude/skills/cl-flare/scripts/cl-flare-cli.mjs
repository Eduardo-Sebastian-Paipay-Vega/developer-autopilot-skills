#!/usr/bin/env node
/**
 * /cl-flare — CLI auxiliar determinista para el Orquestador Multi-Agente Cloudflare
 * (`status`, `init`, `verify` | `estado`, `iniciar`, `verificar`)
 *
 * Verifica guardrails de seguridad antes de `#subida`:
 * - Existencia completa de los 7 documentos de planificación en `docs/cloudflare/`
 * - Cero secretos hardcodeados en `vars` de `wrangler.jsonc` / `wrangler.toml` / `wrangler.json`
 * - Detección de rama Git (`cloudflare`) y skills oficiales de Cloudflare instaladas
 *
 * Uso:
 *   node scripts/cl-flare-cli.mjs status [--dir <ruta>] [--json]
 *   node scripts/cl-flare-cli.mjs init   [--dir <ruta>]
 *   node scripts/cl-flare-cli.mjs verify [--dir <ruta>] [--strict] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REQUIRED_DOCS = [
  '01_evaluacion_frontend.md',
  '02_evaluacion_backend.md',
  '03_evaluacion_base_datos.md',
  '04_evaluacion_storage.md',
  '05_evaluacion_integraciones.md',
  '00_arquitectura_integrada.md',
  'PLAN_MAESTRO_IMPLEMENTACION.md',
];

const OFFICIAL_CF_SKILLS = [
  'cloudflare', 'wrangler', 'cf-cli', 'cloudflare-app-bootstrap',
  'workers-best-practices', 'workers-development', 'workers-profiling',
  'frameworks-on-cloudflare', 'nextjs-on-cloudflare', 'durable-objects',
  'turnstile-spin', 'cloudflare-email-service', 'cloudflare-one', 'web-perf',
];

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

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getGitBranch(root) {
  try {
    return execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function findWranglerFile(root) {
  for (const cand of [
    'wrangler.jsonc', 'wrangler.json', 'wrangler.toml',
    'backend/wrangler.jsonc', 'backend/wrangler.toml',
    'frontend/wrangler.jsonc', 'frontend/wrangler.toml',
  ]) {
    const full = path.join(root, cand);
    if (fs.existsSync(full)) return { rel: cand, full };
  }
  return null;
}

function inspectStatus(root) {
  const cfDir = path.join(root, 'docs', 'cloudflare');
  const branch = getGitBranch(root);
  const wrangler = findWranglerFile(root);
  const docsPresent = REQUIRED_DOCS.filter((d) => fs.existsSync(path.join(cfDir, d)));
  const docsMissing = REQUIRED_DOCS.filter((d) => !fs.existsSync(path.join(cfDir, d)));

  const installedCfSkills = OFFICIAL_CF_SKILLS.filter((s) =>
    fs.existsSync(path.join(root, '.claude', 'skills', s, 'SKILL.md'))
  );

  return {
    root,
    branch,
    isCloudflareBranch: branch === 'cloudflare',
    wranglerFile: wrangler ? wrangler.rel : null,
    docsDir: 'docs/cloudflare',
    docsPresent,
    docsMissing,
    planReadyForDeploy: docsMissing.length === 0,
    installedProjectCfSkillsCount: installedCfSkills.length,
  };
}

function cmdStatus(root, asJson) {
  const st = inspectStatus(root);
  if (asJson) {
    console.log(JSON.stringify(st, null, 2));
  } else {
    console.log(`=== Estado /cl-flare: ${root} ===`);
    console.log(`Rama Git activa: ${st.branch || '(sin git)'} ${st.isCloudflareBranch ? '✅' : '⚠️  (se recomienda rama "cloudflare")'}`);
    console.log(`Config Wrangler: ${st.wranglerFile || '(no detectado aún)'}`);
    console.log(`Documentos de planificación: ${st.docsPresent.length}/${REQUIRED_DOCS.length}`);
    if (st.docsMissing.length) {
      console.log(`  Faltantes: ${st.docsMissing.join(', ')}`);
    }
    console.log(`Listo para #subida: ${st.planReadyForDeploy ? '✅ SÍ' : '❌ NO (ejecuta #crear primero)'}`);
  }
}

function cmdInit(root) {
  const cfDir = path.join(root, 'docs', 'cloudflare');
  fs.mkdirSync(cfDir, { recursive: true });

  const tk = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const rt = readJsonSafe(path.join(root, 'docs', 'arquitectura', 'routes-map.json'));
  const db = readJsonSafe(path.join(root, 'docs', 'bd', 'db-schema.json'));
  const project = tk?.project?.name || path.basename(root);
  const stackLine = `Frontend: ${tk?.stack?.frontend || 'Por detectar'} · Backend: ${tk?.stack?.backend || 'Por detectar'} · BD: ${(tk?.stack?.databases || ['Por detectar']).join(', ')}`;
  const countsLine = `Rutas catalogadas: ${(rt?.frontendRoutes || []).length} FE / ${(rt?.backendEndpoints || []).length} API · Tablas BD: ${db?.schema?.tablesCount ?? 'N/D'}`;

  const templates = {
    '01_evaluacion_frontend.md': `# 01. Evaluación Frontend Cloudflare — ${project}\n\n> ${stackLine}\n> Skills oficiales a consultar: \`/frameworks-on-cloudflare\`, \`/nextjs-on-cloudflare\`, \`/web-perf\`\n\n## Tecnologías Evaluadas (SELECCIONADA / DESCARTADA)\n- Cloudflare Pages · Workers Static Assets · Early Hints (103) · Zaraz · Web Analytics/RUM · Speed Brain · Page Shield · Scrape Shield · Cloudflare Images · RealtimeKit\n`,
    '02_evaluacion_backend.md': `# 02. Evaluación Backend Cloudflare — ${project}\n\n> ${stackLine} · ${countsLine}\n> Skills oficiales a consultar: \`/workers-best-practices\`, \`/workers-development\`, \`/durable-objects\`, \`/workers-profiling\`\n\n## Tecnologías Evaluadas (SELECCIONADA / DESCARTADA)\n- Cloudflare Workers · Hono · \`nodejs_compat\` · Cloudflare Containers · Browser Rendering · API Shield · WAF/OWASP · Rate Limiting · Durable Objects · Workers AI\n`,
    '03_evaluacion_base_datos.md': `# 03. Evaluación Base de Datos Cloudflare — ${project}\n\n> ${countsLine}\n> Skills oficiales a consultar: \`/wrangler\`, \`/cf-cli\`, \`/cloudflare-app-bootstrap\`\n\n## Tecnologías Evaluadas (SELECCIONADA / DESCARTADA)\n- Cloudflare D1 · D1 Time Travel · Hyperdrive · D1 Migrations Engine · Drizzle ORM / Kysely\n`,
    '04_evaluacion_storage.md': `# 04. Evaluación Storage y Caché Cloudflare — ${project}\n\n> Skills oficiales a consultar: \`/wrangler\`, \`/cf-cli\`, \`/durable-objects\`, \`/basin\`, \`/k2\`\n\n## Tecnologías Evaluadas (SELECCIONADA / DESCARTADA)\n- Cloudflare R2 · R2 Presigned URLs · Workers KV · Cache Reserve · Durable Objects SQLite Storage\n`,
    '05_evaluacion_integraciones.md': `# 05. Evaluación Integraciones Externas Cloudflare — ${project}\n\n> Skills oficiales a consultar: \`/turnstile-spin\`, \`/cloudflare-email-service\`, \`/cloudflare-one\`\n\n## Tecnologías Evaluadas (SELECCIONADA / DESCARTADA)\n- Cloudflare Turnstile · Queues (+ DLQ) · Workflows · Email Routing/Sending · Cloudflare Tunnel · AI Gateway · Zero Trust Access · Logpush/OpenTelemetry\n`,
    '00_arquitectura_integrada.md': `# 00. Arquitectura Integrada Cloudflare — ${project}\n\n> Consolidación del Agente Integrador a partir de \`01..05_evaluacion_*.md\`.\n\n## Bindings y Conexiones E2E\n- Pendiente de completar tras Fase 2.\n`,
    'PLAN_MAESTRO_IMPLEMENTACION.md': `# Plan Maestro de Implementación Cloudflare — ${project}\n\n> Generado por el Agente Planificador. Prerrequisito obligatorio antes de ejecutar \`#subida\`.\n\n## Etapas\n1. Aprovisionamiento de Infraestructura (\`wrangler\` / \`cf-cli\`)\n2. Migración y Esquema de Datos (D1 / Hyperdrive)\n3. Transformación de Backend (Workers + \`wrangler secret put\`)\n4. Adaptación de Frontend (Pages/Workers + \`_headers\` + Turnstile)\n5. Seguridad, WAF, DNS y SSL \`Full (strict)\`\n`,
  };

  let created = 0;
  for (const [fname, content] of Object.entries(templates)) {
    const dest = path.join(cfDir, fname);
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, content, 'utf8');
      created++;
    }
  }
  console.log(`✅ Estructura docs/cloudflare/ lista (${created} archivos creados, ${REQUIRED_DOCS.length - created} existentes preservados).`);
}

function cmdVerify(root, strict, asJson) {
  const st = inspectStatus(root);
  const errors = [];
  const warnings = [];

  // Guardrail 2: Plan Maestro y 5 evaluaciones obligatorias antes de #subida
  for (const missing of st.docsMissing) {
    errors.push(`Falta artefacto obligatorio de planificación: docs/cloudflare/${missing} (ejecuta #crear antes de #subida).`);
  }

  // Guardrail 1: advertir si no está en rama cloudflare
  if (st.branch && !st.isCloudflareBranch) {
    warnings.push(`Rama actual es "${st.branch}", no "cloudflare" (Guardrail #1: usar rama dedicada cloudflare).`);
  }

  // Guardrail 4: detectar secretos hardcodeados en wrangler.*
  const wrangler = findWranglerFile(root);
  if (wrangler) {
    const txt = fs.readFileSync(wrangler.full, 'utf8');
    const secretRe = /["']?([A-Z0-9_]*(?:SECRET|PASSWORD|PRIVATE_KEY|API_KEY|ACCESS_TOKEN|JWT_SECRET)[A-Z0-9_]*)["']?\s*[:=]\s*["']([^"']{4,})["']/g;
    let m;
    while ((m = secretRe.exec(txt)) !== null) {
      errors.push(`Guardrail #4 violado: posible secreto "${m[1]}" en texto plano dentro de ${wrangler.rel}. Usa "wrangler secret put".`);
    }
    if (!/compatibility_date/i.test(txt)) {
      warnings.push(`${wrangler.rel} no define "compatibility_date".`);
    }
  } else {
    warnings.push('No se encontró wrangler.jsonc / wrangler.toml todavía (requerido en Fase 5).');
  }

  if (asJson) {
    console.log(JSON.stringify({ status: st, errors, warnings }, null, 2));
  } else {
    console.log(`=== Verificación de Guardrails /cl-flare: ${root} ===`);
    console.log(`Resumen: ${errors.length} errores bloqueantes, ${warnings.length} avisos.`);
    for (const e of errors) console.error(`  ERROR: ${e}`);
    for (const w of warnings) console.warn(`  WARN:  ${w}`);
  }

  if (strict && errors.length > 0) process.exit(1);
}

function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    console.log('Uso: node scripts/cl-flare-cli.mjs <status|init|verify | estado|iniciar|verificar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'status' || cmd === 'estado') cmdStatus(root, Boolean(flags.json));
  else if (cmd === 'init' || cmd === 'iniciar') cmdInit(root);
  else if (cmd === 'verify' || cmd === 'verificar') cmdVerify(root, Boolean(flags.strict), Boolean(flags.json));
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
