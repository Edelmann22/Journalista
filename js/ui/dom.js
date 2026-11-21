/**
 * UI · DOM helpers and view switching
 * ===================================
 *
 * Element lookup and creation, switching between the <main> views, applying
 * the newspaper era to the page, and widgets shared by solo and multiplayer.
 */

/* ---------- element helpers ------------------------------------------------- */

/** Shorthand for document.getElementById. */
const $ = (id) => document.getElementById(id);

/**
 * Create an element with an optional class name and text content.
 *
 * @param {string} tag
 * @param {string|null} [cls]
 * @param {string|number|null} [text]
 */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/* ---------- views ----------------------------------------------------------- */

/** Id of the <main> view currently on screen. */
let view = "home";
/** Every view in index.html. Exactly one is visible at a time. */
const VIEWS = ["home", "search", "room", "mp", "turns", "mpboard", "play", "result"];

/**
 * Show one view and hide the rest. Screens that are not about a single
 * question (home, search, room, result) switch the page back to the neutral edition.
 */
function show(id) {
  // Leaving the screen it was asked on closes the "Play again?" sheet (js/ui/again.js).
  if (id !== view && typeof hideAgain === "function") hideAgain();
  view = id;
  VIEWS.forEach((s) => ($(s).hidden = s !== id));
  window.scrollTo(0, 0);
  if (id === "home" || id === "search" || id === "room" || id === "result") setEra(null);
}

/** Display name of a section id, or "All sections" for the mixed bag. */
function secName(sec) {
  const c = CATS.find((c) => c.id === sec);
  return c ? c.name : "All sections";
}

/* ---------- shared widgets -------------------------------------------------- */

/**
 * Connect an answer form to a handler.
 * Answers are sent by the Submit button or the Enter key directly, never by a
 * real form submit, because embedded previews and some in-app browsers block
 * form submission.
 */
function wire(formId, inputId, fn) {
  const form = $(formId);
  form.addEventListener("submit", (e) => e.preventDefault());
  form.querySelector("button").addEventListener("click", fn);
  $(inputId).addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fn();
    }
  });
}

/** Replay the shake animation on an element (wrong answer feedback). */
function shakeEl(e) {
  e.classList.remove("shake");
  void e.offsetWidth;
  e.classList.add("shake");
}

/** Most answer chips shown per tier on a reveal or scoreboard. */
const TIER_CHIPS = 30;

/**
 * Render a prompt's answers grouped by tier, rarest first.
 *
 * @param {HTMLElement} box  container to fill
 * @param {object} p  the prompt
 * @param {(answer: Array) => HTMLElement} chipFor  builds the chip for one answer
 */
function tierGroups(box, p, chipFor) {
  box.innerHTML = "";
  for (let t = 4; t >= 1; t--) {
    const list = p.answers.filter((a) => a[1] === t);
    if (!list.length) continue;
    const g = el("div", "group");
    g.style.setProperty("--c", TIER[t].c);
    g.appendChild(
      el("span", "kick", TIER[t].mark + " · " + TIER[t].name + " · " + TIER[t].pts + " pts"),
    );
    const chips = el("div", "chips");
    // Long lists show the first TIER_CHIPS answers, plus any the players found.
    let hidden = 0;
    list.forEach((a, i) => {
      const chip = chipFor(a);
      if (i < TIER_CHIPS || chip.classList.contains("you") || chip.querySelector("small"))
        chips.appendChild(chip);
      else hidden++;
    });
    if (hidden) chips.appendChild(el("span", "chip more", "+" + hidden + " more"));
    g.appendChild(chips);
    box.appendChild(g);
  }
}

/* ---------- newspaper era --------------------------------------------------- */

/**
 * Restyle the page for a question's era (see css/theme.css).
 *
 * @param {"new"|"old"|null} e  null shows the neutral "Football edition" label
 */
function setEra(e) {
  const era = e === "old" ? "old" : "new";
  document.documentElement.dataset.era = era;
  $("eraTag").textContent = e
    ? era === "old"
      ? "From the archive"
      : "Modern era"
    : "Football edition";
}
