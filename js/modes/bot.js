/**
 * Mode · stand-in opponent for quick matches
 * ==========================================
 *
 * Until real players are paired at random, a quick match is played against a
 * simulated reporter that behaves like a person rather than a database:
 *
 *   - a name, a home town and a pixel look, like any other player
 *   - a level (Rookie, Pundit, Veteran, Legend) chosen by the player or
 *     matched to their form, which sets how much they know and how fast they are
 *   - a taste: young reporters know modern football better, veterans the
 *     archive, and everyone has a favourite section
 *   - patchy knowledge: common answers come to mind easily, rare ones seldom,
 *     only a handful at a time, and now and then nothing at all
 *   - human timing: reading the prompt, thinking, typing letter by letter,
 *     slowing down as the obvious answers run out, the odd blank moment
 *   - wrong guesses (you see them "typing" but no answer lands)
 *   - network delay on every message
 *   - after the match: a word in the chat, a rematch they may or may not
 *     want, and leaving when they are done. Very rarely they quit mid-match.
 *   - the chat: they read what you write and sometimes answer, after a pause
 *     and a "typing…", and sometimes say nothing at all. Busy mid-round,
 *     they rarely reply. Now and then they wish you luck at kick-off.
 *
 * The bot speaks exactly the same room messages as a real player (hello is
 * skipped because the quick match seats it directly), so the Newsroom race
 * code in js/modes/multiplayer.js cannot tell the difference.
 *
 * Messages the bot sends: typ, hit, res, ready, chat, ctyp, rematch, bye.
 * Messages it reacts to:  round, board, rematch, chat, closed.
 */

/* ---------- who they are ---------------------------------------------------- */

/** Usernames a real player might pick. Kept at 14 characters or fewer. */
const BOT_NAMES = [
  "nikolov_7",
  "Mitko",
  "luisito10",
  "gazza88",
  "Kalin B",
  "marta.lfc",
  "Tsvetan",
  "TheGaffer",
  "rafa_v",
  "Bobi",
  "dani_cules",
  "Vasko94",
  "Elif",
  "kristof_k",
  "pepi",
  "Tomás",
  "jamie.w",
  "Sasha",
  "nonno_calcio",
  "Kiko",
  "ivana_b",
  "MarcoP",
  "rui_dragao",
  "Hristo9",
  "laura_fdz",
  "deano",
  "Emre",
  "bvb_jonas",
  "Petya",
  "Stoyan",
  "giorgos",
  "lena.m",
  "Jakub",
  "oldtrafford99",
  "Nadia",
  "Sergio_R",
  "vlado",
  "tifoso",
  "Mia",
  "Georgi",
];

/** Where they say they are from. */
const BOT_PLACES = [
  "Sofia",
  "Plovdiv",
  "Varna",
  "Burgas",
  "Madrid",
  "Seville",
  "Barcelona",
  "Manchester",
  "Liverpool",
  "London",
  "Milan",
  "Naples",
  "Munich",
  "Dortmund",
  "Lisbon",
  "Porto",
  "Amsterdam",
  "Istanbul",
  "Belgrade",
  "Zagreb",
  "Bucharest",
  "Athens",
  "Lyon",
  "Glasgow",
  "Dublin",
  "Vienna",
  "Prague",
  "Warsaw",
];

/** What they might type after the final whistle. */
const BOT_CHAT = {
  win: ["gg", "gg wp", "good game", "close one", "that was fun", "gg, unlucky"],
  lose: ["gg", "gg wp", "too good", "nice one", "how did you know that", "gg, rematch?", "ugh, gg"],
  draw: ["gg", "level, nice", "can't split us", "gg, decider?"],
};

/**
 * How the bot answers chat: [pattern, chance of replying, possible replies].
 * Replies can be a function of the profile and match state. The first match wins;
 * anything else gets a reply now and then from BOT_SMALL_TALK.
 */
const BOT_REPLIES = [
  [
    /\b(hi|hello|hey|yo|hiya|hola|ciao|servus|salut|zdr|zdravei|privet)\b|здр|здравей|привет/i,
    0.75,
    ["hi", "hey", "yo", "hello", "hey, gl"],
  ],
  [/\b(gg|good game|wp|well played)\b/i, 0.8, ["gg", "gg wp", "wp", "gg, that was fun"]],
  [/\b(gl|good luck|hf|have fun)\b/i, 0.7, ["gl", "you too", "gl hf", "thanks, you too"]],
  [
    /where.*from|from where|where u from/i,
    0.75,
    (o) => ["from " + o.place, o.place, o.place + ", you?"],
  ],
  [
    /\b(rematch|again|one more|another one|revenge)\b/i,
    0.8,
    (o, st) =>
      !st.final
        ? ["after this one", "let's finish this first"]
        : st.final.want
          ? ["sure", "go on then", "yeah, hit rematch"]
          : ["can't, gotta go", "maybe later", "nah, I'm done"],
  ],
  [
    /\b(nice|wow|great|well done|good one|impressive|insane|crazy|respect|genius)\b/i,
    0.6,
    ["thanks", "ty", "lucky guess", "haha thanks", "cheers"],
  ],
  [
    /\b(noob|trash|bad|ez|easy|loser|rubbish|useless)\b/i,
    0.4,
    ["ok", "says you", "we'll see", "relax"],
  ],
  [/\b(lol|haha+|lmao|xd|rofl)\b/i, 0.4, ["haha", "lol"]],
  [/\b(thanks|thank you|ty|thx|cheers)\b/i, 0.5, ["np", "no worries", "anytime"]],
  [
    /\b(how old|age)\b/i,
    0.5,
    ["old enough to remember Zidane", "too old for this", "why do you ask"],
  ],
  [/\b(how|who|what|why|which)\b.*\?/i, 0.5, ["no idea", "idk", "good question", "haha no clue"]],
  [/\?\s*$/, 0.45, ["maybe", "idk", "haha", "could be"]],
];

/** Now and then, an answer to anything else. */
const BOT_SMALL_TALK = ["haha", "true", "ok", "fair", "lol", "yeah", "same"];

/**
 * Opponent levels. Nobody knows everything: each level knows a share of the
 * answers in each tier (know[tier]), can only hold so many in their head at
 * once (cap), sometimes draws a complete blank on a prompt (blank), types at
 * a pace (speed: higher is slower) and fumbles wrong guesses (wrong).
 */
const BOT_LEVELS = {
  rookie: {
    name: "Rookie",
    blurb: "Knows the big names, types slowly, often stuck",
    know: [0, 0.5, 0.15, 0.04, 0.01],
    cap: 3,
    blank: 0.3,
    speed: [1.35, 1.7],
    wrong: [0.3, 0.45],
  },
  pundit: {
    name: "Pundit",
    blurb: "A decent fan: the obvious answers and a few more",
    know: [0, 0.72, 0.32, 0.12, 0.04],
    cap: 5,
    blank: 0.15,
    speed: [1.05, 1.3],
    wrong: [0.2, 0.32],
  },
  veteran: {
    name: "Veteran",
    blurb: "Sharp, quick and knows a few deep cuts",
    know: [0, 0.88, 0.52, 0.26, 0.1],
    cap: 8,
    blank: 0.07,
    speed: [0.88, 1.08],
    wrong: [0.12, 0.22],
  },
  legend: {
    name: "Legend",
    blurb: "Encyclopaedic and fast. Still not perfect",
    know: [0, 0.95, 0.7, 0.42, 0.22],
    cap: 11,
    blank: 0.03,
    speed: [0.74, 0.9],
    wrong: [0.06, 0.14],
  },
};

/** Level keys from weakest to strongest. */
const BOT_LEVEL_ORDER = ["rookie", "pundit", "veteran", "legend"];

/**
 * The level for "Any level": follows the player's form, with some luck of the draw.
 *
 * @param {{w: number, l: number}} [record]
 */
function matchedLevel(record) {
  const r = record || { w: 0, l: 0 };
  const form = (r.w || 0) - (r.l || 0);
  let i = form <= -2 ? 0 : form <= 1 ? 1 : form <= 3 ? 2 : 3;
  if (chance(0.3)) i += chance(0.5) ? 1 : -1;
  return BOT_LEVEL_ORDER[Math.max(0, Math.min(3, i))];
}

/* ---------- small random helpers -------------------------------------------- */

/** A random float between a and b. */
const rnd = (a, b) => a + Math.random() * (b - a);

/** True with probability p. */
const chance = (p) => Math.random() < p;

/** One random element of a list. */
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

/* ---------- making an opponent ---------------------------------------------- */

/**
 * A new opponent profile.
 *
 * @param {string} level  a key of BOT_LEVELS, or "any" to match the player's form
 * @param {{w: number, l: number}} [record]  the player's quick-match record
 */
function makeOpponent(level, record) {
  const key = BOT_LEVELS[level] ? level : matchedLevel(record),
    L = BOT_LEVELS[key];
  return {
    id: "q" + Math.random().toString(36).slice(2, 10),
    name: pickOne(BOT_NAMES),
    place: pickOne(BOT_PLACES),
    look: randomLook(),
    level: key,
    levelName: L.name,
    sharp: rnd(0.85, 1.15), // two reporters at one level are never quite equal
    speed: rnd(L.speed[0], L.speed[1]),
    style: pickOne(["young", "young", "veteran", "all-round"]),
    favourite: pickOne(CATS).id,
    wrong: rnd(L.wrong[0], L.wrong[1]),
    ping: Math.round(rnd(24, 95)),
  };
}

/* ---------- the bot ---------------------------------------------------------- */

/**
 * Start a simulated opponent.
 *
 * @param {object} o  profile from makeOpponent()
 * @param {(message: object) => void} deliver  hands a message to the room, as if it came over the network
 * @returns {{receive: (message: object) => void, stop: () => void}}
 */
function createBot(o, deliver) {
  const timers = new Set();
  let alive = true;
  let final = null;
  let busyUntil = 0; // end of the current round, in Date.now() time
  let lastReply = 0;

  /** Run fn after ms, unless the bot has been stopped. */
  const later = (fn, ms) => {
    const h = setTimeout(
      () => {
        timers.delete(h);
        if (alive) fn();
      },
      Math.max(0, ms),
    );
    timers.add(h);
  };

  /** Send a message with a little network delay. */
  const say = (m) => later(() => deliver(m), o.ping / 2 + rnd(20, 140));

  /** Seconds to type a word of n letters. */
  const typeTime = (n) => n * rnd(0.15, 0.28) * o.speed + rnd(0.2, 0.6);

  /** Show "typing…" from second `at` for `dur` seconds. */
  const typing = (n, at, dur) => {
    for (let k = 0; k < dur; k += 1.2) later(() => say({ t: "typ", n }), (at + k) * 1000);
  };

  /** How much better (or worse) this reporter knows a prompt: their era and favourite section. */
  function taste(p, pid) {
    const modern = p.era === "new";
    const eraF =
      o.style === "young"
        ? modern
          ? 1.15
          : 0.7
        : o.style === "veteran"
          ? modern
            ? 0.8
            : 1.2
          : 1;
    const favF = CATS[pid[0]].id === o.favourite ? 1.3 : 1;
    return { eraF, favF, mult: o.sharp * eraF * favF };
  }

  /** Decide what this reporter knows about a prompt and play the round out in real time. */
  function playRound(m) {
    const p = promptAt(m.pid);
    if (!p) return;
    final = null;
    busyUntil = Date.now() + m.secs * 1000;
    if (m.n === 1 && chance(0.25))
      chatLater(pickOne(["gl", "gl hf", "good luck", "let's go"]), 1, 4);
    const { eraF, favF, mult } = taste(p, m.pid);
    const L = BOT_LEVELS[o.level];

    // What comes to mind, roughly most obvious first. Nobody recalls more than
    // a handful under the clock, and sometimes a prompt draws a total blank.
    const blank = chance(L.blank / Math.min(eraF * favF, 1.3));
    const cap = blank ? (chance(0.5) ? 0 : 1) : Math.max(1, L.cap + Math.round(rnd(-1.5, 1.5)));
    const known = p.answers
      .filter((a) => chance(Math.min(0.97, L.know[a[1]] * mult)))
      .map((a) => ({ a, k: a[1] + rnd(0, 2.2) }))
      .sort((x, y) => x.k - y.k)
      .map((x) => x.a)
      .slice(0, cap);
    // Stuck: a couple of wrong tries, then nothing.
    if (!known.length)
      for (let i = 0, t0 = rnd(6, 14); i < (chance(0.6) ? 2 : 1); i++, t0 += rnd(6, 12))
        typing(m.n, t0 * o.speed, typeTime(Math.round(rnd(5, 11))));

    const end = m.secs - 0.5;
    let t = (1.5 + p.text.length / 30 + rnd(0, 2)) * o.speed; // reading the prompt
    const found = [];
    let pts = 0;
    for (let i = 0; i < known.length; i++) {
      const a = known[i];
      // Thinking time grows as the easy answers run out; now and then a blank moment.
      t += (0.9 + i * 0.4) * rnd(0.6, 1.8) * o.speed + (chance(0.12) ? rnd(3, 8) : 0);
      if (chance(o.wrong)) {
        const d = typeTime(Math.round(rnd(5, 12)));
        if (t + d > end) break;
        typing(m.n, t, d); // a wrong guess: typing, then nothing lands
        t += d + rnd(0.3, 1.2);
      }
      const word = p.kind === "player" && chance(0.6) ? a[0].split(" ").pop() : a[0];
      const d = typeTime(word.length);
      if (t + d > end) break; // still typing when the clock ran out
      typing(m.n, t, d);
      t += d;
      found.push(a[0]);
      pts += TIER[a[1]].pts;
      const c = found.length,
        total = pts;
      later(() => say({ t: "hit", n: m.n, c, p: total }), t * 1000);
    }
    // Hand in the answers once the clock stops, like every player does.
    later(() => say({ t: "res", n: m.n, names: found.slice() }), (m.secs + rnd(0.2, 0.9)) * 1000);

    // Very rarely someone just quits.
    if (o.walkout && o.walkout.n === m.n)
      later(() => say({ t: "bye" }), Math.min(o.walkout.at, end) * 1000);
  }

  /* ---------- Hot seat -------------------------------------------------- */

  /** This round's Hot seat memory: what comes to mind, and the last turn played. */
  let seat = null;

  /** A wrong but plausible guess: an answer to some other prompt of the same kind. */
  function wrongGuess(p) {
    for (let i = 0; i < 20; i++) {
      const c = pickOne(CATS),
        q = pickOne(c.prompts);
      if (q.kind !== p.kind || !q.answers.length) continue;
      const a = pickOne(q.answers)[0];
      if (!p.answers.some((x) => x[0] === a)) return a.split(" ").pop();
    }
    return "";
  }

  /**
   * A Hot seat update from the host. On this reporter's turn: think, maybe
   * try a wrong name, then file an answer nobody has used, unless they cannot
   * think of one in time and the clock runs out.
   */
  function playTurn(m) {
    const p = promptAt(m.pid);
    if (!p) return;
    if (!seat || seat.n !== m.n) {
      final = null;
      const L = BOT_LEVELS[o.level],
        { mult } = taste(p, m.pid);
      seat = {
        n: m.n,
        k: -1,
        // Turns go on for a while, so no cap here: everything they know, most obvious first.
        known: p.answers
          .filter((a) => chance(Math.min(0.97, L.know[a[1]] * mult)))
          .map((a) => ({ a, k: a[1] + rnd(0, 2.2) }))
          .sort((x, y) => x.k - y.k)
          .map((x) => x.a),
      };
    }
    busyUntil = Date.now() + 30000;
    if (m.active !== o.id || m.k === seat.k) return;
    seat.k = m.k;
    const used = new Set((m.used || []).map((u) => u.a)),
      pick = seat.known.find((a) => !used.has(a[0])),
      left = m.left / 1000 - 0.5,
      miss = (at) => {
        const text = wrongGuess(p);
        if (text && at < left) later(() => say({ t: "miss", n: m.n, k: m.k, text }), at * 1000);
      };
    // Reading the board, sometimes a blank moment.
    let t = (0.8 + rnd(0, 1.8)) * o.speed + (chance(0.12) ? rnd(1.5, 4) : 0);
    if (!pick) {
      // Nothing left in the memory: a desperate try or two, then the clock runs out.
      miss(t + rnd(1, 3));
      if (chance(0.5)) miss(t + rnd(4, 6));
      return;
    }
    if (chance(o.wrong)) {
      t += typeTime(Math.round(rnd(5, 10)));
      miss(t);
      t += rnd(0.4, 1.2);
    }
    const word = p.kind === "player" && chance(0.6) ? pick[0].split(" ").pop() : pick[0];
    t += typeTime(word.length);
    if (t > left) return; // too slow: still typing when the clock ran out
    later(() => say({ t: "claim", n: m.n, k: m.k, a: pick[0] }), t * 1000);
  }

  /** Type a chat message after a pause: "is typing…", then the message. */
  function chatLater(text, minSecs, maxSecs) {
    const start = rnd(minSecs, maxSecs) * 1000,
      typing = (text.length * rnd(0.12, 0.2) + rnd(0.3, 0.8)) * 1000;
    later(() => say({ t: "ctyp" }), start);
    if (typing > 2500) later(() => say({ t: "ctyp" }), start + 2500);
    later(() => say({ t: "chat", text }), start + typing);
  }

  /** Read a chat message and maybe answer it. Nobody answers everything. */
  function hearChat(text) {
    const now = Date.now();
    if (now - lastReply < 4000 && chance(0.7)) return; // still answering the last one
    const hit = BOT_REPLIES.find(([re]) => re.test(text));
    let odds = hit ? hit[1] : 0.25;
    if (now < busyUntil) odds *= 0.3; // concentrating on the round
    if (!chance(odds)) return;
    const options = !hit
      ? BOT_SMALL_TALK
      : typeof hit[2] === "function"
        ? hit[2](o, { final })
        : hit[2];
    lastReply = now;
    chatLater(pickOne(options), 1, 3.5);
    // Asked for a rematch and up for it: offer one for real.
    if (hit && hit[0].test("rematch") && final && final.want && !final.sent && chance(0.6))
      later(
        () => {
          final.sent = true;
          say({ t: "rematch" });
        },
        rnd(4, 7) * 1000,
      );
  }

  /** After the final: maybe a word in the chat, then a rematch or goodbye. */
  function afterMatch(m) {
    const mine = m.rows.find((r) => r.id === o.id),
      theirs = m.rows.find((r) => r.id !== o.id);
    if (!mine || !theirs) return;
    const outcome = mine.total > theirs.total ? "win" : mine.total < theirs.total ? "lose" : "draw";
    if (chance(0.65)) chatLater(pickOne(BOT_CHAT[outcome]), 1, 3);
    const want = chance(outcome === "lose" ? 0.75 : outcome === "win" ? 0.45 : 0.6);
    final = { want, sent: false, agreed: false };
    if (want && chance(0.45))
      later(
        () => {
          final.sent = true;
          say({ t: "rematch" });
        },
        rnd(3, 9) * 1000,
      );
    // Nobody waits around forever.
    later(
      () => {
        if (final && !final.agreed) say({ t: "bye" });
      },
      (want ? rnd(18, 35) : rnd(5, 14)) * 1000,
    );
  }

  return {
    /** A message from the room. */
    receive(m) {
      if (!alive || !m) return;
      if (m.t === "round") {
        if (m.n === 1 && !o.walkout && chance(0.03))
          o.walkout = { n: 1 + Math.floor(Math.random() * (m.total || 1)), at: rnd(8, 30) };
        playRound(m);
      } else if (m.t === "turn") playTurn(m);
      else if (m.t === "board") {
        busyUntil = 0;
        seat = null;
        if (!m.last) later(() => say({ t: "ready", n: m.n }), rnd(1.5, 7) * 1000);
        else afterMatch(m);
      } else if (m.t === "rematch" && final && !final.agreed) {
        if (final.want) {
          final.agreed = true;
          if (!final.sent) later(() => say({ t: "rematch" }), rnd(1, 4) * 1000);
        } else later(() => say({ t: "bye" }), rnd(2, 6) * 1000);
      } else if (m.t === "chat") hearChat(String(m.text || ""));
      else if (m.t === "closed") this.stop();
    },
    /** Disconnect: cancel everything still scheduled. */
    stop() {
      alive = false;
      timers.forEach(clearTimeout);
      timers.clear();
    },
  };
}
