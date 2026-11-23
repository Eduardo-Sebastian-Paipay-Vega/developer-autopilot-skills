#!/usr/bin/env node
/**
 * /busqueda — SEO Engineering & Web Visibility Auditor (v2.0)
 * CLI sin dependencias (`init`, `extract`, `generate`, `audit` | `iniciar`, `extraer`, `generar`, `auditar`)
 *
 * Conecta automáticamente con:
 * - `toolkit.config.json` (stack, proyecto, rutas de artefactos)
 * - `docs/arquitectura/routes-map.json` (rutas públicas vs privadas/auth/system)
 * - `docs/diseno/design-tokens.json` (colores para manifest.webmanifest y OG)
 * - `.claude/landing-design/scope.json` (publicRoutes vs excludedRoutes)
 *
 * Características v2.0:
 * - Niveles de madurez L0–L3 por capacidad SEO.
 * - Hallazgos trazables con esquema `SEO-XX-001` (severidad, módulo, ubicación, evidencia, aceptación).
 * - Puntuación de cumplimiento de ingeniería 0–100 (10 pilares).
 * - Verificación HTTP en vivo opcional (`--url http://localhost:3000`) con detección real de Soft-404.
 *
 * Uso:
 *   node scripts/seo-cli.mjs init     [--dir <ruta>] [--domain "https://ejemplo.com"] [--type "saas"]
 *   node scripts/seo-cli.mjs extract  [--dir <ruta>] [--json]
 *   node scripts/seo-cli.mjs generate [--dir <ruta>]
 *   node scripts/seo-cli.mjs audit    [--dir <ruta>] [--url <http://localhost:3000>] [--strict] [--json]
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

function resolveSeoPaths(root) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const s = tkConfig?.seo || {};
  const r = tkConfig?.routes || {};
  const d = tkConfig?.design || {};

  const seoDir = path.join(root, s.dir || path.join('docs', 'seo'));
  return {
    tkConfig,
    seoDir,
    configFile: path.join(root, s.config_file || path.join('docs', 'seo', 'seo-config.json')),
    reportMd: path.join(root, s.report_md || path.join('docs', 'seo', 'SEO_REPORT.md')),
    routesMap: path.join(root, r.map_file || path.join('docs', 'arquitectura', 'routes-map.json')),
    designTokens: path.join(root, d.tokens_file || path.join('docs', 'diseno', 'design-tokens.json')),
    landingScope: path.join(root, d.landing_scope || path.join('.claude', 'landing-design', 'scope.json')),
  };
}

function joinUrl(base, routePath) {
  const cleanBase = String(base || 'https://ejemplo.com').replace(/\/+$/, '');
  const cleanPath = routePath === '/' ? '/' : `/${String(routePath || '').replace(/^\/+/, '')}`;
  return `${cleanBase}${cleanPath}`;
}

/* -------------------- Subcomando: init -------------------- */

function cmdInit(root, flags) {
  const paths = resolveSeoPaths(root);
  if (fs.existsSync(paths.configFile)) {
    console.log(`ℹ️  Ya existe ${path.relative(root, paths.configFile)}. No se sobrescribió.`);
    return;
  }

  const routesMap = readJsonSafe(paths.routesMap);
  const designTokens = readJsonSafe(paths.designTokens);
  const landingScope = readJsonSafe(paths.landingScope);

  const projectName = flags.name || paths.tkConfig?.project?.name || routesMap?.project || designTokens?.project || path.basename(root);
  const canonicalDomain = String(flags.domain || 'https://ejemplo.com').replace(/\/+$/, '');
  const projectType = flags.type || 'corporate-with-app';

  const publicPaths = new Set(['/']);
  const privateDisallow = new Set(['/admin/', '/dashboard/', '/intranet/', '/api/private/', '/login']);

  if (Array.isArray(landingScope?.publicRoutes)) {
    for (const p of landingScope.publicRoutes) publicPaths.add(p);
  }
  if (Array.isArray(landingScope?.excludedRoutes)) {
    for (const ex of landingScope.excludedRoutes) privateDisallow.add(ex.endsWith('/') ? ex : `${ex}/`);
  }
  if (Array.isArray(routesMap?.frontendRoutes)) {
    for (const r of routesMap.frontendRoutes) {
      if (r.group === 'public') publicPaths.add(r.path);
      else if (['internal', 'auth', 'terminal'].includes(r.group)) {
        const seg = `/${String(r.path || '').split('/').filter(Boolean)[0] || ''}`;
        if (seg.length > 1) privateDisallow.add(`${seg}/`);
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const pages = [...publicPaths].sort().map((p) => {
    const slugLabel = p === '/' ? 'Inicio' : p.replace(/^\/+/, '').replace(/[/-]+/g, ' ');
    const titleCase = slugLabel.charAt(0).toUpperCase() + slugLabel.slice(1);
    return {
      path: p,
      indexable: true,
      title: p === '/' ? `${projectName} — Portal Oficial` : `${titleCase} | ${projectName}`,
      description: p === '/'
        ? `Sitio oficial de ${projectName}. Información institucional, servicios y canales de atención.`
        : `Información detallada sobre ${slugLabel} en ${projectName}.`,
      canonicalUrl: joinUrl(canonicalDomain, p),
      robots: 'index, follow',
      ogType: 'website',
      ogImage: `${canonicalDomain}/og/default.jpg`,
      locale: 'es_PE',
      lastModified: today,
    };
  });

  const cfg = {
    project: projectName,
    projectType,
    canonicalDomain,
    locale: 'es-PE',
    updatedAt: today,
    sources: {
      routesMap: routesMap ? path.relative(root, paths.routesMap).replace(/\\/g, '/') : null,
      designTokens: designTokens ? path.relative(root, paths.designTokens).replace(/\\/g, '/') : null,
      landingScope: landingScope ? path.relative(root, paths.landingScope).replace(/\\/g, '/') : null,
    },
    organization: {
      name: projectName,
      url: `${canonicalDomain}/`,
      description: paths.tkConfig?.project?.description || `Plataforma oficial de ${projectName}.`,
      logo: `${canonicalDomain}/logo.png`,
    },
    theme: {
      themeColor: designTokens?.brand?.primary || '#1D4ED8',
      backgroundColor: designTokens?.brand?.surface || '#FFFFFF',
    },
    robots: {
      allow: ['/'],
      disallow: [...privateDisallow].sort(),
      stagingNoIndexHeader: 'X-Robots-Tag: noindex, nofollow',
    },
    redirects: [],
    pages,
    geo: {
      authorAttribution: true,
      publishDates: true,
      llmsTxtEnabled: false,
    },
    analytics: {
      searchConsoleVerified: false,
      analyticsProvider: 'none',
    },
  };

  fs.mkdirSync(path.dirname(paths.configFile), { recursive: true });
  fs.writeFileSync(paths.configFile, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
  console.log(`✅ Configuración SEO creada: ${path.relative(root, paths.configFile)}`);
  console.log(`   • Rutas públicas indexables: ${pages.length} · Prefijos privados protegidos: ${cfg.robots.disallow.length}`);
}

/* -------------------- Subcomando: extract -------------------- */

function scanRepoSeo(root) {
  const codeFiles = walkFiles(root, (_full, name) =>
    /\.(tsx|jsx|ts|js|mjs|html|vue|svelte|astro|py)$/i.test(name)
  );
  const publicFiles = walkFiles(root, (_full, name) =>
    /^(robots\.(txt|ts|js)|sitemap\.(xml|ts|js)|manifest\.(webmanifest|json|ts|js)|llms\.txt)$/i.test(name)
  );

  let hasRobots = false;
  let hasSitemap = false;
  let hasManifest = false;
  let hasLlmsTxt = false;
  let hasHtmlLang = false;
  let hasMetadataApiOrTitle = false;
  let hasCanonical = false;
  let hasOpenGraph = false;
  let hasJsonLd = false;
  let hasXRobotsTag = false;
  const hasSeoTests = fs.existsSync(path.join(root, 'tests', 'seo')) || fs.existsSync(path.join(root, 'e2e', 'seo'));
  const robotsIssues = [];
  const jsonLdErrors = [];

  for (const f of publicFiles) {
    const base = path.basename(f).toLowerCase();
    const rel = path.relative(root, f).replace(/\\/g, '/');
    if (rel.startsWith('docs/seo/')) continue;
    if (base.startsWith('robots.')) {
      hasRobots = true;
      if (base === 'robots.txt') {
        const txt = fs.readFileSync(f, 'utf8');
        if (/Disallow:\s*\/\s*$/m.test(txt) && !/Allow:\s*\//m.test(txt)) {
          robotsIssues.push(`${rel}: bloquea todo el sitio (Disallow: /).`);
        }
        if (/Disallow:\s*\/.*(\.css|\.js|_next\/static)/i.test(txt)) {
          robotsIssues.push(`${rel}: bloquea recursos CSS/JS necesarios para renderizado.`);
        }
      }
    }
    if (base.startsWith('sitemap.')) hasSitemap = true;
    if (base.startsWith('manifest.')) hasManifest = true;
    if (base === 'llms.txt') hasLlmsTxt = true;
  }

  for (const f of codeFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    if (/\.(spec|test)\./i.test(rel)) continue;
    const txt = fs.readFileSync(f, 'utf8');
    if (/<html[^>]*\blang\s*=\s*['"][a-z]{2}/i.test(txt)) hasHtmlLang = true;
    if (/\bgenerateMetadata\b|export\s+const\s+metadata\b|<title\b|Title\s*\)/i.test(txt)) hasMetadataApiOrTitle = true;
    if (/rel=["']canonical["']|\bcanonical\b/i.test(txt)) hasCanonical = true;
    if (/property=["']og:|openGraph\s*:/i.test(txt)) hasOpenGraph = true;
    if (/application\/ld\+json/i.test(txt)) {
      hasJsonLd = true;
      const inlineMatches = txt.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      for (const m of inlineMatches) {
        const body = m[1].trim();
        if (body.startsWith('{') && !body.includes('${') && !body.includes('JSON.stringify')) {
          try { JSON.parse(body); } catch (err) {
            jsonLdErrors.push(`${rel}: JSON-LD inválido (${err.message})`);
          }
        }
      }
    }
    if (/X-Robots-Tag/i.test(txt)) hasXRobotsTag = true;
  }

  return {
    scannedCodeFiles: codeFiles.length,
    signals: {
      hasRobots,
      hasSitemap,
      hasManifest,
      hasLlmsTxt,
      hasHtmlLang,
      hasMetadataApiOrTitle,
      hasCanonical,
      hasOpenGraph,
      hasJsonLd,
      hasXRobotsTag,
      hasSeoTests,
    },
    robotsIssues,
    jsonLdErrors,
  };
}

function cmdExtract(root, asJson) {
  const data = scanRepoSeo(root);
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`=== Extracción SEO Técnica del Repositorio: ${root} ===`);
    for (const [k, v] of Object.entries(data.signals)) {
      console.log(`  ${v ? '✅' : '⚪'} ${k}`);
    }
    for (const r of data.robotsIssues) console.warn(`  ⚠️  ${r}`);
    for (const j of data.jsonLdErrors) console.error(`  ❌ ${j}`);
  }
}

/* -------------------- Verificación HTTP en vivo opcional (Soft-404) -------------------- */

async function probeLiveHttp(baseUrl) {
  const clean = String(baseUrl || '').replace(/\/+$/, '');
  const checks = [];
  const findings = [];
  try {
    const rHome = await fetch(`${clean}/`, { redirect: 'manual' });
    checks.push({ url: `${clean}/`, status: rHome.status, contentType: rHome.headers.get('content-type') || '' });

    const r404 = await fetch(`${clean}/__seo_nonexistent_probe_404__`, { redirect: 'manual' });
    checks.push({ url: `${clean}/__seo_nonexistent_probe_404__`, status: r404.status });
    if (r404.status === 200) {
      findings.push({
        id: 'SEO-BE-SOFT404',
        module: 'SEO Backend',
        severity: 'Crítica',
        location: `${clean}/__seo_nonexistent_probe_404__`,
        evidence: `HTTP 200 OK recibido para una ruta inexistente.`,
        problem: 'Soft 404 detectado: el servidor responde 200 OK en lugar de 404/410.',
        impact: 'Consumo de presupuesto de rastreo e indexación de páginas vacías o de error.',
        acceptance: 'Responder HTTP 404 (o 410) real para rutas inexistentes.',
        status: 'Pendiente',
      });
    }
  } catch (err) {
    checks.push({ url: clean, status: 'UNREACHABLE', error: err.message });
  }
  return { checks, findings };
}

/* -------------------- Evaluación, Madurez L0–L3 y Puntuación 0–100 -------------------- */

function evaluateSeo(root) {
  const paths = resolveSeoPaths(root);
  const cfg = readJsonSafe(paths.configFile);
  const scope = readJsonSafe(paths.landingScope);
  const routesMap = readJsonSafe(paths.routesMap);
  const repo = scanRepoSeo(root);

  const errors = [];
  const warnings = [];
  const findings = [];
  let seq = 1;
  const pushFinding = (prefix, moduleName, severity, location, evidence, problem, impact, acceptance) => {
    const id = `SEO-${prefix}-${String(seq++).padStart(3, '0')}`;
    findings.push({ id, module: moduleName, severity, location, evidence, problem, impact, acceptance, status: 'Pendiente' });
    if (severity === 'Crítica' || severity === 'Alta') errors.push(`[${id}] ${problem}`);
    else warnings.push(`[${id}] ${problem}`);
  };

  if (!cfg) {
    pushFinding('CORE', 'Discovery', 'Alta', path.relative(root, paths.configFile), 'Archivo ausente',
      `Falta ${path.relative(root, paths.configFile)} (ejecuta "autopilot busqueda iniciar").`,
      'No existe fuente única de configuración SEO.', 'Crear y poblar seo-config.json.');
  }

  const pages = cfg?.pages || [];
  const redirects = cfg?.redirects || [];
  const excluded = new Set([
    ...(scope?.excludedRoutes || []),
    ...((routesMap?.frontendRoutes || []).filter((r) => ['internal', 'auth', 'terminal'].includes(r.group)).map((r) => r.path)),
  ]);

  const seenTitles = new Map();
  const seenCanonicals = new Map();
  for (const p of pages) {
    if (p.indexable && excluded.has(p.path)) {
      pushFinding('SEC', 'Security & Privacy', 'Crítica', p.path, `indexable: true en seo-config.json`,
        `Fuga de privacidad: la ruta privada/excluida "${p.path}" está marcada como indexable.`,
        'Exposición de superficies internas en buscadores.', 'Marcar indexable: false, robots: noindex, nofollow y excluir del sitemap.');
    }
    if (!p.title || !p.title.trim()) {
      pushFinding('FE', 'Frontend SEO', 'Alta', p.path, 'title vacío',
        `Ruta "${p.path}" sin <title>.`, 'Pérdida de señal primaria en resultados de búsqueda.', 'Definir título único descriptivo.');
    } else if (seenTitles.has(p.title.trim().toLowerCase())) {
      pushFinding('FE', 'Frontend SEO', 'Alta', p.path, `title="${p.title}"`,
        `Title duplicado ("${p.title}") en "${p.path}" y "${seenTitles.get(p.title.trim().toLowerCase())}".`,
        'Competencia interna y pérdida de especificidad.', 'Asignar título único por ruta.');
    } else {
      seenTitles.set(p.title.trim().toLowerCase(), p.path);
    }

    if (!p.canonicalUrl || !/^https?:\/\//i.test(p.canonicalUrl)) {
      pushFinding('TECH', 'SEO Technical', 'Alta', p.path, `canonicalUrl="${p.canonicalUrl || ''}"`,
        `Canonical inválido o no absoluto en "${p.path}".`, 'Consolidación ambigua de URLs.', 'Definir canonical absoluta con HTTPS.');
    } else if (seenCanonicals.has(p.canonicalUrl)) {
      pushFinding('TECH', 'SEO Technical', 'Alta', p.path, `canonicalUrl="${p.canonicalUrl}"`,
        `Canonical duplicado ("${p.canonicalUrl}") en "${p.path}" y "${seenCanonicals.get(p.canonicalUrl)}".`,
        'Riesgo de desindexación de una de las páginas.', 'Asignar canonical propia a cada ruta independiente.');
    } else {
      seenCanonicals.set(p.canonicalUrl, p.path);
    }

    if (!p.description || p.description.trim().length < 25) {
      pushFinding('FE', 'Frontend SEO', 'Media', p.path, `length=${(p.description || '').length}`,
        `Meta description ausente o muy corta en "${p.path}".`, 'Snippets poco descriptivos.', 'Redactar descripción específica y fiel al contenido.');
    }
    if (!p.ogImage) {
      pushFinding('FE', 'Frontend SEO', 'Baja', p.path, 'ogImage ausente',
        `Falta ogImage en "${p.path}".`, 'Previsualización pobre al compartir en redes.', 'Definir URL absoluta de imagen OG pública.');
    }
  }

  const redirMap = new Map(redirects.map((r) => [r.from, r.to]));
  for (const r of redirects) {
    if (r.from === r.to) {
      pushFinding('URL', 'URL Architecture', 'Crítica', r.from, `${r.from} -> ${r.to}`,
        `Redirección circular detectada: ${r.from} → ${r.to}.`, 'Bucle infinito impide acceso y rastreo.', 'Eliminar bucle y apuntar al destino definitivo.');
    } else if (redirMap.has(r.to)) {
      pushFinding('URL', 'URL Architecture', 'Media', r.from, `${r.from} -> ${r.to} -> ${redirMap.get(r.to)}`,
        `Cadena de redirección detectada: ${r.from} → ${r.to} → ${redirMap.get(r.to)}.`, 'Latencia y pérdida de eficiencia de rastreo.', 'Apuntar directamente al destino final con 301.');
    }
  }

  for (const ri of repo.robotsIssues) {
    pushFinding('TECH', 'SEO Technical', 'Crítica', 'robots.txt', ri, ri, 'Bloqueo de rastreo o renderizado.', 'Permitir rutas públicas y recursos CSS/JS.');
  }
  for (const je of repo.jsonLdErrors) {
    pushFinding('SD', 'Structured Data', 'Alta', 'JSON-LD', je, je, 'Datos estructurados ignorados por motores.', 'Corregir sintaxis JSON válida.');
  }

  if (!repo.signals.hasHtmlLang) {
    pushFinding('A11Y', 'Accessibility', 'Media', 'layout/html', 'Sin <html lang>',
      'No se detectó atributo <html lang="..."> en el código frontend.', 'Dificulta comprensión de idioma y accesibilidad.', 'Agregar lang explícito (ej. lang="es-PE").');
  }
  if (!repo.signals.hasXRobotsTag) {
    pushFinding('SEC', 'Security & Privacy', 'Media', 'servidor/middleware', 'Sin X-Robots-Tag',
      'No se detectó política X-Robots-Tag para staging/preproducción.', 'Riesgo de indexación accidental de staging.', 'Emitir X-Robots-Tag: noindex, nofollow fuera de producción.');
  }
  if (!repo.signals.hasSeoTests) {
    pushFinding('QA', 'SEO QA & CI/CD', 'Media', 'tests/seo/', 'Directorio inexistente',
      'No existe suite automatizada tests/seo/ en el proyecto.', 'Sin protección continua contra regresiones SEO.', 'Agregar pruebas automatizadas en tests/seo/ e integrarlas en CI.');
  }

  // Madurez L0–L3 por capacidad
  const maturity = [
    { capability: 'robots.txt', level: repo.robotsIssues.length ? 'L1' : (repo.signals.hasRobots ? (repo.signals.hasSeoTests ? 'L3' : 'L2') : (cfg?.robots ? 'L1' : 'L0')) },
    { capability: 'sitemap.xml', level: repo.signals.hasSitemap ? (repo.signals.hasSeoTests ? 'L3' : 'L2') : (pages.length > 0 ? 'L1' : 'L0') },
    { capability: 'Metadata única / canonical', level: errors.some((e) => e.includes('SEO-FE-') || e.includes('SEO-TECH-')) ? 'L1' : (repo.signals.hasMetadataApiOrTitle && pages.length ? (repo.signals.hasSeoTests ? 'L3' : 'L2') : (pages.length ? 'L1' : 'L0')) },
    { capability: 'Structured Data (JSON-LD)', level: repo.jsonLdErrors.length ? 'L1' : (repo.signals.hasJsonLd ? 'L2' : (cfg?.organization ? 'L1' : 'L0')) },
    { capability: 'Seguridad & Indexabilidad', level: errors.some((e) => e.includes('SEO-SEC-')) ? 'L0' : (repo.signals.hasXRobotsTag ? 'L2' : 'L1') },
    { capability: 'Accesibilidad base (<html lang>)', level: repo.signals.hasHtmlLang ? 'L2' : 'L0' },
    { capability: 'SEO QA & CI/CD (tests/seo/)', level: repo.signals.hasSeoTests ? 'L3' : 'L0' },
  ];

  const pillars = [
    { name: '1. Infraestructura y servidor', max: 10, score: (cfg?.canonicalDomain?.startsWith('https://') ? 6 : 0) + (redirects.every((r) => r.from !== r.to) ? 4 : 0) },
    { name: '2. Backend', max: 12, score: (cfg ? 6 : 0) + (pages.length > 0 ? 6 : 0) },
    { name: '3. Frontend', max: 15, score: (repo.signals.hasMetadataApiOrTitle ? 5 : 0) + (repo.signals.hasCanonical || pages.length > 0 ? 5 : 0) + (repo.signals.hasOpenGraph || pages.every((p) => p.ogImage) ? 5 : 0) },
    { name: '4. SEO técnico', max: 15, score: (repo.signals.hasRobots || cfg?.robots ? 5 : 0) + (repo.signals.hasSitemap || pages.length > 0 ? 5 : 0) + (repo.jsonLdErrors.length === 0 && (repo.signals.hasJsonLd || cfg?.organization) ? 5 : 0) },
    { name: '5. Rendimiento (CWV)', max: 12, score: cfg ? 8 : 0 },
    { name: '6. Seguridad y privacidad', max: 8, score: (errors.some((e) => e.includes('Fuga de privacidad')) ? 0 : 5) + (repo.signals.hasXRobotsTag || cfg?.robots?.stagingNoIndexHeader ? 3 : 0) },
    { name: '7. Contenido y semántica', max: 10, score: (errors.some((e) => e.includes('Title duplicado')) ? 0 : 6) + (cfg?.geo?.authorAttribution ? 4 : 0) },
    { name: '8. Accesibilidad', max: 5, score: repo.signals.hasHtmlLang ? 5 : 2 },
    { name: '9. Analítica', max: 5, score: cfg?.analytics?.searchConsoleVerified ? 5 : 2 },
    { name: '10. QA y CI/CD', max: 8, score: repo.signals.hasSeoTests ? 8 : 3 },
  ];
  const totalScore = pillars.reduce((acc, p) => acc + p.score, 0);

  return { cfg, repo, errors, warnings, findings, maturity, pillars, totalScore };
}

/* -------------------- Subcomando: generate -------------------- */

function cmdGenerate(root) {
  const paths = resolveSeoPaths(root);
  const evalRes = evaluateSeo(root);
  if (!evalRes.cfg) {
    console.error(`❌ No existe ${path.relative(root, paths.configFile)}. Ejecuta "init" primero.`);
    process.exit(2);
  }

  const cfg = evalRes.cfg;
  const domain = String(cfg.canonicalDomain || 'https://ejemplo.com').replace(/\/+$/, '');
  fs.mkdirSync(paths.seoDir, { recursive: true });

  const robotsTxt = [
    '# Generado automáticamente por /busqueda (seo-cli.mjs)',
    'User-agent: *',
    ...(cfg.robots?.allow || ['/']).map((a) => `Allow: ${a}`),
    ...(cfg.robots?.disallow || []).map((d) => `Disallow: ${d}`),
    '',
    `Sitemap: ${domain}/sitemap.xml`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(paths.seoDir, 'robots.generated.txt'), robotsTxt, 'utf8');

  const indexablePages = (cfg.pages || []).filter((p) => p.indexable && !/noindex/i.test(p.robots || ''));
  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...indexablePages.map((p) => [
      '  <url>',
      `    <loc>${p.canonicalUrl}</loc>`,
      `    <lastmod>${p.lastModified || cfg.updatedAt}</lastmod>`,
      '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(paths.seoDir, 'sitemap.generated.xml'), sitemapXml, 'utf8');

  const manifest = {
    name: cfg.project,
    short_name: cfg.project.slice(0, 12),
    start_url: '/',
    display: 'standalone',
    background_color: cfg.theme?.backgroundColor || '#FFFFFF',
    theme_color: cfg.theme?.themeColor || '#1D4ED8',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
  fs.writeFileSync(path.join(paths.seoDir, 'manifest.generated.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: cfg.organization?.name || cfg.project,
    url: cfg.organization?.url || `${domain}/`,
    description: cfg.organization?.description || '',
    logo: cfg.organization?.logo || `${domain}/logo.png`,
  };
  fs.writeFileSync(path.join(paths.seoDir, 'organization.schema.jsonld'), `${JSON.stringify(orgSchema, null, 2)}\n`, 'utf8');

  const report = [
    `# Auditoría y Estándar SEO Engineering — ${cfg.project}`,
    '',
    `Dominio canónico: \`${domain}\` · Tipo: \`${cfg.projectType}\` · Fecha: **${cfg.updatedAt}** · Cumplimiento interno: **${evalRes.totalScore}/100** *(no predice rankings de Google)*.`,
    '',
    '## 1. Niveles de Madurez por Capacidad (`L0–L3`)',
    '| Capacidad | Nivel |',
    '| :--- | :---: |',
    ...evalRes.maturity.map((m) => `| ${m.capability} | **${m.level}** |`),
    '',
    '## 2. Matriz de Cumplimiento Técnico (100 puntos)',
    '| Pilar | Puntuación | Máximo |',
    '| :--- | :---: | :---: |',
    ...evalRes.pillars.map((p) => `| ${p.name} | **${p.score}** | ${p.max} |`),
    `| **TOTAL** | **${evalRes.totalScore}** | **100** |`,
    '',
    '## 3. Inventario de Rutas Indexables y Metadatos',
    '| Ruta | Title | Canonical | Robots |',
    '| :--- | :--- | :--- | :---: |',
    ...indexablePages.map((p) => `| \`${p.path}\` | ${p.title} | \`${p.canonicalUrl}\` | \`${p.robots}\` |`),
    '',
    '## 4. Aislamiento de Rutas Privadas (`robots.txt` + `noindex`)',
    ...(cfg.robots?.disallow || []).map((d) => `- \`Disallow: ${d}\``),
    `- Política staging: \`${cfg.robots?.stagingNoIndexHeader || 'X-Robots-Tag: noindex, nofollow'}\``,
    '',
    '## 5. Matriz de Hallazgos con Evidencia (`SEO-XX-001`)',
    ...(evalRes.findings.length
      ? evalRes.findings.map((f) => `- **${f.id}** [${f.severity}] (${f.module} · \`${f.location}\`): ${f.problem} — *Aceptación:* ${f.acceptance}`)
      : ['- ✅ Sin hallazgos pendientes.']),
    '',
  ].join('\n');
  fs.writeFileSync(paths.reportMd, report, 'utf8');

  console.log(`✅ Artefactos SEO generados en ${path.relative(root, paths.seoDir)}:`);
  console.log(`   • SEO_REPORT.md (${evalRes.totalScore}/100)`);
  console.log(`   • robots.generated.txt`);
  console.log(`   • sitemap.generated.xml (${indexablePages.length} URLs)`);
  console.log(`   • manifest.generated.webmanifest`);
  console.log(`   • organization.schema.jsonld`);
}

/* -------------------- Subcomando: audit -------------------- */

async function cmdAudit(root, flags) {
  const res = evaluateSeo(root);
  let liveHttp = null;
  if (flags.url) {
    liveHttp = await probeLiveHttp(flags.url);
    for (const f of liveHttp.findings) {
      res.findings.push(f);
      res.errors.push(`[${f.id}] ${f.problem}`);
    }
  }

  if (flags.json) {
    console.log(JSON.stringify({
      score: res.totalScore,
      maturity: res.maturity,
      pillars: res.pillars,
      findings: res.findings,
      errors: res.errors,
      warnings: res.warnings,
      signals: res.repo.signals,
      liveHttp,
    }, null, 2));
  } else {
    console.log(`=== Auditoría SEO Engineering (/busqueda): ${root} ===`);
    console.log(`Puntuación de ingeniería interna: ${res.totalScore}/100`);
    console.log('Madurez L0–L3: ' + res.maturity.map((m) => `${m.capability}=${m.level}`).join(' | '));
    console.log(`Resumen: ${res.errors.length} errores bloqueantes, ${res.warnings.length} avisos.`);
    for (const e of res.errors) console.error(`  ERROR: ${e}`);
    for (const w of res.warnings.slice(0, 15)) console.warn(`  WARN:  ${w}`);
  }
  if (flags.strict && res.errors.length > 0) process.exit(1);
}

async function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    console.log('Uso: node scripts/seo-cli.mjs <init|extract|generate|audit | iniciar|extraer|generar|auditar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'init' || cmd === 'iniciar') cmdInit(root, flags);
  else if (cmd === 'extract' || cmd === 'extraer') cmdExtract(root, Boolean(flags.json));
  else if (cmd === 'generate' || cmd === 'generar') cmdGenerate(root);
  else if (cmd === 'audit' || cmd === 'auditar') await cmdAudit(root, flags);
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
