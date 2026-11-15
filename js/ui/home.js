/**
 * UI · front-page extras
 * ======================
 *
 * The decorations that make the front page feel alive:
 *   - the "Latest" ticker, scrolling a random selection of prompts
 *   - the editor, a pixel mascot with a speech bubble of tips (click for more)
 *   - your own pixel reporter, with a "New look" button to reroll it
 */

/** What the editor says. One is shown at a time, changing every few seconds. */
const EDITOR_TIPS = [
  "Anyone can file Messi. Bring me a name nobody else has.",
  "Rarer answers score more. A front-page answer is worth 500.",
  "Try the Hot seat with friends: take turns, and don't let the clock run out on you.",
  "Typos are fine on long names, and a surname is enough for most players.",
  "Seven prompts a day, the same for everyone. Don't miss the deadline.",
  "In a race, an answer nobody else found is a scoop worth 50 extra.",
  "Questions since 2010 run in today's paper. Older ones come from the archive.",
  "Answer fast. Every second left on the clock is worth 2 points.",
];

/** Milliseconds between tips. */
const EDITOR_TIP_MS = 7000;

/** Index of the tip on screen, and the timer that rotates them. */
let editorTip = Math.floor(Math.random() * EDITOR_TIPS.length);
let editorTimer = 0;

/** Fill the ticker with ten random prompts, doubled so the loop is seamless. */
function renderTicker() {
  const items = shuffle(
    CATS.flatMap((c) => c.prompts.map((p) => c.name + ": " + p.text)),
    Math.random,
  ).slice(0, 10);
  const track = $("ticker");
  track.innerHTML = "";
  [0, 1].forEach(() => items.forEach((t) => track.appendChild(el("span", "ticker-item", t))));
}

/** Show the editor's current tip, with a little hop. */
function showTip() {
  const bubble = $("edSay");
  bubble.textContent = EDITOR_TIPS[editorTip];
  replay(bubble, "say-in");
  replay($("editorAv"), "hop");
}

/** Move on to the next tip. */
function nextTip() {
  editorTip = (editorTip + 1) % EDITOR_TIPS.length;
  showTip();
}

/** Draw the editor and start rotating tips (once). */
function renderEditor() {
  $("editorAv").src = avatarSrc(EDITOR_LOOK, "happy");
  showTip();
  if (!editorTimer)
    editorTimer = setInterval(() => {
      if (view === "home" && !document.hidden) nextTip();
    }, EDITOR_TIP_MS);
}

/** Draw the player's own reporter. */
function renderMe() {
  $("meAv").src = avatarSrc(myLook(), "happy");
}

$("editorBtn").addEventListener("click", nextTip);

/** Reroll the player's look. */
$("reroll").addEventListener("click", () => {
  store.look = randomLook();
  save(store);
  renderMe();
  replay($("meAv"), "hop");
  popText($("meAv"), "New look!", "var(--t2)");
});
