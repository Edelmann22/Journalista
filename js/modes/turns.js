/**
 * Mode · Hot seat (turn-based multiplayer)
 * ========================================
 *
 * Players sit in a fixed order and take turns naming answers to one prompt.
 * Each turn has a short clock (the room's "seconds a turn" setting). File an
 * answer nobody has used yet and the turn passes on; run out of time and you
 * lose the round. The first seat rotates every round.
 *
 * Scoring per round
 *   - every filed answer scores its tier points (Wire copy 100 ... Front page 500)
 *   - the player who ran out of time is spiked: 0 points for the round
 *   - everyone else still seated earns SURVIVE_BONUS on top
 *
 * The host is the referee and keeps the ledger (seating, whose turn it is,
 * which answers are taken). Messages, on top of those in multiplayer.js:
 *   host     turn     full round state after every change
 *            timeout  the player on the clock ran out of time
 *   players  claim    the active player wants to file an answer
 *            miss     a wrong guess, shown to everyone for drama
 *
 * Builds on the room, transport and scoreboard in js/modes/multiplayer.js.
 */

/* ---------- rules ----------------------------------------------------------- */

/** Points every survivor earns when someone else runs out of time. */
const SURVIVE_BONUS = 100;

/** Hot seat only uses prompts with at least this many answers, so a round can go round the table. */
const MIN_TURN_ANSWERS = 12;

/** Extra time the host allows for a claim that is still travelling over the network. */
const TURN_GRACE_MS = 400;

/** How long the "Spiked!" moment stays on screen before the scoreboard. */
const TURN_REVEAL_MS = 2400;

/** Seconds left at which the active reporter starts to panic. */
const TURN_PANIC_SECS = 3;

/** Host fallback timer, so a turn still ends while the host's tab is in the background. */
let turnTimer = 0;

/* ---------- host: the referee ----------------------------------------------- */

/** Start the next round: a new prompt, every current player seated, first seat rotating. */
function turnsHostRound() {
  mp.n++;
  const ids = mp.players.map((p) => p.id);
  const shift = (mp.n - 1) % ids.length;
  mp.ledger = {
    n: mp.n,
    pid: mp.order[mp.n - 1],
    secs: mp.settings.turn || 10,
    seats: ids.slice(shift).concat(ids.slice(0, shift)),
    active: 0,
    k: 0,
    used: [],
    pts: {},
    open: true,
    deadline: 0,
  };
  turnsHostBroadcast(null);
}

/**
 * Tell everyone the state of the round.
 *
 * @param {{a: string, by: string, tier: number}|null} last  the answer just filed, if any
 * @param {boolean} [keepClock]  true to keep the running clock instead of starting a new turn
 */
function turnsHostBroadcast(last, keepClock) {
  const L = mp.ledger,
    now = performance.now();
  if (!keepClock) L.deadline = now + L.secs * 1000;
  const msg = {
    t: "turn",
    n: L.n,
    total: mp.order.length,
    pid: L.pid,
    seats: L.seats,
    active: L.seats[L.active],
    k: L.k,
    full: L.secs,
    left: Math.max(0, L.deadline - now),
    used: L.used,
    last,
  };
  send(msg);
  turnsApply(msg);
  clearTimeout(turnTimer);
  turnTimer = setTimeout(turnsHostTimer, msg.left + TURN_GRACE_MS);
}

/** True when the host's ledger has an open turn whose clock (plus grace) has run out. */
function turnsHostExpired() {
  const L = mp && mp.isHost && mp.ledger;
  return !!(L && L.open && performance.now() >= L.deadline + TURN_GRACE_MS);
}

/** Fallback timer: end the turn if it has expired, otherwise check again shortly. */
function turnsHostTimer() {
  const L = mp && mp.isHost && mp.ledger;
  if (!L || !L.open) return;
  if (turnsHostExpired()) turnsHostTimeout();
  else turnTimer = setTimeout(turnsHostTimer, 250);
}

/**
 * An answer from the active player. Valid, unused and on time: it is filed
 * and the turn passes to the next seat.
 */
function turnsHostClaim(from, n, k, name) {
  const L = mp.ledger;
  if (!L || !L.open || n !== L.n || k !== L.k || from !== L.seats[L.active]) return;
  if (performance.now() > L.deadline + TURN_GRACE_MS) return;
  const p = promptAt(L.pid),
    ans = p && p.answers.find((a) => a[0] === name);
  if (!ans || L.used.some((u) => u.a === name)) return;
  L.used.push({ a: name, by: from });
  L.pts[from] = (L.pts[from] || 0) + TIER[ans[1]].pts;
  L.active = (L.active + 1) % L.seats.length;
  L.k++;
  turnsHostBroadcast({ a: name, by: from, tier: ans[1] });
}

/** The active player ran out of time: announce it, then score the round. */
function turnsHostTimeout() {
  const L = mp.ledger;
  L.open = false;
  clearTimeout(turnTimer);
  const msg = { t: "timeout", n: L.n, k: L.k, loser: L.seats[L.active] };
  send(msg);
  turnsOnTimeout(msg);
  setTimeout(() => turnsHostBoard(msg.loser), TURN_REVEAL_MS);
}

/** A player left mid-round: unseat them. If they were on the clock, the next seat takes over. */
function turnsHostLeave(id) {
  const L = mp.ledger;
  if (!L || !L.open) return;
  const i = L.seats.indexOf(id);
  if (i < 0) return;
  L.seats.splice(i, 1);
  if (!L.seats.length) {
    L.open = false;
    clearTimeout(turnTimer);
    return;
  }
  if (i < L.active) {
    L.active--;
    turnsHostBroadcast(null, true);
  } else if (i === L.active) {
    L.active %= L.seats.length;
    L.k++;
    turnsHostBroadcast(null);
  } else turnsHostBroadcast(null, true);
}

/** Score the round and send the scoreboard. */
function turnsHostBoard(loser) {
  if (!mp || !mp.ledger) return;
  const L = mp.ledger;
  const rows = mp.players.map((pl) => {
    const lost = pl.id === loser;
    const pts = lost ? 0 : L.pts[pl.id] || 0;
    const bonus = !lost && mp.players.length > 1 && L.seats.includes(pl.id) ? SURVIVE_BONUS : 0;
    pl.total += pts + bonus;
    return {
      id: pl.id,
      name: pl.name,
      look: pl.look,
      names: L.used.filter((u) => u.by === pl.id).map((u) => u.a),
      pts,
      bonus,
      total: pl.total,
      lost,
    };
  });
  mp.ledger = null;
  const msg = {
    t: "board",
    mode: "turns",
    n: L.n,
    total: mp.order.length,
    pid: L.pid,
    rows,
    last: mp.n >= mp.order.length,
    loser,
  };
  send(msg);
  showBoard(msg);
}

/* ---------- everyone: following the round ----------------------------------- */

/**
 * Apply a turn message from the host: draw the seats, the filed answers and
 * whose clock is running. The first message of a round opens the view.
 */
function turnsApply(m) {
  const p = promptAt(m.pid);
  if (!p) return;
  const fresh = !mp.turn || mp.turn.n !== m.n;
  mp.phase = "round";
  mp.n = m.n;
  mp.total = m.total;
  mp.turn = {
    n: m.n,
    pid: m.pid,
    p,
    seats: m.seats || [],
    active: m.active,
    k: m.k,
    used: m.used || [],
    full: m.full,
    deadline: performance.now() + m.left,
    open: true,
    pending: false,
    panic: false,
    timeShown: false,
  };
  if (fresh) {
    setEra(p.era);
    $("tCount").textContent = "Round " + m.n + " of " + m.total + " · " + CATS[m.pid[0]].name;
    $("tText").textContent = p.text;
    $("tSub").textContent = p.sub + " · " + p.answers.length + " answers in the pot";
    $("tSay").textContent = "";
    $("tSay").className = "say";
    $("tScore").textContent = "0";
    $("tScore").dataset.v = 0;
    show("turns");
    replay($("tCard"), "enter");
  }
  const mine = m.active === myId,
    inp = $("tAnswer");
  inp.disabled = !mine;
  inp.value = "";
  inp.placeholder = mine ? "Your turn: file an answer" : "Wait for your turn";
  $("tForm").querySelector("button").disabled = !mine;
  turnsBanner();
  turnsSeats(null);
  turnsUsed(m.last);
  turnsScore();
  if (m.last) turnsCelebrate(m.last);
  if (mine) {
    inp.focus({ preventScroll: true });
    replay($("tBanner"), "banner-in");
  }
  cancelAnimationFrame(mraf);
  turnsTick();
}

/** Animation-frame loop for the turn clock. The host also ends expired turns here. */
function turnsTick() {
  const t = mp && mp.turn;
  if (!t || !t.open) return;
  const left = Math.max(0, t.deadline - performance.now()),
    s = Math.ceil(left / 1000);
  $("tFill").style.transform = "scaleX(" + Math.min(1, left / (t.full * 1000)) + ")";
  $("tSec").classList.toggle("low", s <= TURN_PANIC_SECS);
  $("tSec").textContent = s;
  if (s <= TURN_PANIC_SECS && left > 0 && !t.panic) {
    t.panic = true;
    turnsSeats(null);
  }
  if (left <= 0 && t.active === myId && !t.pending && !t.timeShown) {
    t.timeShown = true;
    $("tAnswer").disabled = true;
    $("tSay").className = "say";
    $("tSay").textContent = "Time!";
  }
  if (turnsHostExpired()) {
    turnsHostTimeout();
    return;
  }
  mraf = requestAnimationFrame(turnsTick);
}

/** The big banner: your turn, or who is on the clock. */
function turnsBanner() {
  const t = mp.turn,
    b = $("tBanner"),
    mine = t.active === myId;
  b.className = "turn-banner" + (mine ? " mine" : "");
  b.textContent = mine
    ? "Your turn! File an answer"
    : (t.seats.includes(myId) ? "" : "Watching · ") + nameOf(t.active) + " is on the clock";
}

/** Draw every seat: reporter, name and answers filed. */
function turnsSeats(loser) {
  const t = mp.turn,
    box = $("tSeats");
  box.innerHTML = "";
  t.seats.forEach((id) => {
    const active = t.open && id === t.active,
      out = id === loser;
    const seat = el(
      "div",
      "seat" + (active ? " active" : "") + (out ? " out" : "") + (id === myId ? " me" : ""),
    );
    seat.dataset.id = id;
    const mood = out ? "sad" : active && t.panic ? "shock" : "idle";
    const filed = t.used.filter((u) => u.by === id).length;
    seat.append(
      avatar(lookOf(id), mood, "av-lg"),
      el("span", "nm", id === myId ? "You" : nameOf(id)),
      el("span", "ct num", filed + " filed"),
    );
    if (active) seat.appendChild(pixelIcon("ball", "seat-ball"));
    box.appendChild(seat);
  });
}

/** The seat element of one player, if seated. */
function seatOf(id) {
  return [...$("tSeats").children].find((s) => s.dataset.id === id) || null;
}

/** Chips for every answer filed so far, newest first. */
function turnsUsed(last) {
  const t = mp.turn,
    box = $("tUsed");
  box.innerHTML = "";
  if (!t.used.length) box.appendChild(el("span", "small", "Nothing filed yet."));
  t.used
    .slice()
    .reverse()
    .forEach((u) => {
      const ans = t.p.answers.find((a) => a[0] === u.a),
        tier = ans ? ans[1] : 1;
      const chip = el(
        "span",
        "chip" + (u.by === myId ? " you" : "") + (last && last.a === u.a ? " new" : ""),
        u.a,
      );
      chip.style.setProperty("--c", TIER[tier].c);
      chip.appendChild(el("small", null, u.by === myId ? "you" : nameOf(u.by)));
      box.appendChild(chip);
    });
}

/** My points filed this round, counting up when they change. */
function turnsScore() {
  const t = mp.turn,
    e = $("tScore");
  const pts = t.used
    .filter((u) => u.by === myId)
    .reduce((sum, u) => {
      const ans = t.p.answers.find((a) => a[0] === u.a);
      return sum + (ans ? TIER[ans[1]].pts : 0);
    }, 0);
  const before = +(e.dataset.v || 0);
  e.dataset.v = pts;
  if (pts !== before) countUp(e, before, pts);
  else e.textContent = fmt(pts);
}

/** Someone filed an answer: their reporter cheers and the points float up. */
function turnsCelebrate(last) {
  const tier = TIER[last.tier],
    seat = seatOf(last.by);
  $("tSay").className = "say ok";
  $("tSay").textContent =
    (last.by === myId ? "You" : nameOf(last.by)) +
    " filed " +
    last.a +
    " · " +
    tier.name +
    " +" +
    tier.pts;
  if (!seat) return;
  const av = seat.querySelector(".avatar");
  av.src = avatarSrc(lookOf(last.by), "happy");
  replay(av, "hop");
  popText(av, "+" + tier.pts, tier.c);
  if (last.tier === 4) confetti(av, 50);
}

/** Submit the active player's answer: misses are shown to everyone, hits go to the host. */
wire("tForm", "tAnswer", () => {
  const t = mp && mp.turn;
  if (!t || !t.open || t.active !== myId || t.pending || performance.now() > t.deadline) return;
  const inp = $("tAnswer"),
    raw = inp.value.trim(),
    say = $("tSay");
  if (!raw) {
    say.className = "say";
    say.textContent = "Type an answer first.";
    inp.focus();
    return;
  }
  const hit = findAnswer(t.p, raw),
    taken = hit && t.used.find((u) => u.a === hit[0]);
  if (!hit || taken) {
    say.className = "say";
    say.textContent = taken
      ? hit[0] + " is already filed by " + (taken.by === myId ? "you" : nameOf(taken.by)) + "."
      : "“" + raw + "” does not count. Keep going!";
    shakeEl($("tCard"));
    inp.select();
    send({ t: "miss", n: t.n, k: t.k, text: raw.slice(0, 40) });
    return;
  }
  t.pending = true;
  inp.disabled = true;
  say.className = "say ok";
  say.textContent = "Filing " + hit[0] + "…";
  if (mp.isHost) turnsHostClaim(myId, t.n, t.k, hit[0]);
  else send({ t: "claim", n: t.n, k: t.k, a: hit[0] });
});

/** Another player guessed wrong on their turn. */
function turnsOnMiss(m) {
  const t = mp.turn;
  if (!t || !t.open || m.n !== t.n || m.k !== t.k) return;
  $("tSay").className = "say";
  $("tSay").textContent = nameOf(m.from) + " tried “" + String(m.text || "").slice(0, 40) + "”";
  replay(seatOf(m.from), "shake");
}

/** Someone ran out of time: lock the round and stamp it. */
function turnsOnTimeout(m) {
  const t = mp.turn;
  if (!t || m.n !== t.n) return;
  t.open = false;
  cancelAnimationFrame(mraf);
  $("tAnswer").disabled = true;
  $("tAnswer").value = "";
  $("tAnswer").placeholder = "Time's up";
  $("tForm").querySelector("button").disabled = true;
  $("tSec").textContent = "0";
  $("tFill").style.transform = "scaleX(0)";
  turnsSeats(m.loser);
  const me = m.loser === myId;
  $("tBanner").className = "turn-banner out";
  $("tBanner").textContent = (me ? "You" : nameOf(m.loser)) + " ran out of time";
  $("tSay").className = "say";
  $("tSay").textContent = me
    ? "Spiked. Your copy from this round goes in the bin."
    : "Spiked! Everyone else gets +" + SURVIVE_BONUS + " for surviving.";
  stamp("Spiked!", "var(--spot)");
  replay(seatOf(m.loser), "quake");
  if (me) {
    flash("var(--spot)");
    quake();
    const score = $("tScore");
    countUp(score, +(score.dataset.v || 0), 0, 900);
    score.dataset.v = 0;
  }
}

/** Stop the turn clock and timers (leaving the room, or the round is over). */
function turnsStop() {
  clearTimeout(turnTimer);
  cancelAnimationFrame(mraf);
  if (mp && mp.turn) mp.turn.open = false;
}
