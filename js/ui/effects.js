/**
 * UI · visual effects
 * ===================
 *
 * Paper confetti, floating score pop-ups, counting numbers, screen flashes,
 * full-screen stamps ("Front page!", "Spiked!") and screen shake.
 *
 * Everything here is decoration: effects never block input, and all motion
 * is skipped when the player's system asks for reduced motion.
 */

/** True when the operating system asks for reduced motion. */
function reducedMotion() {
  return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/** Restart a CSS animation class on an element. */
function replay(e, cls) {
  if (!e) return;
  e.classList.remove(cls);
  void e.offsetWidth;
  e.classList.add(cls);
}

/** Read a CSS custom property from the page (follows the current era). */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Centre of an element in viewport coordinates, or the top third of the screen. */
function centreOf(target) {
  if (target && target.getBoundingClientRect) {
    const r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: innerWidth / 2, y: innerHeight / 3 };
}

/* ---------- paper confetti -------------------------------------------------- */

/** The shared full-screen canvas, its particles and animation handle. */
const fx = { canvas: null, ctx: null, parts: [], raf: 0 };

/** Create (once) and size the confetti canvas to the viewport. */
function fxContext() {
  if (!fx.canvas) {
    fx.canvas = el("canvas", "fx-canvas");
    fx.canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(fx.canvas);
    fx.ctx = fx.canvas.getContext("2d");
  }
  // Resize on any change, not just width: the phone keyboard changes the height.
  const dpr = Math.min(2, window.devicePixelRatio || 1),
    w = Math.round(innerWidth * dpr),
    h = Math.round(innerHeight * dpr);
  if (fx.canvas.width !== w || fx.canvas.height !== h) {
    fx.canvas.width = w;
    fx.canvas.height = h;
  }
  fx.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return fx.ctx;
}

/** Wipe the whole canvas bitmap, whatever size it was drawn at. */
function fxWipe() {
  if (!fx.ctx) return;
  fx.ctx.setTransform(1, 0, 0, 1, 0, 0);
  fx.ctx.clearRect(0, 0, fx.canvas.width, fx.canvas.height);
}

/** Stop the confetti at once and clear the screen (leaving a view, app paused). */
function fxStop() {
  if (fx.raf) cancelAnimationFrame(fx.raf);
  fx.raf = 0;
  fx.parts = [];
  fxWipe();
}
document.addEventListener("visibilitychange", () => document.hidden && fxStop());

/**
 * Throw scraps of newsprint in the tier colours from an element.
 *
 * @param {HTMLElement|null} target  where the burst starts (null: top of screen)
 * @param {number} [count]
 */
function confetti(target, count = 60) {
  if (reducedMotion()) return;
  fxContext();
  const { x, y } = centreOf(target);
  const colours = ["--t1", "--t2", "--t3", "--t4", "--ink"].map(cssVar);
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 4 + Math.random() * 7;
    fx.parts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.4,
      colour: colours[i % colours.length],
      life: 1,
    });
  }
  if (!fx.raf) fx.raf = requestAnimationFrame(fxStep);
}

/** One frame of confetti physics: gravity, drag, flutter and fade. */
function fxStep() {
  fxWipe();
  const ctx = fxContext();
  fx.parts = fx.parts.filter((p) => {
    p.vy += 0.22;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.spin;
    p.life -= 0.006;
    if (p.life <= 0 || p.y > innerHeight + 30) return false;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.fillStyle = p.colour;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 1);
    ctx.restore();
    return true;
  });
  if (fx.parts.length) fx.raf = requestAnimationFrame(fxStep);
  else {
    fx.raf = 0;
    fxWipe();
  }
}

/* ---------- overlays -------------------------------------------------------- */

/** Add a short-lived overlay element to the page and remove it after ms. */
function overlay(cls, text, colour, ms) {
  const e = el("div", cls, text);
  e.setAttribute("aria-hidden", "true");
  if (colour) e.style.setProperty("--c", colour);
  document.body.appendChild(e);
  setTimeout(() => e.remove(), ms);
  return e;
}

/** A number such as "+500" that floats up from an element and fades. */
function popText(target, text, colour) {
  const { x, y } = centreOf(target);
  const e = overlay("pop-text", text, colour, 1000);
  e.style.left = x + "px";
  e.style.top = y + "px";
}

/** A big rubber stamp across the middle of the screen. */
function stamp(text, colour) {
  overlay("fx-stamp", text, colour, 1500);
}

/** A brief full-screen colour flash. */
function flash(colour) {
  if (!reducedMotion()) overlay("fx-flash", null, colour, 500);
}

/** Shake the whole page. */
function quake() {
  replay(document.querySelector(".wrap"), "quake");
}

/* ---------- counting numbers ------------------------------------------------ */

const COUNTERS = new WeakMap();

/**
 * Count a number up (or down) inside an element, formatted with fmt().
 *
 * @param {HTMLElement} e
 * @param {number} from
 * @param {number} to
 * @param {number} [ms]
 */
function countUp(e, from, to, ms = 600) {
  if (!e) return;
  const token = {};
  COUNTERS.set(e, token);
  if (reducedMotion() || from === to) {
    e.textContent = fmt(to);
    return;
  }
  const t0 = Date.now();
  const step = () => {
    if (COUNTERS.get(e) !== token) return;
    const k = Math.min(1, (Date.now() - t0) / ms);
    e.textContent = fmt(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  step();
}
