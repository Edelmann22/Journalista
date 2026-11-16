/**
 * Mode · stand-in opponent for quick matches
 * ==========================================
 *
 * Until real players are paired at random, a quick match is played against a
 * simulated reporter that behaves like a person rather than a database:
 *
 *   - a name, a home town and a pixel look, like any other player
 *   - a skill level, matched to how the player has been doing
 *   - a taste: young reporters know modern football better, veterans the
 *     archive, and everyone has a favourite section
 *   - patchy knowledge: common answers come to mind easily, rare ones seldom
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

/** Chance of knowing an answer of each tier before skill and taste are applied. */
const BOT_KNOW = [0, 0.9, 0.58, 0.3, 0.12];

/* ---------- small random helpers -------------------------------------------- */

/** A random float between a and b. */
const rnd = (a, b) => a + Math.random() * (b - a);

/** True with probability p. */
const chance = (p) => Math.random() < p;

/** One random element of a list. */
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

/* ---------- making an opponent ---------------------------------------------- */

/**
 * A new opponent profile. Skill drifts towards the player's form, so a
 * player on a winning run meets stronger reporters.
 *
 * @param {{w: number, l: number}} [record]  the player's quick-match record
 */
function makeOpponent(record) {
  const r = record || { w: 0, l: 0 };
  const form = Math.max(-4, Math.min(4, (r.w || 0) - (r.l || 0)));
  return {
    id: "q" + Math.random().toString(36).slice(2, 10),
    name: pickOne(BOT_NAMES),
    place: pickOne(BOT_PLACES),
    look: randomLook(),
    skill: Math.max(0.3, Math.min(0.95, 0.6 + form * 0.07 + rnd(-0.15, 0.15))),
    speed: rnd(0.8, 1.25),
    style: pickOne(["young", "young", "veteran", "all-round"]),
    favourite: pickOne(CATS).id,
    wrong: rnd(0.12, 0.3),
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

  /** Decide what this reporter knows about a prompt and play the round out in real time. */
  function playRound(m) {
    const p = promptAt(m.pid);
    if (!p) return;
    final = null;
    busyUntil = Date.now() + m.secs * 1000;
    if (m.n === 1 && chance(0.25))
      chatLater(pickOne(["gl", "gl hf", "good luck", "let's go"]), 1, 4);
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
    const favF = CATS[m.pid[0]].id === o.favourite ? 1.3 : 1;
    const mult = (0.45 + o.skill * 0.75) * eraF * favF;

    // What comes to mind, roughly most obvious first.
    const known = p.answers
      .filter((a) => chance(Math.min(0.97, BOT_KNOW[a[1]] * mult)))
      .map((a) => ({ a, k: a[1] + rnd(0, 2.2) }))
      .sort((x, y) => x.k - y.k)
      .map((x) => x.a);

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
      } else if (m.t === "board") {
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
