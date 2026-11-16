/**
 * Mode · multiplayer rooms
 * ========================
 *
 * The player who creates the room is the host. The host picks the prompts,
 * runs the round clock and adds up the scores. Everyone talks over one
 * broadcast channel named after the room code:
 *   - Supabase Realtime when js/config.js has credentials
 *   - BroadcastChannel (same browser, other tabs) as a local test mode
 *
 * Two game types, chosen by the host in the lobby:
 *   race   Newsroom race: everyone answers the same prompt at once (this file)
 *   turns  Hot seat: players take turns, the one who runs out of time loses
 *          the round (js/modes/turns.js)
 *
 * Messages (field t):
 *   players  hello, ping, bye
 *   host     lobby, round, board, again, closed
 *   everyone hit, res, typ (during a race round; typ shows "typing…")
 *   Quick matches add ready, rematch and chat (see js/modes/quickmatch.js).
 *   Hot seat adds turn, timeout, claim and miss (see js/modes/turns.js).
 */

/* ---------- identity, limits and state -------------------------------------- */

/** Random id for this browser tab, used as the sender of every message. */
const myId = Math.random().toString(36).slice(2, 10);

/** Most players allowed in one room. */
const MAX_PLAYERS = 8;

/** Only prompts with at least this many answers are used in multiplayer. */
const MIN_ANSWERS = 8;

/** Bonus for a scoop: an answer nobody else in the room found. */
const UNIQUE_BONUS = 50;

/** How each game type is explained in the lobby. */
const MODE_RULES = {
  race:
    "Newsroom race: one prompt for everyone. Type as many right answers as you can before the " +
    "clock stops. Rarer answers score more, and an answer nobody else found is a scoop worth " +
    UNIQUE_BONUS +
    " extra.",
  turns:
    "Hot seat: take turns filing one answer each to the same prompt. Every answer can only be " +
    "filed once. Run out of time on your turn and you lose the round: your copy is spiked, and " +
    "everyone else gets 100 for surviving.",
};

/** Lobby settings a new room starts with. */
const DEFAULT_SETTINGS = { mode: "race", rounds: 5, era: "mix", secs: 45, turn: 10 };

/**
 * The room this tab is in, or null:
 * { code, tr (transport), name, isHost, joined, phase, n, total, lastHost,
 *   players, settings, mode, round (race), turn (Hot seat view),
 *   ledger (Hot seat, host only), order }
 */
let mp = null;

/** Supabase client, created on first use. */
let sb = null;

/** Heartbeat interval handle (see beat()). */
let hb = 0;

/** requestAnimationFrame handle for the round clock. */
let mraf = 0;

/* ---------- transport ------------------------------------------------------- */

/**
 * Connect to a room's broadcast channel.
 * Uses Supabase Realtime when configured, otherwise BroadcastChannel
 * between tabs of this browser (local test mode).
 *
 * @param {string} code  four-letter room code
 * @param {(message: object) => void} onMessage
 * @returns {Promise<{local: boolean, send: Function, close: Function}>}
 */
function openRoom(code, onMessage) {
  return new Promise((resolve, reject) => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
      try {
        sb = sb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const ch = sb.channel("journalista-" + code, { config: { broadcast: { self: false } } });
        let done = false;
        ch.on("broadcast", { event: "m" }, (e) => onMessage(e.payload));
        ch.subscribe((st) => {
          if (done) return;
          if (st === "SUBSCRIBED") {
            done = true;
            resolve({
              local: false,
              send: (m) => ch.send({ type: "broadcast", event: "m", payload: m }),
              close: () => sb.removeChannel(ch),
            });
          } else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") {
            done = true;
            reject(
              new Error("Could not reach the game server. Check your connection and try again."),
            );
          }
        });
      } catch (e) {
        reject(new Error("Could not start online play: " + e.message));
      }
    } else if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("journalista-" + code);
      bc.onmessage = (e) => onMessage(e.data);
      resolve({ local: true, send: (m) => bc.postMessage(m), close: () => bc.close() });
    } else reject(new Error("Online play is not set up on this site yet."));
  });
}

/** Broadcast a message to the room, stamped with this tab's id. */
function send(m) {
  if (!mp) return;
  m.from = myId;
  try {
    mp.tr.send(m);
  } catch (e) {}
}

/* ---------- players and prompts --------------------------------------------- */

/** A player in this room by id, or undefined. */
function playerOf(id) {
  return mp && mp.players.find((p) => p.id === id);
}

/** Display name of a player in this room. */
function nameOf(id) {
  const p = playerOf(id);
  return p ? p.name : "Player";
}

/** Pixel look of a player in this room (stable fallback for unknown players). */
function lookOf(id) {
  const p = playerOf(id);
  return p && p.look ? p.look : hashLook(id);
}

/** The prompt for a [section index, prompt index] pair, or undefined. */
function promptAt(pid) {
  const c = pid && CATS[pid[0]];
  return c && c.prompts[pid[1]];
}

/* ---------- joining and leaving --------------------------------------------- */

/** Show a status line under the room controls on the front page. */
function homeMsg(t) {
  $("homeMsg").textContent = t || "";
}

/** The player's name from the input, saved for next time. Null (with a hint) if empty. */
function myName() {
  const n = $("name").value.trim().slice(0, 14);
  if (!n) {
    homeMsg("Enter your name first.");
    $("name").focus();
    return null;
  }
  store.name = n;
  save(store);
  return n;
}

/** A random four-letter room code (no I or O, to avoid confusion with 1 and 0). */
function newCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join("");
}

$("create").addEventListener("click", () => enterRoom(newCode(), true));
$("join").addEventListener("click", () => {
  const c = $("code")
    .value.trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (c.length !== 4) {
    homeMsg("Room codes are four letters.");
    $("code").focus();
    return;
  }
  enterRoom(c, false);
});

/**
 * Open a room as host, or try to join an existing one.
 * A joining player who hears nothing from a host within 5 seconds gives up.
 *
 * @param {string} code
 * @param {boolean} asHost
 */
async function enterRoom(code, asHost) {
  const name = myName();
  if (!name || mp) return;
  homeMsg("Connecting…");
  try {
    const tr = await openRoom(code, onMessage);
    mp = {
      code,
      tr,
      name,
      isHost: asHost,
      joined: asHost,
      phase: "lobby",
      n: 0,
      total: 0,
      lastHost: Date.now(),
      players: asHost ? [{ id: myId, name, look: myLook(), total: 0, seen: Date.now() }] : [],
      settings: { ...DEFAULT_SETTINGS },
      mode: "race",
      round: null,
      turn: null,
      ledger: null,
      order: [],
    };
    clearInterval(hb);
    hb = setInterval(beat, 4000);
    if (asHost) {
      homeMsg("");
      renderRoom();
      show("room");
    } else {
      send({ t: "hello", name, look: myLook() });
      setTimeout(() => {
        if (mp && !mp.joined) {
          closeRoom();
          homeMsg(
            "No room found with code " +
              code +
              ". Check the code, and that the host still has the room open.",
          );
        }
      }, 5000);
    }
  } catch (e) {
    homeMsg(e.message);
  }
}

/** Stop timers and disconnect, without telling anyone. */
function closeRoom() {
  quickTimersClear();
  clearInterval(hb);
  cancelAnimationFrame(mraf);
  turnsStop();
  if (mp) {
    try {
      mp.tr.close();
    } catch (e) {}
  }
  mp = null;
}

/** Tell the room we are leaving (or closing it, as host), disconnect and go home. */
function leaveRoom(msg) {
  if (mp && mp.quick) quickAbandon();
  if (mp) {
    send({ t: mp.isHost ? "closed" : "bye" });
  }
  closeRoom();
  goHome();
  homeMsg(msg || "");
}

$("leave").addEventListener("click", () => leaveRoom());
$("bLeave").addEventListener("click", () => leaveRoom());
window.addEventListener("pagehide", () => {
  if (mp) send({ t: mp.isHost ? "closed" : "bye" });
});

/* ---------- heartbeat ------------------------------------------------------- */

/**
 * Runs every 4 seconds. The host drops lobby players silent for 16 seconds
 * and re-broadcasts the lobby; players ping and watch for a missing host.
 */
function beat() {
  if (!mp) return;
  if (mp.isHost) {
    if (mp.phase === "lobby") {
      const n = mp.players.length,
        now = Date.now();
      mp.players = mp.players.filter((p) => p.id === myId || now - p.seen < 16000);
      if (n !== mp.players.length) renderRoom();
    }
    sendLobby();
  } else {
    send({ t: "ping" });
    $("hostLost").hidden = Date.now() - mp.lastHost < 16000;
  }
}

/** Broadcast the player list, settings and phase (host only). */
function sendLobby() {
  send({
    t: "lobby",
    players: mp.players.map((p) => ({ id: p.id, name: p.name, look: p.look, total: p.total })),
    settings: mp.settings,
    phase: mp.phase,
  });
}

/* ---------- message handling ------------------------------------------------ */

/**
 * Handle one message from the room.
 * The host handles hello, ping, bye, res and claim; players handle lobby,
 * round, turn, timeout, board, again and closed; everyone handles hit
 * (live answer counts) and miss (Hot seat wrong guesses).
 */
function onMessage(m) {
  if (!mp || !m || typeof m !== "object" || m.from === myId) return;
  if (mp.quick && quickOnMessage(m)) return;
  if (mp.isHost) {
    let p = mp.players.find((p) => p.id === m.from);
    if (m.t === "hello") {
      if (!p) {
        if (mp.players.length >= MAX_PLAYERS) return;
        p = { id: m.from, name: String(m.name || "Player").slice(0, 14), total: 0 };
        mp.players.push(p);
      }
      if (m.look) p.look = m.look | 0;
      // Tabs of one browser share saved data, so they can arrive with the same look.
      if (mp.players.some((x) => x !== p && x.look === p.look)) p.look = hashLook(m.from);
      p.seen = Date.now();
      sendLobby();
      if (view === "room") renderRoom();
    } else if (m.t === "ping") {
      if (p) p.seen = Date.now();
    } else if (m.t === "bye") {
      mp.players = mp.players.filter((x) => x.id !== m.from);
      turnsHostLeave(m.from);
      sendLobby();
      if (view === "room") renderRoom();
    } else if (m.t === "res" && mp.round && m.n === mp.n && p && Array.isArray(m.names)) {
      mp.round.res[m.from] = m.names.slice(0, 80).map(String);
    } else if (m.t === "claim" && p) {
      turnsHostClaim(m.from, m.n, m.k, String(m.a));
    }
  } else {
    if (m.t === "lobby") {
      mp.lastHost = Date.now();
      $("hostLost").hidden = true;
      mp.players = m.players || [];
      mp.settings = m.settings || mp.settings;
      if (!mp.players.some((p) => p.id === myId)) {
        if (mp.joined || mp.players.length < MAX_PLAYERS)
          send({ t: "hello", name: mp.name, look: myLook() });
        return;
      }
      if (!mp.joined) {
        mp.joined = true;
        mp.phase = m.phase;
        homeMsg("");
        renderRoom();
        show("room");
      } else if (view === "room") {
        if (m.phase === "lobby") mp.phase = "lobby";
        renderRoom();
      }
    } else if (m.t === "round") {
      mp.lastHost = Date.now();
      if (mp.joined) startRound(m);
    } else if (m.t === "turn") {
      mp.lastHost = Date.now();
      if (mp.joined) turnsApply(m);
    } else if (m.t === "timeout") {
      mp.lastHost = Date.now();
      if (mp.joined) turnsOnTimeout(m);
    } else if (m.t === "board") {
      mp.lastHost = Date.now();
      if (mp.joined) showBoard(m);
    } else if (m.t === "again") {
      mp.phase = "lobby";
      turnsStop();
      mp.turn = null;
      renderRoom();
      show("room");
    } else if (m.t === "closed") {
      leaveRoom("The host closed the room.");
      return;
    }
  }
  if (m.t === "hit" && mp.round && m.n === mp.n) {
    mp.round.live[m.from] = { c: m.c | 0, p: m.p | 0 };
    delete mp.round.typing[m.from];
    renderLive();
  }
  if (m.t === "typ" && mp.round && mp.round.open && m.n === mp.n) {
    mp.round.typing[m.from] = Date.now() + TYPING_MS;
    renderLive();
    setTimeout(renderLive, TYPING_MS + 50);
  }
  if (m.t === "miss") turnsOnMiss(m);
}

/* ---------- lobby ----------------------------------------------------------- */

/** Draw the lobby: code, players, and host settings or a waiting message. */
function renderRoom() {
  $("roomCode").textContent = mp.code;
  $("localWarn").hidden = !mp.tr.local;
  $("pCount").textContent = "Players · " + mp.players.length + " of " + MAX_PLAYERS;
  const box = $("plist");
  box.innerHTML = "";
  mp.players.forEach((p, i) => {
    const r = el("div", "pl"),
      who = el("div", "pl-who");
    who.append(avatar(lookOf(p.id), "idle", "av-sm"), document.createTextNode(p.name));
    r.append(
      who,
      el(
        "span",
        null,
        (p.id === myId ? "you" : "") + (i === 0 ? (p.id === myId ? " · host" : "host") : ""),
      ),
    );
    box.appendChild(r);
  });
  const s = { ...DEFAULT_SETTINGS, ...mp.settings };
  document.querySelectorAll(".mode-card").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.mode === s.mode));
    b.disabled = !mp.isHost;
  });
  $("roomRules").textContent = MODE_RULES[s.mode] || MODE_RULES.race;
  $("hostBox").hidden = !mp.isHost;
  if (mp.isHost) {
    $("sRounds").value = s.rounds;
    $("sEra").value = s.era;
    $("sSecs").value = s.secs;
    $("sTurn").value = s.turn;
    $("fSecs").hidden = s.mode !== "race";
    $("fTurn").hidden = s.mode !== "turns";
    $("roomMsg").textContent =
      mp.players.length < 2
        ? "Waiting for friends to join with the code. You can start alone to try it."
        : "";
  } else {
    const eraName =
      { mix: "all eras", new: "modern questions", old: "classic questions" }[s.era] || "all eras";
    const clock = s.mode === "turns" ? s.turn + " seconds a turn" : s.secs + " seconds each";
    $("roomMsg").textContent =
      mp.phase === "lobby"
        ? "Waiting for the host to start. " +
          (s.mode === "turns" ? "Hot seat, " : "Newsroom race, ") +
          s.rounds +
          " rounds, " +
          clock +
          ", " +
          eraName +
          "."
        : "A match is in progress. You will join at the next round.";
  }
}

/** Host changed a match setting: store it and tell the room. */
["sRounds", "sEra", "sSecs", "sTurn"].forEach((id) =>
  $(id).addEventListener("change", () => {
    if (!mp || !mp.isHost) return;
    mp.settings = {
      ...mp.settings,
      rounds: +$("sRounds").value,
      era: $("sEra").value,
      secs: +$("sSecs").value,
      turn: +$("sTurn").value,
    };
    sendLobby();
  }),
);

/** Host picked a game type. */
document.querySelectorAll(".mode-card").forEach((b) =>
  b.addEventListener("click", () => {
    if (!mp || !mp.isHost) return;
    mp.settings = { ...mp.settings, mode: b.dataset.mode };
    sendLobby();
    renderRoom();
    replay(b.querySelector(".pix-icon"), "hop");
  }),
);

/** Host starts the match: pick the prompts for every round, reset totals. */
$("startMp").addEventListener("click", () => {
  if (!mp || !mp.isHost) return;
  mp.mode = mp.settings.mode === "turns" ? "turns" : "race";
  const need = mp.mode === "turns" ? MIN_TURN_ANSWERS : MIN_ANSWERS;
  let pool = [];
  CATS.forEach((c, ci) =>
    c.prompts.forEach((p, pi) => {
      if (p.answers.length >= need && (mp.settings.era === "mix" || p.era === mp.settings.era))
        pool.push([ci, pi]);
    }),
  );
  mp.order = shuffle(pool, Math.random).slice(0, mp.settings.rounds);
  mp.n = 0;
  mp.players.forEach((p) => (p.total = 0));
  hostNext();
});

/** Host advances to the next round and announces it. */
function hostNext() {
  if (mp.mode === "turns") {
    turnsHostRound();
    return;
  }
  mp.n++;
  const msg = {
    t: "round",
    n: mp.n,
    total: mp.order.length,
    pid: mp.order[mp.n - 1],
    secs: mp.settings.secs,
  };
  send(msg);
  startRound(msg);
}
/* ---------- playing a round ------------------------------------------------- */

/**
 * Begin a round for everyone (host and players).
 *
 * @param {{n: number, total: number, pid: number[], secs: number}} m
 */
function startRound(m) {
  const c = CATS[m.pid[0]],
    p = c && c.prompts[m.pid[1]];
  if (!p) return;
  mp.phase = "round";
  mp.n = m.n;
  mp.total = m.total;
  mp.round = {
    pid: m.pid,
    p,
    secs: m.secs,
    found: [],
    pts: 0,
    live: {},
    typing: {},
    res: {},
    open: true,
    deadline: performance.now() + m.secs * 1000,
  };
  setEra(p.era);
  $("mpCount").textContent = "Round " + m.n + " of " + m.total + " · " + c.name;
  $("mpText").textContent = p.text;
  $("mpSub").textContent = p.sub + " · " + p.answers.length + " answers to find";
  $("mpScore").textContent = "0";
  $("mpMine").innerHTML = "";
  $("mpSay").textContent = "";
  $("mpSay").className = "say";
  $("mpAnswer").value = "";
  $("mpAnswer").disabled = false;
  renderLive();
  show("mp");
  replay($("mpCard"), "enter");
  $("mpAnswer").focus({ preventScroll: true });
  cancelAnimationFrame(mraf);
  mpTick();
}

/** Animation-frame loop for the round clock. Ends the round at zero. */
function mpTick() {
  if (!mp || !mp.round || !mp.round.open) return;
  const r = mp.round,
    left = Math.max(0, r.deadline - performance.now()),
    s = Math.ceil(left / 1000);
  $("mpFill").style.transform = "scaleX(" + left / (r.secs * 1000) + ")";
  $("mpSec").classList.toggle("low", s <= 7);
  $("mpSec").textContent = s;
  if (left <= 0) {
    endRound();
    return;
  }
  mraf = requestAnimationFrame(mpTick);
}

/** Check a typed answer, record new hits and share the live count. */
wire("mpForm", "mpAnswer", () => {
  if (!mp || !mp.round || !mp.round.open) return;
  const inp = $("mpAnswer"),
    raw = inp.value.trim(),
    r = mp.round,
    say = $("mpSay");
  if (!raw) {
    say.className = "say";
    say.textContent = "Type an answer first.";
    inp.focus();
    return;
  }
  const hit = findAnswer(r.p, raw);
  if (!hit) {
    say.className = "say";
    say.textContent = "“" + raw + "” does not count.";
    shakeEl($("mpCard"));
    inp.select();
    return;
  }
  if (r.found.some((a) => a[0] === hit[0])) {
    say.className = "say";
    say.textContent = "You already have " + hit[0] + ".";
    inp.value = "";
    return;
  }
  const before = r.pts,
    tier = TIER[hit[1]];
  r.found.push(hit);
  r.pts += tier.pts;
  say.className = "say ok";
  say.textContent = hit[0] + " · " + tier.name + " +" + tier.pts;
  const chip = el("span", "chip you new", hit[0]);
  chip.style.setProperty("--c", tier.c);
  $("mpMine").prepend(chip);
  countUp($("mpScore"), before, r.pts);
  popText($("mpScore"), "+" + tier.pts, tier.c);
  if (hit[1] === 4) confetti(chip, 40);
  inp.value = "";
  send({ t: "hit", n: mp.n, c: r.found.length, p: r.pts });
  renderLive();
});

/** How long a "typing…" signal stays on screen without a fresh one. */
const TYPING_MS = 1800;

/** When this tab last told the room it was typing. */
let lastTyp = 0;

/** Tell the others we are typing, at most every 1.2 seconds. */
$("mpAnswer").addEventListener("input", () => {
  if (!mp || !mp.round || !mp.round.open || !$("mpAnswer").value.trim()) return;
  const now = Date.now();
  if (now - lastTyp < 1200) return;
  lastTyp = now;
  send({ t: "typ", n: mp.n });
});

/** Draw the live bars showing how many answers each player has, and who is typing. */
function renderLive() {
  if (!mp || !mp.round) return;
  const r = mp.round,
    box = $("mpLive");
  box.innerHTML = "";
  const rows = mp.players.map((p) => ({
    id: p.id,
    name: p.name,
    c: p.id === myId ? r.found.length : (r.live[p.id] || {}).c || 0,
  }));
  const max = Math.max(4, ...rows.map((x) => x.c));
  rows.forEach((x) => {
    const row = el("div", "lv" + (x.id === myId ? " me" : ""));
    const tr = el("div", "tr"),
      bar = document.createElement("i");
    bar.style.width = (x.c / max) * 100 + "%";
    tr.appendChild(bar);
    const who = el("span", "lv-who");
    who.append(
      avatar(lookOf(x.id), "idle", "av-xs"),
      document.createTextNode(x.id === myId ? "You" : x.name),
    );
    const count = el("span", "num", x.c + (x.c === 1 ? " answer" : " answers"));
    if (x.id !== myId && r.open && (r.typing[x.id] || 0) > Date.now())
      count.appendChild(el("span", "lv-typing", "typing…"));
    row.append(who, tr, count);
    box.appendChild(row);
  });
}

/** Clock ran out: lock input and send our answers to the host for counting. */
function endRound() {
  const r = mp.round;
  r.open = false;
  cancelAnimationFrame(mraf);
  $("mpAnswer").disabled = true;
  $("mpSec").textContent = "0";
  $("mpFill").style.transform = "scaleX(0)";
  $("mpSay").className = "say ok";
  $("mpSay").textContent = "Deadline. Counting the copy…";
  const names = r.found.map((a) => a[0]);
  if (mp.isHost) {
    r.res[myId] = names;
    setTimeout(hostBoard, 2200);
  } else send({ t: "res", n: mp.n, names });
}
/* ---------- scoring --------------------------------------------------------- */

/**
 * Host scores the round: keeps only valid, de-duplicated answers, awards
 * tier points plus UNIQUE_BONUS for scoops, and broadcasts the board.
 */
function hostBoard() {
  if (!mp || !mp.round) return;
  const r = mp.round,
    tierOf = {};
  r.p.answers.forEach((a) => (tierOf[a[0]] = a[1]));
  const clean = {},
    count = {};
  mp.players.forEach((pl) => {
    clean[pl.id] = [...new Set(r.res[pl.id] || [])].filter((n) => tierOf[n]);
    clean[pl.id].forEach((n) => (count[n] = (count[n] || 0) + 1));
  });
  const rows = mp.players.map((pl) => {
    let pts = 0,
      bonus = 0;
    clean[pl.id].forEach((n) => {
      pts += TIER[tierOf[n]].pts;
      if (mp.players.length > 1 && count[n] === 1) bonus += UNIQUE_BONUS;
    });
    pl.total += pts + bonus;
    return {
      id: pl.id,
      name: pl.name,
      look: pl.look,
      names: clean[pl.id],
      pts,
      bonus,
      total: pl.total,
    };
  });
  const msg = {
    t: "board",
    n: mp.n,
    total: mp.order.length,
    pid: r.pid,
    rows,
    last: mp.n >= mp.order.length,
  };
  send(msg);
  showBoard(msg);
}

/**
 * Show the round (or final) scoreboard with every answer and who found it.
 *
 * @param {{n, total, pid, rows, last: boolean}} m
 */
function showBoard(m) {
  const c = CATS[m.pid[0]],
    p = c && c.prompts[m.pid[1]];
  if (!p) return;
  turnsStop();
  mp.turn = null;
  if (mp.round) mp.round.open = false;
  mp.phase = m.last ? "final" : "board";
  mp.n = m.n;
  setEra(m.last ? null : p.era);
  const turns = m.mode === "turns",
    rows = m.rows.slice().sort((a, b) => b.total - a.total),
    top = rows[0],
    me = rows.find((r) => r.id === myId),
    tie = rows.length > 1 && rows[1].total === top.total,
    loser = turns && m.rows.find((r) => r.id === m.loser);
  $("bMeta").textContent = m.last
    ? "Final edition · " + m.total + " rounds"
    : "Round " + m.n + " of " + m.total + " · scores";
  $("bHead").textContent = m.last
    ? tie
      ? "It finishes level at the top"
      : top.id === myId
        ? "You win. The front page is yours"
        : top.name + " wins the front page"
    : turns
      ? m.loser === myId
        ? "You ran out of time. Spiked"
        : (loser ? loser.name : "Someone") + " ran out of time"
      : me
        ? "You found " + me.names.length + " of " + p.answers.length
        : "Round over";
  const box = $("bRanks");
  box.innerHTML = "";
  rows.forEach((r, i) => {
    const lost = turns && r.lost;
    const row = el("div", "rank" + (i === 0 ? " first" : "") + (lost ? " lost" : ""));
    const nm = el("span", "nm"),
      mood = lost ? "sad" : m.last && i === 0 && !tie ? "happy" : "idle";
    nm.append(
      avatar(r.look || lookOf(r.id), mood, "av-sm"),
      document.createTextNode(r.id === myId ? r.name + " (you)" : r.name),
    );
    const detail = turns
      ? lost
        ? "spiked"
        : "+" + fmt(r.pts + r.bonus) + (r.bonus ? " · survived" : "")
      : "+" +
        fmt(r.pts + r.bonus) +
        (r.bonus
          ? " · " + r.bonus / UNIQUE_BONUS + (r.bonus > UNIQUE_BONUS ? " scoops" : " scoop")
          : "");
    row.append(
      el("span", "pos num", String(i + 1)),
      nm,
      el("span", "rd num", detail),
      el("span", "tt num", fmt(r.total)),
    );
    box.appendChild(row);
  });
  if (m.last && !tie)
    setTimeout(() => {
      confetti($("bRanks").firstChild, top.id === myId ? 140 : 60);
      if (top.id === myId) stamp("You win!", "var(--t4)");
    }, 350);
  $("bPrompt").textContent = p.text;
  const who = {};
  m.rows.forEach((r) =>
    r.names.forEach((n) => (who[n] = who[n] || []).push(r.id === myId ? "you" : r.name)),
  );
  tierGroups($("bGroups"), p, (a) => {
    const w = who[a[0]] || [],
      chip = el("span", "chip" + (w.includes("you") ? " you" : ""), a[0]);
    if (w.length)
      chip.appendChild(
        el("small", null, w.length === m.rows.length && w.length > 1 ? "all" : w.join(", ")),
      );
    return chip;
  });
  $("bNext").hidden = !mp.isHost;
  $("bNext").textContent = m.last ? "Back to the room" : "Next round";
  $("bWait").textContent = mp.isHost
    ? ""
    : m.last
      ? "The host can start another match from the room."
      : "Waiting for the host to start the next round.";
  show("mpboard");
  if (mp.quick) quickBoard(m);
}

/** Host moves on: next round, or back to the lobby after the final. */
$("bNext").addEventListener("click", () => {
  if (mp && mp.quick) return quickNext();
  if (!mp || !mp.isHost) return;
  if (mp.phase === "final") {
    mp.phase = "lobby";
    send({ t: "again" });
    sendLobby();
    renderRoom();
    show("room");
  } else hostNext();
});
