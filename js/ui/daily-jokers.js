/**
 * UI · daily jokers
 * =================
 *
 * Three jokers you can play during any prompt, once each per day. They refill
 * at midnight (local time):
 *   - Red joker:   the full name of a Front page answer (red)
 *   - Green joker: the first name of a Back page answer (green)
 *   - Blue joker:  the surname of a Good line answer (blue)
 *
 * A joker is only spent if the prompt still has an answer of its colour that
 * you have not found. Used by solo play (js/modes/solo.js) and the Newsroom
 * race and quick match (js/modes/multiplayer.js). State lives in store.dj.
 */

/** The three jokers: storage key, answer tier, and what they reveal. */
const DAILY_JOKERS = [
  { key: "red", tier: 4, name: "Red joker", label: "Full name" },
  { key: "green", tier: 3, name: "Green joker", label: "First name" },
  { key: "blue", tier: 2, name: "Blue joker", label: "Surname" },
];

/** Today's joker state, reset when the day changes. */
function djState() {
  if (!store.dj || store.dj.day !== today()) store.dj = { day: today(), used: {} };
  return store.dj;
}

/** "Modrić" → "______": letters and digits become blanks, the rest stays. */
function djBlank(word) {
  return [...word].map((ch) => (/[\p{L}\p{N}]/u.test(ch) ? "_" : ch)).join("");
}

/**
 * What a joker shows of an answer.
 *
 * Green keeps the first word ("Luka ______"), blue keeps the surname with its
 * particles ("_____ van Persie"). A one-word answer shows its first or second half.
 *
 * @param {string} key  "red", "green" or "blue"
 * @param {string} name
 * @returns {string}
 */
function djReveal(key, name) {
  const clean = name.replace(/\s*\(.*\)$/, ""),
    words = clean.split(" ");
  if (key === "red") return clean;
  if (words.length === 1) {
    const letters = [...clean],
      half = Math.ceil(letters.length / 2);
    return key === "green"
      ? letters.slice(0, half).join("") + djBlank(letters.slice(half).join(""))
      : djBlank(letters.slice(0, letters.length - half).join("")) +
          letters.slice(letters.length - half).join("");
  }
  if (key === "green") return [words[0], ...words.slice(1).map(djBlank)].join(" ");
  let i = words.length - 1;
  while (i > 1 && SURNAME_PARTICLES.has(words[i - 1].toLowerCase())) i--;
  return words.map((w, k) => (k < i ? djBlank(w) : w)).join(" ");
}

/**
 * Draw the joker buttons for the current prompt.
 *
 * @param {string} id  the button row: "djSolo" or "djMp"; its hint box is id + "Hint"
 * @param {() => ({prompt: object, found: string[]}|null)} current
 *        the open prompt and the answers already found, or null when closed
 */
function renderDailyJokers(id, current) {
  const box = $(id),
    st = djState();
  box.innerHTML = "";
  box.appendChild(el("span", "dj-label", "Daily jokers"));
  DAILY_JOKERS.forEach((j) => {
    const used = !!st.used[j.key],
      b = el("button", "dj-btn dj-" + j.key + (used ? " used" : ""));
    b.type = "button";
    b.disabled = used;
    b.title = used ? j.name + ": used today, back tomorrow" : j.name + ": " + j.label;
    b.append(el("i"), el("span", "", used ? "Used" : j.label));
    b.addEventListener("click", () => playDailyJoker(id, j, current));
    box.appendChild(b);
  });
}

/** Spend a joker on the current prompt, if it has an answer of that colour left. */
function playDailyJoker(id, j, current) {
  const now = current(),
    hint = $(id + "Hint");
  if (!now || djState().used[j.key]) return;
  const pool = now.prompt.answers.filter((a) => a[1] === j.tier && !now.found.includes(a[0]));
  hint.style.setProperty("--c", TIER[j.tier].c);
  hint.hidden = false;
  hint.querySelector("b").textContent = j.name;
  if (!pool.length) {
    hint.querySelector(".joker-mask").textContent = "No answers of this colour left · not used";
    hint.classList.add("empty");
  } else {
    const ans = pool[Math.floor(Math.random() * pool.length)];
    djState().used[j.key] = true;
    save(store);
    hint.querySelector(".joker-mask").textContent = djReveal(j.key, ans[0]);
    hint.classList.remove("empty");
    renderDailyJokers(id, current);
  }
  replay(hint, "say-in");
  // Keep the keyboard up: go back to the answer box.
  const inp = $(id).closest("main").querySelector('input[type="text"]');
  if (inp) inp.focus({ preventScroll: true });
}

/** Hide the hint and redraw the buttons when a new prompt starts. */
function resetDailyJokers(id, current) {
  $(id + "Hint").hidden = true;
  renderDailyJokers(id, current);
}
