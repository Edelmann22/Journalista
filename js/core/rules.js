/**
 * Core · scoring rules and match constants
 * ========================================
 *
 * Scoring tiers, solo match length and the clock. Every number that decides
 * how many points an answer is worth lives here.
 */

/**
 * Players whose surname alone must NOT count as an answer.
 * A bare "Ronaldo" means Cristiano, so the Brazilian keeps only his explicit aliases.
 */
const NO_SURNAME = new Set(["Ronaldo Nazário"]);

/**
 * Rating tiers, indexed by the tier number stored on each answer.
 * Index 0 is a miss. `mark` is the newspaper-style rating shown in the stamp,
 * `pts` the base score and `c` the CSS colour token for that tier.
 */
const TIER = [
  { name: "Spiked", mark: "0", pts: 0, c: "var(--ink)" },
  { name: "Wire copy", mark: "6", pts: 100, c: "var(--t1)" },
  { name: "Good line", mark: "7", pts: 200, c: "var(--t2)" },
  { name: "Back page", mark: "8", pts: 350, c: "var(--t3)" },
  { name: "Front page", mark: "10", pts: 500, c: "var(--t4)" },
];
/** Seconds on the clock for each solo prompt. */
const SECONDS = 25;

/** Prompts in a solo match (the daily seven). */
const PER_MATCH = 7;

/** Total number of prompts across every section. */
const TOTAL = CATS.reduce((n, c) => n + c.prompts.length, 0);
