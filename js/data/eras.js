/**
 * Data · era tagging for older prompts
 * ====================================
 *
 * The original prompts were written without an explicit era. Any prompt whose
 * text starts with one of these prefixes is about football since 2010 and is
 * shown in the modern edition; every other untagged prompt goes to the
 * archive edition. Must load after all question files.
 */

/** Text prefixes of untagged prompts that belong to the modern edition. */
const NEW_PREFIX = [
  "Name a player who scored in a World Cup final this century",
  "Name a quarter-finalist at the 2026",
  "Name a World Cup semi-finalist since 2010",
  "Name a player with 50 or more Champions League",
  "Name a manager who has won the Champions League this century",
  "Name a city that hosted a Champions League final",
  "Name a club that has won the Champions League since",
  "Name a club that has won the Europa League since",
  "Name a player from Leicester",
  "Name a Chelsea manager",
  "Name a Premier League Golden Boot winner since",
  "Name a club that has won Ligue 1",
  "Name a La Liga top scorer",
  "Name a Bundesliga top scorer",
  "Name a country that played at Euro 2024",
  "Name a Ballon d'Or winner this century",
  "Name a Golden Boy winner",
  "Name a Kopa Trophy winner",
  "Name a men's Yashin Trophy winner",
  "Name a Women's Ballon d'Or winner",
  "Name a club Zlatan",
  "Name a club Lionel Messi or Cristiano",
  "Name a club José Mourinho",
  "Name a club Carlo Ancelotti",
  "Name a Spain player from the 2026",
  "Name an Argentina player from the 2022",
  "Name a Spain player from the 2010",
  "Name a scorer from Germany",
];

/** Give every prompt without an explicit era one, based on NEW_PREFIX. */
CATS.forEach((c) =>
  c.prompts.forEach((p) => {
    p.era = p.era || (NEW_PREFIX.some((x) => p.text.startsWith(x)) ? "new" : "old");
  }),
);
