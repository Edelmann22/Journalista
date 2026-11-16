/**
 * Data · prompts generated from the player database
 * =================================================
 *
 * Turns js/data/players.js into four new sections:
 *   The nations   "Name a Spanish footballer of the modern era", "Name a Belgian footballer"
 *   Regions       "Name an African footballer", "Name a Nordic footballer"
 *   Positions     "Name a goalkeeper who starred before 2010", "Name an Italian defender"
 *   Name game     "Name a footballer whose surname starts with F"
 *
 * The lists of prompts below are written out in full on purpose. Prompts are
 * referenced by position, so a prompt must never appear or disappear just
 * because players were added to the database. To add a prompt, append it to
 * the end of its list (or add a new section at the end of the file).
 *
 * Answer tiers come from each player's fame. Prompts whose players span both
 * eras take the era most of their answers belong to.
 */

/* ---------- reading the database ------------------------------------------- */

/**
 * Words that belong to a surname: "van Persie" files under V, "De Bruyne" under D.
 * Also used by js/core/matching.js, so "van persie" counts as an answer.
 */
const SURNAME_PARTICLES = new Set([
  "de",
  "di",
  "da",
  "do",
  "dos",
  "das",
  "du",
  "del",
  "della",
  "van",
  "von",
  "der",
  "den",
  "ter",
  "ten",
  "le",
  "la",
  "el",
  "mac",
]);

/** Every player in js/data/players.js as an object. */
const PLAYERS = NATIONS.flatMap((n) =>
  n.rows
    .trim()
    .split("\n")
    .map((line) => {
      const m = line.trim().match(/^([1-4]) ([nob]) ([GDMF]) (=?)([^|]+)(?:\|(.*))?$/);
      if (!m) throw new Error("players.js: cannot read line: " + line);
      const name = m[5].trim();
      return {
        name,
        fame: +m[1],
        era: m[2],
        pos: m[3],
        full: m[4] === "=",
        aliases: m[6] || "",
        nation: n,
      };
    }),
);

/** The letter a player files under in the Name game. */
function surnameLetter(p) {
  const words = p.name.split(" ");
  let i = words.length - 1;
  if (!p.full) while (i > 0 && SURNAME_PARTICLES.has(words[i - 1].toLowerCase())) i--;
  else i = 0;
  const c = words[i].normalize("NFD").charAt(0).toUpperCase();
  return { Ø: "O", Ł: "L", Đ: "D", Æ: "A" }[c] || c;
}

/* ---------- building prompts ------------------------------------------------ */

/** True if the player belongs to the era filter: "new", "old" or null for any. */
function inEra(p, era) {
  return !era || p.era === "b" || (era === "new" ? p.era === "n" : p.era === "o");
}

/**
 * A player prompt from a filter over the database.
 * Duplicate names are dropped; players known by their full name keep no surname alias.
 *
 * @param {string} text
 * @param {string} sub
 * @param {(p: object) => boolean} test
 * @param {"new"|"old"|null} era  null: take the era most answers belong to
 */
function PP(text, sub, test, era) {
  const seen = new Set(),
    list = PLAYERS.filter((p) => test(p) && !seen.has(p.name) && seen.add(p.name));
  const modern = list.filter((p) => p.era !== "o").length,
    classic = list.filter((p) => p.era !== "n").length;
  const prompt = P(
    text,
    sub,
    "player",
    list.map((p) => (p.aliases ? [p.name, p.fame, p.aliases] : [p.name, p.fame])),
    era || (modern >= classic ? N : O),
  );
  prompt.noSurname = new Set(list.filter((p) => p.full).map((p) => p.name));
  return prompt;
}

/** Shorthand filters. */
const from =
  (...codes) =>
  (p) =>
    codes.includes(p.nation.code);
const inRegion = (region) => (p) => p.nation.region === region;

/* ---------- The nations ----------------------------------------------------- */

/** The big footballing countries get one prompt per era. */
const NATION_SPLIT = ["ESP", "FRA", "GER", "ITA", "ENG", "BRA", "ARG", "NED", "POR"];

/** Everyone else gets one prompt covering every era. */
const NATION_ALL = [
  "BEL",
  "CRO",
  "URU",
  "COL",
  "MEX",
  "USA",
  "BUL",
  "SRB",
  "POL",
  "SWE",
  "DEN",
  "NOR",
  "SCO",
  "WAL",
  "IRL",
  "CZE",
  "HUN",
  "ROU",
  "TUR",
  "USR",
  "AUT",
  "SUI",
  "GRE",
  "NGA",
  "SEN",
  "CIV",
  "GHA",
  "CMR",
  "EGY",
  "MAR",
  "ALG",
  "JPN",
  "KOR",
  "CHI",
];

/** "a" or "an" for an adjective. */
const an = (word) => (/^[AEIOU]/.test(word) ? "an " : "a ") + word;

/** The nation record for a code. */
const nationOf = (code) => NATIONS.find((n) => n.code === code);

ADDC({
  id: "nat",
  name: "The nations",
  blurb: "As many players as you can from one country",
  prompts: [
    ...NATION_SPLIT.flatMap((code) => {
      const n = nationOf(code);
      return [
        PP(
          "Name " + an(n.adj) + " footballer of the modern era",
          "Men's national team players at their peak since 2010",
          (p) => p.nation.code === code && inEra(p, "new"),
          N,
        ),
        PP(
          "Name " + an(n.adj) + " footballer who starred before 2010",
          "Men's national team players, from the first World Cups to 2010",
          (p) => p.nation.code === code && inEra(p, "old"),
          O,
        ),
      ];
    }),
    ...NATION_ALL.map((code) => {
      const n = nationOf(code);
      return PP(
        "Name " + an(n.adj) + " footballer",
        "Men's national team players for " + n.country + ", any era",
        from(code),
        null,
      );
    }),
  ],
});

/* ---------- Regions --------------------------------------------------------- */

ADDC({
  id: "reg",
  name: "Around the world",
  blurb: "Players from whole continents and corners of the map",
  prompts: [
    PP("Name an African footballer", "Any African national team, any era", inRegion("CAF"), null),
    PP(
      "Name an Asian or Australian footballer",
      "AFC nations: Japan, South Korea, Iran, Australia, Saudi Arabia and more",
      inRegion("AFC"),
      null,
    ),
    PP(
      "Name a South American footballer who did not play for Brazil or Argentina",
      "Uruguay, Colombia, Chile, Paraguay, Peru, Ecuador and the rest of CONMEBOL",
      (p) => p.nation.region === "CONMEBOL" && !["BRA", "ARG"].includes(p.nation.code),
      null,
    ),
    PP(
      "Name a footballer from North or Central America or the Caribbean",
      "CONCACAF nations: the USA, Mexico, Canada, Costa Rica, Jamaica and more",
      inRegion("CONCACAF"),
      null,
    ),
    PP(
      "Name a Nordic footballer",
      "Denmark, Finland, Iceland, Norway or Sweden",
      (p) => p.nation.nordic,
      null,
    ),
    PP(
      "Name a footballer from Scotland, Wales or either Ireland",
      "The home nations apart from England",
      (p) => p.nation.home,
      null,
    ),
    PP(
      "Name a footballer from the former Yugoslavia",
      "Croatia, Serbia, Slovenia, Bosnia, Montenegro, North Macedonia, Kosovo and Yugoslavia itself",
      (p) => p.nation.yugo,
      null,
    ),
  ],
});

/* ---------- Positions ------------------------------------------------------- */

const POS_NAME = { G: "goalkeeper", D: "defender", M: "midfielder", F: "forward" };

/** Country and position pairs with enough players for a good prompt. */
const NATION_POS = [
  ["ITA", "D"],
  ["ITA", "G"],
  ["ENG", "G"],
  ["ENG", "D"],
  ["ENG", "F"],
  ["ESP", "M"],
  ["ESP", "G"],
  ["GER", "G"],
  ["GER", "M"],
  ["BRA", "F"],
  ["BRA", "D"],
  ["ARG", "F"],
  ["FRA", "M"],
  ["FRA", "D"],
  ["NED", "M"],
  ["ESP", "D"],
  ["ESP", "F"],
  ["FRA", "F"],
  ["GER", "F"],
  ["GER", "D"],
  ["ITA", "M"],
  ["ITA", "F"],
  ["ENG", "M"],
  ["BRA", "M"],
  ["ARG", "M"],
  ["ARG", "D"],
  ["NED", "F"],
  ["NED", "D"],
  ["POR", "F"],
  ["POR", "M"],
];

ADDC({
  id: "pos",
  name: "Positions",
  blurb: "Keepers, defenders, midfielders and forwards",
  prompts: [
    ...["G", "D", "M", "F"].flatMap((pos) => [
      PP(
        "Name " + an(POS_NAME[pos]) + " of the modern era",
        "Any country, at their peak since 2010",
        (p) => p.pos === pos && inEra(p, "new"),
        N,
      ),
      PP(
        "Name " + an(POS_NAME[pos]) + " who starred before 2010",
        "Any country, any era up to 2010",
        (p) => p.pos === pos && inEra(p, "old"),
        O,
      ),
    ]),
    ...NATION_POS.map(([code, pos]) =>
      PP(
        "Name " + an(nationOf(code).adj) + " " + POS_NAME[pos],
        "Men's national team players for " + nationOf(code).country + ", any era",
        (p) => p.nation.code === code && p.pos === pos,
        null,
      ),
    ),
  ],
});

/* ---------- Name game ------------------------------------------------------- */

/** Letters with enough famous surnames. */
const NAME_GAME_LETTERS = "ABCDEFGHIJKLMNOPRSTVWYZ".split("");

ADDC({
  id: "abc",
  name: "Name game",
  blurb: "Footballers by the first letter of their surname",
  prompts: NAME_GAME_LETTERS.map((L) =>
    PP(
      "Name a footballer whose surname starts with " + L,
      "Any country, any era · particles count, so van Persie is a V · one-name players go by that name",
      (p) => surnameLetter(p) === L,
      null,
    ),
  ),
});
