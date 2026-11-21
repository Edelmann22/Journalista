/**
 * UI · "Play again?"
 * ==================
 *
 * When any game ends (solo, daily seven, a room match, a quick match) a sheet
 * slides up from the bottom and asks whether to play again, so one game leads
 * straight into the next. The handle at the top folds it down to a bar, to look
 * at the scoreboard, and opens it again.
 *
 * Each mode passes its own choices:
 *   askAgain({
 *     text: "One line of context",
 *     yes:  ["Play again", fn],          // main button
 *     alt:  ["Quick match", fn],         // optional second choice
 *     no:   ["Front page", fn],          // optional way out
 *   });
 * The functions decide what happens to the sheet: starting a new game changes
 * the view, which closes it (see show() in js/ui/dom.js); otherwise call
 * hideAgain() or againSet() to change the text and buttons while it is open.
 */

/** Wait before the sheet appears, so the final score and confetti land first. */
const AGAIN_DELAY_MS = 1500;

let againOpts = null;
let againTimer = 0;

/**
 * Ask whether to play again, after a short pause, on the current view.
 *
 * @param {{text?: string, yes?: Array, alt?: Array, no?: Array}} o
 * @param {number} [delay]
 */
function askAgain(o, delay = AGAIN_DELAY_MS) {
  clearTimeout(againTimer);
  againOpts = { ...o };
  const on = view;
  againTimer = setTimeout(() => {
    if (view !== on || !againOpts) return;
    const sheet = $("againSheet");
    sheet.dataset.view = on;
    againFill();
    againFold(false);
    sheet.hidden = false;
    replay(sheet, "sheet-in");
  }, delay);
}

/** Change the text or buttons, whether the sheet is open yet or still on its way. */
function againSet(patch) {
  if (!againOpts) return;
  Object.assign(againOpts, patch);
  if (!$("againSheet").hidden) againFill();
}

/** Close the sheet and forget its choices. */
function hideAgain() {
  clearTimeout(againTimer);
  againOpts = null;
  $("againSheet").hidden = true;
}

/** Fold the sheet down to its handle, or open it again. */
function againFold(folded) {
  $("againSheet").classList.toggle("min", folded);
  $("agToggle").setAttribute("aria-expanded", String(!folded));
}

/** Write the current choices into the sheet. */
function againFill() {
  const o = againOpts;
  $("agText").textContent = o.text || "";
  $("agText").hidden = !o.text;
  [
    ["agYes", o.yes],
    ["agAlt", o.alt],
    ["agNo", o.no],
  ].forEach(([id, choice]) => {
    $(id).hidden = !choice;
    if (choice) $(id).textContent = choice[0];
  });
}

[
  ["agYes", "yes"],
  ["agAlt", "alt"],
  ["agNo", "no"],
].forEach(([id, key]) =>
  $(id).addEventListener("click", () => {
    const choice = againOpts && againOpts[key];
    if (choice) choice[1]();
  }),
);
$("agToggle").addEventListener("click", () =>
  againFold(!$("againSheet").classList.contains("min")),
);
