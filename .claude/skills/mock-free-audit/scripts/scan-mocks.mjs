#!/usr/bin/env node
/**
 * MDES / Mock-Free Audit — Scanner estático anti-mocks (0 dependencias)
 *
 * Inspecciona un proyecto en busca de archivos mock productivos, librerías de mocking
 * en `dependencies`, flags de demo/mock, latencias artificiales en servicios, URLs de
 * imágenes de prueba y comentarios residuales — excluyendo tests unitarios legítimos.
 *
 * Uso:
 *   node scripts/scan-mocks.mjs <carpeta-proyecto> [--strict] [--json]
 *
 * --strict: termina con código 1 si detecta hallazgos CRITICAL o HIGH (ideal para CI/CD).
 */

import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.angular', '.nuxt',
  'coverage', '__pycache__', '.venv', 'venv', 'tests', '__tests__', '__mocks__', 'e2e', 'cypress', 'playwright',
]);

const TEST_FILE_RE = /\.(spec|test)\.[jt]sx?$|_test\.py$|^test_.*\.py$/i;
const MOCK_FILE_RE = /\.(mock|dummy|fake|stub)\.[jt]sx?$|^mockData\.[jt]sx?$|^mocks?\.[jt]sx?$/i;
const MOCK_DIR_RE = /(?:^|[\\/])(mocks?|fixtures?|stubs?)(?:[\\/]|$)/i;
const SERVICE_PATH_RE = /(?:^|[\\/])(services?|api|repositories?|hooks?|store)(?:[\\/]|$)/i;

const MOCK_PACKAGES = new Set([
  'msw', 'json-server', '@faker-js/faker', 'faker', 'axios-mock-adapter', 'miragejs', 'nock', 'fetch-mock',
]);

const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte', '.py', '.env', '.example']);

const LINE_RULES = [
  {
    id: 'MK-010',
    severity: 'CRITICAL',
    re: /\b(NEXT_PUBLIC_USE_MOCKS|ENABLE_MOCK_API|IS_DEMO_MODE|BYPASS_AUTH|SKIP_API|USE_MOCK_DATA)\b/,
    msg: 'Flag de entorno mock/demo/bypass detectado en ruta productiva.',
  },
  {
    id: 'MK-004',
    severity: 'CRITICAL',
    re: /\b(setupWorker|setupServer|new\s+MockAdapter|createServer\s*\(\s*\{\s*models)\b/,
    msg: 'Inicialización de interceptor/mock API en código productivo.',
  },
  {
    id: 'MK-009',
    severity: 'HIGH',
    re: /catch(?:Error)?\b[^\r\n]*\b(mock|dummy|fake|fallbackData|sampleData)\b/i,
    msg: 'Posible fallback silencioso devolviendo datos simulados en catch.',
  },
  {
    id: 'MK-003',
    severity: 'HIGH',
    onlyInServices: true,
    re: /\b(setTimeout\s*\(|new\s+Promise\s*\([^)]*setTimeout|\bsleep\s*\(|\bdelay\s*\()/,
    msg: 'Latencia artificial detectada dentro de capa de servicios/API.',
  },
  {
    id: 'MK-001',
    severity: 'MEDIUM',
    re: /https?:\/\/(?:images\.unsplash\.com|i\.pravatar\.cc|picsum\.photos|via\.placeholder\.com)/i,
    msg: 'URL de imagen de relleno/placeholder detectada.',
  },
  {
    id: 'MK-002',
    severity: 'MEDIUM',
    re: /(?:TODO|FIXME|HACK)\s*:?\s*[^\r\n]*(?:connect to backend|mock data|hardcoded|simulando|dummy|fake)/i,
    msg: 'Comentario residual de funcionalidad simulada o pendiente de conectar al backend.',
  },
];

function parseArgs(argv) {
  const opts = { target: '.', strict: false, json: false };
  for (const a of argv) {
    if (a === '--strict') opts.strict = true;
    else if (a === '--json') opts.json = true;
    else if (!a.startsWith('-')) opts.target = a;
  }
  return opts;
}

function scanProject(rootDir) {
  const absRoot = path.resolve(rootDir);
  if (!fs.existsSync(absRoot)) {
    console.error(`❌ Ruta no encontrada: ${absRoot}`);
    process.exit(2);
  }

  const findings = [];
  const add = (finding) => findings.push(finding);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      const rel = path.relative(absRoot, full);

      if (entry.isDirectory()) {
        if (MOCK_DIR_RE.test(rel)) {
          add({
            id: 'MK-001',
            severity: 'HIGH',
            file: rel,
            line: 0,
            message: 'Directorio de mocks/fixtures/stubs dentro del árbol productivo.',
          });
        }
        walk(full);
        continue;
      }

      if (TEST_FILE_RE.test(entry.name)) continue;

      // 1. Revisar package.json (solo `dependencies`, no `devDependencies`)
      if (entry.name === 'package.json') {
        try {
          const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
          const deps = pkg.dependencies || {};
          for (const dep of Object.keys(deps)) {
            if (MOCK_PACKAGES.has(dep)) {
              add({
                id: 'MK-004',
                severity: 'CRITICAL',
                file: rel,
                line: 0,
                message: `Dependencia de mocking "${dep}" instalada en dependencies (producción). Muévela a devDependencies o elimínala.`,
              });
            }
          }
        } catch { /* ignorar JSON malformado */ }
        continue;
      }

      // 2. Nombres de archivo sospechosos
      if (MOCK_FILE_RE.test(entry.name)) {
        add({
          id: 'MK-001',
          severity: 'HIGH',
          file: rel,
          line: 0,
          message: 'Archivo de datos simulados (*.mock / *.dummy / *.fake) fuera de tests.',
        });
      }

      // 3. Reglas línea por línea en archivos de código / env
      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_EXTS.has(ext) && !entry.name.startsWith('.env')) continue;

      const isService = SERVICE_PATH_RE.test(rel);
      const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const rule of LINE_RULES) {
          if (rule.onlyInServices && !isService) continue;
          if (rule.re.test(line)) {
            add({
              id: rule.id,
              severity: rule.severity,
              file: rel,
              line: i + 1,
              message: rule.msg,
              snippet: line.trim().slice(0, 120),
            });
          }
        }
      }
    }
  }

  walk(absRoot);
  return findings;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const findings = scanProject(opts.target);

  const counts = {
    CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
    HIGH: findings.filter((f) => f.severity === 'HIGH').length,
    MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
  };

  if (opts.json) {
    console.log(JSON.stringify({ target: path.resolve(opts.target), counts, findings }, null, 2));
  } else {
    console.log(`=== Mock-Free Static Audit: ${path.resolve(opts.target)} ===`);
    console.log(`Hallazgos: ${findings.length} (CRITICAL: ${counts.CRITICAL}, HIGH: ${counts.HIGH}, MEDIUM: ${counts.MEDIUM})`);
    for (const f of findings) {
      const loc = f.line > 0 ? `${f.file}:${f.line}` : f.file;
      console.log(`  [${f.severity}] ${f.id} ${loc} — ${f.message}`);
    }
    if (findings.length === 0) console.log('  ✅ 0 patrones de mock productivos detectados en análisis estático.');
  }

  if (opts.strict && (counts.CRITICAL > 0 || counts.HIGH > 0)) {
    process.exit(1);
  }
  process.exit(0);
}

main();
