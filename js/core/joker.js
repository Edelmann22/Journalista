/**
 * Core · the joker
 * ================
 *
 * If you still have no correct answer 40 seconds into a prompt, the game
 * plays a joker: part of one answer's name, like "L___ M____ć" for Luka
 * Modrić. On clocks shorter than 45 seconds (solo prompts are 25) it comes
 * with JOKER_LEFT seconds to go instead. One joker per prompt.
 *
 * Used by solo play (js/modes/solo.js) and Newsroom race
 * (js/modes/multiplayer.js). Hot seat turns are too short for one.
 */

/** Seconds into a prompt when the joker appears, if you have no correct answer. */
const JOKER_AT = 40;

/** On shorter clocks, the joker appears with this many seconds left. */
const JOKER_LEFT = 5;

/**
 * True once the joker is due.
 *
 * @param {number} secs  length of the clock in seconds
 * @param {number} leftMs  milliseconds still on the clock
 */
function jokerDue(secs, leftMs) {
  return secs - leftMs / 1000 >= Math.min(JOKER_AT, secs - JOKER_LEFT);
}

/**
 * Choose the answer to hint at: one of the most common answers, so the
 * joker helps rather than teases.
 *
 * @param {object} prompt
 * @returns {Array} an answer from prompt.answers
 */
function jokerAnswer(prompt) {
  const top = Math.min(...prompt.answers.map((a) => a[1]));
  const pool = prompt.answers.filter((a) => a[1] === top);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Hide most of a name: each word keeps its first and last letter and every
 * third letter in between; short words such as "de" or "van" stay whole.
 * "Luka Modrić" becomes "L__a M__r_ć".
 *
 * @param {string} name
 * @returns {string}
 */
function jokerMask(name) {
  return name
    .split(" ")
    .map((w) => {
      const letters = [...w];
      if (letters.length <= 3 || /^\p{Ll}+$/u.test(w)) return w; // "de", "van"
      return letters
        .map((ch, i) =>
          i === 0 || i === letters.length - 1 || i % 3 === 0 || !/[\p{L}\p{N}]/u.test(ch)
            ? ch
            : "_",
        )
        .join("");
    })
    .join("   ");
}

/**
 * Show a joker for a prompt in one of the joker boxes.
 *
 * @param {string} id  the box: "joker" (solo) or "mpJoker" (race)
 * @param {object} prompt
 */
function showJoker(id, prompt) {
  const box = $(id),
    ans = jokerAnswer(prompt);
  if (!ans) return;
  box.querySelector(".joker-mask").textContent = jokerMask(ans[0].replace(/\s*\(.*\)$/, ""));
  box.hidden = false;
  replay(box, "say-in");
}
