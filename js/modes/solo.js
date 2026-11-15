/**
 * Mode · solo play (daily seven and practice)
 * ===========================================
 *
 * Daily: the same seven prompts for everyone, picked deterministically from
 * today's date, one per section with one section rested each day.
 * Practice: seven random prompts from one section, avoiding prompts already
 * seen until the section is exhausted.
 *
 * Each prompt has SECONDS on the clock and the first correct answer is scored.
 * The rarer the answer, the higher its tier; whole seconds left on the clock
 * add a speed bonus of 2 points each.
 */

/* ---------- choosing prompts ------------------------------------------------ */

/**
 * Today's seven prompts as [section index, prompt index] pairs.
 * One section is rested each day; every other section contributes one
 * prompt, cycling through its own fixed shuffle, then seven are kept.
 * Deterministic, so every player gets the same seven.
 */
function pickDaily() {
  const d = dayNumber(today()),
    out = d % CATS.length,
    picks = [];
  CATS.forEach((c, ci) => {
    if (ci === out) return;
    const order = shuffle(idx(c.prompts.length), rng(1907 + ci * 31));
    picks.push([ci, order[d % order.length]]);
  });
  return shuffle(picks, rng(d)).slice(0, PER_MATCH);
}

/**
 * Seven random practice prompts from one section (or "all"), preferring
 * prompts the player has not seen yet. When the section runs out, the
 * seen list starts over.
 *
 * @param {string} sec  section id or "all"
 */
function pickFree(sec) {
  let all = [];
  CATS.forEach((c, ci) => {
    if (sec === "all" || c.id === sec) c.prompts.forEach((_, pi) => all.push(ci + "." + pi));
  });
  const want = Math.min(PER_MATCH, all.length);
  let seen = (store.seen[sec] || []).filter((k) => all.includes(k));
  let picks = shuffle(
    all.filter((k) => !seen.includes(k)),
    Math.random,
  ).slice(0, want);
  if (picks.length < want) {
    const rest = shuffle(
      all.filter((k) => !picks.includes(k)),
      Math.random,
    ).slice(0, want - picks.length);
    picks = picks.concat(rest);
    seen = rest.slice();
  } else seen = seen.concat(picks);
  store.seen[sec] = seen;
  save(store);
  return picks.map((k) => k.split(".").map(Number));
}

/** The prompt object for the game's current question. */
function promptOf(g) {
  const [ci, pi] = g.ids[g.i];
  return CATS[ci].prompts[pi];
}

/* ---------- state ----------------------------------------------------------- */

/** The solo game in progress: { mode, sec, date, ids, i, score, rows, deadline, open }. */
let game = null;

/** requestAnimationFrame handle for the solo clock. */
let raf = 0;

/** Current daily streak, or 0 if the player missed a day. */
function streakNow() {
  if (!store.lastDay) return 0;
  return dayNumber(today()) - dayNumber(store.lastDay) <= 1 ? store.streak || 0 : 0;
}

/** Today's finished daily game, if the player already played it. */
function todaysResult() {
  return store.daily && store.daily.date === today() ? store.daily : null;
}

/* ---------- front page ------------------------------------------------------ */

/** Fill the home view: dateline, streak, daily button and the section index. */
function renderHome() {
  $("name").value = store.name || "";
  $("dl").textContent = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  $("edNo").textContent = "No. " + (dayNumber(today()) - 20400);
  const played = todaysResult();
  $("edition").textContent =
    "Play alone · streak " + streakNow() + " · best " + fmt(store.best || 0);
  $("kick").textContent = played ? "See today's result" : "Play today's seven";
  $("homeNote").textContent = played
    ? "You scored " + fmt(played.score) + " today. A new seven arrives at midnight."
    : "The same seven prompts for everyone today, one answer each, 25 seconds a prompt.";
  const box = $("index");
  box.innerHTML = "";
  [{ id: "all", name: "Mixed bag", blurb: "Seven at random from every section", n: TOTAL }]
    .concat(CATS.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb, n: c.prompts.length })))
    .forEach((r) => {
      const b = el("button", "sec");
      b.type = "button";
      b.append(
        el("span", "t", r.name),
        el("span", "c num", r.n + " prompts"),
        el("span", "d", r.blurb),
      );
      b.addEventListener("click", () => start("free", r.id));
      box.appendChild(b);
    });
  renderTicker();
  renderEditor();
  renderMe();
}

$("kick").addEventListener("click", () => {
  const saved = todaysResult();
  if (saved) {
    game = saved;
    renderResult();
    return;
  }
  start("daily", "all");
});
$("back").addEventListener("click", goHome);
$("again").addEventListener("click", () =>
  start("free", game && game.mode === "free" ? game.sec : "all"),
);

/** Abandon any solo game and return to the front page. */
function goHome() {
  cancelAnimationFrame(raf);
  if (game) game.open = false;
  renderHome();
  show("home");
}
$("homeBtn").addEventListener("click", () => {
  if (mp) {
    if (view !== "room" && mp.phase === "lobby") {
      show("room");
    }
    return;
  }
  goHome();
});

/* ---------- playing a match ------------------------------------------------- */

/**
 * Start a solo match.
 *
 * @param {"daily"|"free"} mode
 * @param {string} sec  section id, or "all"
 */
function start(mode, sec) {
  game = {
    mode,
    sec,
    date: today(),
    ids: mode === "daily" ? pickDaily() : pickFree(sec),
    i: 0,
    score: 0,
    rows: [],
  };
  show("play");
  ask();
}

/** Update the prompt counter, section name, score and progress pips. */
function drawBoard() {
  const n = game.ids.length,
    cur = Math.min(game.i, n - 1);
  $("qCount").textContent =
    "Prompt " + (cur + 1) + " of " + n + (game.mode === "daily" ? " · Daily" : " · Practice");
  $("qCat").textContent = CATS[game.ids[cur][0]].name;
  $("score").textContent = fmt(game.score);
  $("pips").innerHTML = game.ids
    .map((_, k) => {
      const r = game.rows[k];
      return '<div class="pip ' + (r ? "t" + r.tier : k === game.i ? "now" : "") + '"></div>';
    })
    .join("");
}

/** Show the current prompt and start its clock. */
function ask() {
  const p = promptOf(game);
  setEra(p.era);
  drawBoard();
  $("ask").hidden = false;
  $("reveal").hidden = true;
  $("qText").textContent = p.text;
  $("qSub").textContent = p.sub + " · " + p.answers.length + " answers count";
  $("say").textContent = "";
  $("answer").value = "";
  $("answer").focus({ preventScroll: true });
  replay($("card"), "enter");
  setSoloMood("idle");
  game.deadline = performance.now() + SECONDS * 1000;
  game.open = true;
  cancelAnimationFrame(raf);
  tick();
}

/** Animation-frame loop for the solo clock. Settles the prompt at zero. */
function tick() {
  if (!game || !game.open) return;
  const left = Math.max(0, game.deadline - performance.now()),
    s = Math.ceil(left / 1000);
  $("fill").style.transform = "scaleX(" + left / (SECONDS * 1000) + ")";
  $("sec").classList.toggle("low", s <= 7);
  $("sec").textContent = s;
  if (s <= 5) setSoloMood("shock");
  if (left <= 0) {
    settle(null, "Missed the deadline");
    return;
  }
  raf = requestAnimationFrame(tick);
}

/** Check a typed answer: a match settles the prompt, a miss shakes the card. */
wire("form", "answer", () => {
  if (!game || !game.open) return;
  const raw = $("answer").value.trim();
  if (!raw) {
    $("say").textContent = "Type an answer first.";
    $("answer").focus();
    return;
  }
  const hit = findAnswer(promptOf(game), raw);
  if (hit) {
    settle(hit);
    return;
  }
  $("say").textContent = "“" + raw + "” does not count. Try another.";
  shakeEl($("card"));
  $("answer").select();
});
$("skip").addEventListener("click", () => {
  if (game && game.open) settle(null, "Skipped");
});

/**
 * Close the current prompt, score it and show the verdict.
 *
 * @param {Array|null} hit  the matched answer, or null for a miss
 * @param {string} [why]    shown instead of an answer on a miss
 */
function settle(hit, why) {
  game.open = false;
  cancelAnimationFrame(raf);
  const p = promptOf(game),
    left = Math.max(0, Math.floor((game.deadline - performance.now()) / 1000));
  const tier = hit ? hit[1] : 0,
    bonus = hit ? left * 2 : 0,
    pts = TIER[tier].pts + bonus,
    before = game.score;
  game.score += pts;
  game.rows.push({ q: p.text, a: hit ? hit[0] : why || "No answer", tier, pts });
  drawBoard();
  $("ask").hidden = true;
  $("reveal").hidden = false;
  $("rText").textContent = p.text;
  const v = $("verdict");
  v.style.setProperty("--c", TIER[tier].c);
  v.classList.remove("pop");
  void v.offsetWidth;
  v.classList.add("pop");
  $("vRate").textContent = TIER[tier].mark;
  $("vKind").textContent = TIER[tier].name;
  $("vAns").textContent = hit
    ? hit[0] + (bonus ? " · +" + bonus + " for speed" : "")
    : why || "No answer";
  $("vPts").textContent = "+" + pts;
  $("next").textContent = game.i === game.ids.length - 1 ? "Close the edition" : "Next prompt";
  tierGroups($("groups"), p, (a) =>
    el("span", "chip" + (hit && a[0] === hit[0] ? " you" : ""), a[0]),
  );
  window.scrollTo(0, 0);
  $("next").focus({ preventScroll: true });
  soloReact(tier, pts, before);
}

/** The player's reporter in the corner of the solo match. */
function setSoloMood(mood) {
  if (game.mood === mood) return;
  game.mood = mood;
  $("soloAv").src = avatarSrc(myLook(), mood);
}

/**
 * Celebrate (or commiserate) a settled prompt: the reporter's face, the
 * score counting up, a floating "+points", and confetti for rare answers.
 */
function soloReact(tier, pts, before) {
  setSoloMood(tier >= 2 ? "happy" : tier === 1 ? "idle" : "sad");
  countUp($("score"), before, game.score);
  if (tier) {
    replay($("soloAv"), "hop");
    popText($("score"), "+" + pts, TIER[tier].c);
  } else quake();
  if (tier === 4) {
    confetti($("vRate"), 90);
    stamp("Front page!", TIER[4].c);
  } else if (tier === 3) confetti($("vRate"), 40);
}
$("next").addEventListener("click", () => {
  game.i++;
  if (game.i < game.ids.length) {
    ask();
    return;
  }
  finish();
});
/* ---------- results --------------------------------------------------------- */

/** End the match: update streak, best score and today's saved result. */
function finish() {
  if (game.mode === "daily") {
    const gap = store.lastDay ? dayNumber(game.date) - dayNumber(store.lastDay) : null;
    if (gap !== 0) store.streak = gap === 1 ? (store.streak || 0) + 1 : 1;
    store.lastDay = game.date;
    store.daily = {
      mode: "daily",
      sec: "all",
      date: game.date,
      ids: game.ids,
      i: game.i,
      score: game.score,
      rows: game.rows,
    };
  }
  store.best = Math.max(store.best || 0, game.score);
  save(store);
  renderResult();
}

/**
 * Newsroom job title for a score, scaled to a full seven-prompt match.
 *
 * @param {number} score
 * @param {number} n  prompts played
 */
function rank(score, n) {
  const s = (score / (n || PER_MATCH)) * PER_MATCH;
  return s >= 2800
    ? "Editor-in-chief"
    : s >= 2100
      ? "Chief football writer"
      : s >= 1400
        ? "Staff reporter with a byline"
        : s >= 700
          ? "Junior reporter"
          : "Work experience, making the tea";
}

/** Spoiler-free result summary with one coloured square per prompt. */
function shareText() {
  const sq = ["✖️", "⬜", "🟦", "🟨", "🟥"],
    goals = game.rows.filter((r) => r.tier).length;
  return (
    "Journalista · " +
    (game.mode === "daily" ? "Daily " + game.date : "Practice, " + secName(game.sec)) +
    "\n" +
    goals +
    "/" +
    game.rows.length +
    " filed · " +
    fmt(game.score) +
    " pts\n" +
    game.rows.map((r) => sq[r.tier]).join("")
  );
}

/** Fill and show the full-time results view. */
function renderResult() {
  const goals = game.rows.filter((r) => r.tier).length,
    worldies = game.rows.filter((r) => r.tier === 4).length;
  $("resMeta").textContent =
    "Edition closed · " +
    (game.mode === "daily" ? "Daily " + game.date : "Practice · " + secName(game.sec));
  $("resScore").textContent = fmt(game.score);
  $("resRank").textContent = rank(game.score, game.rows.length);
  $("resLine").textContent =
    goals +
    " of " +
    game.rows.length +
    " filed" +
    (worldies ? ", " + worldies + " on the front page" : "") +
    ". Your best ever is " +
    fmt(Math.max(store.best || 0, game.score)) +
    ".";
  const box = $("resRows");
  box.innerHTML = "";
  game.rows.forEach((r) => {
    const row = el("div", "row");
    row.style.setProperty("--c", TIER[r.tier].c);
    row.append(
      el("div", "rate", TIER[r.tier].mark),
      el("span", "a", r.a),
      el("span", "p num", "+" + r.pts),
      el("span", "q", r.q),
    );
    box.appendChild(row);
  });
  $("share").textContent = "Copy result";
  $("shareBox").hidden = true;
  $("again").textContent =
    game.mode === "free" ? "Play " + secName(game.sec) + " again" : "Play a practice round";
  show("result");
  const scaled = (game.score / (game.rows.length || PER_MATCH)) * PER_MATCH;
  $("resAv").src = avatarSrc(myLook(), scaled >= 1400 ? "happy" : scaled < 700 ? "sad" : "idle");
  replay($("resAv"), "hop");
  countUp($("resScore"), 0, game.score, 1200);
  if (scaled >= 2100) setTimeout(() => confetti($("resScore"), 120), 400);
}

/** Copy the result, falling back to a selectable text box when the clipboard is blocked. */
$("share").addEventListener("click", () => {
  const text = shareText();
  const fallback = () => {
    const b = $("shareBox");
    b.value = text;
    b.hidden = false;
    b.focus();
    b.select();
    $("share").textContent = "Select and copy below";
  };
  try {
    navigator.clipboard.writeText(text).then(() => {
      $("share").textContent = "Copied";
    }, fallback);
  } catch (e) {
    fallback();
  }
});
