/**
 * UI · pixel-art reporters
 * ========================
 *
 * Every player is drawn as a small 16 × 16 pixel reporter. A "look" is a
 * single number: it seeds the random choice of skin tone, hair, kit, facial
 * hair and accessory, so the same look draws the same character on every
 * device. Moods (idle, happy, sad, shock) only change the face.
 *
 * Sprites are written as text grids so they can be edited by hand:
 * "." is transparent and every other letter is a palette key (see COLOURS in
 * drawSprite). Images are drawn on a canvas once and cached as data URLs.
 */

/* ---------- sprite sheets --------------------------------------------------- */

/** Head and shoulders. o outline · s skin · S ear shade · c/C kit colours · k collar */
const SPRITE_BASE = [
  "................",
  "................",
  "....oooooooo....",
  "...osssssssso...",
  "...osssssssso...",
  "...osssssssso...",
  "...osssssssso...",
  "..oSssssssssSo..",
  "...osssssssso...",
  "...osssssssso...",
  "....osssssso....",
  ".....oossoo.....",
  "..occcckkcccco..",
  ".occccckkccccco.",
  ".occcccccccccco.",
  ".occcccccccccco.",
];

/** Hair styles, drawn over the base from row 0. h hair · w shine */
// prettier-ignore
const SPRITE_HAIR = {
  crop: [
    "................",
    ".....oooooo.....",
    "....ohhhhhho....",
    "...ohhhhhhhho...",
    "...oh......ho...",
  ],
  curls: [
    "....oooooooo....",
    "...ohhhhhhhho...",
    "..ohhhhhhhhhho..",
    "..ohhhhhhhhhho..",
    "..ohh......hho..",
    "..oh........ho..",
    "..oh........ho..",
  ],
  long: [
    "................",
    ".....oooooo.....",
    "....ohhhhhho....",
    "...ohhhhhhhho...",
    "..ohhh....hhho..",
    "..oh........ho..",
    "..oh........ho..",
    "..oh........ho..",
    "..oh........ho..",
    "..oh........ho..",
    "..ohh......hho..",
    "..ohh......hho..",
  ],
  mohawk: [
    ".......oo.......",
    "......ohho......",
    "....oohhhhoo....",
    "...o.hhhhhh.o...",
  ],
  slick: [
    "................",
    "....ooooooo.....",
    "...ohhhhhhhoo...",
    "...ohhhhhhhhho..",
    "...ohhhh....o...",
  ],
  bald: ["................", "................", "................", ".....w.........."],
};

/** Facial hair, drawn from row 8. */
const SPRITE_FACIAL = {
  none: [],
  moustache: ["......hhhh......"],
  beard: ["...oh......ho...", "...ohhh..hhho...", "....ohhhhhho...."],
};

/** Accessories: [first row, rows] overlays, drawn last so they sit on top. f felt · r red · p press card · g grey */
// prettier-ignore
const SPRITE_ACCESSORY = {
  none: [],
  press: [[0, ["....oooooooo....", "....offffpfo....", "....orrrrpro....", "..oooooooooooo.."]]],
  cap: [[1, [".....oooooo.....", "....occcccco....", "...occccccccooo."]]],
  shades: [[5, ["....oooooooo....", "....owo..owo...."]]],
  band: [[4, ["...oCCCCCCCCo..."]]],
  phones: [
    [1, ["....oooooooo...."]],
    [6, ["..gg........gg..", "..gg........gg..", "..gg........gg.."]],
  ],
};

/** Faces: [row, column, key] pixels. e eye · m mouth · b blush · t tear or sweat */
const SPRITE_EYES = [
  [5, 6, "e"],
  [6, 6, "e"],
  [5, 9, "e"],
  [6, 9, "e"],
];
// prettier-ignore
const SPRITE_MOODS = {
  idle: [...SPRITE_EYES, [9, 7, "m"], [9, 8, "m"]],
  happy: [...SPRITE_EYES, [8, 6, "m"], [8, 9, "m"], [9, 7, "m"], [9, 8, "m"], [7, 5, "b"], [7, 10, "b"]],
  sad: [[6, 6, "e"], [6, 9, "e"], [8, 7, "m"], [8, 8, "m"], [9, 6, "m"], [9, 9, "m"], [7, 10, "t"], [8, 10, "t"]],
  shock: [...SPRITE_EYES, [8, 7, "m"], [8, 8, "m"], [9, 7, "m"], [9, 8, "m"], [3, 13, "t"], [4, 13, "t"]],
};

/** Small 8 × 8 icons. */
const SPRITE_ICONS = {
  ball: [
    "..oooo..",
    ".owoowo.",
    "owwoowwo",
    "oowwwwoo",
    "owwoowwo",
    ".owoowo.",
    "..oooo..",
    "........",
  ],
  watch: [
    "...oo...",
    "..oooo..",
    ".owwwwo.",
    "owwwowwo",
    "owwwoowo",
    "owwwwwwo",
    ".owwwwo.",
    "..oooo..",
  ],
};

/* ---------- palettes -------------------------------------------------------- */

const INK = "#1d1912";
const WHITE = "#f4f1ea";
const PALETTE = {
  skin: ["#f6d5bc", "#eab994", "#cf9466", "#a96d45", "#7c4b2b", "#57331d"],
  hair: ["#1d1912", "#4b2e1a", "#7d4d25", "#c88b3a", "#e8c872", "#a8391f", "#cfc9bf", "#2f4a9a"],
  kit: [
    "#c8102e",
    "#1456a8",
    "#0a6b46",
    "#f2c230",
    "#111111",
    WHITE,
    "#6b2c91",
    "#ea7b1c",
    "#7fb3e6",
  ],
};

/** The front-page editor: grey slick hair, moustache, press hat and a black suit. */
const EDITOR_LOOK = {
  skin: "#eab994",
  hair: "slick",
  hairColor: "#cfc9bf",
  facial: "moustache",
  accessory: "press",
  kit: "#111111",
  kit2: "#111111",
  pattern: "plain",
};

/* ---------- looks ----------------------------------------------------------- */

/**
 * Turn a look number into a full character description.
 *
 * @param {number} look
 * @returns {{skin, hair, hairColor, facial, accessory, kit, kit2, pattern}}
 */
function lookSpec(look) {
  const r = rng(look);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const kit = pick(PALETTE.kit);
  let kit2 = pick(PALETTE.kit);
  if (kit2 === kit) kit2 = kit === WHITE ? INK : WHITE;
  return {
    skin: pick(PALETTE.skin),
    hair: pick(Object.keys(SPRITE_HAIR)),
    hairColor: pick(PALETTE.hair),
    facial: pick(["none", "none", "none", "moustache", "beard"]),
    accessory: pick(["none", "none", "none", "press", "cap", "shades", "band", "phones"]),
    kit,
    kit2,
    pattern: pick(["plain", "plain", "stripes", "hoops", "sash", "halves"]),
  };
}

/** A fresh random look number. */
function randomLook() {
  return Math.floor(Math.random() * 0x7ffffffe) + 1;
}

/** This player's look, created and saved on first use. */
function myLook() {
  if (!store.look) {
    store.look = randomLook();
    save(store);
  }
  return store.look;
}

/** A stable look derived from any string, for players whose look is unknown. */
function hashLook(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0 || 1;
}

/* ---------- drawing --------------------------------------------------------- */

/** Lighten (amount > 0) or darken (amount < 0) a #rrggbb colour. */
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + amount))));
  return "rgb(" + ch(n >> 16) + "," + ch((n >> 8) & 255) + "," + ch(n & 255) + ")";
}

/** Which kit colour a shirt pixel gets for each pattern. */
function kitPixel(pattern, x, y) {
  if (pattern === "stripes") return x % 2 ? "C" : "c";
  if (pattern === "hoops") return y % 2 ? "C" : "c";
  if (pattern === "sash") return x + y === 18 || x + y === 19 ? "C" : "c";
  if (pattern === "halves") return x < 8 ? "c" : "C";
  return "c";
}

/** Paint a grid of palette keys onto a new canvas and return it as a data URL. */
function paintGrid(grid, colours, pixelKey = (ch) => ch) {
  const canvas = document.createElement("canvas");
  canvas.width = grid[0].length;
  canvas.height = grid.length;
  const ctx = canvas.getContext("2d");
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      ctx.fillStyle = colours[pixelKey(ch, x, y)] || INK;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return canvas.toDataURL();
}

/** Assemble base, hair, facial hair, face and accessory into one sprite. */
function drawSprite(spec, mood) {
  const grid = SPRITE_BASE.map((row) => row.split(""));
  const paint = (from, rows) =>
    rows.forEach((row, i) =>
      [...row].forEach((ch, c) => {
        if (ch !== ".") grid[from + i][c] = ch;
      }),
    );
  paint(0, SPRITE_HAIR[spec.hair] || []);
  paint(8, SPRITE_FACIAL[spec.facial] || []);
  (SPRITE_MOODS[mood] || SPRITE_MOODS.idle).forEach(([r, c, ch]) => (grid[r][c] = ch));
  (SPRITE_ACCESSORY[spec.accessory] || []).forEach(([from, rows]) => paint(from, rows));
  const COLOURS = {
    o: INK,
    e: INK,
    s: spec.skin,
    S: shade(spec.skin, -0.18),
    h: spec.hairColor,
    c: spec.kit,
    C: spec.kit2,
    k: spec.kit === WHITE ? INK : WHITE,
    m: "#7a2a22",
    w: "#ffffff",
    b: "#f08a7e",
    t: "#7fc4ef",
    r: "#c8102e",
    p: "#f7f5ef",
    f: "#5c5240",
    g: "#8a857c",
  };
  return paintGrid(
    grid.map((r) => r.join("")),
    COLOURS,
    (ch, x, y) => (ch === "c" && y >= 12 ? kitPixel(spec.pattern, x, y) : ch),
  );
}

const SPRITE_CACHE = new Map();

/**
 * Data URL of a reporter sprite.
 *
 * @param {number|object} look  a look number, or a full spec such as EDITOR_LOOK
 * @param {"idle"|"happy"|"sad"|"shock"} [mood]
 */
function avatarSrc(look, mood = "idle") {
  const key = (typeof look === "object" ? JSON.stringify(look) : look) + ":" + mood;
  if (!SPRITE_CACHE.has(key))
    SPRITE_CACHE.set(key, drawSprite(typeof look === "object" ? look : lookSpec(look), mood));
  return SPRITE_CACHE.get(key);
}

/**
 * An <img> of a reporter, scaled up with crisp pixels by the .avatar class.
 *
 * @param {number|object} look
 * @param {string} [mood]
 * @param {string} [cls]  size class: av-xs, av-sm, av-lg or av-xl
 */
function avatar(look, mood, cls) {
  const img = el("img", "avatar" + (cls ? " " + cls : ""));
  img.src = avatarSrc(look, mood);
  img.alt = "";
  img.width = 16;
  img.height = 16;
  img.draggable = false;
  return img;
}

/** Data URL of a small icon from SPRITE_ICONS. */
function iconSrc(name) {
  const key = "icon:" + name;
  if (!SPRITE_CACHE.has(key))
    SPRITE_CACHE.set(key, paintGrid(SPRITE_ICONS[name], { o: INK, w: "#ffffff" }));
  return SPRITE_CACHE.get(key);
}

/** An <img> of a small icon. */
function pixelIcon(name, cls) {
  const img = el("img", "pix-icon" + (cls ? " " + cls : ""));
  img.src = iconSrc(name);
  img.alt = "";
  img.draggable = false;
  return img;
}

/** Fill every <img data-icon="..."> in the page markup. */
function paintIcons() {
  document
    .querySelectorAll("img[data-icon]")
    .forEach((img) => (img.src = iconSrc(img.dataset.icon)));
}
