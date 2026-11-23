#!/usr/bin/env node
/**
 * /busqueda — Estándar Técnico Integral de SEO & AI Search (GEO)
 * CLI sin dependencias (`init`, `extract`, `generate`, `audit` | `iniciar`, `extraer`, `generar`, `auditar`)
 *
 * Conecta automáticamente con:
 * - `toolkit.config.json` (stack, proyecto, rutas de artefactos)
 * - `docs/arquitectura/routes-map.json` (rutas públicas vs privadas/auth/system)
 * - `docs/diseno/design-tokens.json` (colores para manifest.webmanifest y OG)
 * - `.claude/landing-design/scope.json` (publicRoutes vs excludedRoutes)
 *
 * Uso:
 *   node scripts/seo-cli.mjs init     [--dir <ruta>] [--domain "https://ejemplo.com"] [--type "saas"]
 *   node scripts/seo-cli.mjs extract  [--dir <ruta>] [--json]
 *   node scripts/seo-cli.mjs generate [--dir <ruta>]
 *   node scripts/seo-cli.mjs audit    [--dir <ruta>] [--strict] [--json]
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

  // Recolectar rutas públicas (indexables) y privadas (noindex)
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
  let hasSeoTests = fs.existsSync(path.join(root, 'tests', 'seo')) || fs.existsSync(path.join(root, 'e2e', 'seo'));
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

/* -------------------- Evaluación y Puntuación 0–100 -------------------- */

function evaluateSeo(root) {
  const paths = resolveSeoPaths(root);
  const cfg = readJsonSafe(paths.configFile);
  const scope = readJsonSafe(paths.landingScope);
  const routesMap = readJsonSafe(paths.routesMap);
  const repo = scanRepoSeo(root);

  const errors = [];
  const warnings = [];

  if (!cfg) {
    errors.push(`Falta ${path.relative(root, paths.configFile)} (ejecuta "autopilot busqueda iniciar").`);
  }

  const pages = cfg?.pages || [];
  const redirects = cfg?.redirects || [];
  const excluded = new Set([
    ...(scope?.excludedRoutes || []),
    ...((routesMap?.frontendRoutes || []).filter((r) => ['internal', 'auth', 'terminal'].includes(r.group)).map((r) => r.path)),
  ]);

  // 1. Duplicados de title y canonical + fuga de rutas privadas
  const seenTitles = new Map();
  const seenCanonicals = new Map();
  for (const p of pages) {
    if (p.indexable && excluded.has(p.path)) {
      errors.push(`Fuga de privacidad: la ruta privada/excluida "${p.path}" está marcada como indexable en seo-config.json.`);
    }
    if (!p.title || !p.title.trim()) errors.push(`Ruta "${p.path}" sin <title>.`);
    else if (seenTitles.has(p.title.trim().toLowerCase())) {
      errors.push(`Title duplicado ("${p.title}") en "${p.path}" y "${seenTitles.get(p.title.trim().toLowerCase())}".`);
    } else {
      seenTitles.set(p.title.trim().toLowerCase(), p.path);
    }

    if (!p.canonicalUrl || !/^https?:\/\//i.test(p.canonicalUrl)) {
      errors.push(`Canonical inválido o no absoluto en "${p.path}": "${p.canonicalUrl || ''}".`);
    } else if (seenCanonicals.has(p.canonicalUrl)) {
      errors.push(`Canonical duplicado ("${p.canonicalUrl}") en "${p.path}" y "${seenCanonicals.get(p.canonicalUrl)}".`);
    } else {
      seenCanonicals.set(p.canonicalUrl, p.path);
    }

    if (!p.description || p.description.trim().length < 25) {
      warnings.push(`Meta description ausente o muy corta en "${p.path}".`);
    }
    if (!p.ogImage) warnings.push(`Falta ogImage en "${p.path}".`);
  }

  // 2. Redirecciones 301 circulares o encadenadas
  const redirMap = new Map(redirects.map((r) => [r.from, r.to]));
  for (const r of redirects) {
    if (r.from === r.to) errors.push(`Redirección circular: ${r.from} → ${r.to}.`);
    else if (redirMap.has(r.to)) {
      warnings.push(`Cadena de redirección detectada: ${r.from} → ${r.to} → ${redirMap.get(r.to)}.`);
    }
  }

  for (const ri of repo.robotsIssues) errors.push(ri);
  for (const je of repo.jsonLdErrors) errors.push(je);

  if (!repo.signals.hasHtmlLang) warnings.push('No se detectó atributo <html lang="..."> en el código frontend.');
  if (!repo.signals.hasXRobotsTag) warnings.push('No se detectó política X-Robots-Tag para staging/preproducción.');
  if (!repo.signals.hasSeoTests) warnings.push('No existe suite automatizada tests/seo/ en el proyecto.');

  // Cálculo transparente de los 10 pilares (100 puntos)
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

  return { cfg, repo, errors, warnings, pillars, totalScore };
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

  // 1. robots.generated.txt
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

  // 2. sitemap.generated.xml (solo rutas indexables)
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

  // 3. manifest.generated.webmanifest
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

  // 4. organization.schema.jsonld
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: cfg.organization?.name || cfg.project,
    url: cfg.organization?.url || `${domain}/`,
    description: cfg.organization?.description || '',
    logo: cfg.organization?.logo || `${domain}/logo.png`,
  };
  fs.writeFileSync(path.join(paths.seoDir, 'organization.schema.jsonld'), `${JSON.stringify(orgSchema, null, 2)}\n`, 'utf8');

  // 5. SEO_REPORT.md
  const report = [
    `# Estándar y Auditoría Técnica SEO — ${cfg.project}`,
    '',
    `Dominio canónico: \`${domain}\` · Tipo: \`${cfg.projectType}\` · Fecha: **${cfg.updatedAt}** · Cumplimiento de ingeniería: **${evalRes.totalScore}/100**.`,
    '',
    '## 1. Matriz de Cumplimiento Técnico (100 puntos)',
    '| Pilar | Puntuación | Máximo |',
    '| :--- | :---: | :---: |',
    ...evalRes.pillars.map((p) => `| ${p.name} | **${p.score}** | ${p.max} |`),
    `| **TOTAL** | **${evalRes.totalScore}** | **100** |`,
    '',
    '## 2. Inventario de Rutas Indexables y Metadatos',
    '| Ruta | Title | Canonical | Robots |',
    '| :--- | :--- | :--- | :---: |',
    ...indexablePages.map((p) => `| \`${p.path}\` | ${p.title} | \`${p.canonicalUrl}\` | \`${p.robots}\` |`),
    '',
    '## 3. Aislamiento de Rutas Privadas (`robots.txt` + `noindex`)',
    ...(cfg.robots?.disallow || []).map((d) => `- \`Disallow: ${d}\``),
    `- Política staging: \`${cfg.robots?.stagingNoIndexHeader || 'X-Robots-Tag: noindex, nofollow'}\``,
    '',
    '## 4. Hallazgos de Auditoría',
    ...(evalRes.errors.length ? evalRes.errors.map((e) => `- ❌ **ERROR:** ${e}`) : ['- ✅ Sin errores bloqueantes.']),
    ...(evalRes.warnings.length ? evalRes.warnings.map((w) => `- ⚠️ **AVISO:** ${w}`) : []),
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

function cmdAudit(root, strict, asJson) {
  const res = evaluateSeo(root);
  if (asJson) {
    console.log(JSON.stringify({
      score: res.totalScore,
      pillars: res.pillars,
      errors: res.errors,
      warnings: res.warnings,
      signals: res.repo.signals,
    }, null, 2));
  } else {
    console.log(`=== Auditoría Técnica SEO (/busqueda): ${root} ===`);
    console.log(`Puntuación de ingeniería interna: ${res.totalScore}/100`);
    for (const p of res.pillars) {
      console.log(`  • ${p.name}: ${p.score}/${p.max}`);
    }
    console.log(`Resumen: ${res.errors.length} errores, ${res.warnings.length} avisos.`);
    for (const e of res.errors) console.error(`  ERROR: ${e}`);
    for (const w of res.warnings.slice(0, 15)) console.warn(`  WARN:  ${w}`);
  }
  if (strict && res.errors.length > 0) process.exit(1);
}

function main() {
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
  else if (cmd === 'audit' || cmd === 'auditar') cmdAudit(root, Boolean(flags.strict), Boolean(flags.json));
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
