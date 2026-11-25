#!/usr/bin/env node
/**
 * /screen-designer-sdd — CLI sin dependencias (Herramienta #2 del Gestor de Frontend)
 * (`generate`, `verify` | `generar`, `verificar`)
 *
 * Genera por cada pantalla (`docs/frontend/pantallas/<slug>/`):
 * - `00_relacional.md`     (SCR-XXX, Ruta, Módulo, RF, CU, RBAC, Entidades BD, Endpoints)
 * - `01_frontend.md`       (UI-STD-001: Tipología, Base-8, Librería UI real, CMP-XXX, 6/5 estados, WCAG, Checklist 16)
 * - `02_backend.md`        (Nivel #backend opcional)
 * - `03_integraciones.md`  (Nivel #integraciones opcional)
 *
 * Uso:
 *   node scripts/screen-designer-cli.mjs generate [--dir <ruta>] [--screen <SCR-001|slug>] [--level frontend|backend|integraciones|all] [--force]
 *   node scripts/screen-designer-cli.mjs verify   [--dir <ruta>] [--strict] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';

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

function slugFromRoute(routePath) {
  if (!routePath || routePath === '/') return 'home';
  return String(routePath)
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/\[|\]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'screen';
}

/* -------------------- Mapeo automático a la librería UI real -------------------- */

const UI_CATALOGS = {
  primereact: {
    label: 'PrimeReact',
    button: 'Button (`loading`, `severity`)',
    input: 'InputText + FloatLabel',
    password: 'Password (`toggleMask`)',
    select: 'Dropdown (`filter`)',
    table: 'DataTable + Column + Paginator (`scrollable`, `frozen`)',
    card: 'Card',
    dialog: 'Dialog (`dismissableMask={false}`)',
    toast: 'Toast (`sticky: true` en error) / Message',
    skeleton: 'Skeleton',
    badge: 'Tag / Badge',
    breadcrumb: 'BreadCrumb',
  },
  primeng: {
    label: 'PrimeNG',
    button: 'p-button (`[loading]`, `severity`)',
    input: 'pInputText + p-floatlabel',
    password: 'p-password (`[toggleMask]`)',
    select: 'p-select (`[filter]`)',
    table: 'p-table (`[scrollable]`, `pFrozenColumn`)',
    card: 'p-card',
    dialog: 'p-dialog (`[dismissableMask]="false"`)',
    toast: 'p-toast (`sticky: true` en error) / p-message',
    skeleton: 'p-skeleton',
    badge: 'p-tag / p-badge',
    breadcrumb: 'p-breadcrumb',
  },
  shadcn: {
    label: 'shadcn/ui + Radix UI',
    button: 'Button (`variant`, `size`, `disabled={isLoading}`)',
    input: 'Input + Label + FormMessage',
    password: 'Input (`type="password"`) + toggle visibilidad',
    select: 'Select / Command (Combobox)',
    table: 'Table (`@tanstack/react-table`) + Pagination',
    card: 'Card (`CardHeader`/`CardContent`)',
    dialog: 'Dialog / AlertDialog',
    toast: 'Sonner / Toast + Alert',
    skeleton: 'Skeleton',
    badge: 'Badge',
    breadcrumb: 'Breadcrumb',
  },
  mui: {
    label: 'Material UI (MUI)',
    button: 'LoadingButton / Button',
    input: 'TextField',
    password: 'TextField + InputAdornment',
    select: 'Select / Autocomplete',
    table: 'DataGrid (`@mui/x-data-grid`)',
    card: 'Card + CardContent',
    dialog: 'Dialog',
    toast: 'Snackbar + Alert',
    skeleton: 'Skeleton',
    badge: 'Chip / Badge',
    breadcrumb: 'Breadcrumbs',
  },
  vuetify: {
    label: 'Vuetify',
    button: 'v-btn (`:loading`)',
    input: 'v-text-field',
    password: 'v-text-field (`append-inner-icon`)',
    select: 'v-select / v-autocomplete',
    table: 'v-data-table-server',
    card: 'v-card',
    dialog: 'v-dialog (`persistent`)',
    toast: 'v-snackbar + v-alert',
    skeleton: 'v-skeleton-loader',
    badge: 'v-chip / v-badge',
    breadcrumb: 'v-breadcrumbs',
  },
  generic: {
    label: 'Tailwind CSS / Componentes del Proyecto',
    button: 'Button (sistema de diseño)',
    input: 'Input + Label accesible',
    password: 'PasswordInput con toggle',
    select: 'Select / Combobox',
    table: 'DataTable con cabecera fija y paginación',
    card: 'Card',
    dialog: 'Modal accesible (`trapFocus`)',
    toast: 'Toast / Inline Alert',
    skeleton: 'Skeleton',
    badge: 'Badge / Status Pill',
    breadcrumb: 'Breadcrumb',
  },
};

function detectUiCatalog(tkConfig, specDoc) {
  const libs = [
    ...(tkConfig?.stack?.ui_libraries || []),
    ...(specDoc?.stack?.ui_libraries || []),
  ].join(' ').toLowerCase();
  if (libs.includes('primereact')) return UI_CATALOGS.primereact;
  if (libs.includes('primeng')) return UI_CATALOGS.primeng;
  if (libs.includes('shadcn') || libs.includes('radix')) return UI_CATALOGS.shadcn;
  if (libs.includes('mui') || libs.includes('material')) return UI_CATALOGS.mui;
  if (libs.includes('vuetify')) return UI_CATALOGS.vuetify;
  return UI_CATALOGS.generic;
}

function defaultComponentsForScreen(screen, cat) {
  const rfTag = (screen.rf || []).join(', ') || 'RF-PENDIENTE';
  if (screen.group === 'auth') {
    return [
      { id: 'CMP-001', name: 'AuthCard', lib: cat.card, variant: 'Centered max-w-440px', rf: rfTag, purpose: 'Contenedor de marca, título y formulario de acceso' },
      { id: 'CMP-002', name: 'IdentifierInput', lib: cat.input, variant: 'Standard 40px (16px móvil)', rf: rfTag, purpose: 'Captura de usuario/correo con autocompletado y validación onBlur' },
      { id: 'CMP-003', name: 'PasswordField', lib: cat.password, variant: 'With visibility toggle', rf: rfTag, purpose: 'Captura segura de contraseña compatible con gestores de claves' },
      { id: 'CMP-004', name: 'SubmitAction', lib: cat.button, variant: 'Primary (único en la vista)', rf: rfTag, purpose: 'Dispara autenticación con bloqueo isLoading anti-double-submit' },
      { id: 'CMP-005', name: 'FeedbackAlert', lib: cat.toast, variant: 'Error persistente (durationMs: null)', rf: rfTag, purpose: 'Comunica credenciales inválidas o bloqueo sin borrar el identificador' },
    ];
  }
  if (screen.group === 'internal') {
    return [
      { id: 'CMP-001', name: 'PageHeader & Breadcrumb', lib: cat.breadcrumb, variant: 'Contextual + 1 acción primaria', rf: rfTag, purpose: 'Orientación espacial y acción principal del módulo' },
      { id: 'CMP-002', name: 'FilterToolbar', lib: `${cat.input} + ${cat.select}`, variant: 'Debounce 300ms + chips activos', rf: rfTag, purpose: 'Búsqueda y filtrado sin perder paginación ni contexto' },
      { id: 'CMP-003', name: 'EnterpriseDataTable', lib: cat.table, variant: 'StickyHeader + Vista Fija + Paginación', rf: rfTag, purpose: 'Presentación y gestión de registros con alineación estricta y acciones fijas' },
      { id: 'CMP-004', name: 'EntityDialog', lib: cat.dialog, variant: 'md 560px · closeOnOverlayClick: false', rf: rfTag, purpose: 'Creación/edición controlada preservando contexto de tabla' },
      { id: 'CMP-005', name: 'LoadingSkeleton & Feedback', lib: `${cat.skeleton} + ${cat.toast}`, variant: '5 UI States completos', rf: rfTag, purpose: 'Skeleton estructural inicial, Empty State accionable y Toast de error persistente' },
    ];
  }
  return [
    { id: 'CMP-001', name: 'SectionHeader', lib: cat.card, variant: 'Semantic HTML H1/H2', rf: rfTag, purpose: 'Jerarquía clara y orientación de la pantalla' },
    { id: 'CMP-002', name: 'PrimaryCTA', lib: cat.button, variant: 'Primary (único) · hit-area ≥44px', rf: rfTag, purpose: 'Acción principal verificable con foco visible WCAG 2.2 AA' },
    { id: 'CMP-003', name: 'StatusFeedback', lib: `${cat.skeleton} + ${cat.toast}`, variant: '5 UI States completos', rf: rfTag, purpose: 'Estados Loading, Empty y Error con recuperación clara' },
  ];
}

function buildRelationalMd(screen, project, routesMap, dbSchema) {
  const relatedEndpoints = (routesMap?.backendEndpoints || [])
    .filter((e) => (screen.endpoints || []).includes(e.path) || (screen.module && String(e.path || '').includes(screen.module)))
    .slice(0, 12);
  const relatedTables = (dbSchema?.schema?.tables || [])
    .filter((t) => screen.module && t.name.toLowerCase().includes(screen.module.toLowerCase().slice(0, 5)))
    .map((t) => t.name);

  return [
    `# 00. Documentación Relacional — ${screen.id}: ${screen.name}`,
    '',
    `> Fuente única de trazabilidad de la pantalla \`${screen.path}\` en **${project}**. Toda decisión de \`01_frontend.md\`, \`02_backend.md\` y \`03_integraciones.md\` debe responder estrictamente a esta información.`,
    '',
    '## 1. Ficha de Identificación y Alcance',
    '| Campo | Valor |',
    '| :--- | :--- |',
    `| **ID Pantalla** | \`${screen.id}\` |`,
    `| **Nombre funcional** | ${screen.name} |`,
    `| **Ruta URL** | \`${screen.path}\` |`,
    `| **Módulo** | \`${screen.module}\` |`,
    `| **Grupo / Superficie** | \`${screen.group}\` |`,
    `| **Requisitos Funcionales (RF)** | ${(screen.rf || []).join(', ') || 'Por asignar'} |`,
    `| **Casos de Uso (CU)** | ${(screen.cu || []).join(', ') || 'Por asignar'} |`,
    `| **Actores / Roles RBAC** | ${(screen.roles || []).join(', ') || 'Por definir'} |`,
    `| **Estado / Etapa Datos** | \`${screen.status}\` · \`${screen.dataStage}\` |`,
    '',
    '## 2. Propósito y Flujo Funcional',
    `- **Objetivo:** ${screen.purpose || '—'}`,
    ...(screen.userFlow || []).map((st, i) => `${i + 1}. ${st}`),
    '',
    '## 3. Relaciones con Base de Datos y Endpoints Previstos',
    `- **Entidades / Tablas BD relacionadas:** ${relatedTables.length ? relatedTables.map((x) => `\`${x}\``).join(', ') : 'Verificar en `docs/bd/db-schema.json`'}`,
    `- **Endpoints API previstos:** ${relatedEndpoints.length ? relatedEndpoints.map((e) => `\`${e.method} ${e.path}\``).join(', ') : ((screen.endpoints || []).join(', ') || 'Definir en `docs/arquitectura/routes-map.json`')}`,
    '',
    '## 4. Límites Out-of-Scope',
    '- No incorporar funcionalidades ni campos fuera de los `RF`/`CU` listados arriba.',
    '',
  ].join('\n');
}

function buildFrontendMd(screen, project, cat) {
  const typology = screen.group === 'auth'
    ? 'Acceso y Autenticación (Sección 2.1 UI-STD-001)'
    : screen.group === 'internal'
      ? 'Listado / Gestión Empresarial (Sección 2.3 UI-STD-001)'
      : screen.group === 'system'
        ? 'Estado Vacío / Error / Sistema (Sección 2.16 UI-STD-001)'
        : 'Portal Público / Informativa';

  const cmps = defaultComponentsForScreen(screen, cat);
  const rfList = (screen.rf || []).join(', ') || 'Por asignar';

  const lines = [
    `# 01. Diseño Frontend y Componentes (#frontend) — ${screen.id}: ${screen.name}`,
    '',
    `> Alineado a **UI-STD-001**, **Guía Maestra de Arquitectura UI**, tokens de \`docs/diseno/design-tokens.json\` y librería UI real del proyecto: **${cat.label}**.`,
    `> **Trazabilidad obligatoria:** \`${screen.id}\` · Ruta \`${screen.path}\` · RF: **${rfList}** · CU: **${(screen.cu || []).join(', ') || 'Por asignar'}**`,
    '',
    '## 1. Arquitectura Visual, Tipología y Retícula (Base-8)',
    `- **Tipología:** ${typology}`,
    `- **Layout:** ${screen.layout || 'Shell del proyecto'}`,
    '- **Escala Espacial:** Base-8 (`4/8/16/24/32/48px`) · **Grid:** Desktop 12 cols (`24px` gutter) / Tablet 8 cols (`16px`) / Mobile 4 cols (`16px`)',
    '- **Densidad:** Estándar (inputs `40px`, filas tabla `44–48px`, fuente inputs móvil `≥16px` para evitar zoom iOS)',
    `- **Librería UI autorizada:** **${cat.label}** (prohibido mezclar librerías equivalentes en la misma vista)`,
    '',
    '### Decisiones Autónomas de Diseño (Justificación UI-STD-001)',
    '| Dimensión | Decisión Autónoma | Alternativa Descartada | Justificación Técnica (Tarea / Volumen / RF) |',
    '| :--- | :--- | :--- | :--- |',
    `| **Tipología** | ${typology} | Pantalla genérica sin arquetipo | Alineada al flujo operativo y grupo \`${screen.group}\` (${rfList}) |`,
    '| **Densidad** | Estándar (`40–48px`) | Compacta / Confortable | Equilibrio entre legibilidad, accesibilidad táctil y densidad operativa |',
    `| **Librería UI** | ${cat.label} | Controles ad-hoc | Consistencia total con \`toolkit.config.json → stack.ui_libraries\` |`,
    '',
    '## 2. Inventario de Componentes de la Pantalla (Trazados a RF)',
    '| ID | Componente Canónico | Componente Real (`' + cat.label + '`) | Variante | RF / Función | Obligatorio |',
    '| :---: | :--- | :--- | :--- | :--- | :---: |',
    ...cmps.map((c) => `| \`${c.id}\` | ${c.name} | ${c.lib} | ${c.variant} | ${c.rf} — ${c.purpose} | Sí |`),
    '',
    '## 3. Ficha Técnica Detallada por Componente (Sección 15.2 UI-STD-001)',
    '',
  ];

  for (const c of cmps) {
    lines.push(
      `### ${c.id} — ${c.name} (${c.lib})`,
      '```yaml',
      'component:',
      `  id: ${c.id}`,
      `  name: ${c.name}`,
      `  ui_library_component: "${c.lib}"`,
      `  traces_rf: "${c.rf}"`,
      `  purpose: "${c.purpose}"`,
      `  variant: "${c.variant}"`,
      '  states_required: [default, hover, focus, disabled, loading, empty, error]',
      '  responsive:',
      '    desktop: "Composición completa en 12 columnas"',
      '    tablet: "Reorganización a 8 columnas sin solapamientos"',
      '    mobile: "1 columna apilada, hit-area >= 44px, scroll horizontal si es tabla"',
      '  accessibility:',
      '    - "Operable 100% por teclado (Tab, Enter, Space, Esc)"',
      '    - "Foco visible WCAG 2.2 AA y contraste >= 4.5:1 (texto) / 3.0:1 (bordes)"',
      '    - "Label asociado y mensajes de error ligados por aria-describedby"',
      '  acceptance:',
      `    - "Cumple funcionalmente ${c.rf} sin alterar lógica fuera de alcance"`,
      '    - "Maneja estados Loading, Empty, Error y prevención de double-submit"',
      '```',
      ''
    );
  }

  lines.push(
    '## 4. Ciclo Completo de Estados UI (The 5 UI States) y Validación',
    '- **Ideal:** Datos reales o stub tipado (`FRONTEND_FIRST_STUB`) con `tabular-nums` en cifras y fechas.',
    `- **Loading:** ${screen.states?.loading || 'Skeleton estructural (obligatorio si >1s; nunca layout shift CLS < 0.1)'}.`,
    `- **Empty:** ${screen.states?.empty || 'Diferenciar first-use vs no-results con CTA de recuperación'}.`,
    `- **Error:** ${screen.states?.error || 'Mensaje claro + traceId + botón Reintentar; Toast de error persistente (durationMs: null)'}.`,
    '- **Partial / Overflow:** `text-overflow: ellipsis` + Tooltip en textos largos; paginación explícita en volumen alto.',
    '- **Validación de Formularios:** Validar en `onBlur` la primera vez y re-validar en `onChange` solo tras error; preservar lo escrito ante fallo de red; `Unsaved Changes Guard` si `isDirty === true`.',
    '',
    '## 5. Checklist de Auditoría Documental (UI-STD-001 Secciones 16.1–16.6) y Evaluación 0–100',
    '- [ ] **16.1 Funcionalidad:** Cada componente trazado a `RF`/`CU`, sin double-submit y con recuperación de errores.',
    '- [ ] **16.2 Composición Visual:** Máximo 1 botón primario por vista/modal, tokens de `design-tokens.json`, Base-8.',
    `- [ ] **16.3 Componentes:** 100% alineados a **${cat.label}**, con inputs/outputs/estados documentados.`,
    '- [ ] **16.4 Responsive:** Estrategia explícita Desktop (`≥1280px`), Tablet (`768px`) y Mobile (`390px`).',
    '- [ ] **16.5 Accesibilidad:** WCAG 2.2 AA (contraste `4.5:1`, hit-area `44px`, teclado y foco visible).',
    '- [ ] **16.6 Rendimiento:** `CLS < 0.1`, `INP < 200ms`, Skeleton inicial y carga diferida de vistas pesadas.',
    '',
    '| Dimensión | Peso | Estado Documental |',
    '| :--- | :---: | :---: |',
    '| Cumplimiento funcional (`RF`/`CU`) | 20 | Verificado |',
    '| Usabilidad y flujo | 15 | Verificado |',
    '| Jerarquía y composición | 15 | Verificado |',
    '| Accesibilidad (WCAG 2.2 AA) | 15 | Verificado |',
    '| Consistencia de componentes | 10 | Verificado |',
    '| Responsive | 10 | Verificado |',
    '| Rendimiento percibido | 10 | Verificado |',
    '| Documentación y mantenibilidad | 5 | Verificado |',
    ''
  );

  return lines.join('\n');
}

function cmdGenerate(root, flags) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const specFile = path.join(root, tkConfig?.frontend_specs?.spec_file || path.join('docs', 'frontend', 'screens-spec.json'));
  const specDoc = readJsonSafe(specFile);
  if (!specDoc || !Array.isArray(specDoc.screens)) {
    console.error(`❌ No existe ${path.relative(root, specFile)}. Ejecuta "autopilot pantallas iniciar" primero.`);
    process.exit(2);
  }

  const routesMap = readJsonSafe(path.join(root, tkConfig?.routes?.map_file || path.join('docs', 'arquitectura', 'routes-map.json')));
  const dbSchema = readJsonSafe(path.join(root, tkConfig?.database?.schema_file || path.join('docs', 'bd', 'db-schema.json')));
  const cat = detectUiCatalog(tkConfig, specDoc);
  const level = String(flags.level || 'frontend').toLowerCase();
  const force = Boolean(flags.force);
  const outBase = path.join(root, tkConfig?.frontend_specs?.dir || path.join('docs', 'frontend'), 'pantallas');

  const targetScreens = flags.screen
    ? specDoc.screens.filter((s) =>
      s.id.toLowerCase() === String(flags.screen).toLowerCase()
      || slugFromRoute(s.path) === String(flags.screen).toLowerCase()
      || s.path === flags.screen)
    : specDoc.screens;

  if (!targetScreens.length) {
    console.error(`❌ No se encontró la pantalla "${flags.screen}" en screens-spec.json.`);
    process.exit(2);
  }

  let filesWritten = 0;
  for (const s of targetScreens) {
    const slug = slugFromRoute(s.path);
    const dir = path.join(outBase, slug);
    fs.mkdirSync(dir, { recursive: true });

    const relPath = path.join(dir, '00_relacional.md');
    if (force || !fs.existsSync(relPath)) {
      fs.writeFileSync(relPath, buildRelationalMd(s, specDoc.project, routesMap, dbSchema), 'utf8');
      filesWritten++;
    }
    if (level === 'frontend' || level === 'all') {
      const fePath = path.join(dir, '01_frontend.md');
      if (force || !fs.existsSync(fePath)) {
        fs.writeFileSync(fePath, buildFrontendMd(s, specDoc.project, cat), 'utf8');
        filesWritten++;
      }
    }
    if (level === 'backend' || level === 'all') {
      const bePath = path.join(dir, '02_backend.md');
      if (force || !fs.existsSync(bePath)) {
        fs.writeFileSync(bePath, `# 02. Especificación Backend (#backend) — ${s.id}: ${s.name}\n\n- **Ruta UI:** \`${s.path}\` · **RF:** ${(s.rf || []).join(', ') || '—'}\n- **Endpoints:** ${(s.endpoints || []).join(', ') || 'Ver routes-map.json'}\n- **Validación servidor, DTOs y RBAC:** Pendiente de completar en fase #backend.\n`, 'utf8');
        filesWritten++;
      }
    }
    if (level === 'integraciones' || level === 'all') {
      const intPath = path.join(dir, '03_integraciones.md');
      if (force || !fs.existsSync(intPath)) {
        fs.writeFileSync(intPath, `# 03. Especificación de Integraciones (#integraciones) — ${s.id}: ${s.name}\n\n- **Ruta UI:** \`${s.path}\` · **WebSockets / Storage / Auth / Eventos:** Pendiente de completar en fase #integraciones.\n`, 'utf8');
        filesWritten++;
      }
    }
  }

  console.log(`✅ Diseños detallados generados para ${targetScreens.length} pantalla(s) (${filesWritten} archivos escritos) usando librería UI: ${cat.label}.`);
}

function cmdVerify(root, strict, asJson) {
  const tkConfig = readJsonSafe(path.join(root, 'toolkit.config.json'));
  const specFile = path.join(root, tkConfig?.frontend_specs?.spec_file || path.join('docs', 'frontend', 'screens-spec.json'));
  const specDoc = readJsonSafe(specFile);
  const outBase = path.join(root, tkConfig?.frontend_specs?.dir || path.join('docs', 'frontend'), 'pantallas');

  const errors = [];
  const warnings = [];
  let verifiedScreens = 0;

  if (!specDoc || !Array.isArray(specDoc.screens)) {
    errors.push(`Falta ${path.relative(root, specFile)}. Ejecuta "autopilot pantallas iniciar".`);
  } else {
    const cat = detectUiCatalog(tkConfig, specDoc);
    for (const s of specDoc.screens) {
      const slug = slugFromRoute(s.path);
      const relPath = path.join(outBase, slug, '00_relacional.md');
      const fePath = path.join(outBase, slug, '01_frontend.md');

      if (!fs.existsSync(relPath)) {
        errors.push(`${s.id} (${s.path}): falta docs/frontend/pantallas/${slug}/00_relacional.md`);
        continue;
      }
      if (!fs.existsSync(fePath)) {
        errors.push(`${s.id} (${s.path}): falta docs/frontend/pantallas/${slug}/01_frontend.md`);
        continue;
      }

      const relTxt = fs.readFileSync(relPath, 'utf8');
      const feTxt = fs.readFileSync(fePath, 'utf8');

      if (!/CMP-\d{3}/.test(feTxt)) {
        errors.push(`${s.id} (${slug}): 01_frontend.md no documenta ningún componente con ID CMP-XXX.`);
      }
      if (!feTxt.includes(cat.label)) {
        warnings.push(`${s.id} (${slug}): 01_frontend.md no menciona explícitamente la librería UI del proyecto (${cat.label}).`);
      }
      if (!/Decisiones Aut[oó]nomas/i.test(feTxt)) {
        warnings.push(`${s.id} (${slug}): 01_frontend.md no incluye tabla de Decisiones Autónomas de Diseño.`);
      }
      for (const reqWord of ['Loading', 'Empty', 'Error', 'WCAG']) {
        if (!new RegExp(reqWord, 'i').test(feTxt)) {
          errors.push(`${s.id} (${slug}): 01_frontend.md omite la especificación obligatoria de "${reqWord}".`);
        }
      }
      for (const rf of (s.rf || [])) {
        if (!relTxt.includes(rf)) errors.push(`${s.id} (${slug}): ${rf} no figura en 00_relacional.md.`);
        if (!feTxt.includes(rf)) errors.push(`${s.id} (${slug}): ${rf} no está trazado a ningún componente en 01_frontend.md.`);
      }
      verifiedScreens++;
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ verifiedScreens, totalScreens: (specDoc?.screens || []).length, errors, warnings }, null, 2));
  } else {
    console.log(`=== Verificación Documental de Pantallas y Componentes (/screen-designer-sdd): ${root} ===`);
    console.log(`Pantallas verificadas: ${verifiedScreens}/${(specDoc?.screens || []).length} · Errores: ${errors.length} · Avisos: ${warnings.length}`);
    for (const e of errors) console.error(`  ERROR: ${e}`);
    for (const w of warnings.slice(0, 15)) console.warn(`  WARN:  ${w}`);
  }

  if (strict && errors.length > 0) process.exit(1);
}

function main() {
  const [rawCmd, ...rest] = process.argv.slice(2);
  const cmd = (rawCmd || '').toLowerCase();
  const flags = parseFlags(rest);
  const root = path.resolve(flags.dir || process.cwd());

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'ayuda') {
    console.log('Uso: node scripts/screen-designer-cli.mjs <generate|verify | generar|verificar> [opciones]');
    process.exit(0);
  }
  if (cmd === 'generate' || cmd === 'generar') cmdGenerate(root, flags);
  else if (cmd === 'verify' || cmd === 'verificar') cmdVerify(root, Boolean(flags.strict), Boolean(flags.json));
  else {
    console.error(`❌ Subcomando desconocido: ${rawCmd}`);
    process.exit(2);
  }
}

main();
