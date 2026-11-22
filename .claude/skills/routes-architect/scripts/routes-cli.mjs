#!/usr/bin/env node
/**
 * Routes Architect — CLI sin dependencias
 * (`init`, `extract`, `generate`, `audit` | `iniciar`, `extraer`, `generar`, `auditar`)
 *
 * Fuente única de verdad para rutas Frontend, Backend REST, WebSockets,
 * pantallas de error/estado, interceptores HTTP, logs y discrepancias OpenAPI.
 *
 * Uso:
 *   node scripts/routes-cli.mjs init     [--dir <ruta>] [--name "Mi Proyecto"]
 *   node scripts/routes-cli.mjs extract  [--dir <ruta>] [--merge] [--json]
 *   node scripts/routes-cli.mjs generate [--dir <ruta>]
 *   node scripts/routes-cli.mjs audit    [--dir <ruta>] [--strict] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.angular', '.nuxt',
  'coverage', '.venv', 'venv', '__pycache__', '.claude',
]);

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

function walkFiles(dir, predicate) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(full, predicate));
    else if (predicate(full, e.name)) out.push(full);
  }
  return out;
}

/* -------------------- Resolución automática vía toolkit.config.json -------------------- */

function resolveRoutesPaths(root) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const r = tkConfig?.routes || {};
  const d = tkConfig?.design || {};

  const mapFile = path.join(root, r.map_file || path.join('docs', 'arquitectura', 'routes-map.json'));
  const catalogMd = path.join(root, r.catalog_md || path.join('docs', 'arquitectura', 'CATALOGO_RUTAS.md'));
  const planMaestro = path.join(root, r.plan_maestro || path.join('docs', 'planeacion', 'plan-maestro.md'));
  const landingScope = path.join(root, d.landing_scope || path.join('.claude', 'landing-design', 'scope.json'));

  return { tkConfig, mapFile, catalogMd, planMaestro, landingScope };
}

function extractRfsFromPlanMaestro(planPath) {
  if (!fs.existsSync(planPath)) return [];
  const txt = fs.readFileSync(planPath, 'utf8');
  const matches = txt.match(/\bRF-\d{1,3}\b/g) || [];
  return [...new Set(matches)].sort();
}

/* -------------------- Escáner real de código (Frontend + Backend + WS) -------------------- */

function classifyFrontendRoute(urlPath, routeGroup) {
  const g = (routeGroup || '').toLowerCase();
  if (g.includes('landing') || g.includes('public') || g.includes('marketing')) return 'public';
  if (g.includes('system') || g.includes('error')) return 'system';
  if (/^\/(400|401|403|404|429|500|502|503|504|offline|mantenimiento|error-servidor|estados-sistema)(\/|$)/i.test(urlPath)) {
    return 'system';
  }
  if (/^\/(login|signin|signup|register|registro|recuperar|restablecer|activar|forgot-password|reset-password)/i.test(urlPath)) {
    return 'auth';
  }
  if (/^\/(kiosco|kiosk|terminal|tv)(\/|$)/i.test(urlPath)) return 'terminal';
  if (urlPath === '/') return 'public';
  return 'internal';
}

function scanFrontendRoutes(root) {
  const found = [];
  const boundaries = [];
  const seen = new Set();

  // 1. Next.js App Router (**/app/**/page.{tsx,jsx,ts,js} y boundaries)
  const appFiles = walkFiles(root, (full, name) => {
    const norm = full.replace(/\\/g, '/');
    return /\/app\//.test(norm) && /^(page|error|global-error|not-found|loading)\.(tsx|jsx|ts|js)$/.test(name);
  });

  for (const f of appFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const idx = rel.indexOf('app/');
    if (idx === -1) continue;
    const afterApp = rel.slice(idx + 4);
    const parts = afterApp.split('/');
    const fileName = parts.pop();

    if (!fileName.startsWith('page.')) {
      boundaries.push({ type: fileName.replace(/\.(tsx|jsx|ts|js)$/, ''), file: rel });
      continue;
    }

    let routeGroup = '';
    const urlParts = [];
    for (const seg of parts) {
      if (seg.startsWith('(') && seg.endsWith(')')) {
        if (!routeGroup) routeGroup = seg.slice(1, -1);
        continue;
      }
      if (seg.startsWith('@') || seg.startsWith('_')) continue;
      urlParts.push(seg);
    }
    const urlPath = `/${urlParts.join('/')}`.replace(/\/+/g, '/');
    if (seen.has(urlPath)) continue;
    seen.add(urlPath);

    const group = classifyFrontendRoute(urlPath, routeGroup);
    const mod = urlParts.length >= 2 ? urlParts[1] : (urlParts[0] || 'core');
    found.push({
      path: urlPath,
      group,
      module: group === 'public' ? 'portal-publico' : (group === 'system' ? 'sistema-errores' : mod),
      file: rel,
      rf: [],
      roles: group === 'public' || group === 'auth' || group === 'system' ? ['publico'] : [],
      purpose: '',
      status: 'IMPLEMENTED',
    });
  }

  // 2. Angular (*.routes.ts / *-routing.module.ts)
  const ngRouteFiles = walkFiles(root, (_full, name) => /\.(routes|routing\.module)\.ts$/.test(name));
  for (const f of ngRouteFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const txt = fs.readFileSync(f, 'utf8');
    const re = /\bpath\s*:\s*['"]([^'"]*)['"]/g;
    let m;
    while ((m = re.exec(txt)) !== null) {
      const raw = m[1];
      if (raw === '**' || raw === '') continue;
      const urlPath = `/${raw}`.replace(/\/+/g, '/');
      if (seen.has(urlPath)) continue;
      seen.add(urlPath);
      const group = classifyFrontendRoute(urlPath, '');
      found.push({
        path: urlPath,
        group,
        module: raw.split('/')[0] || 'core',
        file: rel,
        rf: [],
        roles: group === 'public' || group === 'auth' || group === 'system' ? ['publico'] : [],
        purpose: '',
        status: 'IMPLEMENTED',
      });
    }
  }

  // 3. Nuxt / Vue (pages/**/*.vue)
  const vuePages = walkFiles(root, (full, name) => /\/pages\//.test(full.replace(/\\/g, '/')) && name.endsWith('.vue'));
  for (const f of vuePages) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const idx = rel.indexOf('pages/');
    const after = rel.slice(idx + 6).replace(/\.vue$/, '').replace(/\/index$|^index$/, '');
    const urlPath = `/${after}`.replace(/\/+/g, '/');
    if (seen.has(urlPath)) continue;
    seen.add(urlPath);
    const group = classifyFrontendRoute(urlPath, '');
    found.push({
      path: urlPath,
      group,
      module: after.split('/')[0] || 'core',
      file: rel,
      rf: [],
      roles: group === 'public' || group === 'auth' || group === 'system' ? ['publico'] : [],
      purpose: '',
      status: 'IMPLEMENTED',
    });
  }

  return { frontendRoutes: found.sort((a, b) => a.path.localeCompare(b.path)), boundaries };
}

function joinApiPath(prefix, sub) {
  const p = String(prefix || '').replace(/\/+$/, '');
  const s = String(sub || '').replace(/^\/+/, '');
  const joined = `${p}/${s}`.replace(/\/+/g, '/');
  return joined.startsWith('/') ? joined : `/${joined}`;
}

function scanBackendEndpoints(root) {
  const endpoints = [];
  const websockets = [];
  const seen = new Set();

  // Detectar prefijos de montaje en Express (app.use('/api/v1/users', usersRouter))
  const mountPrefixes = new Map();
  const appFiles = walkFiles(root, (_full, name) => /^(app|server|index|main)\.(ts|js|mjs)$/.test(name));
  for (const f of appFiles) {
    const txt = fs.readFileSync(f, 'utf8');
    const reUse = /\b(?:app|router)\.use\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z0-9_]+)/g;
    let m;
    while ((m = reUse.exec(txt)) !== null) {
      const prefix = m[1];
      const routerVar = m[2].replace(/Router$|Routes$/i, '').toLowerCase();
      if (routerVar) mountPrefixes.set(routerVar, prefix);
    }
  }

  // 1. Express / Fastify / Hono / NestJS (*.routes.*, *.controller.*, app.*, server.*)
  const jsFiles = walkFiles(root, (_full, name) =>
    /\.(routes|route|controller)\.(ts|js|mjs)$/.test(name) || /^(app|server)\.(ts|js|mjs)$/.test(name)
  );
  for (const f of jsFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    if (/\.(spec|test)\./i.test(rel)) continue;
    const txt = fs.readFileSync(f, 'utf8');
    const baseName = path.basename(f).replace(/\.(routes|route|controller)\.(ts|js|mjs)$/i, '').toLowerCase();
    const prefix = mountPrefixes.get(baseName) || '';

    // Express / Fastify / Hono
    const reExpress = /\b(?:router|app|fastify)\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/gi;
    let m;
    while ((m = reExpress.exec(txt)) !== null) {
      const method = m[1].toUpperCase();
      const rawPath = m[2];
      const fullPath = rawPath.startsWith('/api') || !prefix ? rawPath : joinApiPath(prefix, rawPath);
      const key = `${method} ${fullPath} ${rel}`;
      if (seen.has(key)) continue;
      seen.add(key);
      endpoints.push({
        method,
        path: fullPath,
        service: rel.split('/')[0] || 'backend',
        router: baseName,
        file: rel,
        auth: /\/(public|health|login|forgot-password|reset-password|activate)\b/i.test(fullPath) ? 'public' : 'jwt',
        permissions: [],
        rf: [],
        status: 'IMPLEMENTED',
      });
    }

    // NestJS @Controller + @Get/@Post...
    const ctrlMatch = txt.match(/@Controller\(\s*['"]([^'"]*)['"]\s*\)/);
    if (ctrlMatch) {
      const ctrlPrefix = ctrlMatch[1] ? `/${ctrlMatch[1].replace(/^\/+/, '')}` : '';
      const reNest = /@(Get|Post|Put|Patch|Delete)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g;
      let nm;
      while ((nm = reNest.exec(txt)) !== null) {
        const method = nm[1].toUpperCase();
        const fullPath = joinApiPath(ctrlPrefix, nm[2] || '');
        const key = `${method} ${fullPath} ${rel}`;
        if (seen.has(key)) continue;
        seen.add(key);
        endpoints.push({
          method,
          path: fullPath,
          service: rel.split('/')[0] || 'backend',
          router: baseName,
          file: rel,
          auth: 'jwt',
          permissions: [],
          rf: [],
          status: 'IMPLEMENTED',
        });
      }
    }

    // WebSockets
    const reWs = /['"]((?:\/api\/[^'"]*)?\/(?:ws|live|realtime|socket)[^'"]*)['"]/gi;
    let wm;
    while ((wm = reWs.exec(txt)) !== null) {
      const wsPath = wm[1];
      if (!websockets.some((w) => w.path === wsPath)) {
        websockets.push({
          path: wsPath,
          service: rel.split('/')[0] || 'backend',
          file: rel,
          authProtocol: 'bearer',
          events: [],
          rf: [],
        });
      }
    }
  }

  // 2. Python FastAPI / Django
  const pyFiles = walkFiles(root, (_full, name) => name.endsWith('.py'));
  for (const f of pyFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    if (/test_|_test\.py$/i.test(rel)) continue;
    const txt = fs.readFileSync(f, 'utf8');

    const reFastApi = /@(?:app|router)\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/gi;
    let m;
    while ((m = reFastApi.exec(txt)) !== null) {
      const method = m[1].toUpperCase();
      const fullPath = m[2];
      const key = `${method} ${fullPath} ${rel}`;
      if (seen.has(key)) continue;
      seen.add(key);
      endpoints.push({
        method,
        path: fullPath,
        service: rel.split('/')[0] || 'backend',
        router: path.basename(f, '.py'),
        file: rel,
        auth: /\/(public|health|login)\b/i.test(fullPath) ? 'public' : 'jwt',
        permissions: [],
        rf: [],
        status: 'IMPLEMENTED',
      });
    }

    if (path.basename(f) === 'urls.py') {
      const reDjango = /\bpath\(\s*['"]([^'"]+)['"]/g;
      let dm;
      while ((dm = reDjango.exec(txt)) !== null) {
        const fullPath = `/${dm[1].replace(/^\/+/, '')}`;
        const key = `ANY ${fullPath} ${rel}`;
        if (seen.has(key)) continue;
        seen.add(key);
        endpoints.push({
          method: 'ANY',
          path: fullPath,
          service: rel.split('/')[0] || 'backend',
          router: path.basename(path.dirname(f)),
          file: rel,
          auth: 'jwt',
          permissions: [],
          rf: [],
          status: 'IMPLEMENTED',
        });
      }
    }
  }

  return {
    backendEndpoints: endpoints.sort((a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`)),
    websockets,
  };
}

/* -------------------- Análisis de ambigüedades OpenAPI y duplicados -------------------- */

function detectAmbiguousOpenApiPaths(endpoints) {
  const byParent = new Map();
  for (const ep of endpoints) {
    const clean = String(ep.path || '').replace(/\/+$/, '');
    const parts = clean.split('/').filter(Boolean);
    if (parts.length < 2) continue;
    const last = parts[parts.length - 1];
    const parent = `/${parts.slice(0, -1).join('/')}`;
    const key = `${ep.method} ${parent}`;
    if (!byParent.has(key)) byParent.set(key, { method: ep.method, parent, statics: new Set(), params: new Set() });
    const entry = byParent.get(key);
    if (last.startsWith(':') || (last.startsWith('{') && last.endsWith('}'))) entry.params.add(last);
    else entry.statics.add(last);
  }
  const issues = [];
  for (const entry of byParent.values()) {
    if (entry.params.size > 0 && entry.statics.size > 0) {
      issues.push({
        code: 'AMBIGUOUS_OPENAPI_PATH',
        method: entry.method,
        parent: entry.parent,
        statics: [...entry.statics],
        params: [...entry.params],
        message: `Ambigüedad OpenAPI en ${entry.method} ${entry.parent}: rutas estáticas (${[...entry.statics].join(', ')}) conviven con parámetro (${[...entry.params].join(', ')}).`,
      });
    }
  }
  return issues;
}

/* -------------------- Subcomando: init -------------------- */

function cmdInit(root, projectName) {
  const paths = resolveRoutesPaths(root);
  if (fs.existsSync(paths.mapFile)) {
    console.log(`ℹ️  Ya existe ${path.relative(root, paths.mapFile)}. No se sobrescribió.`);
    return;
  }

  const landingScope = readJsonSafe(paths.landingScope);
  const rfsDetected = extractRfsFromPlanMaestro(paths.planMaestro);
  const publicRoutes = (landingScope?.publicRoutes || ['/']).map((p) => ({
    path: p,
    group: 'public',
    module: 'portal-publico',
    file: '',
    rf: [],
    roles: ['publico'],
    purpose: p === '/' ? 'Inicio del portal público' : `Página pública ${p}`,
    status: 'PLANNED',
  }));

  const template = {
    project: projectName || paths.tkConfig?.project?.name || path.basename(root),
    updatedAt: new Date().toISOString().slice(0, 10),
    sources: {
      planMaestro: fs.existsSync(paths.planMaestro) ? path.relative(root, paths.planMaestro).replace(/\\/g, '/') : null,
      landingScope: landingScope ? path.relative(root, paths.landingScope).replace(/\\/g, '/') : null,
      detectedRfsCount: rfsDetected.length,
    },
    architecture: {
      frontends: [
        { id: 'FE_PUB', label: 'Portal Público (landing)', stack: paths.tkConfig?.stack?.frontend || 'Frontend' },
        { id: 'FE_APP', label: 'Sistema Interno (RBAC)', stack: paths.tkConfig?.stack?.frontend || 'Frontend' },
        { id: 'FE_SYS', label: 'Pantallas de Error y Estado', stack: 'system-state-screens' },
      ],
      backends: [
        { id: 'BE_API', label: `API REST (${paths.tkConfig?.stack?.backend || 'Backend'})`, prefix: '/api/v1' },
      ],
      datastores: (paths.tkConfig?.stack?.databases || ['Base de Datos']).map((db, i) => ({ id: `DB_${i + 1}`, label: db })),
    },
    frontendRoutes: [
      ...publicRoutes,
      { path: '/login', group: 'auth', module: 'autenticacion', file: '', rf: ['RF-01'], roles: ['publico'], purpose: 'Inicio de sesión', status: 'PLANNED' },
      { path: '/401', group: 'system', module: 'sistema-errores', file: '', rf: [], roles: ['publico'], purpose: 'Sesión expirada / No autenticado', status: 'PLANNED' },
      { path: '/403', group: 'system', module: 'sistema-errores', file: '', rf: [], roles: ['publico'], purpose: 'Acceso restringido por RBAC', status: 'PLANNED' },
      { path: '/404', group: 'system', module: 'sistema-errores', file: '', rf: [], roles: ['publico'], purpose: 'Recurso o ruta no encontrada', status: 'PLANNED' },
      { path: '/500', group: 'system', module: 'sistema-errores', file: '', rf: [], roles: ['publico'], purpose: 'Error interno con traceId', status: 'PLANNED' },
      { path: '/503', group: 'system', module: 'sistema-errores', file: '', rf: [], roles: ['publico'], purpose: 'Mantenimiento / Servicio degradado', status: 'PLANNED' },
      { path: '/offline', group: 'system', module: 'sistema-errores', file: '', rf: [], roles: ['publico'], purpose: 'Sin conexión de red', status: 'PLANNED' },
    ],
    frontendBoundaries: [],
    backendEndpoints: [
      { method: 'GET', path: '/api/v1/health', service: 'backend', router: 'health', file: '', auth: 'public', permissions: [], rf: [], status: 'PLANNED' },
    ],
    websockets: [],
    systemErrorsAndLogs: {
      responseEnvelope: '{ success, data | error: { code, message }, timestamp }',
      correlationHeader: 'X-Request-Id',
      versionHeader: 'X-Min-App-Version',
      piiLogSanitization: 'Omitir URLs con query strings sensibles, DNI y tokens en logs HTTP/consola.',
      auditTrail: 'Registrar mutaciones críticas, lecturas de auditoría y denegaciones RBAC (ACCESS_DENIED).',
    },
    findings: [],
  };

  fs.mkdirSync(path.dirname(paths.mapFile), { recursive: true });
  fs.writeFileSync(paths.mapFile, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  console.log(`✅ Mapa de rutas creado: ${path.relative(root, paths.mapFile)}`);
  if (rfsDetected.length) console.log(`   🔗 Detectados ${rfsDetected.length} RF en plan-maestro.md.`);
}

/* -------------------- Subcomando: extract -------------------- */

function cmdExtract(root, merge, asJson) {
  const paths = resolveRoutesPaths(root);
  const fe = scanFrontendRoutes(root);
  const be = scanBackendEndpoints(root);
  const ambiguous = detectAmbiguousOpenApiPaths(be.backendEndpoints);

  let mergedStats = null;
  if (merge) {
    if (!fs.existsSync(paths.mapFile)) cmdInit(root, null);
    const data = JSON.parse(fs.readFileSync(paths.mapFile, 'utf8'));

    let feAdded = 0;
    let feMatched = 0;
    const feByPath = new Map((data.frontendRoutes || []).map((r) => [r.path, r]));
    for (const r of fe.frontendRoutes) {
      if (feByPath.has(r.path)) {
        const existing = feByPath.get(r.path);
        existing.file = r.file || existing.file;
        existing.status = 'IMPLEMENTED';
        feMatched++;
      } else {
        data.frontendRoutes.push(r);
        feByPath.set(r.path, r);
        feAdded++;
      }
    }
    data.frontendBoundaries = fe.boundaries;

    let beAdded = 0;
    let beMatched = 0;
    const beByKey = new Map((data.backendEndpoints || []).map((e) => [`${e.method} ${e.path}`, e]));
    for (const e of be.backendEndpoints) {
      const k = `${e.method} ${e.path}`;
      if (beByKey.has(k)) {
        const existing = beByKey.get(k);
        existing.file = e.file || existing.file;
        existing.status = 'IMPLEMENTED';
        beMatched++;
      } else {
        data.backendEndpoints.push(e);
        beByKey.set(k, e);
        beAdded++;
      }
    }

    for (const ws of be.websockets) {
      if (!(data.websockets || []).some((w) => w.path === ws.path)) {
        data.websockets.push(ws);
      }
    }

    data.updatedAt = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(paths.mapFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    mergedStats = { feAdded, feMatched, beAdded, beMatched, mapFile: path.relative(root, paths.mapFile) };
  }

  const result = {
    frontendRoutesCount: fe.frontendRoutes.length,
    frontendBoundariesCount: fe.boundaries.length,
    backendEndpointsCount: be.backendEndpoints.length,
    websocketsCount: be.websockets.length,
    ambiguousOpenApiPaths: ambiguous,
    merged: mergedStats,
    frontendRoutes: fe.frontendRoutes,
    frontendBoundaries: fe.boundaries,
    backendEndpoints: be.backendEndpoints,
    websockets: be.websockets,
  };

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`=== Extracción de Rutas y Endpoints: ${root} ===`);
    console.log(`Frontend: ${result.frontendRoutesCount} rutas · ${result.frontendBoundariesCount} boundaries de error/loading`);
    console.log(`Backend:  ${result.backendEndpointsCount} endpoints REST · ${result.websocketsCount} WebSockets`);
    if (ambiguous.length) {
      console.log(`⚠️  Ambigüedades OpenAPI detectadas: ${ambiguous.length}`);
      for (const a of ambiguous) console.log(`   • ${a.message}`);
    }
    if (mergedStats) {
      console.log(`✅ Sincronizado en ${mergedStats.mapFile} (+${mergedStats.feAdded} FE, +${mergedStats.beAdded} BE; ${mergedStats.feMatched + mergedStats.beMatched} confirmadas como IMPLEMENTED).`);
    }
  }
}

/* -------------------- Subcomando: generate -------------------- */

function cmdGenerate(root) {
  const paths = resolveRoutesPaths(root);
  if (!fs.existsSync(paths.mapFile)) {
    console.error(`❌ No existe ${path.relative(root, paths.mapFile)}. Ejecuta "init" o "extract --merge" primero.`);
    process.exit(2);
  }
  const d = JSON.parse(fs.readFileSync(paths.mapFile, 'utf8'));
  const fe = d.frontendRoutes || [];
  const be = d.backendEndpoints || [];
  const ws = d.websockets || [];
  const arch = d.architecture || {};
  const errCfg = d.systemErrorsAndLogs || {};
  const ambiguous = detectAmbiguousOpenApiPaths(be);

  const lines = [
    `# Catálogo Completo de Rutas, Endpoints y Errores — ${d.project || 'Proyecto'}`,
    '',
    `Fuente única de verdad generada desde \`${path.relative(root, paths.mapFile).replace(/\\/g, '/')}\`. Última actualización: **${d.updatedAt || new Date().toISOString().slice(0, 10)}**.`,
    '',
    '---',
    '',
    '## 1. Arquitectura de Servicios y Flujo',
    '',
    '```mermaid',
    'flowchart LR',
    '    subgraph FE["Frontend"]',
    ...(arch.frontends || []).map((f) => `        ${f.id}["${f.label}"]`),
    '    end',
    '    subgraph BE["Backend y Tiempo Real"]',
    ...(arch.backends || []).map((b) => `        ${b.id}["${b.label}"]`),
    '    end',
    '    subgraph DB["Persistencia"]',
    ...(arch.datastores || []).map((ds) => `        ${ds.id}[("${ds.label}")]`),
    '    end',
    '    FE --> BE',
    '    BE --> DB',
    '```',
    '',
    '---',
    '',
    '## 2. Rutas del Frontend',
    '',
  ];

  const groupLabels = [
    ['public', '2.1. Portal Público / Landing'],
    ['auth', '2.2. Autenticación y Activación'],
    ['terminal', '2.3. Terminales Especiales (Kiosco / Offline)'],
    ['internal', '2.4. Sistema Interno (por Módulo y RBAC)'],
    ['system', '2.5. Pantallas de Error y Estado del Sistema'],
  ];

  for (const [gKey, title] of groupLabels) {
    const items = fe.filter((r) => r.group === gKey);
    if (!items.length) continue;
    lines.push(`### ${title}`);
    lines.push('| Ruta URL | Módulo | RF | Roles RBAC | Estado | Archivo | Propósito |');
    lines.push('| :--- | :--- | :--- | :--- | :---: | :--- | :--- |');
    for (const r of items) {
      lines.push(`| \`${r.path}\` | ${r.module || '—'} | ${(r.rf || []).join(', ') || '—'} | ${(r.roles || []).join(', ') || '—'} | ${r.status || 'PLANNED'} | ${r.file ? `\`${r.file}\`` : '—'} | ${r.purpose || '—'} |`);
    }
    lines.push('');
  }

  lines.push('---', '', '## 3. Endpoints Backend REST y WebSockets', '');
  if (be.length) {
    lines.push('| Método | Ruta API | Servicio / Router | Auth | Permisos | RF | Estado | Archivo |');
    lines.push('| :---: | :--- | :--- | :---: | :--- | :--- | :---: | :--- |');
    for (const e of be) {
      lines.push(`| \`${e.method}\` | \`${e.path}\` | ${e.service || 'backend'} / ${e.router || '—'} | ${e.auth || 'jwt'} | ${(e.permissions || []).join(', ') || '—'} | ${(e.rf || []).join(', ') || '—'} | ${e.status || 'PLANNED'} | ${e.file ? `\`${e.file}\`` : '—'} |`);
    }
    lines.push('');
  } else {
    lines.push('_Sin endpoints REST registrados todavía._', '');
  }

  if (ws.length) {
    lines.push('### WebSockets / Tiempo Real');
    lines.push('| Ruta WS | Servicio | Protocolo Auth | Eventos | Archivo |');
    lines.push('| :--- | :--- | :---: | :--- | :--- |');
    for (const w of ws) {
      lines.push(`| \`${w.path}\` | ${w.service || 'backend'} | ${w.authProtocol || 'bearer'} | ${(w.events || []).join(', ') || '—'} | ${w.file ? `\`${w.file}\`` : '—'} |`);
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## 4. Contrato de Errores, Interceptores y Logs de Auditoría',
    '',
    `- **Sobre HTTP canónico:** \`${errCfg.responseEnvelope || '{ success, data | error }'}\``,
    `- **Correlation ID:** \`${errCfg.correlationHeader || 'X-Request-Id'}\``,
    `- **Control de versión cliente:** \`${errCfg.versionHeader || 'X-Min-App-Version'}\``,
    `- **Sanitización PII en logs:** ${errCfg.piiLogSanitization || 'No loguear DNI, contraseñas ni tokens en URLs o consola.'}`,
    `- **Auditoría inmutable:** ${errCfg.auditTrail || 'Registrar mutaciones críticas y ACCESS_DENIED.'}`,
    ''
  );

  if ((d.frontendBoundaries || []).length) {
    lines.push('### Boundaries Detectados en Frontend');
    for (const b of d.frontendBoundaries) {
      lines.push(`- **${b.type}**: \`${b.file}\``);
    }
    lines.push('');
  }

  const allFindings = [...(d.findings || []), ...ambiguous.map((a) => ({ code: a.code, detail: a.message }))];
  lines.push('---', '', '## 5. Discrepancias y Hallazgos de Enrutamiento', '');
  if (allFindings.length) {
    for (const f of allFindings) {
      lines.push(`- **${f.code || 'HALLAZGO'}:** ${f.detail || f.message || JSON.stringify(f)}`);
    }
  } else {
    lines.push('✅ Sin discrepancias ni ambigüedades OpenAPI registradas.');
  }
  lines.push('');

  fs.mkdirSync(path.dirname(paths.catalogMd), { recursive: true });
  fs.writeFileSync(paths.catalogMd, lines.join('\n'), 'utf8');
  console.log(`✅ Catálogo generado: ${path.relative(root, paths.catalogMd)}`);
}

/* -------------------- Subcomando: audit -------------------- */

function cmdAudit(root, strict, asJson) {
  const paths = resolveRoutesPaths(root);
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(paths.mapFile)) {
    errors.push(`Falta ${path.relative(root, paths.mapFile)} (ejecuta "autopilot rutas iniciar" o "extraer --merge").`);
  } else {
    const d = JSON.parse(fs.readFileSync(paths.mapFile, 'utf8'));
    const fe = d.frontendRoutes || [];
    const be = d.backendEndpoints || [];

    // 1. Duplicados exactos Frontend
    const feSeen = new Set();
    for (const r of fe) {
      if (feSeen.has(r.path)) errors.push(`Ruta Frontend duplicada: ${r.path}`);
      feSeen.add(r.path);
      if (r.group === 'internal' && (!r.roles || r.roles.length === 0)) {
        warnings.push(`Ruta interna sin roles RBAC definidos: ${r.path}`);
      }
      if (r.group === 'internal' && (!r.rf || r.rf.length === 0)) {
        warnings.push(`Ruta interna sin trazabilidad RF: ${r.path}`);
      }
    }

    // 2. Duplicados exactos Backend
    const beSeen = new Set();
    for (const e of be) {
      const k = `${e.method} ${e.path}`;
      if (beSeen.has(k)) errors.push(`Endpoint Backend duplicado: ${k}`);
      beSeen.add(k);
    }

    // 3. Ambigüedades OpenAPI (/users/me vs /users/:id)
    for (const a of detectAmbiguousOpenApiPaths(be)) {
      warnings.push(a.message);
    }

    // 4. Cobertura mínima de rutas de error
    const fePaths = new Set(fe.map((r) => r.path));
    for (const reqErr of ['/401', '/403', '/404', '/500']) {
      if (!fePaths.has(reqErr)) {
        warnings.push(`Falta ruta de error recomendada en el catálogo: ${reqErr}`);
      }
    }

    // 5. Conflicto con landing-design-guardian/scope.json
    const scope = readJsonSafe(paths.landingScope);
    if (scope && Array.isArray(scope.excludedRoutes)) {
      for (const r of fe.filter((x) => x.group === 'public')) {
        if (scope.excludedRoutes.some((ex) => r.path === ex || r.path.startsWith(`${ex}/`))) {
          errors.push(`Conflicto de seguridad: la ruta "${r.path}" está marcada como "public" pero aparece en scope.json → excludedRoutes.`);
        }
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ errors, warnings }, null, 2));
  } else {
    console.log(`=== Auditoría de Rutas, Endpoints y OpenAPI: ${root} ===`);
    console.log(`Resumen: ${errors.length} errores, ${warnings.length} avisos.`);
    for (const e of errors) console.error(`  ERROR: ${e}`);
    for (const w of warnings.slice(0, 20)) console.warn(`  WARN:  ${w}`);
  }

  if (strict && errors.length > 0) process.exit(1);
}

function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    console.log('Uso: node scripts/routes-cli.mjs <init|extract|generate|audit | iniciar|extraer|generar|auditar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'init' || cmd === 'iniciar') cmdInit(root, flags.name);
  else if (cmd === 'extract' || cmd === 'extraer') cmdExtract(root, Boolean(flags.merge), Boolean(flags.json));
  else if (cmd === 'generate' || cmd === 'generar') cmdGenerate(root);
  else if (cmd === 'audit' || cmd === 'auditar') cmdAudit(root, Boolean(flags.strict), Boolean(flags.json));
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
