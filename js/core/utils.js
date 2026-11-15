/**
 * Core · date, random and formatting utilities
 * ============================================
 *
 * Pure helpers with no DOM access.
 */

/** Today's local date as YYYY-MM-DD. */
function today() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/** Days since 1970-01-01 for a YYYY-MM-DD string. Used for streaks and the daily seed. */
function dayNumber(str) {
  const [y, m, d] = str.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
}

/**
 * Seeded pseudo-random number generator (mulberry32).
 * The same seed always yields the same sequence, which keeps the daily seven
 * identical for every player.
 *
 * @param {number} seed
 * @returns {() => number}  a function returning floats in [0, 1)
 */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher–Yates shuffle into a new array, using the given random source.
 *
 * @param {Array} arr
 * @param {() => number} r  e.g. Math.random or rng(seed)
 */
function shuffle(arr, r) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** [0, 1, ..., n - 1] */
const idx = (n) => [...Array(n).keys()];

/** Format a number with British thousands separators, e.g. 1,250. */
function fmt(n) {
  return n.toLocaleString("en-GB");
}
