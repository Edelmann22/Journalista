/**
 * Core · answer matching
 * ======================
 *
 * Turns whatever the player typed into one of the prompt's answers, or null.
 * Matching is forgiving: accents, punctuation and "the/fc/cf" are ignored,
 * club nicknames and player surnames count, and small typos are allowed on
 * longer names (Levenshtein distance 1 from 5 letters, 2 from 9 letters).
 */

/**
 * Normalise text for comparison: strip accents and punctuation, lower-case,
 * fold a few special letters (ø, æ, ß, đ, ł) and drop "the", "fc" and "cf".
 *
 * @param {string} s
 * @returns {string}
 */
function norm(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss")
    .replace(/đ/g, "d")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(the|fc|cf)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Levenshtein edit distance between two strings.
 * Returns 9 early when the lengths differ by more than 2, since such strings
 * can never be within the typo allowance used by findAnswer().
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Every normalised spelling that counts for one answer: its display name,
 * its own extra aliases, shared club aliases (club prompts) and the surname
 * on its own (player prompts, except names listed in NO_SURNAME).
 *
 * @param {object} prompt  a prompt built with P()
 * @param {Array}  ans     [display name, tier, aliases?]
 * @returns {string[]}
 */
function aliasesFor(prompt, ans) {
  const set = new Set([norm(ans[0])]);
  if (ans[2]) ans[2].split("|").forEach((a) => set.add(norm(a)));
  if (prompt.kind === "club" && CLUB[ans[0]])
    CLUB[ans[0]].split("|").forEach((a) => set.add(norm(a)));
  if (prompt.kind === "player" && !NO_SURNAME.has(ans[0])) {
    const parts = norm(ans[0]).split(" ");
    if (parts.length > 1) set.add(parts[parts.length - 1]);
  }
  set.delete("");
  return [...set];
}

/**
 * Match the player's raw input against a prompt's answers.
 * An exact alias match wins immediately; otherwise the closest alias within
 * the typo allowance (1 edit from 5 letters, 2 edits from 9 letters) wins.
 *
 * @param {object} prompt
 * @param {string} raw  what the player typed
 * @returns {Array|null}  the matched answer, or null
 */
function findAnswer(prompt, raw) {
  const g = norm(raw);
  if (!g) return null;
  let best = null,
    bestD = 9;
  for (const ans of prompt.answers) {
    for (const al of aliasesFor(prompt, ans)) {
      if (al === g) return ans;
      const allow = al.length >= 9 ? 2 : al.length >= 5 ? 1 : 0;
      if (!allow) continue;
      const d = lev(g, al);
      if (d <= allow && d < bestD) {
        best = ans;
        bestD = d;
      }
    }
  }
  return best;
}
