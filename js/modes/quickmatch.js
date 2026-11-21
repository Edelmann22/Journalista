/**
 * Mode · quick match against a random opponent
 * ============================================
 *
 * "Find an opponent" on the front page. The flow a player sees:
 *
 *   search    a matchmaking screen: elapsed time, status lines, faces flicking
 *             past in the opponent's slot. Now and then a found opponent
 *             does not accept and the search carries on.
 *   found     the opponent's name, town and reporter, a connection check,
 *             then a three-second countdown
 *   match     QM_ROUNDS rounds of Newsroom race or Hot seat (the player picks
 *             on the front page), using the normal room code. Between rounds
 *             both players press Ready (or the round starts by itself after
 *             QM_READY_SECS).
 *   final     the "Play again?" sheet (js/ui/again.js): rematch, which turns
 *             into a new opponent if this one leaves, or the front page
 *
 * The player is always the host of a private room with one opponent. Today
 * that opponent is the simulated reporter in js/modes/bot.js, connected
 * through a fake transport. To pair real strangers later, replace
 * quickConnect(): put both players in a matchmaking channel, let one of them
 * open a room as host, and hand the other the code. The rest of the match
 * (rounds, scoring, ready, rematch messages) already works over the network.
 *
 * There is no Leave button during a match: closing the app is the way out.
 *
 * Extra room messages used here: ready and rematch. Chat works as in any
 * room (js/modes/chat.js); the opponent may or may not answer.
 */

/* ---------- settings -------------------------------------------------------- */

/** Rounds in a quick match. */
const QM_ROUNDS = 3;

/** Seconds on the clock for each round. */
const QM_SECS = 45;

/** Seconds between rounds before the next one starts on its own. */
const QM_READY_SECS = 15;

/** What the search screen says while it waits, and from which second. */
const QM_STATUS = [
  [0, "Looking for reporters at your level…"],
  [5, "Checking the press boxes across Europe…"],
  [11, "Widening the search…"],
  [17, "Still looking. Busy night in the newsroom."],
];

/**
 * The quick match in progress, or null:
 * { phase, t0, timers, tick, opp, bot, readyMe, readyOpp, readyLeft,
 *   rematchMe, rematchOpp, gone, counted }
 * phase: search | found | countdown | round | board | final | over
 */
let qm = null;

/* ---------- timers ---------------------------------------------------------- */

/** setTimeout that is cancelled when the quick match ends. */
function qmLater(fn, ms) {
  if (!qm) return;
  const h = setTimeout(fn, ms);
  qm.timers.push(h);
}

/** Cancel every quick-match timer and put the shared scoreboard back as rooms expect it. */
function quickTimersClear() {
  if (qm) {
    qm.timers.forEach(clearTimeout);
    qm.timers = [];
    clearInterval(qm.tick);
    clearInterval(qm.readyTick);
  }
  $("bNext").disabled = false;
}

/** The opponent's name as shown on screen. */
function oppName(o) {
  return LABEL_BOTS ? o.name + " (bot)" : o.name;
}

/* ---------- front page ------------------------------------------------------ */

/** The player's quick-match record, created on first use. */
function qmRecord() {
  store.qm = store.qm || { w: 0, l: 0, d: 0 };
  return store.qm;
}

/** The game type the player picked for quick matches: "race" or "turns" (Hot seat). */
function qmMode() {
  return store.qmMode === "turns" ? "turns" : "race";
}

/** The game types offered for a quick match. */
const QM_MODES = [
  ["race", "Race", "Everyone at once, 45 seconds"],
  ["turns", "Hot seat", "Take turns, run out of time and lose"],
];

/** The opponent level the player picked: "any" or a key of BOT_LEVELS. */
function qmLevel() {
  return store.qmLevel && (store.qmLevel === "any" || BOT_LEVELS[store.qmLevel])
    ? store.qmLevel
    : "any";
}

/** The record against one level, created on first use. */
function qmLevelRecord(level) {
  store.qmBy = store.qmBy || {};
  store.qmBy[level] = store.qmBy[level] || { w: 0, l: 0, d: 0 };
  return store.qmBy[level];
}

/**
 * Count a quick match: overall and against the opponent's level.
 *
 * @param {"w"|"l"|"d"} result
 */
function qmTally(result) {
  qmRecord()[result]++;
  if (qm && qm.opp) qmLevelRecord(qm.opp.level)[result]++;
  save(store);
}

/** "3 won · 1 lost" */
function recordText(r) {
  return r.w + " won · " + r.l + " lost" + (r.d ? " · " + r.d + " drawn" : "");
}

/** The game type and level pickers, the level description and the record line. Called from renderHome(). */
function renderQuickHome() {
  const modes = $("qmModes");
  modes.innerHTML = "";
  QM_MODES.forEach(([key, name, blurb]) => {
    const on = key === qmMode(),
      b = el("button", "qm-mode" + (on ? " on" : ""));
    b.type = "button";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(on));
    b.append(el("b", null, name), el("span", null, blurb));
    b.addEventListener("click", () => {
      store.qmMode = key;
      save(store);
      renderQuickHome();
    });
    modes.appendChild(b);
  });
  const sel = qmLevel(),
    box = $("qmLevels");
  box.innerHTML = "";
  [["any", "Any", 0]]
    .concat(BOT_LEVEL_ORDER.map((k, i) => [k, BOT_LEVELS[k].name, i + 1]))
    .forEach(([key, name, bars]) => {
      const b = el("button", "level" + (key === sel ? " on" : ""));
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(key === sel));
      const meter = el("span", "level-meter");
      for (let i = 1; i <= 4; i++) meter.appendChild(el("i", i <= bars ? "full" : ""));
      if (!bars) meter.classList.add("any");
      b.append(meter, el("span", "level-name", name));
      b.addEventListener("click", () => {
        store.qmLevel = key;
        save(store);
        renderQuickHome();
      });
      box.appendChild(b);
    });
  $("qmLevelBlurb").textContent =
    sel === "any"
      ? "Matched to your form: win and the reporters get better."
      : BOT_LEVELS[sel].blurb;
  const all = qmRecord(),
    lv = sel === "any" ? all : qmLevelRecord(sel),
    played = lv.w + lv.l + lv.d;
  $("qmRecord").textContent = !played
    ? ""
    : (sel === "any" ? "Your record: " : "Against " + BOT_LEVELS[sel].name + "s: ") +
      recordText(lv);
  $("qmMsg").textContent = "";
}

$("qmFind").addEventListener("click", () => quickSearch());

/* ---------- searching ------------------------------------------------------- */

/** Fill the opponent's side of the versus panel, or show it searching. */
function setOpp(o) {
  const img = $("qsOpp");
  if (!o) {
    img.classList.add("searching");
    $("qsOppName").textContent = "?";
    $("qsOppSub").textContent = "Searching…";
    return;
  }
  img.classList.remove("searching");
  img.src = avatarSrc(o.look, "happy");
  $("qsOppName").textContent = oppName(o);
  $("qsOppSub").textContent = o.levelName + " · from " + o.place;
  replay(img, "hop");
}

/** How long the queue takes: usually a few seconds, sometimes much longer. Fewer legends are online. */
function searchWait() {
  const f = { rookie: 0.8, pundit: 0.9, veteran: 1.1, legend: 1.4 }[qmLevel()] || 1;
  return Math.min(26, (3.5 - Math.log(1 - Math.random()) * 5) * f) * 1000;
}

/** Start looking for an opponent. */
function quickSearch() {
  const name = $("name").value.trim().slice(0, 14);
  if (!name) {
    $("qmMsg").textContent = "Enter your name above first.";
    $("name").focus();
    return;
  }
  if (mp) return;
  store.name = name;
  save(store);
  quickTimersClear();
  qm = { phase: "search", t0: Date.now(), timers: [], tick: 0, readyTick: 0 };
  $("qsHead").textContent =
    qmMode() === "turns" ? "Finding you a Hot seat opponent" : "Finding you an opponent";
  $("qsMe").src = avatarSrc(myLook(), "idle");
  $("qsMeName").textContent = name;
  $("qsCancel").hidden = false;
  $("qsTime").hidden = false;
  setOpp(null);
  show("search");
  let face = 0;
  qm.tick = setInterval(() => {
    if (!qm) return;
    const s = Math.floor((Date.now() - qm.t0) / 1000);
    $("qsTime").textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    if (qm.phase === "search" && face++ % 2 === 0) $("qsOpp").src = avatarSrc(randomLook(), "idle");
  }, 160);
  QM_STATUS.forEach(([at, text]) =>
    qmLater(() => {
      if (qm && qm.phase === "search") $("qsStatus").textContent = text;
    }, at * 1000),
  );
  qmLater(() => quickFound(makeOpponent(qmLevel(), qmRecord()), chance(0.12)), searchWait());
}

/**
 * Someone turned up in the queue. They may still not accept.
 *
 * @param {object} o  opponent profile
 * @param {boolean} declines  true if they will not accept
 */
function quickFound(o, declines) {
  if (!qm) return;
  qm.phase = "found";
  setOpp(o);
  $("qsHead").textContent = "Opponent found";
  $("qsStatus").textContent = "Waiting for " + oppName(o) + " to accept…";
  if (declines) {
    qmLater(
      () => {
        if (!qm) return;
        qm.phase = "search";
        $("qsHead").textContent = "Finding you an opponent";
        $("qsStatus").textContent = oppName(o) + " didn't accept. Back in the queue.";
        setOpp(null);
        qmLater(() => quickFound(makeOpponent(qmLevel(), qmRecord()), false), rnd(3, 9) * 1000);
      },
      rnd(2, 5) * 1000,
    );
    return;
  }
  qmLater(
    () => {
      $("qsStatus").textContent = "Connecting… " + o.ping + " ms";
      qmLater(
        () => {
          $("qsStatus").textContent = oppName(o) + " is ready.";
          quickCountdown(3, () => quickConnect(o));
        },
        rnd(0.8, 2) * 1000,
      );
    },
    rnd(1, 3) * 1000,
  );
}

/** Count down on the search screen, then run done(). */
function quickCountdown(n, done) {
  if (!qm) return;
  qm.phase = "countdown";
  $("qsCancel").hidden = true;
  $("qsTime").hidden = true;
  $("qsHead").textContent = "Kick-off in " + n;
  replay($("qsHead"), "say-in");
  if (n > 1) qmLater(() => quickCountdown(n - 1, done), 1000);
  else qmLater(done, 1000);
}

/** Give up searching and go back to the front page. */
function quickCancel() {
  quickTimersClear();
  qm = null;
  goHome();
}

$("qsCancel").addEventListener("click", quickCancel);
$("homeBtn").addEventListener("click", () => {
  if (qm && !mp) quickCancel();
});

/* ---------- the match ------------------------------------------------------- */

/**
 * Three prompts for a quick match, avoiding ones from earlier quick matches
 * until every eligible prompt has been used. Hot seat needs bigger prompts.
 *
 * @param {"race"|"turns"} mode
 */
function quickPick(mode) {
  const need = mode === "turns" ? Math.max(MIN_ANSWERS, MIN_TURN_ANSWERS) : MIN_ANSWERS,
    pool = [];
  CATS.forEach((c, ci) =>
    c.prompts.forEach((p, pi) => {
      if (p.answers.length >= need) pool.push([ci, pi]);
    }),
  );
  const key = (id) => id.join(".");
  let seen = new Set(store.qmSeen || []);
  let pick = shuffle(
    pool.filter((id) => !seen.has(key(id))),
    Math.random,
  ).slice(0, QM_ROUNDS);
  if (pick.length < QM_ROUNDS) {
    seen = new Set();
    const rest = shuffle(
      pool.filter((id) => !pick.includes(id)),
      Math.random,
    );
    pick = pick.concat(rest.slice(0, QM_ROUNDS - pick.length));
  }
  store.qmSeen = [...seen, ...pick.map(key)];
  save(store);
  return pick;
}

/**
 * Open a private room with the opponent and start round one.
 * Today the opponent is a simulated reporter behind a fake transport.
 */
function quickConnect(o) {
  if (!qm || mp) return;
  const bot = createBot(o, (m) => {
    if (!mp || !mp.quick) return;
    onMessage({ ...m, from: o.id });
    if (m.t === "bye") bot.stop();
  });
  qm.opp = o;
  qm.bot = bot;
  const mode = qmMode();
  mp = {
    code: "QUICK",
    tr: { local: false, bot: true, send: (m) => bot.receive(m), close: () => bot.stop() },
    name: store.name,
    isHost: true,
    joined: true,
    phase: "round",
    n: 0,
    total: 0,
    lastHost: Date.now(),
    players: [
      { id: myId, name: store.name, look: myLook(), total: 0, seen: Date.now() },
      { id: o.id, name: oppName(o), look: o.look, total: 0, seen: Date.now() },
    ],
    settings: { ...DEFAULT_SETTINGS, mode, rounds: QM_ROUNDS, secs: QM_SECS },
    mode,
    round: null,
    turn: null,
    ledger: null,
    order: quickPick(mode),
    quick: true,
  };
  qm.phase = "round";
  clearInterval(qm.tick);
  hostNext();
}

/**
 * Handle quick-match messages from the opponent before the normal room code.
 * Returns true if the message was dealt with here.
 */
function quickOnMessage(m) {
  if (!qm || !qm.opp || m.from !== qm.opp.id) return false;
  const name = oppName(qm.opp);
  if (m.t === "ready") {
    if (qm.phase === "board" && m.n === mp.n) {
      qm.readyOpp = true;
      readyText();
      if (qm.readyMe) quickGo();
    }
    return true;
  }
  if (m.t === "rematch") {
    if (qm.phase !== "final" || qm.gone) return true;
    if (qm.rematchMe) quickRematch();
    else {
      qm.rematchOpp = true;
      againSet({ text: name + " wants a rematch.", yes: ["Accept rematch", quickRematch] });
    }
    return true;
  }
  if (m.t === "bye") {
    qm.gone = true;
    if (qm.phase === "final") {
      if (qm.rematchMe) {
        // You wanted to play on: straight to the next opponent.
        againSet({ text: name + " left. Finding you a new opponent…", yes: null, no: null });
        qmLater(quickNewOpponent, 1600);
      } else
        againSet({
          text: name + " left the newsroom.",
          yes: ["Find a new opponent", quickNewOpponent],
        });
    } else if (qm.phase !== "over") quickWalkover();
    return true;
  }
  return false;
}

/** Called at the end of showBoard() in a quick match: Ready between rounds, rematch at the end. */
function quickBoard(m) {
  if (!qm) return;
  clearInterval(qm.readyTick);
  $("bNext").hidden = false;
  $("bNext").disabled = false;
  qm.readyMe = qm.readyOpp = qm.rematchMe = qm.rematchOpp = false;
  if (m.last) {
    qm.phase = "final";
    quickRecord(m.rows);
    $("bNext").hidden = true;
    $("bWait").textContent = "";
    askQuickAgain();
    return;
  }
  qm.phase = "board";
  $("bNext").textContent = "Ready for round " + (m.n + 1);
  qm.readyLeft = QM_READY_SECS;
  readyText();
  qm.readyTick = setInterval(() => {
    if (!qm || qm.phase !== "board") return clearInterval(qm && qm.readyTick);
    qm.readyLeft--;
    if (qm.readyLeft <= 0) quickGo();
    else readyText();
  }, 1000);
}

/** The line under the Ready button between rounds. */
function readyText() {
  const name = oppName(qm.opp);
  $("bWait").textContent =
    (qm.readyOpp ? name + " is ready." : "Waiting for " + name + "…") +
    " Next round in " +
    qm.readyLeft +
    ".";
}

/** Both ready, or time is up: start the next round. */
function quickGo() {
  if (!qm || qm.phase !== "board") return;
  clearInterval(qm.readyTick);
  qm.phase = "round";
  hostNext();
}

/** The scoreboard's button between rounds in a quick match: Ready. */
function quickNext() {
  if (!qm || qm.phase !== "board") return;
  qm.readyMe = true;
  $("bNext").disabled = true;
  $("bNext").textContent = "You're ready";
  if (qm.readyOpp) quickGo();
}

/** After a quick match: play again (a rematch, or a new opponent), or the front page. */
function askQuickAgain() {
  askAgain({
    text: "Same opponent if " + oppName(qm.opp) + " is up for it, a new one if not.",
    yes: ["Play again", quickPlayAgain],
    alt: ["New opponent", quickNewOpponent],
    no: ["Front page", () => leaveRoom()],
  });
}

/** "Play again": accept or ask for a rematch. If the opponent leaves, a new one is found. */
function quickPlayAgain() {
  if (!qm || qm.phase !== "final") return;
  if (qm.gone) return quickNewOpponent();
  if (qm.rematchOpp) return quickRematch();
  qm.rematchMe = true;
  send({ t: "rematch" });
  againSet({ text: "Asking " + oppName(qm.opp) + " for a rematch…", yes: null, alt: null });
}

/** Close this match and search for someone new, at the same level and game type. */
function quickNewOpponent() {
  if (mp) {
    send({ t: "closed" });
    closeRoom();
  }
  quickTimersClear();
  qm = null;
  quickSearch();
}

/** Both want another go: same opponent, three new prompts. */
function quickRematch() {
  send({ t: "rematch" }); // lets the opponent know it is on, whoever asked first
  qm.phase = "countdown";
  qm.counted = false;
  mp.players.forEach((p) => (p.total = 0));
  mp.order = quickPick(mp.mode);
  mp.n = 0;
  hideAgain();
  $("bNext").hidden = false;
  $("bNext").disabled = true;
  let n = 3;
  const step = () => {
    if (!qm || qm.phase !== "countdown") return;
    if (n === 0) {
      qm.phase = "round";
      hostNext();
      return;
    }
    $("bNext").textContent = "Rematch in " + n;
    $("bWait").textContent = "Rematch on.";
    n--;
    qmLater(step, 1000);
  };
  step();
}

/** Save a win, loss or draw (once per match). */
function quickRecord(rows) {
  if (!qm || qm.counted) return;
  qm.counted = true;
  const me = rows.find((r) => r.id === myId),
    them = rows.find((r) => r.id !== myId);
  if (!me || !them) return;
  qmTally(me.total > them.total ? "w" : me.total < them.total ? "l" : "d");
}

/** The opponent quit mid-match: the player wins by walkover. */
function quickWalkover() {
  cancelAnimationFrame(mraf);
  clearInterval(qm.readyTick);
  turnsStop();
  mp.ledger = null; // stops a pending Hot seat scoreboard
  if (mp.round) mp.round.open = false;
  mp.round = null; // stops a pending hostBoard() from replacing this screen
  mp.phase = "final";
  qm.phase = "over";
  if (!qm.counted) {
    qm.counted = true;
    qmTally("w");
  }
  setEra(null);
  const name = oppName(qm.opp);
  $("bMeta").textContent = "Walkover · round " + mp.n + " of " + QM_ROUNDS;
  $("bHead").textContent = name + " left the match. You win by walkover";
  const box = $("bRanks");
  box.innerHTML = "";
  mp.players
    .slice()
    .sort((a, b) => (a.id === myId ? -1 : b.id === myId ? 1 : 0))
    .forEach((p, i) => {
      const row = el("div", "rank" + (i === 0 ? " first" : " lost")),
        nm = el("span", "nm");
      nm.append(
        avatar(p.look, i === 0 ? "happy" : "sad", "av-sm"),
        document.createTextNode(p.id === myId ? p.name + " (you)" : p.name),
      );
      row.append(
        el("span", "pos num", String(i + 1)),
        nm,
        el("span", "rd num", i === 0 ? "walkover" : "left"),
        el("span", "tt num", fmt(p.total)),
      );
      box.appendChild(row);
    });
  $("bPrompt").textContent = "No more rounds: your opponent has gone.";
  $("bGroups").innerHTML = "";
  $("bNext").hidden = true;
  $("bWait").textContent = "";
  show("mpboard");
  renderChat();
  stamp("Walkover", "var(--t3)");
  askAgain({
    text: "Keep going against someone new?",
    yes: ["Find a new opponent", quickNewOpponent],
    no: ["Front page", () => leaveRoom()],
  });
}

/** The player leaves a quick match: leaving before the end counts as a loss. */
function quickAbandon() {
  if (!qm) return;
  if (!qm.counted && ["round", "board", "countdown"].includes(qm.phase) && mp && mp.n > 0) {
    qm.counted = true;
    qmTally("l");
  }
  quickTimersClear();
  qm = null;
}
