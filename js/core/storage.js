/**
 * Core · local persistence
 * ========================
 *
 * Saves the player's name, streak, best score, today's daily result and which
 * practice prompts they have already seen, in localStorage. Every access is
 * best effort: private windows or blocked storage simply start fresh.
 */

/** localStorage key. Bump the version if the saved shape changes incompatibly. */
const KEY = "journalista.v1";

/** Read the saved state, or an empty object if nothing usable is stored. */
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    return {};
  }
}

/** Write the state back. Failures (quota, private mode) are ignored. */
function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {}
}

/**
 * The player's saved state, shared by every module:
 *   name, streak, lastDay, best, daily (today's finished game),
 *   seen { [section id]: prompt keys already played in practice }
 */
let store = load();
store.seen = store.seen || {};
