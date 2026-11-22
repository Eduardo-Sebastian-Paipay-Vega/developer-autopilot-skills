/**
 * MDES — Motion Design Engineering System · Core v0.1.0
 * Controlador agnóstico de framework para recursos SVG + CSS.
 * Sin dependencias. Seguro de importar en Node (no toca el DOM al cargar).
 *
 * Uso:
 *   import { MotionController } from './mdes-core.js';
 *   const ctrl = new MotionController(document.querySelector('.mdes'), config);
 *   ctrl.setSpeed(1.5); ctrl.setColors({ primaryColor: '#4F000B' }); ctrl.setState('success');
 */

export const MDES_VERSION = '0.1.0';

export const COMPLEXITY_LEVELS = ['M1', 'M2', 'M3', 'M4'];
export const RENDERERS = ['css', 'svg-css', 'svg-css-waapi', 'canvas-2d', 'webgl-three'];
export const CATEGORIES = ['loading', 'success', 'error', 'empty', 'object', 'scene', 'feedback', 'decorative'];
export const STATES = ['idle', 'processing', 'success', 'error', 'paused'];
export const TRIGGERS = ['automatic', 'hover', 'click', 'visible', 'state', 'manual'];
export const REDUCED_MOTION = ['static', 'minimal', 'off'];
export const THEMES = ['light', 'dark', 'brand'];

/** Mapeo parámetro de configuración → token CSS. */
export const COLOR_TOKENS = Object.freeze({
  primaryColor: '--motion-primary',
  secondaryColor: '--motion-secondary',
  accentColor: '--motion-accent',
  dangerColor: '--motion-danger',
  backgroundColor: '--motion-background',
  surfaceColor: '--motion-surface',
  strokeColor: '--motion-stroke',
  shadowColor: '--motion-shadow',
});

export const DEFAULTS = Object.freeze({
  complexity: 'M2',
  renderer: 'svg-css',
  canvas: { width: 240, height: 180, viewBox: '0 0 240 180' },
  visual: { scale: 1, strokeWidth: 2, opacity: 1 },
  motion: { duration: 1800, speed: 1, delay: 0, loop: true, direction: 'normal', intensity: 0.7 },
  behavior: { trigger: 'automatic', initialState: 'processing', reducedMotion: 'static', pauseWhenHidden: true },
  accessibility: { decorative: false, ariaLabel: '' },
});

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Fusión profunda simple (objetos planos). */
export function mergeConfig(base, override = {}) {
  const out = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    out[key] = isObject(value) && isObject(base[key]) ? mergeConfig(base[key], value) : value;
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* Validación del contrato (subconjunto ejecutable del JSON Schema)          */
/* ------------------------------------------------------------------------ */

const HEX_OR_CSS_COLOR = /^(#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})|transparent|currentColor|rgba?\(.+\)|hsla?\(.+\)|var\(--[\w-]+\))$/i;

/**
 * Valida una configuración MDES.
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };
  const warn = (cond, msg) => { if (!cond) warnings.push(msg); };

  if (!isObject(config)) return { valid: false, errors: ['La configuración debe ser un objeto.'], warnings };

  req(typeof config.id === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(config.id), 'id: obligatorio en kebab-case (ej. "document-processing-001").');
  req(typeof config.name === 'string' && config.name.length > 0, 'name: obligatorio.');
  req(CATEGORIES.includes(config.category), `category: debe ser uno de ${CATEGORIES.join(', ')}.`);
  req(COMPLEXITY_LEVELS.includes(config.complexity), `complexity: debe ser uno de ${COMPLEXITY_LEVELS.join(', ')}.`);
  req(RENDERERS.includes(config.renderer), `renderer: debe ser uno de ${RENDERERS.join(', ')}.`);

  if (config.complexity === 'M4') {
    req(typeof config.justification === 'string' && config.justification.trim().length >= 20,
      'justification: M4 exige una justificación explícita (mínimo 20 caracteres).');
  }
  if (config.renderer === 'webgl-three' && config.complexity !== 'M4') {
    warnings.push('renderer webgl-three normalmente implica complexity M4; revisa la elección.');
  }

  const c = config.canvas;
  req(isObject(c), 'canvas: obligatorio ({ width, height, viewBox }).');
  if (isObject(c)) {
    req(Number.isFinite(c.width) && c.width > 0, 'canvas.width: número > 0.');
    req(Number.isFinite(c.height) && c.height > 0, 'canvas.height: número > 0.');
    req(typeof c.viewBox === 'string' && /^-?\d+(\.\d+)?( -?\d+(\.\d+)?){3}$/.test(c.viewBox.trim()), 'canvas.viewBox: formato "minX minY width height".');
  }

  const v = config.visual;
  req(isObject(v), 'visual: obligatorio.');
  if (isObject(v)) {
    for (const key of Object.keys(COLOR_TOKENS)) {
      if (key in v) req(typeof v[key] === 'string' && HEX_OR_CSS_COLOR.test(v[key]), `visual.${key}: color CSS inválido ("${v[key]}").`);
    }
    req('primaryColor' in v, 'visual.primaryColor: obligatorio (todo recurso debe ser recoloreable).');
    if ('scale' in v) req(Number.isFinite(v.scale) && v.scale > 0, 'visual.scale: número > 0.');
    if ('opacity' in v) req(Number.isFinite(v.opacity) && v.opacity >= 0 && v.opacity <= 1, 'visual.opacity: 0..1.');
    if ('strokeWidth' in v) req(Number.isFinite(v.strokeWidth) && v.strokeWidth >= 0, 'visual.strokeWidth: número >= 0.');
  }

  const m = config.motion;
  req(isObject(m), 'motion: obligatorio.');
  if (isObject(m)) {
    req(Number.isFinite(m.duration) && m.duration >= 50 && m.duration <= 20000, 'motion.duration: ms entre 50 y 20000.');
    if ('speed' in m) req(Number.isFinite(m.speed) && m.speed > 0 && m.speed <= 4, 'motion.speed: multiplicador entre 0 (excl.) y 4.');
    if ('intensity' in m) req(Number.isFinite(m.intensity) && m.intensity >= 0 && m.intensity <= 1, 'motion.intensity: 0..1.');
    if ('delay' in m) req(Number.isFinite(m.delay) && m.delay >= 0, 'motion.delay: ms >= 0.');
    if ('direction' in m) req(['normal', 'reverse', 'alternate', 'alternate-reverse'].includes(m.direction), 'motion.direction inválido.');
    if ('loop' in m) req(typeof m.loop === 'boolean' || (Number.isInteger(m.loop) && m.loop > 0), 'motion.loop: boolean o entero > 0.');
    warn(!(m.duration < 150 && m.loop === true), 'motion: un bucle con duración < 150 ms puede resultar agresivo; revisa.');
  }

  const b = config.behavior;
  req(isObject(b), 'behavior: obligatorio.');
  if (isObject(b)) {
    req(REDUCED_MOTION.includes(b.reducedMotion), `behavior.reducedMotion: obligatorio (${REDUCED_MOTION.join(' | ')}).`);
    if ('trigger' in b) req(TRIGGERS.includes(b.trigger), `behavior.trigger: ${TRIGGERS.join(', ')}.`);
    if ('initialState' in b) req(STATES.includes(b.initialState), `behavior.initialState: ${STATES.join(', ')}.`);
    if ('progressMode' in b) req(['indeterminate', 'determinate'].includes(b.progressMode), 'behavior.progressMode: indeterminate | determinate.');
    warn(b.reducedMotion !== 'off', 'behavior.reducedMotion = "off" solo se admite para movimiento esencial; documenta el motivo.');
  }

  const a = config.accessibility;
  req(isObject(a), 'accessibility: obligatorio ({ decorative, ariaLabel }).');
  if (isObject(a)) {
    req(typeof a.decorative === 'boolean', 'accessibility.decorative: boolean.');
    if (a.decorative === false) req(typeof a.ariaLabel === 'string' && a.ariaLabel.trim().length > 0, 'accessibility.ariaLabel: obligatorio cuando el recurso no es decorativo.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------------ */
/* Utilidades de entorno                                                     */
/* ------------------------------------------------------------------------ */

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Aplica la configuración como tokens CSS sobre el contenedor `.mdes`. */
export function applyConfig(root, config) {
  const { canvas = {}, visual = {}, motion = {} } = config;
  const style = root.style;
  for (const [key, token] of Object.entries(COLOR_TOKENS)) {
    if (visual[key]) style.setProperty(token, visual[key]);
  }
  if (canvas.width) style.setProperty('--motion-width', `${canvas.width}px`);
  if (canvas.width && canvas.height) style.setProperty('--motion-aspect', `${canvas.width} / ${canvas.height}`);
  if (visual.scale != null) style.setProperty('--motion-scale', String(visual.scale));
  if (visual.strokeWidth != null) style.setProperty('--motion-stroke-width', String(visual.strokeWidth));
  if (visual.opacity != null) style.opacity = String(visual.opacity);
  if (motion.duration != null) style.setProperty('--motion-duration', `${motion.duration}ms`);
  if (motion.delay != null) style.setProperty('--motion-delay', `${motion.delay}ms`);
  if (motion.intensity != null) style.setProperty('--motion-intensity', String(motion.intensity));
}

/* ------------------------------------------------------------------------ */
/* MotionController                                                          */
/* ------------------------------------------------------------------------ */

export class MotionController {
  /**
   * @param {HTMLElement} root  Contenedor `.mdes` del recurso.
   * @param {object} config     Configuración MDES (se fusiona con DEFAULTS).
   */
  constructor(root, config = {}) {
    if (!root) throw new Error('MotionController: se requiere el elemento raíz .mdes');
    this.root = root;
    this.config = mergeConfig(DEFAULTS, config);
    this._userPaused = this.config.behavior.trigger === 'manual';
    this._autoPaused = false;
    this._destroyed = false;
    this._listeners = [];

    root.classList.add('mdes');
    root.dataset.mdesId = this.config.id || '';
    applyConfig(root, this.config);
    this._applyAccessibility();
    this.setState(this.config.behavior.initialState);
    if (this.config.behavior.progressMode) root.dataset.progressMode = this.config.behavior.progressMode;

    // Velocidad: se re-sincroniza cada vez que una animación CSS (re)inicia.
    this._on(root, 'animationstart', () => this._sync());

    // Movimiento reducido (respeta cambios en vivo del sistema operativo).
    this._resolveReducedMotion();
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      this._on(mq, 'change', () => this._resolveReducedMotion());
    }

    // No gastar CPU en segundo plano.
    if (this.config.behavior.pauseWhenHidden !== false && typeof document !== 'undefined') {
      this._on(document, 'visibilitychange', () => this._setAutoPaused(document.hidden));
      if (typeof IntersectionObserver !== 'undefined') {
        this._io = new IntersectionObserver(([entry]) => this._setAutoPaused(!entry.isIntersecting));
        this._io.observe(root);
      }
    }

    this._sync();
  }

  /** Animaciones CSS/WAAPI vivas dentro del recurso. */
  get animations() {
    return typeof this.root.getAnimations === 'function' ? this.root.getAnimations({ subtree: true }) : [];
  }

  get state() { return this.root.dataset.motionState; }
  get speed() { return this.config.motion.speed; }
  get isPlaying() { return !this._userPaused && !this._autoPaused; }

  play() { this._userPaused = false; this._sync(); return this; }
  pause() { this._userPaused = true; this._sync(); return this; }

  restart() {
    for (const a of this.animations) { a.cancel(); a.play(); }
    this._userPaused = false;
    this._sync();
    return this;
  }

  reverse() {
    for (const a of this.animations) a.reverse();
    this.root.dataset.motionDirection = this.root.dataset.motionDirection === 'reverse' ? 'normal' : 'reverse';
    return this;
  }

  setSpeed(speed) {
    if (!(Number.isFinite(speed) && speed > 0 && speed <= 4)) throw new RangeError('setSpeed: valor entre 0 (excl.) y 4');
    this.config.motion.speed = speed;
    this._sync();
    return this;
  }

  setColors(colors = {}) {
    this.config.visual = { ...this.config.visual, ...colors };
    for (const [key, value] of Object.entries(colors)) {
      const token = COLOR_TOKENS[key];
      if (token && value) this.root.style.setProperty(token, value);
    }
    return this;
  }

  setTheme(theme) {
    if (!THEMES.includes(theme)) throw new RangeError(`setTheme: ${THEMES.join(', ')}`);
    // El tema se aplica por atributo; los colores inline personalizados siguen teniendo prioridad.
    this.root.dataset.motionTheme = theme;
    return this;
  }

  /** Limpia colores inline para que el tema activo gobierne la paleta. */
  resetColors() {
    for (const token of Object.values(COLOR_TOKENS)) this.root.style.removeProperty(token);
    return this;
  }

  setSize(width, height) {
    if (!(width > 0)) throw new RangeError('setSize: width > 0');
    this.root.style.setProperty('--motion-width', `${width}px`);
    if (height > 0) this.root.style.setProperty('--motion-aspect', `${width} / ${height}`);
    return this;
  }

  /**
   * Progreso REAL de una operación (0..1). Pasa `null` para volver a indeterminado.
   * Nunca lo llames con valores inventados: si la operación no reporta avance, usa null.
   */
  setProgress(value) {
    if (value === null || value === undefined) {
      this.root.dataset.progressMode = 'indeterminate';
      this.root.style.removeProperty('--motion-progress');
      this._progressEl()?.removeAttribute('aria-valuenow');
      return this;
    }
    if (!(Number.isFinite(value) && value >= 0 && value <= 1)) throw new RangeError('setProgress: 0..1 o null');
    this.root.dataset.progressMode = 'determinate';
    this.root.style.setProperty('--motion-progress', String(value));
    const el = this._progressEl();
    if (el) {
      el.setAttribute('aria-valuemin', '0');
      el.setAttribute('aria-valuemax', '100');
      el.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    }
    return this;
  }

  setState(state) {
    if (!STATES.includes(state)) throw new RangeError(`setState: ${STATES.join(', ')}`);
    this.root.dataset.motionState = state;
    const live = this.root.querySelector('[data-motion-live]');
    if (live) {
      const labels = this.config.accessibility.stateLabels || {};
      if (labels[state]) live.textContent = labels[state];
    }
    // Las animaciones nuevas del estado heredan la velocidad en el próximo frame.
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => this._sync());
    return this;
  }

  destroy() {
    if (this._destroyed) return;
    for (const a of this.animations) a.cancel();
    for (const [target, type, fn] of this._listeners) target.removeEventListener(type, fn);
    this._listeners = [];
    this._io?.disconnect();
    this._destroyed = true;
  }

  /* ---------------- internos ---------------- */

  _on(target, type, fn) {
    target.addEventListener(type, fn);
    this._listeners.push([target, type, fn]);
  }

  _setAutoPaused(paused) {
    this._autoPaused = paused;
    this._sync();
  }

  _sync() {
    if (this._destroyed) return;
    const rate = this.config.motion.speed;
    const shouldRun = this.isPlaying;
    for (const a of this.animations) {
      if (a.playbackRate !== rate) {
        if (typeof a.updatePlaybackRate === 'function') a.updatePlaybackRate(rate);
        else a.playbackRate = rate;
      }
      if (shouldRun && a.playState === 'paused') a.play();
      if (!shouldRun && a.playState === 'running') a.pause();
    }
    this.root.dataset.motionPlayState = shouldRun ? 'running' : 'paused';
  }

  _resolveReducedMotion() {
    const policy = this.config.behavior.reducedMotion;
    if (prefersReducedMotion()) this.root.dataset.motionReduced = policy;
    else delete this.root.dataset.motionReduced;
  }

  _progressEl() {
    return this.root.querySelector('[role="progressbar"]') || (this.root.getAttribute('role') === 'progressbar' ? this.root : null);
  }

  _applyAccessibility() {
    const { decorative, ariaLabel } = this.config.accessibility;
    const svg = this.root.querySelector('svg');
    if (decorative) {
      this.root.setAttribute('aria-hidden', 'true');
    } else if (ariaLabel) {
      if (!this.root.hasAttribute('role')) this.root.setAttribute('role', 'img');
      this.root.setAttribute('aria-label', ariaLabel);
      svg?.setAttribute('aria-hidden', 'true');
    }
  }
}

/** Atajo: monta un controlador leyendo la configuración JSON embebida o remota. */
export async function mountMotion(root, configOrUrl) {
  const config = typeof configOrUrl === 'string' ? await (await fetch(configOrUrl)).json() : configOrUrl;
  const result = validateConfig(config);
  if (!result.valid) console.warn(`[MDES] Configuración inválida (${config?.id}):`, result.errors);
  return new MotionController(root, config);
}
